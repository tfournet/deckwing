import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, MessageSquare, Play, FolderOpen, Download, ChevronDown } from 'lucide-react';
import { MODELS, DEFAULT_MODEL } from '../shared/models.js';
import { SlideFrame } from './engine/renderer';
import { ChatPanel } from './components/chat/ChatPanel';
import { AuthGate } from './components/auth/AuthGate';
import { SlideEditor } from './components/editor/SlideEditor';
import { DetachedEditorView } from './components/editor/DetachedEditorView';
import { SlideOutline } from './components/editor/SlideOutline';
import { DeckListModal } from './components/editor/DeckListModal';
import { PresenterMode } from './components/presenter/PresenterMode';
import { useChat } from './hooks/useChat';
import { useDeckState } from './hooks/useDeckState';
import { useExport } from './hooks/useExport';
import { useDetachedEditor } from './hooks/useDetachedEditor';
import { loadDeck } from './store/deck-store';

function MainLayout() {
  const [chatOpen, setChatOpen] = useState(true);
  const [presentMode, setPresentMode] = useState(false);
  const [deckListOpen, setDeckListOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(() =>
    localStorage.getItem('deckwing-model') || DEFAULT_MODEL
  );
  const {
    deck,
    setDeck,
    currentSlideIndex,
    currentSlide,
    goToSlide,
    addSlide,
    removeSlide,
    duplicateSlide,
    reorderSlides,
    updateSlide,
    applyAction,
  } = useDeckState();
  const { exporting, exportType, slideContainerRef, handleExportPDF, handleExportPPTX, handleExportHTML } = useExport({ deck });
  const { messages, isLoading, sendMessage, resetChat } = useChat({ deck, onAction: applyAction, model: selectedModel });

  // Persist model selection
  useEffect(() => {
    localStorage.setItem('deckwing-model', selectedModel);
  }, [selectedModel]);
  const { isDetached, openEditor, closeEditor, sendSlideData, useEditListener } = useDetachedEditor();

  useEditListener(updateSlide);

  useEffect(() => {
    if (isDetached && currentSlide) {
      sendSlideData(currentSlide, currentSlideIndex);
    }
  }, [currentSlide, currentSlideIndex, isDetached, sendSlideData]);

  if (presentMode) {
    return (
      <PresenterMode
        deck={deck}
        initialSlideIndex={currentSlideIndex}
        onExit={() => setPresentMode(false)}
      />
    );
  }

  return (
    <div className="w-screen h-screen bg-ops-indigo-950 flex flex-col overflow-hidden">
      <header className="h-14 bg-ops-indigo-900 border-b border-ops-indigo-700/50 flex items-center px-4 gap-4 shrink-0">
        <h1 className="font-display font-bold text-white text-lg">DeckWing</h1>
        <button className="text-cloud-gray-400 hover:text-bot-teal-400 transition-colors p-1" onClick={() => setDeckListOpen(true)} title="Open / New deck">
          <FolderOpen size={18} />
        </button>
        <span className="text-cloud-gray-500 text-sm">|</span>
        <input className="bg-transparent text-cloud-gray-200 text-sm font-medium focus:outline-none focus:text-white flex-1 max-w-md" value={deck.title} onChange={(e) => setDeck(prev => ({ ...prev, title: e.target.value }))} />
        {/* Model selector */}
        <select
          className="bg-ops-indigo-800 border border-ops-indigo-600/50 rounded px-2 py-1.5 text-xs text-cloud-gray-200 cursor-pointer focus:outline-none focus:border-bot-teal-400/50"
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          title="AI model"
        >
          {MODELS.map(m => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
        <div className="flex-1" />
        {/* Export dropdown */}
        <div className="relative">
          <button
            className="btn-secondary text-sm flex items-center gap-2"
            onClick={() => setExportMenuOpen(v => !v)}
            disabled={exporting}
          >
            <Download size={16} />
            {exporting ? `Exporting ${exportType?.toUpperCase()}...` : 'Export'}
            <ChevronDown size={14} />
          </button>
          {exportMenuOpen && !exporting && (
            <div className="absolute right-0 top-full mt-1 z-40 bg-ops-indigo-800 border border-ops-indigo-600/50 rounded-lg shadow-xl py-1 w-48">
              <button
                className="w-full text-left px-3 py-2 text-sm text-cloud-gray-200 hover:bg-ops-indigo-700/60 hover:text-white transition-colors"
                onClick={() => { setExportMenuOpen(false); handleExportPDF(); }}
              >
                Export as PDF
              </button>
              <button
                className="w-full text-left px-3 py-2 text-sm text-cloud-gray-200 hover:bg-ops-indigo-700/60 hover:text-white transition-colors"
                onClick={() => { setExportMenuOpen(false); handleExportPPTX(); }}
              >
                Export as PowerPoint
              </button>
              <button
                className="w-full text-left px-3 py-2 text-sm text-cloud-gray-200 hover:bg-ops-indigo-700/60 hover:text-white transition-colors"
                onClick={() => { setExportMenuOpen(false); handleExportHTML(); }}
              >
                Export as HTML Presentation
              </button>
            </div>
          )}
        </div>
        <button className="btn-secondary text-sm flex items-center gap-2" onClick={() => setChatOpen(!chatOpen)}>
          <MessageSquare size={16} />
          AI Chat
        </button>
        <button className="btn-primary text-sm flex items-center gap-2" onClick={() => setPresentMode(true)}>
          <Play size={16} />
          Present
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-56 bg-ops-indigo-900/50 border-r border-ops-indigo-700/30 flex flex-col shrink-0">
          <SlideOutline
            slides={deck.slides}
            currentIndex={currentSlideIndex}
            onSelectSlide={goToSlide}
            onReorderSlides={reorderSlides}
            onAddSlide={addSlide}
            onDuplicateSlide={duplicateSlide}
            onRemoveSlide={removeSlide}
          />
        </aside>

        <main className="flex-1 flex flex-col">
          <div className="flex items-center justify-center gap-4 py-3 bg-ops-indigo-900/30">
            <button className="text-cloud-gray-400 hover:text-white transition-colors disabled:opacity-30" onClick={() => goToSlide(currentSlideIndex - 1)} disabled={currentSlideIndex === 0}>
              <ChevronLeft size={24} />
            </button>
            <span className="text-cloud-gray-400 text-sm font-mono">{currentSlideIndex + 1} / {deck.slides.length}</span>
            <button className="text-cloud-gray-400 hover:text-white transition-colors disabled:opacity-30" onClick={() => goToSlide(currentSlideIndex + 1)} disabled={currentSlideIndex === deck.slides.length - 1}>
              <ChevronRight size={24} />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center p-8">
            <div ref={slideContainerRef} className="w-full max-w-5xl aspect-video rounded-xl overflow-hidden shadow-2xl shadow-black/50 border border-ops-indigo-700/30">
              <SlideFrame slide={currentSlide} defaultTheme={deck.defaultTheme} />
            </div>
          </div>

          <SlideEditor
            slide={currentSlide}
            index={currentSlideIndex}
            onUpdateSlide={updateSlide}
            isDetached={isDetached}
            openDetachedEditor={openEditor}
            closeDetachedEditor={closeEditor}
          />
        </main>

        {chatOpen && (
          <ChatPanel
            messages={messages}
            isLoading={isLoading}
            onSendMessage={sendMessage}
            onResetChat={resetChat}
            onClose={() => setChatOpen(false)}
          />
        )}
      </div>

      {deckListOpen && (
        <DeckListModal
          onOpenDeck={(id) => {
            const loaded = loadDeck(id);
            if (!loaded) return;
            setDeck(loaded);
            goToSlide(0);
          }}
          onNewDeck={(newDeck) => {
            setDeck(newDeck);
            goToSlide(0);
          }}
          onClose={() => setDeckListOpen(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  const isDetachedEditor = new URLSearchParams(window.location.search).get('editor') === 'detached';

  if (isDetachedEditor) {
    return <DetachedEditorView />;
  }

  return (
    <AuthGate>
      <MainLayout />
    </AuthGate>
  );
}
