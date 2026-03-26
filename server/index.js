import dotenv from 'dotenv';
import { cleanStaleSessions } from './ai/chat-engine.js';
import app from './app.js';

dotenv.config();

const PORT = process.env.PORT || 3001;

// Purge stale sessions every 15 minutes
setInterval(cleanStaleSessions, 15 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`DeckWing API running on port ${PORT}`);
});
