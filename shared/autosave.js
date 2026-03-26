import { DECKWING_EXTENSION, deserializeDeck, serializeDeck } from './deck-file.js';

const AUTOSAVE_FOLDER = '.autosave';

function isNodeEnvironment() {
  return typeof process !== 'undefined' && Boolean(process.versions?.node);
}

async function dynamicImport(specifier) {
  return import(specifier);
}

function sanitizeDeckTitle(deckTitle) {
  const safeTitle = String(deckTitle ?? 'Untitled Presentation')
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
    .replace(/\.+$/g, '')
    .trim();

  return safeTitle || 'Untitled Presentation';
}

function formatTimestamp(date = new Date()) {
  return date.toISOString().slice(0, 19).replace(/:/g, '');
}

function assertNodeFileSystem() {
  if (!isNodeEnvironment()) {
    throw new Error('File system operations are not available in this environment.');
  }
}

function assertProjectFolder(projectFolder) {
  if (typeof projectFolder !== 'string' || !projectFolder.trim()) {
    throw new Error('A valid project folder is required for autosave operations.');
  }
}

async function getNodeUtilities() {
  assertNodeFileSystem();

  const [fs, pathModule] = await Promise.all([
    dynamicImport('node:fs/promises'),
    dynamicImport('node:path'),
  ]);

  return { fs, pathModule };
}

async function resolveDeckFolder(deckTitle, projectFolder) {
  const { pathModule } = await getNodeUtilities();
  return pathModule.join(projectFolder, AUTOSAVE_FOLDER, sanitizeDeckTitle(deckTitle));
}

function versionToTimestamp(fileName) {
  return fileName.endsWith(DECKWING_EXTENSION)
    ? fileName.slice(0, -DECKWING_EXTENSION.length)
    : fileName;
}

export async function autoSaveDeck(deck, projectFolder) {
  assertProjectFolder(projectFolder);
  const { fs, pathModule } = await getNodeUtilities();
  const deckTitle = deck?.title ?? 'Untitled Presentation';
  const versionFolder = pathModule.join(projectFolder, AUTOSAVE_FOLDER, sanitizeDeckTitle(deckTitle));
  const timestamp = formatTimestamp();
  const versionPath = pathModule.join(versionFolder, `${timestamp}${DECKWING_EXTENSION}`);

  await fs.mkdir(versionFolder, { recursive: true });
  await fs.writeFile(versionPath, serializeDeck(deck), 'utf8');

  const stats = await fs.stat(versionPath);
  return {
    timestamp,
    path: versionPath,
    size: stats.size,
  };
}

export async function listVersions(deckTitle, projectFolder) {
  assertProjectFolder(projectFolder);
  const { fs, pathModule } = await getNodeUtilities();
  const versionFolder = pathModule.join(projectFolder, AUTOSAVE_FOLDER, sanitizeDeckTitle(deckTitle));

  try {
    const entries = await fs.readdir(versionFolder, { withFileTypes: true });
    const versions = [];

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(DECKWING_EXTENSION)) {
        continue;
      }

      const versionPath = pathModule.join(versionFolder, entry.name);
      const stats = await fs.stat(versionPath);
      versions.push({
        timestamp: versionToTimestamp(entry.name),
        path: versionPath,
        size: stats.size,
      });
    }

    return versions.sort((left, right) => right.timestamp.localeCompare(left.timestamp));
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return [];
    }

    throw error;
  }
}

export async function loadVersion(versionPath) {
  assertNodeFileSystem();
  const { fs } = await getNodeUtilities();
  const raw = await fs.readFile(versionPath, 'utf8');
  return deserializeDeck(raw);
}

export async function pruneVersions(deckTitle, projectFolder, maxVersions) {
  const normalizedMaxVersions = Math.max(0, Number(maxVersions) || 0);
  const versions = await listVersions(deckTitle, projectFolder);
  const { fs } = await getNodeUtilities();
  const versionsToRemove = versions.slice(normalizedMaxVersions);

  await Promise.all(versionsToRemove.map(version => fs.unlink(version.path)));
  return versionsToRemove;
}

export async function getLatestAutoSave(deckTitle, projectFolder) {
  const versions = await listVersions(deckTitle, projectFolder);
  return versions[0] ?? null;
}

