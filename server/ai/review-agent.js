/**
 * Review Agent - DeckWing
 *
 * Performs deterministic quality checks against generated deck JSON.
 * No model calls are made here — this is a pure analyzer.
 */

import { SLIDE_TYPES } from '../../shared/schema/slide-schema.js';

/**
 * Review a deck and return quality suggestions.
 *
 * @param {{ slides?: object[] }} deck - Deck JSON to review
 * @returns {{ suggestions: Array<{ slideIndex: number | null, category: string, message: string }> }}
 */
export function reviewDeck(deck) {
  const slides = Array.isArray(deck?.slides) ? deck.slides : [];
  const suggestions = [];

  addRepeatedTypeSuggestions(slides, suggestions);
  addMissingSectionsSuggestion(slides, suggestions);
  addOvercrowdedSuggestions(slides, suggestions);
  addMonotoneThemeSuggestion(slides, suggestions);
  addEmptyContentSuggestions(slides, suggestions);
  addDeckLengthSuggestions(slides, suggestions);

  return { suggestions };
}

function addRepeatedTypeSuggestions(slides, suggestions) {
  let previousType = null;
  let consecutiveCount = 0;

  slides.forEach((slide, index) => {
    if (slide?.type === previousType) {
      consecutiveCount += 1;
    } else {
      previousType = slide?.type ?? null;
      consecutiveCount = 1;
    }

    if (previousType && consecutiveCount === 3) {
      suggestions.push({
        slideIndex: index,
        category: 'repeated-types',
        message: `Slides ${index - 1}-${index + 1} all use the "${previousType}" layout. Consider adding more slide variety.`,
      });
    }
  });
}

function addMissingSectionsSuggestion(slides, suggestions) {
  if (slides.length <= 8) return;

  const hasSectionSlide = slides.some(slide => slide?.type === 'section');
  if (!hasSectionSlide) {
    suggestions.push({
      slideIndex: null,
      category: 'missing-sections',
      message: 'This deck is long and has no section divider slides. Consider adding section breaks to improve flow.',
    });
  }
}

function addOvercrowdedSuggestions(slides, suggestions) {
  slides.forEach((slide, index) => {
    if (slide?.type === 'content' && Array.isArray(slide.points) && slide.points.length > 5) {
      suggestions.push({
        slideIndex: index,
        category: 'overcrowded',
        message: `This content slide has ${slide.points.length} bullet points. Consider splitting it into multiple slides.`,
      });
    }
  });
}

function addMonotoneThemeSuggestion(slides, suggestions) {
  if (slides.length < 2) return;

  const themes = new Set(slides.map(slide => slide?.theme));
  if (themes.size === 1) {
    const [theme] = themes;
    suggestions.push({
      slideIndex: null,
      category: 'monotone-theme',
      message: `All slides use the same theme${theme ? ` ("${theme}")` : ''}. Consider varying themes for emphasis.`,
    });
  }
}

function addEmptyContentSuggestions(slides, suggestions) {
  slides.forEach((slide, index) => {
    const schema = SLIDE_TYPES[slide?.type];

    if (!schema) {
      suggestions.push({
        slideIndex: index,
        category: 'empty-content',
        message: 'Slide is missing a valid type or uses an unsupported slide type.',
      });
      return;
    }

    const missingFields = schema.required.filter(
      field => slide[field] === undefined || slide[field] === null,
    );

    if (missingFields.length > 0) {
      suggestions.push({
        slideIndex: index,
        category: 'empty-content',
        message: `Slide is missing required field${missingFields.length > 1 ? 's' : ''}: ${missingFields.join(', ')}.`,
      });
    }
  });
}

function addDeckLengthSuggestions(slides, suggestions) {
  if (slides.length > 20) {
    suggestions.push({
      slideIndex: null,
      category: 'too-many-slides',
      message: `This deck has ${slides.length} slides. Consider condensing it to keep the presentation focused.`,
    });
  }

  if (slides.length < 3) {
    suggestions.push({
      slideIndex: null,
      category: 'too-few-slides',
      message: `This deck has only ${slides.length} slide${slides.length === 1 ? '' : 's'}. Consider expanding it with more supporting content.`,
    });
  }
}
