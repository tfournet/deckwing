import { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, LayoutTemplate, ChevronLeft, FolderOpen, TrendingUp, Shield, Rocket, MonitorSmartphone, Users } from 'lucide-react';
import { listDecks, deleteDeck } from '../../store/deck-store';
import { createDeck } from '../../schema/slide-schema';
import { deserializeDeck } from '../../../shared/deck-file';
import { TEMPLATES } from '../../data/templates';

const TEMPLATE_ICONS = {
  qbr: TrendingUp,
  security: Shield,
  onboarding: Rocket,
  demo: MonitorSmartphone,
  'all-hands': Users,
};

/**
 * Modal for managing saved decks and browsing starter templates.
 *
 * Props:
 *   onOpenDeck(deck)  — called with a deck object to load
 *   onNewDeck(deck)   — called with a fresh deck
 *   onClose()         — dismiss the modal
 *   initialView       — 'decks' | 'templates' (default: 'decks')
 */
export function DeckListModal({ onOpenDeck, onNewDeck, onClose, initialView = 'decks' }) {
  const [decks, setDecks] = useState([]);
  const [view, setView] = useState(initialView);
  const [fileError, setFileError] = useState(null);
  const backdropRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setDecks(listDecks());
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    backdropRef.current?.focus();
  }, []);

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

  function handleSelectTemplate(template) {
    const cloned = JSON.parse(JSON.stringify(template.deck));
    cloned.id = crypto.randomUUID();
    cloned.createdAt = new Date().toISOString();
    cloned.updatedAt = new Date().toISOString();
    onNewDeck(cloned);
    onClose();
  }

  async function handleFileOpen(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);
    try {
      const text = await file.text();
      const deck = deserializeDeck(text);
      deck.id = crypto.randomUUID();
      deck.createdAt = new Date().toISOString();
      deck.updatedAt = new Date().toISOString();
      onNewDeck(deck);
      onClose();
    } catch (err) {
      setFileError(err.message || 'Could not open this file.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
      tabIndex={-1}
      aria-modal="true"
      role="dialog"
      aria-label={view === 'decks' ? 'Your decks' : 'Choose a template'}
    >
      <div className="bg-ops-indigo-900 border border-ops-indigo-600/50 rounded-xl p-5 shadow-2xl w-[520px] max-w-[calc(100vw-2rem)] max-h-[80vh] flex flex-col">
        {view === 'decks' ? (
          /* ── Deck list view ── */
          <>
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

            {/* New deck buttons */}
            <div className="flex gap-2 mb-3 shrink-0">
              <button
                className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg
                           bg-bot-teal-400/10 border border-bot-teal-400/30
                           hover:bg-bot-teal-400/20 transition-colors"
                onClick={handleNewDeck}
              >
                <Plus size={16} className="text-bot-teal-400" />
                <span className="text-bot-teal-400 text-sm font-semibold">Blank</span>
              </button>
              <button
                className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg
                           bg-ops-indigo-800/60 border border-ops-indigo-600/30
                           hover:bg-ops-indigo-700/60 transition-colors"
                onClick={() => setView('templates')}
              >
                <LayoutTemplate size={16} className="text-cloud-gray-400" />
                <span className="text-cloud-gray-300 text-sm font-semibold">From Template</span>
              </button>
              <button
                className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg
                           bg-ops-indigo-800/60 border border-ops-indigo-600/30
                           hover:bg-ops-indigo-700/60 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <FolderOpen size={16} className="text-cloud-gray-400" />
                <span className="text-cloud-gray-300 text-sm font-semibold">Open File</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".deckwing,.json"
                className="hidden"
                onChange={handleFileOpen}
              />
            </div>

            {/* File error */}
            {fileError && (
              <div className="mb-2 px-3 py-2 rounded-lg bg-alert-coral-400/10 border border-alert-coral-400/30 flex items-center justify-between">
                <span className="text-alert-coral-300 text-xs">{fileError}</span>
                <button
                  className="text-alert-coral-400 hover:text-alert-coral-300 text-xs ml-2"
                  onClick={() => setFileError(null)}
                >
                  Dismiss
                </button>
              </div>
            )}

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
          </>
        ) : (
          /* ── Template picker view ── */
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  className="text-cloud-gray-500 hover:text-cloud-gray-300 transition-colors p-1 rounded"
                  onClick={() => setView('decks')}
                  aria-label="Back to deck list"
                >
                  <ChevronLeft size={16} />
                </button>
                <h2 className="text-white font-bold text-sm tracking-wide uppercase">Choose a Template</h2>
              </div>
              <button
                className="text-cloud-gray-500 hover:text-cloud-gray-300 transition-colors p-1 rounded"
                onClick={onClose}
              >
                <X size={16} />
              </button>
            </div>

            {/* Template grid */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATES.map((template) => {
                  const Icon = TEMPLATE_ICONS[template.id] || LayoutTemplate;
                  const slideCount = template.deck?.slides?.length ?? 0;

                  return (
                    <button
                      key={template.id}
                      className="flex items-start gap-3 p-3 rounded-lg text-left
                                 bg-ops-indigo-800/60 border border-ops-indigo-600/30
                                 hover:bg-bot-teal-400/10 hover:border-bot-teal-400/30
                                 focus-visible:border-bot-teal-400/50 focus-visible:ring-1 focus-visible:ring-bot-teal-400/30
                                 transition-colors group"
                      onClick={() => handleSelectTemplate(template)}
                    >
                      <span className="mt-0.5 p-1.5 rounded-md bg-ops-indigo-700/60
                                       text-cloud-gray-400 group-hover:text-bot-teal-400
                                       transition-colors shrink-0">
                        <Icon size={14} />
                      </span>
                      <span className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-cloud-gray-200 text-sm font-semibold
                                         group-hover:text-white transition-colors">
                          {template.name}
                        </span>
                        <span className="text-cloud-gray-500 text-xs leading-snug line-clamp-2">
                          {template.description}
                        </span>
                        <span className="text-cloud-gray-500 text-xs tabular-nums mt-0.5">
                          {slideCount} slides
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
