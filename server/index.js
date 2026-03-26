import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'rewst-deck-builder' });
});

// AI chat endpoint - generates/modifies slide schema
app.post('/api/chat', async (req, res) => {
  // TODO: Implement conversational AI engine
  // This will receive user messages and return slide schema modifications
  res.json({
    message: 'AI chat endpoint not yet implemented',
    action: null,
    slides: null,
  });
});

// Deck CRUD (localStorage for MVP, DB later)
app.get('/api/decks', (req, res) => {
  // TODO: Implement deck persistence
  res.json({ decks: [] });
});

app.listen(PORT, () => {
  console.log(`Rewst Deck Builder API running on port ${PORT}`);
});
