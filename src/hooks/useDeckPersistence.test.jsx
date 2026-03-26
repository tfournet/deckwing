/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createDeck, createSlide } from '../schema/slide-schema.js';

// Stub localStorage
function createStorageStub() {
  const store = new Map();
  return {
    getItem: vi.fn((key) => store.get(key) ?? null),
    setItem: vi.fn((key, value) => store.set(key, String(value))),
    removeItem: vi.fn((key) => store.delete(key)),
    clear: vi.fn(() => store.clear()),
    get length() { return store.size; },
    key: (index) => [...store.keys()][index] ?? null,
  };
}

let storage;

beforeEach(() => {
  storage = createStorageStub();
  vi.stubGlobal('localStorage', storage);
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

import { useDeckPersistence } from './useDeckPersistence.js';

describe('useDeckPersistence', () => {
  it('returns a deck, setter, and save status', () => {
    const { result } = renderHook(() => useDeckPersistence());

    expect(result.current.deck).toBeDefined();
    expect(result.current.deck.slides.length).toBeGreaterThanOrEqual(1);
    expect(typeof result.current.setDeck).toBe('function');
    expect(typeof result.current.saveStatus).toBe('string');
  });

  it('starts with a default deck when nothing is saved', () => {
    const { result } = renderHook(() => useDeckPersistence());
    expect(result.current.deck.title).toBeDefined();
    expect(result.current.saveStatus).toBe('new');
  });

  it('loads a previously saved deck by ID', () => {
    const deck = createDeck({ title: 'Saved Deck' });
    storage.setItem(`rewst-deck-${deck.id}`, JSON.stringify(deck));

    const { result } = renderHook(() => useDeckPersistence(deck.id));
    expect(result.current.deck.title).toBe('Saved Deck');
    expect(result.current.deck.id).toBe(deck.id);
  });

  it('auto-saves deck after debounce period when deck changes', () => {
    const { result } = renderHook(() => useDeckPersistence());
    const deckId = result.current.deck.id;

    act(() => {
      result.current.setDeck({ ...result.current.deck, title: 'Updated Title' });
    });

    // Before debounce fires, localStorage should not have the update
    expect(result.current.saveStatus).toBe('saving');

    // Advance past debounce
    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(result.current.saveStatus).toBe('saved');
    const raw = storage.getItem(`rewst-deck-${deckId}`);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw).title).toBe('Updated Title');
  });

  it('debounces rapid changes — only saves once', () => {
    const { result } = renderHook(() => useDeckPersistence());

    act(() => {
      result.current.setDeck({ ...result.current.deck, title: 'Change 1' });
    });
    act(() => {
      result.current.setDeck({ ...result.current.deck, title: 'Change 2' });
    });
    act(() => {
      result.current.setDeck({ ...result.current.deck, title: 'Change 3' });
    });

    act(() => {
      vi.advanceTimersByTime(600);
    });

    // Should only have been called once with the final value
    const setCalls = storage.setItem.mock.calls.filter(
      ([key]) => key.startsWith('rewst-deck-')
    );
    expect(setCalls).toHaveLength(1);
    expect(JSON.parse(setCalls[0][1]).title).toBe('Change 3');
  });

  it('flushes pending save on unmount to prevent data loss', () => {
    const { result, unmount } = renderHook(() => useDeckPersistence());
    const deckId = result.current.deck.id;

    act(() => {
      result.current.setDeck({ ...result.current.deck, title: 'Unsaved Edit' });
    });

    // Unmount before debounce fires
    unmount();

    // The pending save should have been flushed
    const raw = storage.getItem(`rewst-deck-${deckId}`);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw).title).toBe('Unsaved Edit');
  });

  it('sets updatedAt on save', () => {
    const { result } = renderHook(() => useDeckPersistence());
    const deckId = result.current.deck.id;
    const originalUpdatedAt = result.current.deck.updatedAt;

    act(() => {
      result.current.setDeck({ ...result.current.deck, title: 'Timestamped' });
    });

    act(() => {
      vi.advanceTimersByTime(600);
    });

    const raw = storage.getItem(`rewst-deck-${deckId}`);
    const saved = JSON.parse(raw);
    expect(saved.updatedAt).toBeDefined();
    // updatedAt should be at least as recent as the original
    expect(new Date(saved.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(originalUpdatedAt).getTime()
    );
  });

  it('sets saveStatus to error when localStorage throws', () => {
    const { result } = renderHook(() => useDeckPersistence());

    act(() => {
      result.current.setDeck({ ...result.current.deck, title: 'Will Fail' });
    });

    storage.setItem = () => { throw new Error('QuotaExceededError'); };

    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(result.current.saveStatus).toBe('error');
  });
});
