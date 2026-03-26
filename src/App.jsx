import { useState, useCallback } from 'react';
import { EXAMPLE_DECK, createSlide } from './schema/slide-schema';
import { renderSlide, SlideFrame } from './engine/renderer';
import { getTheme, getThemeNames } from './config/themes';
import { ChevronLeft, ChevronRight, Plus, Trash2, MessageSquare, Play, Settings } from 'lucide-react';

/**
 * Rewst Deck Builder - Main Application
 *
 * Three-panel layout:
 * - Left: Slide list / outline
 * - Center: Slide preview (live rendered)
 * - Right: AI chat panel (conversational builder)
 */
export default function App() {
  const [deck, setDeck] = useState(EXAMPLE_DECK);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [chatOpen, setChatOpen] = useState(true);
  const [presentMode, setPresentMode] = useState(false);

  const currentSlide = deck.slides[currentSlideIndex];

  const goToSlide = useCallback((index) => {
    setCurrentSlideIndex(Math.max(0, Math.min(index, deck.slides.length - 1)));
  }, [deck.slides.length]);

  const addSlide = useCallback(() => {
    const newSlide = createSlide('content', {
      title: 'New Slide',
      points: ['Add your content here'],
    });
    setDeck(prev => ({
      ...prev,
      slides: [
        ...prev.slides.slice(0, currentSlideIndex + 1),
        newSlide,
        ...prev.slides.slice(currentSlideIndex + 1),
      ],
      updatedAt: new Date().toISOString(),
    }));
    setCurrentSlideIndex(prev => prev + 1);
  }, [currentSlideIndex]);

  const removeSlide = useCallback(() => {
    if (deck.slides.length <= 1) return;
    setDeck(prev => ({
      ...prev,
      slides: prev.slides.filter((_, i) => i !== currentSlideIndex),
      updatedAt: new Date().toISOString(),
    }));
    setCurrentSlideIndex(prev => Math.min(prev, deck.slides.length - 2));
  }, [currentSlideIndex, deck.slides.length]);

  // Present mode - fullscreen single slide
  if (presentMode) {
    return (
      <div
        className="w-screen h-screen cursor-none"
        onClick={() => goToSlide(currentSlideIndex + 1)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight' || e.key === ' ') goToSlide(currentSlideIndex + 1);
          if (e.key === 'ArrowLeft') goToSlide(currentSlideIndex - 1);
          if (e.key === 'Escape') setPresentMode(false);
        }}
        tabIndex={0}
      >
        <SlideFrame slide={currentSlide} defaultTheme={deck.defaultTheme} />
        {/* Progress bar */}
        <div className="fixed bottom-0 left-0 right-0 h-1 bg-black/50">
          <div
            className="h-full bg-bot-teal-400 transition-all duration-300"
            style={{ width: `${((currentSlideIndex + 1) / deck.slides.length) * 100}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-ops-indigo-950 flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="h-14 bg-ops-indigo-900 border-b border-ops-indigo-700/50 flex items-center px-4 gap-4 shrink-0">
        <h1 className="font-display font-bold text-white text-lg">Rewst Deck Builder</h1>
        <span className="text-cloud-gray-500 text-sm">|</span>
        <input
          className="bg-transparent text-cloud-gray-200 text-sm font-medium focus:outline-none focus:text-white flex-1 max-w-md"
          value={deck.title}
          onChange={(e) => setDeck(prev => ({ ...prev, title: e.target.value }))}
        />
        <div className="flex-1" />
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
          <div className="p-3 border-b border-ops-indigo-700/30 flex items-center justify-between">
            <span className="text-cloud-gray-400 text-xs font-bold uppercase tracking-wider">Slides</span>
            <button
              className="text-cloud-gray-400 hover:text-bot-teal-400 transition-colors"
              onClick={addSlide}
              title="Add slide"
            >
              <Plus size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {deck.slides.map((slide, i) => (
              <button
                key={slide.id}
                className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${
                  i === currentSlideIndex
                    ? 'bg-bot-teal-400/20 text-bot-teal-400 border border-bot-teal-400/30'
                    : 'text-cloud-gray-300 hover:bg-ops-indigo-800/50 border border-transparent'
                }`}
                onClick={() => goToSlide(i)}
              >
                <span className="text-xs text-cloud-gray-500 mr-2">{i + 1}</span>
                <span className="font-medium">{slide.title || slide.type}</span>
                <span className="block text-xs text-cloud-gray-500 ml-5 mt-0.5">{slide.type}</span>
              </button>
            ))}
          </div>
          <div className="p-2 border-t border-ops-indigo-700/30">
            <button
              className="w-full text-cloud-gray-500 hover:text-alert-coral-400 text-xs flex items-center justify-center gap-1 py-1 transition-colors"
              onClick={removeSlide}
              disabled={deck.slides.length <= 1}
            >
              <Trash2 size={14} />
              Remove slide
            </button>
          </div>
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
            <div className="w-full max-w-5xl aspect-video rounded-xl overflow-hidden shadow-2xl shadow-black/50 border border-ops-indigo-700/30">
              <SlideFrame slide={currentSlide} defaultTheme={deck.defaultTheme} />
            </div>
          </div>
        </main>

        {/* Right panel - AI Chat */}
        {chatOpen && (
          <aside className="w-96 bg-ops-indigo-900/50 border-l border-ops-indigo-700/30 flex flex-col shrink-0">
            <div className="p-3 border-b border-ops-indigo-700/30 flex items-center justify-between">
              <span className="text-cloud-gray-400 text-xs font-bold uppercase tracking-wider">AI Assistant</span>
              <button
                className="text-cloud-gray-500 hover:text-white transition-colors"
                onClick={() => setChatOpen(false)}
              >
                &times;
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="text-center py-12">
                <div className="text-bot-teal-400 mb-4">
                  <MessageSquare size={48} className="mx-auto opacity-50" />
                </div>
                <p className="text-cloud-gray-300 text-lg font-medium mb-2">
                  Chat with AI to build your deck
                </p>
                <p className="text-cloud-gray-500 text-sm max-w-xs mx-auto">
                  Describe your presentation topic, ask to add slides, or refine existing content.
                </p>
              </div>
            </div>
            <div className="p-3 border-t border-ops-indigo-700/30">
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-ops-indigo-800 border border-ops-indigo-600/50 rounded-full px-4 py-2 text-sm text-white placeholder-cloud-gray-500 focus:outline-none focus:border-bot-teal-400/50"
                  placeholder="Describe your presentation..."
                />
                <button className="btn-primary text-sm px-4">Send</button>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
