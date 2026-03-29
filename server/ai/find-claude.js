/**
 * Find the claude binary even if it's not in PATH.
 * Common on Windows after fresh npm install without terminal restart.
 */

import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { execFileSync } from 'child_process';  // used by checkClaudeVersion

const MIN_CLAUDE_VERSION = '2.0.0';

let cached = undefined;

/**
 * Check if a claude binary is recent enough.
 * Returns the version string or null if too old / can't check.
 */
export function checkClaudeVersion(binaryPath) {
  try {
    const version = execFileSync(binaryPath, ['--version'], { encoding: 'utf-8', timeout: 3000 }).trim();
    // Output is like "2.1.84 (Claude Code)"
    const match = version.match(/^(\d+\.\d+\.\d+)/);
    if (!match) return { ok: false, version: version };
    const parts = match[1].split('.').map(Number);
    const minParts = MIN_CLAUDE_VERSION.split('.').map(Number);
    const ok = parts[0] > minParts[0] ||
      (parts[0] === minParts[0] && parts[1] > minParts[1]) ||
      (parts[0] === minParts[0] && parts[1] === minParts[1] && parts[2] >= minParts[2]);
    return { ok, version: match[1] };
  } catch {
    return { ok: false, version: null };
  }
}

export function findClaudeBinary({ skipCache = false } = {}) {
  if (!skipCache && cached !== undefined) return cached;

  const home = homedir();
  const binaryName = process.platform === 'win32' ? 'claude.exe' : 'claude';

  // Only trust DeckWing-managed locations where binaries are checksum-verified.
  // System PATH, npm global, and other unverified locations are intentionally
  // excluded to prevent binary planting attacks.
  const trustedLocations = [
    join(home, '.deckwing', 'claude', binaryName),
  ];

  // Electron appData location (used by claude-manager.js in desktop builds)
  if (process.platform === 'win32') {
    const appData = process.env.APPDATA || join(home, 'AppData', 'Roaming');
    trustedLocations.push(join(appData, 'deckwing', 'claude', binaryName));
  } else if (process.platform === 'darwin') {
    trustedLocations.push(join(home, 'Library', 'Application Support', 'deckwing', 'claude', binaryName));
  } else {
    const xdgConfig = process.env.XDG_CONFIG_HOME || join(home, '.config');
    trustedLocations.push(join(xdgConfig, 'deckwing', 'claude', binaryName));
  }

  for (const p of trustedLocations) {
    if (existsSync(p)) {
      cached = p;
      return cached;
    }
  }

  cached = null;
  return null;
}
