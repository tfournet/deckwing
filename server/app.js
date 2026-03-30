import express from 'express';
import cors from 'cors';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { chat, createSession, resetSession } from './ai/chat-engine.js';
import { reviewDeck } from './ai/review-agent.js';
import { startOAuthFlow, getOAuthStatus, cleanupOAuthSessions } from './ai/claude-oauth.js';
import { findClaudeBinary, checkClaudeVersion } from './ai/find-claude.js';

const execFileAsync = promisify(execFile);
const ALLOWED_ORIGINS = new Set([
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
]);

const app = express();

app.use(cors({
  origin(origin, callback) {
    // No origin header → same-origin or non-browser request, always allow
    if (!origin) return callback(null, true);

    // Exact match for known dev ports
    if (ALLOWED_ORIGINS.has(origin)) return callback(null, true);

    // In Electron, Express listens on a random port.  The page and the
    // API share the same localhost origin, so allow any localhost origin.
    try {
      const url = new URL(origin);
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        return callback(null, true);
      }
    } catch {
      // Malformed origin — fall through to reject
    }

    callback(new Error('CORS: origin not allowed'));
  },
}));
app.use(express.json({ limit: '10mb' }));

/**
 * Check if the user has a valid Claude auth session.
 * Returns { authenticated, method, email, loginCommand }.
 */
async function checkClaudeAuth() {
  // If API key is set, auth is handled — no Claude CLI needed
  if (process.env.ANTHROPIC_API_KEY) {
    return { authenticated: true, method: 'api_key' };
  }

  // Try the CLI — skip cache so we detect newly-installed claude during polling
  const claudeBin = findClaudeBinary({ skipCache: true });
  if (claudeBin) {
    try {
      const { stdout } = await execFileAsync(claudeBin, ['auth', 'status'], {
        timeout: 5000,
      });
      const status = JSON.parse(stdout);
      return {
        authenticated: !!status.loggedIn,
        method: status.authMethod || null,
        email: status.email || null,
        claudeInstalled: true,
        loginCommand: status.loggedIn ? null : 'claude auth login',
      };
    } catch {
      // CLI found but auth check failed — fall through to credentials file
    }
  }

  // Check the credentials file — works even when claude isn't in PATH
  // (common on Windows after fresh install without terminal restart)
  const credPaths = [
    join(homedir(), '.claude', '.credentials.json'),
    join(homedir(), '.claude', 'credentials.json'),
  ];

  for (const credPath of credPaths) {
    if (existsSync(credPath)) {
      try {
        const creds = JSON.parse(readFileSync(credPath, 'utf-8'));
        const oauth = creds.claudeAiOauth;
        if (oauth?.accessToken && oauth?.expiresAt > Date.now()) {
          return {
            authenticated: true,
            method: 'claude.ai',
            email: null,
            claudeInstalled: true,
          };
        }
        // Credentials exist but expired or incomplete
        return {
          authenticated: false,
          method: null,
          loginCommand: 'claude auth login',
          claudeInstalled: true,
        };
      } catch {
        // Corrupted credentials file
      }
    }
  }

  // Check if claude binary exists but credentials are missing
  if (claudeBin) {
    const { ok, version } = checkClaudeVersion(claudeBin);
    return {
      authenticated: false,
      method: null,
      claudeInstalled: true,
      claudeVersion: version,
      claudeOutdated: !ok,
      loginCommand: 'claude auth login',
    };
  }

  // No CLI and no credentials file
  return {
    authenticated: false,
    method: null,
    loginCommand: 'claude auth login',
    error: 'Claude Code not found. Install it with: curl -fsSL https://claude.ai/install.sh | sh',
  };
}

// Health check + auth status
app.get('/api/health', async (req, res) => {
  const auth = await checkClaudeAuth();
  res.json({ status: 'ok', service: 'deckwing', auth });
});

// Claude OAuth start + status endpoints
app.post('/api/auth/start', async (req, res) => {
  try {
    cleanupOAuthSessions();
    const result = await startOAuthFlow();
    res.json({ ok: true, state: result.state, oauthUrl: result.oauthUrl });
  } catch (err) {
    console.error('  [auth start error]', err instanceof Error ? err.message : err);
    if (err instanceof Error && err.stack) {
      console.error('  [auth start stack]', err.stack);
    }
    res.status(500).json({
      ok: false,
      error: 'Could not start Claude sign-in.',
    });
  }
});

app.get('/api/auth/status/:state', (req, res) => {
  cleanupOAuthSessions();
  const result = getOAuthStatus(req.params.state);
  res.json({ ok: true, status: result.status, error: result.error });
});

// Create a new chat session — returns a server-generated session ID
app.post('/api/chat/session', (req, res) => {
  try {
    const sessionId = createSession();
    res.json({ sessionId });
  } catch (err) {
    res.status(429).json({ error: err.message });
  }
});

// Simple per-session rate limiter: max 10 requests per 60 seconds
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
const rateLimitMap = new Map();

function checkRateLimit(sessionId) {
  const now = Date.now();
  let bucket = rateLimitMap.get(sessionId);
  if (!bucket || now - bucket.windowStart > RATE_LIMIT_WINDOW_MS) {
    bucket = { windowStart: now, count: 0 };
    rateLimitMap.set(sessionId, bucket);
  }
  bucket.count++;

  // Purge expired buckets to prevent unbounded growth
  if (rateLimitMap.size > 200) {
    for (const [key, b] of rateLimitMap) {
      if (now - b.windowStart > RATE_LIMIT_WINDOW_MS) rateLimitMap.delete(key);
    }
  }

  return bucket.count <= RATE_LIMIT_MAX;
}

// AI chat endpoint — generates and modifies slide decks via conversation
app.post('/api/chat', async (req, res) => {
  const { message, deck, currentSlideIndex, sessionId } = req.body;

  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ error: 'message is required' });
  }

  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  if (!checkRateLimit(sessionId)) {
    return res.status(429).json({
      error: 'Too many requests',
      reply: 'You\'re sending messages too quickly. Please wait a moment.',
      action: null,
    });
  }

  try {
    const result = await chat({
      sessionId,
      message: message.trim(),
      deck: deck == null ? null : deck,
      currentSlideIndex: Number.isFinite(currentSlideIndex) && currentSlideIndex >= 0
        ? Math.floor(currentSlideIndex)
        : 0,
    });

    res.json({ reply: result.reply, action: result.action });
  } catch (err) {
    if (err.message.includes('Invalid or expired session')) {
      return res.status(400).json({
        error: err.message,
        reply: err.message,
        action: null,
      });
    }
    console.error('  [chat error]', err.message);
    console.error('  [chat stack]', err.stack);
    res.status(500).json({
      error: 'Failed to process chat message',
      reply: 'Something went wrong on my end. Please try again.',
      action: null,
    });
  }
});

// Streaming chat endpoint — SSE with thinking status updates
app.post('/api/chat/stream', async (req, res) => {
  const { message, deck, currentSlideIndex, sessionId, model } = req.body;

  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ error: 'message is required' });
  }

  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  if (!checkRateLimit(sessionId)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const result = await chat({
      sessionId,
      message: message.trim(),
      deck: deck == null ? null : deck,
      currentSlideIndex: Number.isFinite(currentSlideIndex) && currentSlideIndex >= 0
        ? Math.floor(currentSlideIndex)
        : 0,
      model,
      onThinking: (status) => {
        res.write(`data: ${JSON.stringify({ type: 'thinking', status })}\n\n`);
      },
    });

    res.write(`data: ${JSON.stringify({ type: 'result', reply: result.reply, action: result.action })}\n\n`);
  } catch (err) {
    console.error('  [chat stream error]', err.message);
    const reply = err.message.includes('Invalid or expired session')
      ? err.message
      : 'Something went wrong on my end. Please try again.';
    res.write(`data: ${JSON.stringify({ type: 'error', error: reply })}\n\n`);
  }

  res.end();
});

// Reset conversation history for a session
app.post('/api/chat/reset', (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  resetSession(sessionId);
  res.json({ ok: true });
});

// Deck review — local schema analysis, no AI call
app.post('/api/deck/review', (req, res) => {
  const { deck } = req.body;

  if (!deck || !Array.isArray(deck.slides)) {
    return res.status(400).json({ error: 'deck with slides array is required' });
  }

  const result = reviewDeck(deck);
  res.json(result);
});

// Deck CRUD (localStorage for MVP, DB later)
app.get('/api/decks', (req, res) => {
  // TODO: Implement deck persistence
  res.json({ decks: [] });
});

app.use((err, req, res, next) => {
  if (err?.message === 'CORS: origin not allowed') {
    return res.status(403).json({ error: err.message });
  }

  return next(err);
});

export default app;
