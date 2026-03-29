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

function getChecksumPath(binaryPath) {
  return binaryPath + '.sha256';
}

function verifyBinaryChecksum(binaryPath) {
  const checksumPath = getChecksumPath(binaryPath);
  if (!fs.existsSync(checksumPath)) {
    return false;
  }
  const expected = fs.readFileSync(checksumPath, 'utf-8').trim().toLowerCase();
  const actual = crypto.createHash('sha256').update(fs.readFileSync(binaryPath)).digest('hex');
  return actual === expected;
}

function saveChecksum(binaryPath, checksum) {
  fs.writeFileSync(getChecksumPath(binaryPath), checksum.toLowerCase() + '\n');
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

  // If binary exists, verify its integrity before trusting it
  if (fs.existsSync(targetPath)) {
    if (verifyBinaryChecksum(targetPath)) {
      return targetPath;
    }
    // Quarantine instead of delete — restore if re-download fails
    console.log('[claude-manager] Cached binary failed integrity check, re-downloading');
    const quarantinePath = targetPath + '.quarantine';
    fs.renameSync(targetPath, quarantinePath);
    const checksumPath = getChecksumPath(targetPath);
    if (fs.existsSync(checksumPath)) fs.unlinkSync(checksumPath);

    try {
      const freshPath = await downloadVerifiedBinary(targetPath);
      if (fs.existsSync(quarantinePath)) fs.unlinkSync(quarantinePath);
      return freshPath;
    } catch (err) {
      console.warn('[claude-manager] Re-download failed, restoring cached binary:', err.message);
      fs.renameSync(quarantinePath, targetPath);
      return targetPath;
    }
  }

  // Migrate from legacy location if available (verify after copy)
  const legacyPath = getLegacyClaudePath();
  if (fs.existsSync(legacyPath)) {
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(legacyPath, targetPath);
    ensureExecutable(targetPath);
    // Legacy binaries have no sidecar — fetch manifest to create one
  }

  return downloadVerifiedBinary(targetPath);
}

async function downloadVerifiedBinary(targetPath) {
  const version = (await fetchText(`${GCS_BUCKET}/latest`)).trim();
  if (!version) {
    throw new Error('Claude Code latest version endpoint returned an empty response.');
  }

  const platformKey = getPlatformKey();
  const manifest = await fetchJson(`${GCS_BUCKET}/${version}/manifest.json`);
  const checksum = manifest?.platforms?.[platformKey]?.checksum;
  if (typeof checksum !== 'string' || !/^[0-9a-f]{64}$/i.test(checksum)) {
    throw new Error(`Claude Code manifest has invalid checksum for ${platformKey}.`);
  }

  // If target exists (legacy migration), verify against manifest
  if (fs.existsSync(targetPath)) {
    const digest = crypto.createHash('sha256').update(fs.readFileSync(targetPath)).digest('hex');
    if (digest === checksum.toLowerCase()) {
      saveChecksum(targetPath, checksum);
      return targetPath;
    }
    // Legacy binary doesn't match current manifest — re-download
    fs.unlinkSync(targetPath);
  }

  const binaryName = getBinaryName();
  const downloadUrl = `${GCS_BUCKET}/${version}/${platformKey}/${binaryName}`;
  const payload = await fetchBuffer(downloadUrl);
  const digest = crypto.createHash('sha256').update(payload).digest('hex');
  if (digest !== checksum.toLowerCase()) {
    throw new Error(`Claude Code checksum mismatch for ${platformKey}.`);
  }

  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, payload);
  ensureExecutable(targetPath);
  saveChecksum(targetPath, checksum);

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
