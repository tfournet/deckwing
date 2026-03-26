import express from 'express';
import cors from 'cors';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { chat, resetSession } from './ai/chat-engine.js';
import { startOAuthFlow, getOAuthStatus, cleanupOAuthSessions } from './ai/claude-oauth.js';
import { findClaudeBinary, checkClaudeVersion } from './ai/find-claude.js';

const execFileAsync = promisify(execFile);

const app = express();

app.use(cors());
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
    res.status(500).json({
      ok: false,
      error: err instanceof Error ? err.message : 'Could not start Claude sign-in.',
    });
  }
});

app.get('/api/auth/status/:state', (req, res) => {
  cleanupOAuthSessions();
  const result = getOAuthStatus(req.params.state);
  res.json({ ok: true, status: result.status, error: result.error });
});

// AI chat endpoint — generates and modifies slide decks via conversation
app.post('/api/chat', async (req, res) => {
  const { message, deck, currentSlideIndex, sessionId } = req.body;

  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ error: 'message is required' });
  }

  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'sessionId is required' });
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
    // Log for debugging, not user-facing (the API returns a friendly message)
    console.error('  [chat error]', err.message);
    res.status(500).json({
      error: 'Failed to process chat message',
      reply: 'Something went wrong on my end. Please try again.',
      action: null,
    });
  }
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

// Deck CRUD (localStorage for MVP, DB later)
app.get('/api/decks', (req, res) => {
  // TODO: Implement deck persistence
  res.json({ decks: [] });
});

export default app;
