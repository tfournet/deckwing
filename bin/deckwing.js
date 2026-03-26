#!/usr/bin/env node

/**
 * DeckWing CLI — starts the app and opens the browser.
 *
 * When installed via `npm install -g deckwing`, this serves the
 * pre-built frontend and API from a single Express process.
 */

import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { execFileSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');
const PORT = process.env.PORT || 3000;

/** Convert a file path to a file:// URL for dynamic import (Windows-safe) */
function toImportURL(filePath) {
  return pathToFileURL(filePath).href;
}

console.log('');
console.log('  Starting DeckWing...');

if (!existsSync(join(DIST, 'index.html'))) {
  console.log('');
  console.log('  Hmm, it looks like the app files are missing.');
  console.log('  Try reinstalling:');
  console.log('');
  console.log('    npm install -g github:tfournet/deckwing');
  console.log('');
  process.exit(1);
}

// Start the production server
const { default: app } = await import(toImportURL(join(ROOT, 'server', 'app.js')));
const { cleanStaleSessions } = await import(toImportURL(join(ROOT, 'server', 'ai', 'chat-engine.js')));
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

function tryListen(port, maxRetries = 5) {
  const server = app.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log('');
    console.log('  🐔 DeckWing is ready!');
    console.log(`     ${url}`);
    console.log('');
    console.log('  Press Ctrl+C to stop.');
    console.log('');

    try {
      const platform = process.platform;
      if (platform === 'darwin') execFileSync('open', [url]);
      else if (platform === 'win32') execFileSync('cmd', ['/c', 'start', url]);
      else execFileSync('xdg-open', [url]);
    } catch {
      // Browser open is best-effort
    }
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && maxRetries > 0) {
      console.log(`  Port ${port} in use, trying ${port + 1}...`);
      tryListen(port + 1, maxRetries - 1);
    } else if (err.code === 'EADDRINUSE') {
      console.error('');
      console.error(`  Could not find an open port (tried ${PORT}-${port}).`);
      console.error(`  Try: PORT=4000 deckwing`);
      console.error('');
      process.exit(1);
    } else {
      console.error(`  Server error: ${err.message}`);
      process.exit(1);
    }
  });

  return server;
}

const server = tryListen(Number(PORT));

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('');
  console.log('  DeckWing stopped. See you next time!');
  console.log('');
  server.close(() => process.exit(0));
});
