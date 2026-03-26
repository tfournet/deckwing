import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const IMAGE_DATA_URL = 'data:image/png;base64,ZmFrZS1pbWFnZS1ieXRlcw==';
const PROJECT_FOLDER = '/workspace/deckwing-project';

let fsMock;

vi.mock('node:fs/promises', () => fsMock);

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

  function immediateChildren(targetPath) {
    const normalized = normalize(targetPath);
    const names = new Set();

    for (const filePath of files.keys()) {
      if (path.dirname(filePath) === normalized) {
        names.add(path.basename(filePath));
      }
    }

    for (const directoryPath of directories) {
      if (directoryPath !== normalized && path.dirname(directoryPath) === normalized) {
        names.add(path.basename(directoryPath));
      }
    }

    return [...names].sort();
  }

  return {
    async mkdir(targetPath) {
      ensureDirectory(targetPath);
    },
    async writeFile(targetPath, content) {
      ensureDirectory(path.dirname(targetPath));
      files.set(normalize(targetPath), String(content));
    },
    async readFile(targetPath) {
      const normalized = normalize(targetPath);
      if (!files.has(normalized)) {
        throw makeEnoent(targetPath);
      }
      return files.get(normalized);
    },
    async stat(targetPath) {
      const normalized = normalize(targetPath);
      if (files.has(normalized)) {
        return { size: Buffer.byteLength(files.get(normalized), 'utf8') };
      }
      if (directories.has(normalized)) {
        return { size: 0 };
      }
      throw makeEnoent(targetPath);
    },
    async readdir(targetPath, options = {}) {
      const normalized = normalize(targetPath);
      if (!directories.has(normalized)) {
        throw makeEnoent(targetPath);
      }

      const children = immediateChildren(normalized);
      if (!options.withFileTypes) {
        return children;
      }

      return children.map((name) => {
        const childPath = normalize(path.join(normalized, name));
        const isFile = files.has(childPath);
        return {
          name,
          isFile: () => isFile,
          isDirectory: () => !isFile,
        };
      });
    },
    async unlink(targetPath) {
      const normalized = normalize(targetPath);
      if (!files.has(normalized)) {
        throw makeEnoent(targetPath);
      }
      files.delete(normalized);
    },
    __files: files,
  };
}

async function loadAutosaveModule() {
  vi.resetModules();
  return import('./autosave.js');
}

beforeEach(() => {
  fsMock = createFsMock();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('autosave service', () => {
  it('writes timestamped autosave versions and lists newest first', async () => {
    const { autoSaveDeck, listVersions, getLatestAutoSave } = await loadAutosaveModule();
    const deck = {
      title: 'Quarterly Review',
      author: 'DeckWing',
      createdAt: '2026-03-26T13:00:00.000Z',
      updatedAt: '2026-03-26T13:00:00.000Z',
      defaultTheme: 'rewst',
      slides: [{ id: 'slide-1', type: 'image', src: IMAGE_DATA_URL }],
    };

    vi.setSystemTime(new Date('2026-03-26T13:45:00.000Z'));
    const first = await autoSaveDeck(deck, PROJECT_FOLDER);

    vi.setSystemTime(new Date('2026-03-26T13:52:00.000Z'));
    const second = await autoSaveDeck(deck, PROJECT_FOLDER);

    const versions = await listVersions(deck.title, PROJECT_FOLDER);
    expect(versions.map(version => version.timestamp)).toEqual([
      '2026-03-26T135200',
      '2026-03-26T134500',
    ]);
    expect(first.path).toContain('/.autosave/Quarterly Review/2026-03-26T134500.deckwing');
    expect(second.path).toContain('/.autosave/Quarterly Review/2026-03-26T135200.deckwing');
    expect((await getLatestAutoSave(deck.title, PROJECT_FOLDER))?.timestamp).toBe('2026-03-26T135200');
  });

  it('loads a saved version and restores data URLs from assets', async () => {
    const { autoSaveDeck, loadVersion } = await loadAutosaveModule();
    const deck = {
      title: 'Image Demo',
      author: 'DeckWing',
      createdAt: '2026-03-26T13:00:00.000Z',
      updatedAt: '2026-03-26T13:00:00.000Z',
      defaultTheme: 'rewst',
      slides: [{ id: 'slide-1', type: 'image', src: IMAGE_DATA_URL, caption: 'Inline image' }],
    };

    vi.setSystemTime(new Date('2026-03-26T14:10:00.000Z'));
    const version = await autoSaveDeck(deck, PROJECT_FOLDER);
    const loaded = await loadVersion(version.path);

    expect(loaded).toEqual(deck);
  });

  it('prunes older versions beyond the configured maximum', async () => {
    const { autoSaveDeck, listVersions, pruneVersions } = await loadAutosaveModule();
    const deck = {
      title: 'Keep Latest Two',
      author: 'DeckWing',
      createdAt: '2026-03-26T13:00:00.000Z',
      updatedAt: '2026-03-26T13:00:00.000Z',
      defaultTheme: 'rewst',
      slides: [{ id: 'slide-1', type: 'title', title: 'Autosave' }],
    };

    vi.setSystemTime(new Date('2026-03-26T10:00:00.000Z'));
    await autoSaveDeck(deck, PROJECT_FOLDER);
    vi.setSystemTime(new Date('2026-03-26T11:00:00.000Z'));
    await autoSaveDeck(deck, PROJECT_FOLDER);
    vi.setSystemTime(new Date('2026-03-26T12:00:00.000Z'));
    await autoSaveDeck(deck, PROJECT_FOLDER);

    const removed = await pruneVersions(deck.title, PROJECT_FOLDER, 2);
    const remaining = await listVersions(deck.title, PROJECT_FOLDER);

    expect(removed).toHaveLength(1);
    expect(removed[0].timestamp).toBe('2026-03-26T100000');
    expect(remaining.map(version => version.timestamp)).toEqual([
      '2026-03-26T120000',
      '2026-03-26T110000',
    ]);
  });
});
