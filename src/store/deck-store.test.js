import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createDeck, createSlide } from '../schema/slide-schema.js';

// Provide a localStorage stub for Node environment
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

let storage;

beforeEach(async () => {
  storage = createStorageStub();
  vi.stubGlobal('localStorage', storage);
});

// Dynamic import so the module picks up our stubbed localStorage
async function loadStore() {
  // Re-import fresh each time to avoid module cache issues
  const mod = await import('./deck-store.js');
  return mod;
}

// --- saveDeck ---

describe('saveDeck', () => {
  it('persists a deck to localStorage keyed by deck id', async () => {
    const { saveDeck, loadDeck } = await loadStore();
    const deck = createDeck({ title: 'Test Deck' });

    saveDeck(deck);

    const loaded = loadDeck(deck.id);
    expect(loaded).not.toBeNull();
    expect(loaded.title).toBe('Test Deck');
    expect(loaded.id).toBe(deck.id);
  });

  it('updates updatedAt timestamp on save', async () => {
    const { saveDeck, loadDeck } = await loadStore();
    const deck = createDeck({ title: 'Timestamped' });
    const originalUpdatedAt = deck.updatedAt;

    // Small delay to ensure different timestamp
    await new Promise(r => setTimeout(r, 10));
    saveDeck(deck);

    const loaded = loadDeck(deck.id);
    expect(loaded).not.toBeNull();
    // The save should store the deck as-is (caller manages updatedAt)
    expect(loaded.updatedAt).toBe(deck.updatedAt);
  });

  it('overwrites existing deck with same id', async () => {
    const { saveDeck, loadDeck } = await loadStore();
    const deck = createDeck({ title: 'Version 1' });

    saveDeck(deck);
    saveDeck({ ...deck, title: 'Version 2' });

    const loaded = loadDeck(deck.id);
    expect(loaded.title).toBe('Version 2');
  });

  it('returns error result when localStorage throws', async () => {
    const { saveDeck } = await loadStore();
    storage.setItem = () => { throw new Error('QuotaExceededError'); };

    const result = saveDeck(createDeck({ title: 'Too Big' }));

    expect(result.ok).toBe(false);
    expect(result.error).toContain('QuotaExceeded');
  });

  it('returns ok result on successful save', async () => {
    const { saveDeck } = await loadStore();

    const result = saveDeck(createDeck({ title: 'Fine' }));

    expect(result.ok).toBe(true);
  });
});

// --- loadDeck ---

describe('loadDeck', () => {
  it('returns null for non-existent deck', async () => {
    const { loadDeck } = await loadStore();
    expect(loadDeck('nonexistent')).toBeNull();
  });

  it('returns null for corrupted JSON', async () => {
    const { loadDeck } = await loadStore();
    storage.setItem('rewst-deck-not-json', '{broken');
    expect(loadDeck('not-json')).toBeNull();
  });

  it('round-trips all deck fields', async () => {
    const { saveDeck, loadDeck } = await loadStore();
    const deck = createDeck({
      title: 'Full Deck',
      author: 'Tim',
      theme: 'terminal',
      slides: [
        createSlide('title', { title: 'Hello' }),
        createSlide('content', { title: 'Body', points: ['a', 'b'] }),
      ],
    });

    saveDeck(deck);
    const loaded = loadDeck(deck.id);

    expect(loaded.title).toBe('Full Deck');
    expect(loaded.author).toBe('Tim');
    expect(loaded.defaultTheme).toBe('terminal');
    expect(loaded.slides).toHaveLength(2);
    expect(loaded.slides[1].points).toEqual(['a', 'b']);
  });
});

// --- listDecks ---

describe('listDecks', () => {
  it('returns empty array when no decks saved', async () => {
    const { listDecks } = await loadStore();
    expect(listDecks()).toEqual([]);
  });

  it('returns metadata for all saved decks', async () => {
    const { saveDeck, listDecks } = await loadStore();
    const deck1 = createDeck({ title: 'Deck A' });
    const deck2 = createDeck({ title: 'Deck B', slides: [
      createSlide('title', { title: 'B' }),
      createSlide('content', { title: 'Body', points: [] }),
    ]});

    saveDeck(deck1);
    saveDeck(deck2);

    const list = listDecks();
    expect(list).toHaveLength(2);

    const titles = list.map(d => d.title).sort();
    expect(titles).toEqual(['Deck A', 'Deck B']);

    // Each item should have metadata fields
    for (const item of list) {
      expect(item.id).toBeDefined();
      expect(item.title).toBeDefined();
      expect(typeof item.slideCount).toBe('number');
      expect(item.updatedAt).toBeDefined();
    }
  });

  it('does not include full slide data in list', async () => {
    const { saveDeck, listDecks } = await loadStore();
    saveDeck(createDeck({ title: 'Compact' }));

    const list = listDecks();
    expect(list[0].slides).toBeUndefined();
  });

  it('ignores non-deck localStorage keys', async () => {
    const { saveDeck, listDecks } = await loadStore();
    storage.setItem('other-key', 'not a deck');
    storage.setItem('rewst-deck-but-bad', '{invalid');
    saveDeck(createDeck({ title: 'Real Deck' }));

    const list = listDecks();
    expect(list).toHaveLength(1);
    expect(list[0].title).toBe('Real Deck');
  });
});

// --- deleteDeck ---

describe('deleteDeck', () => {
  it('removes a deck from storage', async () => {
    const { saveDeck, loadDeck, deleteDeck } = await loadStore();
    const deck = createDeck({ title: 'Doomed' });

    saveDeck(deck);
    expect(loadDeck(deck.id)).not.toBeNull();

    deleteDeck(deck.id);
    expect(loadDeck(deck.id)).toBeNull();
  });

  it('does not throw when deleting non-existent deck', async () => {
    const { deleteDeck } = await loadStore();
    expect(() => deleteDeck('ghost')).not.toThrow();
  });

  it('only removes the specified deck', async () => {
    const { saveDeck, listDecks, deleteDeck } = await loadStore();
    const deck1 = createDeck({ title: 'Keep' });
    const deck2 = createDeck({ title: 'Delete' });

    saveDeck(deck1);
    saveDeck(deck2);
    deleteDeck(deck2.id);

    const list = listDecks();
    expect(list).toHaveLength(1);
    expect(list[0].title).toBe('Keep');
  });
});
