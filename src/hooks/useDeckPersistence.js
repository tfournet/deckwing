import { useState, useCallback, useEffect, useRef } from 'react';
import { saveDeck, loadDeck } from '../store/deck-store.js';
import { createDeck } from '../schema/slide-schema.js';

const DEBOUNCE_MS = 500;

/**
 * Hook for deck state with auto-save to localStorage.
 *
 * @param {string|null} deckId - ID of a deck to load, or null for a new deck
 * @returns {{ deck: object, setDeck: function, saveStatus: 'new'|'saving'|'saved'|'error' }}
 */
export function useDeckPersistence(deckId = null) {
  const [deck, setDeckState] = useState(() => {
    if (deckId) {
      const loaded = loadDeck(deckId);
      if (loaded) return loaded;
    }
    return createDeck();
  });

  const [saveStatus, setSaveStatus] = useState(deckId ? 'saved' : 'new');
  const timerRef = useRef(null);
  const latestDeckRef = useRef(deck);

  const setDeck = useCallback((newDeck) => {
    latestDeckRef.current = newDeck;
    setDeckState(newDeck);
    setSaveStatus('saving');

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      const deckToSave = {
        ...latestDeckRef.current,
        updatedAt: new Date().toISOString(),
      };
      latestDeckRef.current = deckToSave;
      const result = saveDeck(deckToSave);
      setSaveStatus(result.ok ? 'saved' : 'error');
      timerRef.current = null;
    }, DEBOUNCE_MS);
  }, []);

  // Flush any pending save on unmount to prevent data loss
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        const result = saveDeck({
          ...latestDeckRef.current,
          updatedAt: new Date().toISOString(),
        });
        if (!result.ok) {
          console.error('Unmount flush failed:', result.error);
        }
      }
    };
  }, []);

  return { deck, setDeck, saveStatus };
}
