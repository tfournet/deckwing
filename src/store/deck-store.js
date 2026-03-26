import { migrateDeck } from '../../shared/schema/slide-schema.js';

/**
 * Deck Store - localStorage persistence layer
 *
 * All decks are stored with the key prefix `rewst-deck-{id}`.
 * This module provides CRUD operations over that key space.
 */

const KEY_PREFIX = 'rewst-deck-';

/**
 * Save a deck to localStorage.
 * @param {object} deck - Complete deck object (must have an `id` field)
 * @returns {{ok: true} | {ok: false, error: string}}
 */
export function saveDeck(deck) {
  try {
    localStorage.setItem(KEY_PREFIX + deck.id, JSON.stringify(deck));
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Load a deck from localStorage by ID.
 * @param {string} id - Deck ID
 * @returns {object|null} The deck, or null if not found or corrupted
 */
export function loadDeck(id) {
  const raw = localStorage.getItem(KEY_PREFIX + id);
  if (!raw) return null;
  try {
    const deck = JSON.parse(raw);
    return migrateDeck(deck);
  } catch {
    return null;
  }
}

/**
 * List all saved decks as lightweight metadata objects.
 * @returns {Array<{id: string, title: string, slideCount: number, updatedAt: string}>}
 */
export function listDecks() {
  const decks = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(KEY_PREFIX)) continue;
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    try {
      const deck = JSON.parse(raw);
      if (!deck.id || !deck.slides) continue;
      decks.push({
        id: deck.id,
        title: deck.title || 'Untitled',
        slideCount: Array.isArray(deck.slides) ? deck.slides.length : 0,
        updatedAt: deck.updatedAt || '',
      });
    } catch {
      // Skip corrupted entries
    }
  }
  return decks;
}

/**
 * Delete a deck from localStorage.
 * @param {string} id - Deck ID
 */
export function deleteDeck(id) {
  localStorage.removeItem(KEY_PREFIX + id);
}
