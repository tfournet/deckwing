const { app } = require('electron');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const GCS_BUCKET = 'https://storage.googleapis.com/claude-code-dist-86c565f3-f756-42ad-8dfa-d59b1c096819/claude-code-releases';

function getBinaryName() {
  return process.platform === 'win32' ? 'claude.exe' : 'claude';
}

function getLegacyClaudePath() {
  return path.join(os.homedir(), '.deckwing', 'claude', getBinaryName());
}

function getClaudePath() {
  return path.join(app.getPath('appData'), 'deckwing', 'claude', getBinaryName());
}

function getPlatformKey() {
  if (process.platform === 'win32') {
    if (process.arch === 'x64') return 'win32-x64';
    if (process.arch === 'arm64') return 'win32-arm64';
  }

  if (process.platform === 'darwin') {
    if (process.arch === 'x64') return 'darwin-x64';
    if (process.arch === 'arm64') return 'darwin-arm64';
  }

  if (process.platform === 'linux' && process.arch === 'x64') {
    return 'linux-x64';
  }

  throw new Error(`Unsupported Claude Code platform: ${process.platform}-${process.arch}`);
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`);
  }
  return response.text();
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`);
  }
  return response.json();
}

async function fetchBuffer(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function ensureExecutable(filePath) {
  if (process.platform !== 'win32') {
    fs.chmodSync(filePath, 0o755);
  }
}

function syncLegacyLocation(sourcePath) {
  const legacyPath = getLegacyClaudePath();
  fs.mkdirSync(path.dirname(legacyPath), { recursive: true });

  try {
    if (fs.existsSync(legacyPath)) {
      const sourceStat = fs.statSync(sourcePath);
      const legacyStat = fs.statSync(legacyPath);
      if (legacyStat.size === sourceStat.size) {
        return legacyPath;
      }
    }
  } catch {
    // fall through and refresh the compatibility copy
  }

  fs.copyFileSync(sourcePath, legacyPath);
  ensureExecutable(legacyPath);
  return legacyPath;
}

async function ensurePrimaryLocation() {
  const targetPath = getClaudePath();
  if (fs.existsSync(targetPath)) {
    return targetPath;
  }

  const legacyPath = getLegacyClaudePath();
  if (fs.existsSync(legacyPath)) {
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(legacyPath, targetPath);
    ensureExecutable(targetPath);
    return targetPath;
  }

  const version = (await fetchText(`${GCS_BUCKET}/latest`)).trim();
  if (!version) {
    throw new Error('Claude Code latest version endpoint returned an empty response.');
  }

  const platformKey = getPlatformKey();
  const manifest = await fetchJson(`${GCS_BUCKET}/${version}/manifest.json`);
  const checksum = manifest?.platforms?.[platformKey]?.checksum;
  if (!checksum) {
    throw new Error(`Claude Code manifest missing checksum for ${platformKey}.`);
  }

  const binaryName = getBinaryName();
  const downloadUrl = `${GCS_BUCKET}/${version}/${platformKey}/${binaryName}`;
  const payload = await fetchBuffer(downloadUrl);
  const digest = crypto.createHash('sha256').update(payload).digest('hex');
  if (digest !== String(checksum).toLowerCase()) {
    throw new Error(`Claude Code checksum mismatch for ${platformKey}.`);
  }

  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, payload);
  ensureExecutable(targetPath);

  return targetPath;
}

async function ensureClaude() {
  const targetPath = await ensurePrimaryLocation();
  syncLegacyLocation(targetPath);
  return targetPath;
}

function checkClaudeVersion(binaryPath = getClaudePath()) {
  if (!fs.existsSync(binaryPath)) {
    return null;
  }

  try {
    return execFileSync(binaryPath, ['--version'], {
      encoding: 'utf-8',
      timeout: 5000,
    }).trim();
  } catch {
    return null;
  }
}

module.exports = {
  GCS_BUCKET,
  checkClaudeVersion,
  ensureClaude,
  getClaudePath,
};
