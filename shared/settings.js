import { DEFAULT_MODEL } from './models.js';

const SETTINGS_VERSION = 1;
const SETTINGS_STORAGE_KEY = 'deckwing-settings';
const APP_FOLDER_NAME = 'deckwing';

const DEFAULT_SETTINGS = Object.freeze({
  version: SETTINGS_VERSION,
  projectFolder: null,
  recentFiles: [],
  selectedModel: DEFAULT_MODEL,
  autoSave: {
    enabled: true,
    intervalSeconds: 30,
    maxVersions: 50,
  },
});

function cloneDefaults() {
  return {
    ...DEFAULT_SETTINGS,
    recentFiles: [...DEFAULT_SETTINGS.recentFiles],
    autoSave: { ...DEFAULT_SETTINGS.autoSave },
  };
}

function normalizeSettings(settings = {}) {
  const normalized = cloneDefaults();

  if (settings && typeof settings === 'object') {
    normalized.projectFolder = typeof settings.projectFolder === 'string' && settings.projectFolder.trim()
      ? settings.projectFolder
      : null;
    normalized.recentFiles = Array.isArray(settings.recentFiles)
      ? dedupeRecentFiles(settings.recentFiles)
      : [];
    normalized.selectedModel = typeof settings.selectedModel === 'string' && settings.selectedModel.trim()
      ? settings.selectedModel
      : DEFAULT_MODEL;

    if (settings.autoSave && typeof settings.autoSave === 'object') {
      normalized.autoSave = {
        enabled: typeof settings.autoSave.enabled === 'boolean'
          ? settings.autoSave.enabled
          : DEFAULT_SETTINGS.autoSave.enabled,
        intervalSeconds: normalizePositiveInteger(
          settings.autoSave.intervalSeconds,
          DEFAULT_SETTINGS.autoSave.intervalSeconds,
        ),
        maxVersions: normalizePositiveInteger(
          settings.autoSave.maxVersions,
          DEFAULT_SETTINGS.autoSave.maxVersions,
        ),
      };
    }
  }

  return normalized;
}

function normalizePositiveInteger(value, fallback) {
  const numericValue = Number(value);
  return Number.isInteger(numericValue) && numericValue > 0 ? numericValue : fallback;
}

function dedupeRecentFiles(files) {
  const seen = new Set();
  const recentFiles = [];

  for (const entry of files) {
    if (typeof entry !== 'string' || !entry.trim() || seen.has(entry)) {
      continue;
    }

    seen.add(entry);
    recentFiles.push(entry);

    if (recentFiles.length >= 10) {
      break;
    }
  }

  return recentFiles;
}

function isBrowserEnvironment() {
  return typeof process === 'undefined' && typeof localStorage !== 'undefined';
}

function isNodeEnvironment() {
  return typeof process !== 'undefined' && Boolean(process.versions?.node);
}

async function dynamicImport(specifier) {
  return import(specifier);
}

async function resolveNodeSettingsPath() {
  const [{ homedir, platform }, pathModule] = await Promise.all([
    dynamicImport('node:os'),
    dynamicImport('node:path'),
  ]);

  const electronUserData = await getElectronUserDataPath();
  if (electronUserData) {
    return pathModule.join(electronUserData, 'settings.json');
  }

  const currentPlatform = platform();
  if (currentPlatform === 'win32') {
    const appData = process.env.APPDATA || pathModule.join(homedir(), 'AppData', 'Roaming');
    return pathModule.join(appData, APP_FOLDER_NAME, 'settings.json');
  }

  if (currentPlatform === 'darwin') {
    return pathModule.join(homedir(), 'Library', 'Application Support', APP_FOLDER_NAME, 'settings.json');
  }

  return pathModule.join(homedir(), '.config', APP_FOLDER_NAME, 'settings.json');
}

async function getElectronUserDataPath() {
  if (!isNodeEnvironment() || !process.versions?.electron) {
    return null;
  }

  try {
    const electronModule = await dynamicImport('electron');
    const electronApp = electronModule?.app ?? electronModule?.default?.app;

    if (!electronApp?.getPath) {
      return null;
    }

    if (typeof electronApp.isReady === 'function' && !electronApp.isReady() && typeof electronApp.whenReady === 'function') {
      await electronApp.whenReady();
    }

    return electronApp.getPath('userData');
  } catch {
    return null;
  }
}

async function readNodeSettings() {
  const [fs, settingsPath] = await Promise.all([
    dynamicImport('node:fs/promises'),
    resolveNodeSettingsPath(),
  ]);

  try {
    const raw = await fs.readFile(settingsPath, 'utf8');
    return { raw, settingsPath, fs };
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return { raw: null, settingsPath, fs };
    }

    throw error;
  }
}

async function writeNodeSettings(settings) {
  const [fs, pathModule, settingsPath] = await Promise.all([
    dynamicImport('node:fs/promises'),
    dynamicImport('node:path'),
    resolveNodeSettingsPath(),
  ]);

  await fs.mkdir(pathModule.dirname(settingsPath), { recursive: true });
  await fs.writeFile(settingsPath, JSON.stringify(normalizeSettings(settings), null, 2), 'utf8');
  return normalizeSettings(settings);
}

function readBrowserSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      const defaults = cloneDefaults();
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(defaults));
      return defaults;
    }

    return normalizeSettings(JSON.parse(raw));
  } catch {
    const defaults = cloneDefaults();
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(defaults));
    } catch {
      // Ignore storage errors and still return defaults.
    }
    return defaults;
  }
}

function writeBrowserSettings(settings) {
  const normalized = normalizeSettings(settings);
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export async function loadSettings() {
  if (isBrowserEnvironment()) {
    return readBrowserSettings();
  }

  if (!isNodeEnvironment()) {
    return cloneDefaults();
  }

  const { raw } = await readNodeSettings();
  if (raw === null) {
    const defaults = cloneDefaults();
    await writeNodeSettings(defaults);
    return defaults;
  }

  try {
    const normalized = normalizeSettings(JSON.parse(raw));
    await writeNodeSettings(normalized);
    return normalized;
  } catch {
    const defaults = cloneDefaults();
    await writeNodeSettings(defaults);
    return defaults;
  }
}

export async function saveSettings(settings) {
  if (isBrowserEnvironment()) {
    return writeBrowserSettings(settings);
  }

  if (!isNodeEnvironment()) {
    return normalizeSettings(settings);
  }

  return writeNodeSettings(settings);
}

export async function getProjectFolder() {
  const settings = await loadSettings();
  return settings.projectFolder;
}

export async function setProjectFolder(projectFolder) {
  const settings = await loadSettings();
  settings.projectFolder = typeof projectFolder === 'string' && projectFolder.trim() ? projectFolder : null;
  const savedSettings = await saveSettings(settings);
  return savedSettings.projectFolder;
}

export async function addRecentFile(filePath) {
  if (typeof filePath !== 'string' || !filePath.trim()) {
    return getRecentFiles();
  }

  const settings = await loadSettings();
  settings.recentFiles = dedupeRecentFiles([filePath, ...settings.recentFiles]);
  const savedSettings = await saveSettings(settings);
  return [...savedSettings.recentFiles];
}

export async function getRecentFiles() {
  const settings = await loadSettings();
  return [...settings.recentFiles];
}
