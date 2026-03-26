import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SlideFrame } from '../../engine/renderer';

export function clampSlideIndex(index, totalSlides) {
  if (totalSlides <= 0) return 0;
  return Math.max(0, Math.min(index, totalSlides - 1));
}

export function handlePresenterKeyDown({ key, totalSlides, currentIndex, showNotes }) {
  void totalSlides;
  void currentIndex;
  void showNotes;

  switch (key) {
    case ' ':
    case 'ArrowRight':
    case 'PageDown':
      return { type: 'next' };
    case 'ArrowLeft':
    case 'PageUp':
      return { type: 'prev' };
    case 'Escape':
      return { type: 'exit' };
    case 'n':
    case 'N':
      return { type: 'toggle_notes' };
    case 'Home':
      return { type: 'first' };
    case 'End':
      return { type: 'last' };
    default:
      return null;
  }
}

export function PresenterMode({ deck, initialSlideIndex = 0, onExit }) {
  const containerRef = useRef(null);
  const slides = deck?.slides ?? [];
  const totalSlides = slides.length;
  const [currentSlideIndex, setCurrentSlideIndex] = useState(() =>
    clampSlideIndex(initialSlideIndex, totalSlides)
  );
  const [showNotes, setShowNotes] = useState(false);

  useEffect(() => {
    setCurrentSlideIndex(clampSlideIndex(initialSlideIndex, totalSlides));
  }, [initialSlideIndex, totalSlides]);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  const currentSlide = slides[currentSlideIndex] ?? null;
  const nextSlide = currentSlideIndex < totalSlides - 1 ? slides[currentSlideIndex + 1] : null;
  const progress = useMemo(() => {
    if (totalSlides === 0) return 0;
    return ((currentSlideIndex + 1) / totalSlides) * 100;
  }, [currentSlideIndex, totalSlides]);

  const goToSlide = useCallback((index) => {
    setCurrentSlideIndex(clampSlideIndex(index, totalSlides));
  }, [totalSlides]);

  const applyAction = useCallback((action) => {
    if (!action) return;

    switch (action.type) {
      case 'next':
        goToSlide(currentSlideIndex + 1);
        break;
      case 'prev':
        goToSlide(currentSlideIndex - 1);
        break;
      case 'first':
        goToSlide(0);
        break;
      case 'last':
        goToSlide(totalSlides - 1);
        break;
      case 'toggle_notes':
        setShowNotes(prev => !prev);
        break;
      case 'exit':
        onExit?.();
        break;
      default:
        break;
    }
  }, [currentSlideIndex, goToSlide, onExit, totalSlides]);

  useEffect(() => {
    const onWindowKeyDown = (event) => {
      const action = handlePresenterKeyDown({
        key: event.key,
        totalSlides,
        currentIndex: currentSlideIndex,
        showNotes,
      });

      if (!action) return;

      event.preventDefault();
      applyAction(action);
    };

    window.addEventListener('keydown', onWindowKeyDown);
    return () => window.removeEventListener('keydown', onWindowKeyDown);
  }, [applyAction, currentSlideIndex, showNotes, totalSlides]);

  return (
    <div
      ref={containerRef}
      className="relative w-screen h-screen overflow-hidden bg-black cursor-none outline-none"
      onClick={() => goToSlide(currentSlideIndex + 1)}
      tabIndex={-1}
    >
      {currentSlide ? (
        <SlideFrame slide={currentSlide} defaultTheme={deck?.defaultTheme} />
      ) : (
        <div className="flex h-full items-center justify-center text-cloud-gray-400">
          No slides available.
        </div>
      )}

      {showNotes && currentSlide && (
        <div className="absolute inset-x-0 bottom-1 border-t border-ops-indigo-700 bg-ops-indigo-900/90 px-6 py-4 text-white backdrop-blur-sm">
          <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto] md:items-start">
            <section>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-bot-teal-400">
                Speaker Notes
              </p>
              <p className="whitespace-pre-wrap text-sm leading-6 text-cloud-gray-100">
                {currentSlide.notes?.trim() || 'No speaker notes for this slide.'}
              </p>
            </section>

            <section className="rounded-xl border border-ops-indigo-700/80 bg-ops-indigo-950/70 p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-cloud-gray-400">
                Next Slide
              </p>
              {nextSlide ? (
                <>
                  <p className="text-sm font-semibold text-white">{nextSlide.title || 'Untitled slide'}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-cloud-gray-400">
                    {nextSlide.type}
                  </p>
                </>
              ) : (
                <p className="text-sm text-cloud-gray-300">End of deck</p>
              )}
            </section>

            <div className="text-sm font-mono text-cloud-gray-300 md:text-right">
              {totalSlides === 0 ? '0 / 0' : `${currentSlideIndex + 1} / ${totalSlides}`}
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
        <div
          className="h-full bg-bot-teal-400 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export default PresenterMode;
