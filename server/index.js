import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { chat, resetSession, cleanStaleSessions } from './ai/chat-engine.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Purge stale sessions every 15 minutes
setInterval(cleanStaleSessions, 15 * 60 * 1000);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'rewst-deck-builder' });
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
      currentSlideIndex: currentSlideIndex ?? 0,
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

app.listen(PORT, () => {
  console.log(`Rewst Deck Builder API running on port ${PORT}`);
});
