/**
 * Review Agent - DeckWing
 *
 * Performs deterministic quality checks against generated deck JSON.
 * No model calls are made here — this is a pure analyzer.
 */

import { getLayout } from '../../shared/layouts/index.js';
import { BLOCK_KINDS, SLIDE_TYPES } from '../../shared/schema/slide-schema.js';

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
  slides.forEach((slide, index) => {
    if (slide?.type === 'layout') {
      reviewLayoutSlide(slide, index, suggestions);
    }
  });

  return { suggestions };
}

function reviewLayoutSlide(slide, index, suggestions) {
  const slots = slide.layout === 'custom' ? (slide.slots ?? []) : (getLayout(slide.layout)?.slots ?? []);
  const normalizedSlots = Array.isArray(slots) ? slots : [];
  const slotByName = new Map(normalizedSlots.map(slot => [slot.name, slot]));
  const blocks = Array.isArray(slide?.blocks) ? slide.blocks : [];

  addContentOverflowSuggestions(blocks, slotByName, index, suggestions);
  addEmptyBlockSuggestions(blocks, index, suggestions);
  addLongMetricLabelSuggestions(blocks, index, suggestions);
  addColumnBalanceSuggestion(blocks, normalizedSlots, index, suggestions);
}

function addContentOverflowSuggestions(blocks, slotByName, index, suggestions) {
  blocks.forEach(block => {
    const slot = slotByName.get(block?.slot);
    const maxContent = slot?.maxContent;

    if (
      block?.kind === 'list' &&
      Array.isArray(block.items) &&
      Number.isFinite(maxContent?.list) &&
      block.items.length > maxContent.list
    ) {
      suggestions.push({
        slideIndex: index,
        category: 'content-overflow',
        message: `Slide ${index + 1}, slot "${block.slot}": list content exceeds recommended maximum (${block.items.length} items, max ${maxContent.list}).`,
      });
    }

    if (
      typeof block?.text === 'string' &&
      Number.isFinite(maxContent?.text) &&
      block.text.length > maxContent.text
    ) {
      suggestions.push({
        slideIndex: index,
        category: 'content-overflow',
        message: `Slide ${index + 1}, slot "${block.slot}": ${block.kind ?? 'text'} content exceeds recommended maximum (${block.text.length} characters, max ${maxContent.text}).`,
      });
    }
  });
}

function addEmptyBlockSuggestions(blocks, index, suggestions) {
  blocks.forEach(block => {
    const blockSchema = BLOCK_KINDS[block?.kind];
    if (!blockSchema) return;

    blockSchema.required.forEach(field => {
      if (!isEmptyRequiredValue(block[field])) return;

      suggestions.push({
        slideIndex: index,
        category: 'empty-blocks',
        message: `Slide ${index + 1}, slot "${block.slot}": block kind "${block.kind}" has empty required field "${field}".`,
      });
    });
  });
}

function addLongMetricLabelSuggestions(blocks, index, suggestions) {
  blocks.forEach(block => {
    if (block?.kind !== 'metric' || typeof block.label !== 'string' || block.label.length <= 40) {
      return;
    }

    suggestions.push({
      slideIndex: index,
      category: 'long-metric-labels',
      message: `Slide ${index + 1}, slot "${block.slot}": metric label is ${block.label.length} characters (max 40). Long labels get auto-shrunk in PPTX export.`,
    });
  });
}

function addColumnBalanceSuggestion(blocks, slots, index, suggestions) {
  const columnPair = findColumnSlotPair(slots);
  if (!columnPair) return;

  const leftWeight = getSlotContentWeight(blocks, columnPair.left);
  const rightWeight = getSlotContentWeight(blocks, columnPair.right);
  const smaller = Math.min(leftWeight, rightWeight);
  const larger = Math.max(leftWeight, rightWeight);

  if (smaller > 0 && larger > smaller * 3) {
    suggestions.push({
      slideIndex: index,
      category: 'unbalanced-columns',
      message: `Slide ${index + 1}: left/right content is unbalanced (${leftWeight} vs ${rightWeight}). Consider evening out the columns.`,
    });
  }
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

function findColumnSlotPair(slots) {
  if (!Array.isArray(slots)) return null;

  const slotNames = new Set(slots.map(slot => slot?.name));

  if (slotNames.has('left') && slotNames.has('right')) {
    return { left: 'left', right: 'right' };
  }

  if (slotNames.has('left-body') && slotNames.has('right-body')) {
    return { left: 'left-body', right: 'right-body' };
  }

  return null;
}

function getSlotContentWeight(blocks, slotName) {
  return blocks
    .filter(block => block?.slot === slotName)
    .reduce((total, block) => total + getBlockContentWeight(block), 0);
}

function getBlockContentWeight(block) {
  if (typeof block?.text === 'string') {
    return block.text.length;
  }

  if (Array.isArray(block?.items)) {
    return block.items.length;
  }

  return 0;
}

function isEmptyRequiredValue(value) {
  if (typeof value === 'string') {
    return value.trim() === '';
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  return value === undefined || value === null;
}
