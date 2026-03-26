/**
 * Deck storage adapter — delegates to file-based or localStorage storage
 * based on whether a project folder is configured.
 *
 * This is the single entry point for all deck persistence. Components
 * should use this instead of importing deck-store.js directly.
 */

import { saveDeck as saveToLocal, loadDeck as loadFromLocal, listDecks as listFromLocal, deleteDeck as deleteFromLocal } from './deck-store.js';

// For now, always use localStorage. When file-based storage is wired
// into the Electron app, this adapter will check settings and delegate.
// The API is async-ready so the switch is non-breaking.

export async function saveDeck(deck) {
  return saveToLocal(deck);
}

export async function loadDeck(id) {
  return loadFromLocal(id);
}

export async function listDecks() {
  return listFromLocal();
}

export async function deleteDeck(id) {
  return deleteFromLocal(id);
}

/**
 * List .deckwing files from a project folder.
 * Only works in Node/Electron context.
 */
export async function listDeckFiles(projectFolder) {
  if (typeof window !== 'undefined' && !window.deckwing?.fs) {
    // Browser without fs access — fall back to localStorage
    return listFromLocal();
  }

  try {
    const { readdirSync, readFileSync, statSync } = await import('fs');
    const { join } = await import('path');
    const files = readdirSync(projectFolder).filter(f => f.endsWith('.deckwing'));

    return files.map(f => {
      const fullPath = join(projectFolder, f);
      try {
        const content = JSON.parse(readFileSync(fullPath, 'utf-8'));
        const stat = statSync(fullPath);
        return {
          id: content.meta?.title || f.replace('.deckwing', ''),
          title: content.meta?.title || f.replace('.deckwing', ''),
          slideCount: content.slides?.length || 0,
          updatedAt: content.meta?.updatedAt || stat.mtime.toISOString(),
          filePath: fullPath,
        };
      } catch {
        return null;
      }
    }).filter(Boolean).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  } catch {
    return listFromLocal();
  }
}
