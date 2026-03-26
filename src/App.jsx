import { useState, useCallback, useEffect, useRef } from 'react';
import { EXAMPLE_DECK, createSlide } from './schema/slide-schema';
import { SlideFrame } from './engine/renderer';
import { ChevronLeft, ChevronRight, MessageSquare, Play, AlertTriangle, FolderOpen, Download } from 'lucide-react';
import { ChatPanel } from './components/chat/ChatPanel';
import { useChat } from './hooks/useChat';
import { SlideEditor } from './components/editor/SlideEditor';
import { SlideOutline } from './components/editor/SlideOutline';
import { DeckListModal } from './components/editor/DeckListModal';
import { PresenterMode } from './components/presenter/PresenterMode';
import { saveDeck, loadDeck } from './store/deck-store';
import { exportDeckToPDF, downloadBlob } from './engine/export-pdf';

const SAVE_DEBOUNCE_MS = 500;

/**
 * DeckWing - Main Application
 *
 * Three-panel layout:
 * - Left: Slide outline (drag reorder, add, duplicate, delete)
 * - Center: Slide preview (live rendered) + inline editor
 * - Right: AI chat panel (conversational builder)
 */
export default function App() {
  // Load saved deck or fall back to example
  const [deck, setDeck] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const deckId = params.get('deck');
    if (deckId) {
      const loaded = loadDeck(deckId);
      if (loaded) return loaded;
    }
    return EXAMPLE_DECK;
  });
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [chatOpen, setChatOpen] = useState(true);
  const [presentMode, setPresentMode] = useState(false);
  const [deckListOpen, setDeckListOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [authState, setAuthState] = useState(null); // null = loading, object = result
  const [loginMessage, setLoginMessage] = useState(null);
  const [oauthUrl, setOauthUrl] = useState(null);
  const [polling, setPolling] = useState(false);
  const saveTimerRef = useRef(null);
  const slideContainerRef = useRef(null);
  const authPollIntervalRef = useRef(null);
  const authPollTimeoutRef = useRef(null);

  const currentSlide = deck.slides[currentSlideIndex];

  const refreshHealth = useCallback(async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setAuthState(data.auth);
      return data.auth;
    } catch {
      const fallback = { authenticated: false, error: 'Cannot reach server' };
      setAuthState(fallback);
      return fallback;
    }
  }, []);

  const stopAuthPolling = useCallback(() => {
    if (authPollIntervalRef.current) {
      clearInterval(authPollIntervalRef.current);
      authPollIntervalRef.current = null;
    }

    if (authPollTimeoutRef.current) {
      clearTimeout(authPollTimeoutRef.current);
      authPollTimeoutRef.current = null;
    }

    setPolling(false);
  }, []);

  // Check auth on mount
  useEffect(() => {
    refreshHealth();
  }, [refreshHealth]);

  useEffect(() => () => {
    stopAuthPolling();
  }, [stopAuthPolling]);

  // Auto-save with debounce
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(() => {
      const deckToSave = { ...deck, updatedAt: new Date().toISOString() };
      saveDeck(deckToSave);
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [deck]);

  const goToSlide = useCallback((index) => {
    setCurrentSlideIndex(Math.max(0, Math.min(index, deck.slides.length - 1)));
  }, [deck.slides.length]);

  // ── Slide management callbacks for SlideOutline ────────────────────

  const addSlide = useCallback((slide) => {
    setDeck(prev => ({
      ...prev,
      slides: [
        ...prev.slides.slice(0, currentSlideIndex + 1),
        slide,
        ...prev.slides.slice(currentSlideIndex + 1),
      ],
      updatedAt: new Date().toISOString(),
    }));
    setCurrentSlideIndex(prev => prev + 1);
  }, [currentSlideIndex]);

  const removeSlide = useCallback((index) => {
    setDeck(prev => {
      if (prev.slides.length <= 1) return prev;
      return {
        ...prev,
        slides: prev.slides.filter((_, i) => i !== index),
        updatedAt: new Date().toISOString(),
      };
    });
    setCurrentSlideIndex(prev =>
      prev >= deck.slides.length - 1 ? Math.max(0, prev - 1) : prev
    );
  }, [deck.slides.length]);

  const duplicateSlide = useCallback((index) => {
    setDeck(prev => {
      const source = prev.slides[index];
      if (!source) return prev;
      const copy = createSlide(source.type, { ...source, id: undefined });
      return {
        ...prev,
        slides: [
          ...prev.slides.slice(0, index + 1),
          copy,
          ...prev.slides.slice(index + 1),
        ],
        updatedAt: new Date().toISOString(),
      };
    });
    setCurrentSlideIndex(index + 1);
  }, []);

  const reorderSlides = useCallback((newSlides) => {
    setDeck(prev => ({
      ...prev,
      slides: newSlides,
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const updateSlide = useCallback((index, changes) => {
    setDeck(prev => ({
      ...prev,
      slides: prev.slides.map((slide, i) =>
        i === index ? { ...slide, ...changes } : slide
      ),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  // ── AI action handler ──────────────────────────────────────────────

  const applyAction = useCallback((action) => {
    if (!action) return;

    setDeck(prev => {
      const now = new Date().toISOString();

      switch (action.type) {
        case 'create_deck': {
          const { slides = [], title, author, defaultTheme } = action.data;
          const normalizedSlides = slides.map(slide =>
            createSlide(slide.type || 'content', slide)
          );
          return {
            ...prev,
            title: title || prev.title,
            author: author || prev.author,
            defaultTheme: defaultTheme || prev.defaultTheme,
            slides: normalizedSlides.length > 0 ? normalizedSlides : prev.slides,
            updatedAt: now,
          };
        }

        case 'update_slide': {
          const { index, changes } = action.data;
          if (index == null || !changes) return prev;
          const slides = prev.slides.map((slide, i) =>
            i === index ? { ...slide, ...changes } : slide
          );
          return { ...prev, slides, updatedAt: now };
        }

        case 'add_slide': {
          const { slide, index } = action.data;
          if (!slide) return prev;
          const newSlide = createSlide(slide.type || 'content', slide);
          const insertAt = index != null ? index : prev.slides.length;
          const slides = [
            ...prev.slides.slice(0, insertAt),
            newSlide,
            ...prev.slides.slice(insertAt),
          ];
          return { ...prev, slides, updatedAt: now };
        }

        case 'remove_slide': {
          const { index } = action.data;
          if (index == null || prev.slides.length <= 1) return prev;
          const slides = prev.slides.filter((_, i) => i !== index);
          return { ...prev, slides, updatedAt: now };
        }

        case 'reorder': {
          const { order } = action.data;
          if (!Array.isArray(order)) return prev;
          const slides = order
            .filter(i => i >= 0 && i < prev.slides.length)
            .map(i => prev.slides[i]);
          if (slides.length === 0) return prev;
          return { ...prev, slides, updatedAt: now };
        }

        default:
          return prev;
      }
    });

    if (action.type === 'create_deck') {
      setCurrentSlideIndex(0);
    }
    if (action.type === 'remove_slide' && action.data?.index != null) {
      setCurrentSlideIndex(prev =>
        Math.min(prev, Math.max(0, deck.slides.length - 2))
      );
    }
  }, [deck.slides.length]);

  const { messages, isLoading, sendMessage, resetChat } = useChat({
    deck,
    onAction: applyAction,
  });

  // ── PDF export ─────────────────────────────────────────────────────

  const handleExportPDF = useCallback(async () => {
    const container = slideContainerRef.current;
    if (!container || exporting) return;

    setExporting(true);
    try {
      const blob = await exportDeckToPDF({
        slideContainer: container,
        deck,
        defaultTheme: deck.defaultTheme,
        onProgress: () => {},
      });
      downloadBlob(blob, `${deck.title || 'presentation'}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setExporting(false);
    }
  }, [deck, exporting]);

  const startLogin = useCallback(async () => {
    stopAuthPolling();
    setLoginMessage('Preparing Claude sign-in...');
    setOauthUrl(null);

    try {
      const response = await fetch('/api/auth/start', { method: 'POST' });
      const data = await response.json();

      if (!response.ok || !data.ok || !data.state || !data.oauthUrl) {
        setLoginMessage(data.error || 'Could not start login. Is the server running?');
        return;
      }

      setOauthUrl(data.oauthUrl);
      setLoginMessage('Open the Claude sign-in page, then complete sign-in in your browser.');
      setPolling(true);

      authPollIntervalRef.current = setInterval(async () => {
        try {
          const statusResponse = await fetch(`/api/auth/status/${encodeURIComponent(data.state)}`);
          const statusData = await statusResponse.json();

          if (!statusData.ok) {
            stopAuthPolling();
            setOauthUrl(null);
            setLoginMessage(statusData.error || 'Could not check Claude sign-in status.');
            return;
          }

          if (statusData.status === 'pending') {
            return;
          }

          stopAuthPolling();

          if (statusData.status === 'error') {
            setOauthUrl(null);
            setLoginMessage(statusData.error || 'Claude sign-in did not complete.');
            return;
          }

          setLoginMessage('Claude sign-in completed. Verifying session...');
          const auth = await refreshHealth();
          if (auth && auth.authenticated) {
            setOauthUrl(null);
            setLoginMessage(null);
            return;
          }

          setOauthUrl(null);
          setLoginMessage('Claude sign-in completed, but DeckWing could not verify the local session yet. Click Check Again.');
        } catch {
          stopAuthPolling();
          setOauthUrl(null);
          setLoginMessage('Lost connection while checking Claude sign-in status.');
        }
      }, 2000);

      authPollTimeoutRef.current = setTimeout(() => {
        stopAuthPolling();
        setOauthUrl(null);
        setLoginMessage('Claude sign-in timed out. Please try again.');
      }, 125000);
    } catch {
      stopAuthPolling();
      setOauthUrl(null);
      setLoginMessage('Could not start login. Is the server running?');
    }
  }, [refreshHealth, stopAuthPolling]);

  // ── Auth gate ───────────────────────────────────────────────────────

  if (authState && !authState.authenticated) {
    const hasClaude = authState.claudeInstalled || !authState.error?.includes('not found');

    return (
      <div className="w-screen h-screen bg-ops-indigo-950 flex items-center justify-center">
        <div className="bg-ops-indigo-900 border border-ops-indigo-700/50 rounded-xl p-8 max-w-md text-center space-y-5">
          <h1 className="font-display font-bold text-white text-2xl">DeckWing</h1>
          <p className="text-cloud-gray-300 text-sm">
            Sign in with your Claude account to start building presentations.
          </p>

          {hasClaude ? (
            <>
              {oauthUrl ? (
                <>
                  <a
                    href={oauthUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary text-sm px-8 py-3 w-full block text-center"
                  >
                    Open Claude sign-in page
                  </a>
                  <p className="text-bot-teal-400 text-xs animate-pulse">
                    Sign in on the Claude page. This screen will update automatically when you're done.
                  </p>
                </>
              ) : polling ? (
                <>
                  <button className="btn-primary text-sm px-8 py-3 w-full opacity-80" disabled>
                    Waiting for sign in...
                  </button>
                  <p className="text-bot-teal-400 text-xs animate-pulse">
                    Complete the sign-in in your browser, then come back here.
                  </p>
                </>
              ) : (
                <button
                  className="btn-primary text-sm px-8 py-3 w-full"
                  onClick={startLogin}
                >
                  Sign in with Claude
                </button>
              )}

              {loginMessage ? (
                <p className="text-cloud-gray-300 text-xs">{loginMessage}</p>
              ) : null}
            </>
          ) : (
            <>
              <div className="bg-ops-indigo-950 rounded-lg p-4 text-left space-y-2">
                <p className="text-cloud-gray-400 text-xs">Claude Code is required. Install it first:</p>
                <code className="text-bot-teal-400 text-sm font-mono block">
                  curl -fsSL https://claude.ai/install.sh | sh
                </code>
              </div>
              <button
                className="btn-primary text-sm px-6 py-2"
                onClick={async () => {
                  stopAuthPolling();
                  setLoginMessage(null);
                  setOauthUrl(null);
                  setAuthState(null);
                  await refreshHealth();
                }}
              >
                Check Again
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Present mode ───────────────────────────────────────────────────

  if (presentMode) {
    return (
      <PresenterMode
        deck={deck}
        initialSlideIndex={currentSlideIndex}
        onExit={() => setPresentMode(false)}
      />
    );
  }

  // ── Main layout ────────────────────────────────────────────────────

  return (
    <div className="w-screen h-screen bg-ops-indigo-950 flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="h-14 bg-ops-indigo-900 border-b border-ops-indigo-700/50 flex items-center px-4 gap-4 shrink-0">
        <h1 className="font-display font-bold text-white text-lg">DeckWing</h1>
        <button
          className="text-cloud-gray-400 hover:text-bot-teal-400 transition-colors p-1"
          onClick={() => setDeckListOpen(true)}
          title="Open / New deck"
        >
          <FolderOpen size={18} />
        </button>
        <span className="text-cloud-gray-500 text-sm">|</span>
        <input
          className="bg-transparent text-cloud-gray-200 text-sm font-medium focus:outline-none focus:text-white flex-1 max-w-md"
          value={deck.title}
          onChange={(e) => setDeck(prev => ({ ...prev, title: e.target.value }))}
        />
        <div className="flex-1" />
        <button
          className="btn-secondary text-sm flex items-center gap-2"
          onClick={handleExportPDF}
          disabled={exporting}
        >
          <Download size={16} />
          {exporting ? 'Exporting...' : 'Export PDF'}
        </button>
        <button
          className="btn-secondary text-sm flex items-center gap-2"
          onClick={() => setChatOpen(!chatOpen)}
        >
          <MessageSquare size={16} />
          AI Chat
        </button>
        <button
          className="btn-primary text-sm flex items-center gap-2"
          onClick={() => setPresentMode(true)}
        >
          <Play size={16} />
          Present
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left panel - Slide outline */}
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

        {/* Center - Slide preview */}
        <main className="flex-1 flex flex-col">
          {/* Slide navigation */}
          <div className="flex items-center justify-center gap-4 py-3 bg-ops-indigo-900/30">
            <button
              className="text-cloud-gray-400 hover:text-white transition-colors disabled:opacity-30"
              onClick={() => goToSlide(currentSlideIndex - 1)}
              disabled={currentSlideIndex === 0}
            >
              <ChevronLeft size={24} />
            </button>
            <span className="text-cloud-gray-400 text-sm font-mono">
              {currentSlideIndex + 1} / {deck.slides.length}
            </span>
            <button
              className="text-cloud-gray-400 hover:text-white transition-colors disabled:opacity-30"
              onClick={() => goToSlide(currentSlideIndex + 1)}
              disabled={currentSlideIndex === deck.slides.length - 1}
            >
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Slide render area */}
          <div className="flex-1 flex items-center justify-center p-8">
            <div
              ref={slideContainerRef}
              className="w-full max-w-5xl aspect-video rounded-xl overflow-hidden shadow-2xl shadow-black/50 border border-ops-indigo-700/30"
            >
              <SlideFrame slide={currentSlide} defaultTheme={deck.defaultTheme} />
            </div>
          </div>

          {/* Inline slide editor */}
          <SlideEditor
            slide={currentSlide}
            index={currentSlideIndex}
            onUpdateSlide={updateSlide}
          />
        </main>

        {/* Right panel - AI Chat */}
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

      {/* Deck list modal */}
      {deckListOpen && (
        <DeckListModal
          onOpenDeck={(id) => {
            const loaded = loadDeck(id);
            if (loaded) {
              setDeck(loaded);
              setCurrentSlideIndex(0);
            }
          }}
          onNewDeck={(newDeck) => {
            setDeck(newDeck);
            setCurrentSlideIndex(0);
          }}
          onClose={() => setDeckListOpen(false)}
        />
      )}
    </div>
  );
}
