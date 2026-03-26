import { describe, it, expect } from 'vitest';
import { reviewDeck } from './review-agent.js';

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
