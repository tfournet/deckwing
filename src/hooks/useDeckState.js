import { useState, useCallback, useEffect, useRef } from 'react';
import { EXAMPLE_DECK, createSlide } from '../schema/slide-schema';
import { saveDeck, loadDeck } from '../store/deck-store';

const SAVE_DEBOUNCE_MS = 500;

export function useDeckState() {
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
  const saveTimerRef = useRef(null);

  const currentSlide = deck.slides[currentSlideIndex];

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

  const addSlide = useCallback((slide, insertAt) => {
    const idx = insertAt != null ? insertAt : currentSlideIndex + 1;
    setDeck(prev => ({
      ...prev,
      slides: [
        ...prev.slides.slice(0, idx),
        slide,
        ...prev.slides.slice(idx),
      ],
      updatedAt: new Date().toISOString(),
    }));
    setCurrentSlideIndex(idx);
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
    setCurrentSlideIndex(prev => (
      prev >= deck.slides.length - 1 ? Math.max(0, prev - 1) : prev
    ));
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
      slides: prev.slides.map((slide, i) => (
        i === index ? { ...slide, ...changes } : slide
      )),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

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
          const slides = prev.slides.map((slide, i) => (
            i === index ? { ...slide, ...changes } : slide
          ));
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

  return {
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
  };
}

export default useDeckState;
