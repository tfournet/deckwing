import express from 'express';
import cors from 'cors';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { chat, resetSession } from './ai/chat-engine.js';

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

  try {
    const { stdout } = await execFileAsync('claude', ['auth', 'status'], {
      timeout: 5000,
    });
    const status = JSON.parse(stdout);
    return {
      authenticated: !!status.loggedIn,
      method: status.authMethod || null,
      email: status.email || null,
      loginCommand: status.loggedIn ? null : 'claude auth login',
    };
  } catch {
    return {
      authenticated: false,
      method: null,
      loginCommand: 'claude auth login',
      error: 'Claude CLI not found or not responding. Install Claude Code first.',
    };
  }
}

// Health check + auth status
app.get('/api/health', async (req, res) => {
  const auth = await checkClaudeAuth();
  res.json({ status: 'ok', service: 'deckwing', auth });
});

/**
 * Trigger Claude Code login flow.
 * Spawns `claude auth login` which opens the Anthropic OAuth page
 * in the user's default browser. The frontend polls /api/health
 * until auth succeeds.
 */
let loginInProgress = false;

app.post('/api/auth/login', async (req, res) => {
  if (process.env.ANTHROPIC_API_KEY) {
    return res.json({ ok: true, message: 'Already authenticated via API key' });
  }

  // Check if already logged in
  const current = await checkClaudeAuth();
  if (current.authenticated) {
    return res.json({ ok: true, message: 'Already authenticated' });
  }

  if (loginInProgress) {
    return res.json({ ok: true, message: 'Login already in progress — complete it in your browser' });
  }

  loginInProgress = true;

  // Spawn claude auth login — this opens the browser to Anthropic's login page
  try {
    const child = execFile('claude', ['auth', 'login'], {
      timeout: 120000, // 2 minute timeout
    }, () => {
      loginInProgress = false;
    });

    // Don't wait for it to finish — it's interactive (waits for browser callback)
    child.unref();

    res.json({
      ok: true,
      message: 'Login page opened in your browser. Sign in with your Claude account, then come back here.',
    });
  } catch (err) {
    loginInProgress = false;
    res.status(500).json({
      ok: false,
      error: 'Could not start login flow. Is Claude Code installed?',
    });
  }
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
      deck: deck ?? null,
      currentSlideIndex: Number.isFinite(currentSlideIndex) && currentSlideIndex >= 0
        ? Math.floor(currentSlideIndex)
        : 0,
    });

    res.json({ reply: result.reply, action: result.action });
  } catch (err) {
    console.error('Chat endpoint error:', err.message);
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
