import { describe, it, expect } from 'vitest';
import { reviewDeck } from './review-agent.js';

const BLOCK_REVIEW_CATEGORIES = new Set([
  'content-overflow',
  'unbalanced-columns',
  'long-metric-labels',
  'empty-blocks',
]);

function makeSlide(type, overrides = {}) {
  const baseSlides = {
    title: { type, title: 'Title Slide', theme: 'rewst' },
    content: { type, title: 'Content Slide', points: ['One', 'Two'], theme: 'rewst' },
    grid: {
      type,
      title: 'Grid Slide',
      items: [{ title: 'Card', description: 'Description' }],
      theme: 'rewst',
    },
    image: { type, src: '/image.png', theme: 'rewst' },
    quote: { type, quote: 'A good quote', theme: 'rewst' },
    metric: { type, metrics: [{ value: '10', label: 'Value' }], theme: 'rewst' },
    section: { type, title: 'Section Break', theme: 'rewst' },
    blank: { type, theme: 'rewst' },
  };

  return { ...baseSlides[type], ...overrides };
}

function makeDeck(slides) {
  return { slides };
}

function makeDeckWithLayoutSlide(layoutSlide) {
  return makeDeck([
    makeSlide('title', { theme: 'rewst' }),
    makeSlide('quote', { theme: 'dark' }),
    { theme: 'highlight', ...layoutSlide },
    makeSlide('section', { theme: 'rewst' }),
  ]);
}

describe('reviewDeck', () => {
  it('flags repeated slide types after three consecutive matches', () => {
    const deck = makeDeck(Array.from({ length: 10 }, () => makeSlide('content')));

    const result = reviewDeck(deck);

    expect(result.suggestions).toContainEqual({
      slideIndex: 2,
      category: 'repeated-types',
      message: expect.stringContaining('slide variety'),
    });
  });

  it('flags long decks without section divider slides', () => {
    const deck = makeDeck([
      makeSlide('title'),
      ...Array.from({ length: 11 }, (_, index) => makeSlide(index % 2 === 0 ? 'content' : 'quote', {
        theme: index % 2 === 0 ? 'rewst' : 'dark',
      })),
    ]);

    const result = reviewDeck(deck);

    expect(result.suggestions).toContainEqual({
      slideIndex: null,
      category: 'missing-sections',
      message: expect.stringContaining('section'),
    });
  });

  it('flags overcrowded content slides', () => {
    const deck = makeDeck([
      makeSlide('title', { theme: 'rewst' }),
      makeSlide('content', {
        theme: 'dark',
        points: ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven'],
      }),
      makeSlide('section', { theme: 'highlight' }),
    ]);

    const result = reviewDeck(deck);

    expect(result.suggestions).toContainEqual({
      slideIndex: 1,
      category: 'overcrowded',
      message: expect.stringContaining('7 bullet points'),
    });
  });

  it('returns no suggestions for a well-structured deck', () => {
    const deck = makeDeck([
      makeSlide('title', { theme: 'rewst' }),
      makeSlide('section', { theme: 'dark' }),
      makeSlide('content', { theme: 'highlight', points: ['One', 'Two', 'Three'] }),
      makeSlide('grid', { theme: 'rewst' }),
      makeSlide('quote', { theme: 'dark' }),
      makeSlide('metric', { theme: 'highlight' }),
    ]);

    const result = reviewDeck(deck);

    expect(result).toEqual({ suggestions: [] });
  });

  it('flags decks where every slide uses the same theme', () => {
    const deck = makeDeck([
      makeSlide('title', { theme: 'rewst' }),
      makeSlide('content', { theme: 'rewst' }),
      makeSlide('section', { theme: 'rewst' }),
    ]);

    const result = reviewDeck(deck);

    expect(result.suggestions).toContainEqual({
      slideIndex: null,
      category: 'monotone-theme',
      message: expect.stringContaining('same theme'),
    });
  });

  it('flags slides missing required schema fields', () => {
    const deck = makeDeck([
      makeSlide('title', { theme: 'rewst' }),
      { type: 'content', title: 'Missing points', theme: 'dark' },
      makeSlide('section', { theme: 'highlight' }),
    ]);

    const result = reviewDeck(deck);

    expect(result.suggestions).toContainEqual({
      slideIndex: 1,
      category: 'empty-content',
      message: expect.stringContaining('points'),
    });
  });

  it('flags decks with too many slides', () => {
    const deck = makeDeck([
      makeSlide('title', { theme: 'rewst' }),
      makeSlide('section', { theme: 'dark' }),
      ...Array.from({ length: 23 }, (_, index) => makeSlide(index % 2 === 0 ? 'content' : 'quote', {
        theme: index % 3 === 0 ? 'rewst' : index % 3 === 1 ? 'dark' : 'highlight',
      })),
    ]);

    const result = reviewDeck(deck);

    expect(result.suggestions).toContainEqual({
      slideIndex: null,
      category: 'too-many-slides',
      message: expect.stringContaining('25 slides'),
    });
  });

  it('flags decks with too few slides', () => {
    const deck = makeDeck([
      makeSlide('title', { theme: 'rewst' }),
    ]);

    const result = reviewDeck(deck);

    expect(result.suggestions).toContainEqual({
      slideIndex: null,
      category: 'too-few-slides',
      message: expect.stringContaining('only 1 slide'),
    });
  });
});

describe('reviewDeck - layout block checks', () => {
  it('flags layout slides with list blocks exceeding slot maxContent', () => {
    const deck = makeDeckWithLayoutSlide({
      type: 'layout',
      layout: 'two-column',
      blocks: [
        { slot: 'title', kind: 'heading', text: 'Two Column Review' },
        { slot: 'left', kind: 'list', items: ['1', '2', '3', '4', '5', '6', '7', '8'] },
        { slot: 'right', kind: 'text', text: 'Balanced supporting copy.' },
      ],
    });

    const result = reviewDeck(deck);

    expect(result.suggestions).toContainEqual({
      slideIndex: 2,
      category: 'content-overflow',
      message: expect.stringContaining('slot "left": list content exceeds recommended maximum (8 items, max 5)'),
    });
  });

  it('flags custom layout slides with slot maxContent overflow', () => {
    const deck = makeDeckWithLayoutSlide({
      type: 'layout',
      layout: 'custom',
      slots: [
        {
          name: 'title',
          position: { col: 1, row: 1, colSpan: 12, rowSpan: 1 },
          kinds: ['heading'],
          maxContent: { text: 40 },
        },
        {
          name: 'body',
          position: { col: 1, row: 2, colSpan: 12, rowSpan: 4 },
          kinds: ['text'],
          maxContent: { text: 20 },
        },
      ],
      blocks: [
        { slot: 'title', kind: 'heading', text: 'Custom Layout Review' },
        { slot: 'body', kind: 'text', text: 'This custom layout body intentionally exceeds the suggested limit.' },
      ],
    });

    const result = reviewDeck(deck);

    expect(result.suggestions).toContainEqual({
      slideIndex: 2,
      category: 'content-overflow',
      message: expect.stringContaining('slot "body": text content exceeds recommended maximum'),
    });
  });

  it('flags layout slides with unbalanced two-column content', () => {
    const deck = makeDeckWithLayoutSlide({
      type: 'layout',
      layout: 'two-column',
      blocks: [
        { slot: 'title', kind: 'heading', text: 'Column Balance' },
        { slot: 'left', kind: 'text', text: 'L'.repeat(300) },
        { slot: 'right', kind: 'text', text: 'R'.repeat(50) },
      ],
    });

    const result = reviewDeck(deck);

    expect(result.suggestions).toContainEqual({
      slideIndex: 2,
      category: 'unbalanced-columns',
      message: 'Slide 3: left/right content is unbalanced (300 vs 50). Consider evening out the columns.',
    });
  });

  it('flags comparison layouts with unbalanced body columns', () => {
    const deck = makeDeckWithLayoutSlide({
      type: 'layout',
      layout: 'comparison',
      blocks: [
        { slot: 'title', kind: 'heading', text: 'Before vs After' },
        { slot: 'left-header', kind: 'heading', text: 'Before' },
        { slot: 'right-header', kind: 'heading', text: 'After' },
        { slot: 'left-body', kind: 'text', text: 'L'.repeat(180) },
        { slot: 'right-body', kind: 'text', text: 'R'.repeat(50) },
      ],
    });

    const result = reviewDeck(deck);

    expect(result.suggestions).toContainEqual({
      slideIndex: 2,
      category: 'unbalanced-columns',
      message: 'Slide 3: left/right content is unbalanced (180 vs 50). Consider evening out the columns.',
    });
  });

  it('flags heading blocks that exceed slot maxContent.text', () => {
    const deck = makeDeckWithLayoutSlide({
      type: 'layout',
      layout: 'two-column',
      blocks: [
        { slot: 'title', kind: 'heading', text: 'H'.repeat(81) },
        { slot: 'left', kind: 'text', text: 'Left column stays within range.' },
        { slot: 'right', kind: 'text', text: 'Right column stays within range too.' },
      ],
    });

    const result = reviewDeck(deck);

    expect(result.suggestions).toContainEqual({
      slideIndex: 2,
      category: 'content-overflow',
      message: 'Slide 3, slot "title": heading content exceeds recommended maximum (81 characters, max 80).',
    });
  });

  it('flags metric blocks with labels longer than 40 characters', () => {
    const deck = makeDeckWithLayoutSlide({
      type: 'layout',
      layout: 'single-center',
      blocks: [
        { slot: 'title', kind: 'heading', text: 'Metrics Overview' },
        {
          slot: 'body',
          kind: 'metric',
          value: '42%',
          label: 'A'.repeat(52),
        },
      ],
    });

    const result = reviewDeck(deck);

    expect(result.suggestions).toContainEqual({
      slideIndex: 2,
      category: 'long-metric-labels',
      message: expect.stringContaining('metric label is 52 characters (max 40)'),
    });
  });

  it('flags empty required fields in layout blocks', () => {
    const deck = makeDeckWithLayoutSlide({
      type: 'layout',
      layout: 'single-center',
      blocks: [
        { slot: 'title', kind: 'heading', text: 'Empty Field Check' },
        { slot: 'body', kind: 'text', text: '' },
      ],
    });

    const result = reviewDeck(deck);

    expect(result.suggestions).toContainEqual({
      slideIndex: 2,
      category: 'empty-blocks',
      message: 'Slide 3, slot "body": block kind "text" has empty required field "text".',
    });
  });

  it('flags whitespace-only text fields in layout blocks', () => {
    const deck = makeDeckWithLayoutSlide({
      type: 'layout',
      layout: 'single-center',
      blocks: [
        { slot: 'title', kind: 'heading', text: 'Whitespace Check' },
        { slot: 'body', kind: 'text', text: '   ' },
      ],
    });

    const result = reviewDeck(deck);

    expect(result.suggestions).toContainEqual({
      slideIndex: 2,
      category: 'empty-blocks',
      message: 'Slide 3, slot "body": block kind "text" has empty required field "text".',
    });
  });

  it('returns no layout block suggestions for an unknown layout id', () => {
    const deck = makeDeckWithLayoutSlide({
      type: 'layout',
      layout: 'not-a-real-layout',
      blocks: [
        { slot: 'title', kind: 'heading', text: 'Unknown Layout' },
        { slot: 'body', kind: 'text', text: 'Unknown layouts should not crash block-level review.' },
      ],
    });

    const result = reviewDeck(deck);

    expect(result.suggestions.filter(({ category }) => BLOCK_REVIEW_CATEGORIES.has(category))).toEqual([]);
  });

  it('returns no layout block suggestions for a well-structured layout slide', () => {
    const deck = makeDeckWithLayoutSlide({
      type: 'layout',
      layout: 'two-column',
      blocks: [
        { slot: 'title', kind: 'heading', text: 'Healthy Layout Slide' },
        { slot: 'left', kind: 'text', text: 'Left column stays concise and focused.' },
        { slot: 'right', kind: 'text', text: 'Right column mirrors the density with similar detail.' },
      ],
    });

    const result = reviewDeck(deck);

    expect(result.suggestions.filter(({ category }) => BLOCK_REVIEW_CATEGORIES.has(category))).toEqual([]);
  });
});
