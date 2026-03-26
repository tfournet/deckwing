import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let fsMock;
let osMock;

vi.mock('node:fs/promises', () => fsMock);
vi.mock('node:os', () => osMock);

function createStorageStub() {
  const store = new Map();
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
    get length() { return store.size; },
    key: (index) => [...store.keys()][index] ?? null,
  };
}

function createFsMock() {
  const files = new Map();
  const directories = new Set(['/']);

  function makeEnoent(targetPath) {
    const error = new Error(`ENOENT: no such file or directory, ${targetPath}`);
    error.code = 'ENOENT';
    return error;
  }

  function normalize(targetPath) {
    return path.resolve('/', targetPath).replace(/\\/g, '/');
  }

  function ensureDirectory(targetPath) {
    const normalized = normalize(targetPath);
    const segments = normalized.split('/').filter(Boolean);
    let current = '/';
    directories.add(current);

    for (const segment of segments) {
      current = current === '/' ? `/${segment}` : `${current}/${segment}`;
      directories.add(current);
    }
  }

  return {
    async readFile(targetPath) {
      const normalized = normalize(targetPath);
      if (!files.has(normalized)) {
        throw makeEnoent(targetPath);
      }
      return files.get(normalized);
    },
    async writeFile(targetPath, content) {
      ensureDirectory(path.dirname(targetPath));
      files.set(normalize(targetPath), String(content));
    },
    async mkdir(targetPath) {
      ensureDirectory(targetPath);
    },
    __readJson(targetPath) {
      return JSON.parse(files.get(normalize(targetPath)));
    },
    __hasFile(targetPath) {
      return files.has(normalize(targetPath));
    },
  };
}

async function loadSettingsModule() {
  vi.resetModules();
  return import('./settings.js');
}

beforeEach(() => {
  fsMock = createFsMock();
  osMock = {
    homedir: () => '/home/tester',
    platform: () => 'linux',
  };
  vi.unstubAllGlobals();
  delete process.env.APPDATA;
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('settings service (node)', () => {
  it('creates default settings at the linux fallback path when missing', async () => {
    const { loadSettings } = await loadSettingsModule();
    const settingsPath = '/home/tester/.config/deckwing/settings.json';

    const settings = await loadSettings();

    expect(settings).toEqual({
      version: 1,
      projectFolder: null,
      recentFiles: [],
      selectedModel: 'sonnet',
      autoSave: {
        enabled: true,
        intervalSeconds: 30,
        maxVersions: 50,
      },
    });
    expect(fsMock.__hasFile(settingsPath)).toBe(true);
    expect(fsMock.__readJson(settingsPath)).toEqual(settings);
  });

  it('saves project folder and keeps recent files deduped to 10 entries', async () => {
    const { saveSettings, setProjectFolder, getProjectFolder, addRecentFile, getRecentFiles } = await loadSettingsModule();

    await saveSettings({
      projectFolder: null,
      recentFiles: ['/tmp/old.deckwing'],
      selectedModel: 'opus',
      autoSave: {
        enabled: false,
        intervalSeconds: 45,
        maxVersions: 20,
      },
    });

    await setProjectFolder('/projects/deckwing');
    expect(await getProjectFolder()).toBe('/projects/deckwing');

    for (let index = 0; index < 12; index += 1) {
      await addRecentFile(`/projects/deckwing/deck-${index}.deckwing`);
    }
    await addRecentFile('/projects/deckwing/deck-5.deckwing');

    const recentFiles = await getRecentFiles();
    expect(recentFiles).toHaveLength(10);
    expect(recentFiles[0]).toBe('/projects/deckwing/deck-5.deckwing');
    expect(recentFiles.filter(file => file === '/projects/deckwing/deck-5.deckwing')).toHaveLength(1);

    const { loadSettings } = await loadSettingsModule();
    const savedSettings = await loadSettings();
    expect(savedSettings.projectFolder).toBe('/projects/deckwing');
    expect(savedSettings.selectedModel).toBe('opus');
    expect(savedSettings.autoSave).toEqual({
      enabled: false,
      intervalSeconds: 45,
      maxVersions: 20,
    });
  });
});

describe('settings service (browser fallback)', () => {
  it('uses localStorage when process is unavailable', async () => {
    const storage = createStorageStub();
    vi.stubGlobal('localStorage', storage);
    vi.stubGlobal('process', undefined);

    const { loadSettings, setProjectFolder, addRecentFile, getRecentFiles } = await loadSettingsModule();

    const defaults = await loadSettings();
    expect(defaults.selectedModel).toBe('sonnet');
    expect(JSON.parse(storage.getItem('deckwing-settings'))).toEqual(defaults);

    await setProjectFolder('/browser/project');
    await addRecentFile('/browser/project/demo.deckwing');

    const saved = JSON.parse(storage.getItem('deckwing-settings'));
    expect(saved.projectFolder).toBe('/browser/project');
    expect(await getRecentFiles()).toEqual(['/browser/project/demo.deckwing']);
  });
});
