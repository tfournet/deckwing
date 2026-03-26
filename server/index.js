import dotenv from 'dotenv';
import { cleanStaleSessions } from './ai/chat-engine.js';
import app from './app.js';

dotenv.config();

const PORT = process.env.PORT || 3001;

// Purge stale sessions every 15 minutes
setInterval(cleanStaleSessions, 15 * 60 * 1000);

const HOST = process.env.HOST || '127.0.0.1';

app.listen(PORT, HOST, () => {
  // Server started (bin/deckwing.js shows the user-facing message)
});
