#!/usr/bin/env node

/**
 * DeckWing CLI — starts the app and opens the browser.
 *
 * When installed via `npm install -g deckwing`, this serves the
 * pre-built frontend and API from a single Express process.
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { execFileSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');
const PORT = process.env.PORT || 3000;

// If dist/ doesn't exist, build first
if (!existsSync(DIST)) {
  console.log('Building frontend (first run)...');
  execFileSync('npm', ['run', 'build'], { cwd: ROOT, stdio: 'inherit' });
}

// Start the production server
const { default: app } = await import(join(ROOT, 'server', 'app.js'));
const { cleanStaleSessions } = await import(join(ROOT, 'server', 'ai', 'chat-engine.js'));
const express = await import('express');

// Serve built frontend
app.use(express.default.static(DIST));

// SPA fallback — serve index.html for all non-API routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'not found' });
  res.sendFile(join(DIST, 'index.html'));
});

// Stale session cleanup
setInterval(cleanStaleSessions, 15 * 60 * 1000);

const server = app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log('');
  console.log('  🐔 DeckWing is running');
  console.log(`     ${url}`);
  console.log('');
  console.log('  Press Ctrl+C to stop.');
  console.log('');

  // Open browser
  try {
    const platform = process.platform;
    if (platform === 'darwin') execFileSync('open', [url]);
    else if (platform === 'win32') execFileSync('cmd', ['/c', 'start', url]);
    else execFileSync('xdg-open', [url]);
  } catch {
    // Browser open is best-effort
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  server.close(() => process.exit(0));
});
