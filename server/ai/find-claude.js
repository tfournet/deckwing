/**
 * Find the claude binary even if it's not in PATH.
 * Common on Windows after fresh npm install without terminal restart.
 */

import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { execFileSync } from 'child_process';

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

  // Check PATH first
  try {
    const cmd = process.platform === 'win32' ? 'where' : 'which';
    const result = execFileSync(cmd, ['claude'], { encoding: 'utf-8', timeout: 3000 }).trim();
    if (result) {
      cached = result.split('\n')[0].trim();
      return cached;
    }
  } catch { /* not in PATH */ }

  // Common locations — native installer + npm global
  const home = homedir();
  // On Windows, also check .claude/downloads for the latest native binary
  let nativeDownload = null;
  if (process.platform === 'win32') {
    const downloadDir = join(home, '.claude', 'downloads');
    try {
      const files = require('fs').readdirSync(downloadDir)
        .filter(f => f.startsWith('claude-') && f.endsWith('.exe'))
        .sort()
        .reverse();
      if (files.length > 0) {
        nativeDownload = join(downloadDir, files[0]);
      }
    } catch { /* no downloads dir */ }
  }

  const candidates = process.platform === 'win32'
    ? [
        join(home, '.claude', 'local', 'claude.exe'),
        nativeDownload,
        join(home, 'AppData', 'Local', 'Programs', 'Claude', 'claude.exe'),
        join(home, 'AppData', 'Local', 'claude', 'claude.exe'),
        'C:\\Program Files\\Claude\\claude.exe',
        // npm paths last — SDK prefers native binary
        join(home, 'AppData', 'Roaming', 'npm', 'claude.cmd'),
      ].filter(Boolean)
    : [
        join(home, '.local', 'bin', 'claude'),          // native installer location
        '/usr/local/bin/claude',
        '/opt/homebrew/bin/claude',
        join(home, '.npm-global', 'bin', 'claude'),
      ];

  for (const p of candidates) {
    if (existsSync(p)) {
      cached = p;
      return cached;
    }
  }

  // Last resort: check npm global prefix
  try {
    const prefix = execFileSync('npm', ['config', 'get', 'prefix'], { encoding: 'utf-8', timeout: 3000 }).trim();
    const npmBin = process.platform === 'win32'
      ? join(prefix, 'claude.cmd')
      : join(prefix, 'bin', 'claude');
    if (existsSync(npmBin)) {
      cached = npmBin;
      return cached;
    }
  } catch { /* npm not available */ }

  cached = null;
  return null;
}
