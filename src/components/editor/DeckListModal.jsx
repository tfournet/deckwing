import { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { listDecks, deleteDeck } from '../../store/deck-store';
import { createDeck } from '../../schema/slide-schema';

/**
 * Modal for managing saved decks: New, Open, Delete.
 *
 * Props:
 *   onOpenDeck(deck)  — called with a deck object to load
 *   onNewDeck(deck)   — called with a fresh deck
 *   onClose()         — dismiss the modal
 */
export function DeckListModal({ onOpenDeck, onNewDeck, onClose }) {
  const [decks, setDecks] = useState([]);
  const backdropRef = useRef(null);

  useEffect(() => {
    setDecks(listDecks());
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  function handleBackdropClick(e) {
    if (e.target === backdropRef.current) onClose();
  }

  function handleNewDeck() {
    const deck = createDeck();
    onNewDeck(deck);
    onClose();
  }

  function handleDelete(id) {
    deleteDeck(id);
    setDecks(listDecks());
  }

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-ops-indigo-900 border border-ops-indigo-600/50 rounded-xl p-5 shadow-2xl w-[520px] max-w-[calc(100vw-2rem)] max-h-[70vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h2 className="text-white font-bold text-sm tracking-wide uppercase">Your Decks</h2>
          <button
            className="text-cloud-gray-500 hover:text-cloud-gray-300 transition-colors p-1 rounded"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        {/* New deck button */}
        <button
          className="w-full flex items-center gap-3 p-3 rounded-lg mb-3
                     bg-bot-teal-400/10 border border-bot-teal-400/30
                     hover:bg-bot-teal-400/20 transition-colors text-left"
          onClick={handleNewDeck}
        >
          <Plus size={16} className="text-bot-teal-400" />
          <span className="text-bot-teal-400 text-sm font-semibold">New Presentation</span>
        </button>

        {/* Deck list */}
        <div className="flex-1 overflow-y-auto space-y-1">
          {decks.length === 0 ? (
            <p className="text-cloud-gray-500 text-sm text-center py-6">
              No saved presentations yet
            </p>
          ) : (
            decks.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-3 p-3 rounded-lg
                           bg-ops-indigo-800/60 border border-ops-indigo-600/30
                           hover:bg-ops-indigo-700/60 transition-colors group"
              >
                <button
                  className="flex-1 text-left min-w-0"
                  onClick={() => { onOpenDeck(d.id); onClose(); }}
                >
                  <span className="text-cloud-gray-200 text-sm font-semibold truncate block">
                    {d.title}
                  </span>
                  <span className="text-cloud-gray-500 text-xs">
                    {d.slideCount} slides
                    {d.updatedAt && ` · ${new Date(d.updatedAt).toLocaleDateString()}`}
                  </span>
                </button>
                <button
                  className="text-transparent group-hover:text-cloud-gray-500 hover:!text-alert-coral-400 transition-colors p-1"
                  onClick={() => handleDelete(d.id)}
                  title="Delete deck"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
