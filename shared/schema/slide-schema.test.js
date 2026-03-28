import { describe, it, expect } from 'vitest';
import {
  SLIDE_TYPES,
  BLOCK_KINDS,
  CURRENT_SCHEMA_VERSION,
  createSlide,
  createDeck,
  migrateDeck,
  validateBlock,
  validateSlide,
  validateDeck,
  EXAMPLE_DECK,
} from './slide-schema.js';

// --- SLIDE_TYPES ---

describe('SLIDE_TYPES', () => {
  it('defines all 10 slide types', () => {
    const types = Object.keys(SLIDE_TYPES);
    expect(types).toEqual([
      'title', 'content', 'grid', 'image', 'quote', 'metric', 'chart', 'section', 'blank', 'layout',
    ]);
  });

  it('each type has required and optional arrays', () => {
    for (const [type, schema] of Object.entries(SLIDE_TYPES)) {
      expect(Array.isArray(schema.required), `${type}.required`).toBe(true);
      expect(Array.isArray(schema.optional), `${type}.optional`).toBe(true);
    }
  });

  it('blank has no required fields', () => {
    expect(SLIDE_TYPES.blank.required).toEqual([]);
  });
});

describe('BLOCK_KINDS', () => {
  it('defines all 12 block kinds', () => {
    const kinds = Object.keys(BLOCK_KINDS);
    expect(kinds).toEqual([
      'heading', 'text', 'list', 'metric', 'chart', 'table',
      'image', 'icon', 'quote', 'callout', 'divider', 'spacer',
    ]);
  });
});

// --- createSlide ---

describe('createSlide', () => {
  it('creates a slide with type, id, theme defaults, and notes', () => {
    const slide = createSlide('title', { title: 'Hello' });
    expect(slide.type).toBe('title');
    expect(slide.title).toBe('Hello');
    expect(slide.theme).toBe('rewst');
    expect(slide.notes).toBe('');
    expect(typeof slide.id).toBe('string');
    expect(slide.id.length).toBeGreaterThan(0);
  });

  it('preserves a provided id', () => {
    const slide = createSlide('content', { id: 'my-id', title: 'X', points: [] });
    expect(slide.id).toBe('my-id');
  });

  it('allows overriding theme and notes', () => {
    const slide = createSlide('section', {
      title: 'Break',
      theme: 'dramatic',
      notes: 'Pause here',
    });
    expect(slide.theme).toBe('dramatic');
    expect(slide.notes).toBe('Pause here');
  });

  it('throws on unknown type', () => {
    expect(() => createSlide('unknown')).toThrow('Unknown slide type: unknown');
  });

  it('works with no data argument', () => {
    const slide = createSlide('blank');
    expect(slide.type).toBe('blank');
    expect(slide.theme).toBe('rewst');
  });

  it('creates a layout slide', () => {
    const slide = createSlide('layout', {
      layout: 'single-center',
      blocks: [
        { slot: 'title', kind: 'heading', text: 'Layout title' },
        { slot: 'body', kind: 'text', text: 'Layout body' },
      ],
    });

    expect(slide.type).toBe('layout');
    expect(slide.layout).toBe('single-center');
    expect(slide.blocks).toHaveLength(2);
  });

  it('generates unique ids across calls', () => {
    const ids = new Set(Array.from({ length: 50 }, () => createSlide('blank').id));
    expect(ids.size).toBe(50);
  });
});

describe('migrateDeck', () => {
  it('adds schemaVersion 2 to decks without a version', () => {
    const old = { title: 'Old', slides: [{ type: 'title', title: 'Hi' }] };
    const migrated = migrateDeck(old);
    expect(migrated.schemaVersion).toBe(2);
  });

  it('preserves schemaVersion on already-migrated decks', () => {
    const deck = { schemaVersion: 2, title: 'New', slides: [] };
    const migrated = migrateDeck(deck);
    expect(migrated.schemaVersion).toBe(2);
  });

  it('does not mutate the original deck', () => {
    const old = { title: 'Old', slides: [] };
    const migrated = migrateDeck(old);
    expect(old.schemaVersion).toBeUndefined();
    expect(migrated.schemaVersion).toBe(2);
  });

  it('deep copies slides so migrated slide edits do not affect the original deck', () => {
    const old = {
      title: 'Old',
      slides: [{ type: 'title', title: 'Original Title' }],
    };

    const migrated = migrateDeck(old);
    migrated.slides[0].title = 'Changed After Migration';

    expect(old.slides[0].title).toBe('Original Title');
    expect(migrated.slides[0].title).toBe('Changed After Migration');
  });
});

// --- createDeck ---

describe('createDeck', () => {
  it('creates a deck with defaults when no metadata given', () => {
    const deck = createDeck();
    expect(deck.title).toBe('Untitled Presentation');
    expect(deck.author).toBe('');
    expect(deck.defaultTheme).toBe('rewst');
    expect(deck.slides).toHaveLength(1);
    expect(deck.slides[0].type).toBe('title');
    expect(typeof deck.id).toBe('string');
    expect(typeof deck.createdAt).toBe('string');
    expect(typeof deck.updatedAt).toBe('string');
  });

  it('uses provided metadata', () => {
    const deck = createDeck({ title: 'My Deck', author: 'Tim', theme: 'terminal' });
    expect(deck.title).toBe('My Deck');
    expect(deck.author).toBe('Tim');
    expect(deck.defaultTheme).toBe('terminal');
  });

  it('uses provided slides array', () => {
    const slides = [
      createSlide('title', { title: 'A' }),
      createSlide('content', { title: 'B', points: ['x'] }),
    ];
    const deck = createDeck({ slides });
    expect(deck.slides).toHaveLength(2);
    expect(deck.slides[0].title).toBe('A');
    expect(deck.slides[1].title).toBe('B');
  });

  it('stamps schemaVersion on new decks', () => {
    const deck = createDeck({ title: 'Test' });
    expect(deck.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });
});

// --- validateSlide ---

describe('validateSlide', () => {
  it('validates a correct title slide', () => {
    const result = validateSlide({ type: 'title', title: 'Hello' });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('validates a correct content slide', () => {
    const result = validateSlide({
      type: 'content',
      title: 'Features',
      points: ['a', 'b'],
    });
    expect(result.valid).toBe(true);
  });

  it('fails when required fields are missing', () => {
    const result = validateSlide({ type: 'content', title: 'No Points' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Slide type "content" missing required field: points');
  });

  it('fails when type is missing', () => {
    const result = validateSlide({ title: 'Oops' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Slide missing required field: type');
  });

  it('fails on unknown type', () => {
    const result = validateSlide({ type: 'fancy' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Unknown slide type: fancy');
  });

  it('reports multiple missing fields', () => {
    const result = validateSlide({ type: 'grid' });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2); // title + items
  });

  it('treats null as missing', () => {
    const result = validateSlide({ type: 'quote', quote: null });
    expect(result.valid).toBe(false);
  });

  it('blank slide always passes', () => {
    const result = validateSlide({ type: 'blank' });
    expect(result.valid).toBe(true);
  });

  it('validates image slide requires src', () => {
    expect(validateSlide({ type: 'image' }).valid).toBe(false);
    expect(validateSlide({ type: 'image', src: '/img.png' }).valid).toBe(true);
  });

  it('validates metric slide requires metrics', () => {
    expect(validateSlide({ type: 'metric' }).valid).toBe(false);
    expect(validateSlide({ type: 'metric', metrics: [] }).valid).toBe(true);
  });

  it('validates chart slide with enabled chart type and matching data lengths', () => {
    const result = validateSlide({
      type: 'chart',
      chartType: 'line',
      data: {
        labels: ['Jan', 'Feb'],
        datasets: [{ label: 'Automated', values: [10, 20], color: 'teal' }],
      },
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects chart slides with disabled chart types', () => {
    const result = validateSlide({
      type: 'chart',
      chartType: 'area',
      data: {
        labels: ['Jan'],
        datasets: [{ label: 'Automated', values: [10] }],
      },
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Slide type "chart" has unsupported chartType: area');
  });

  it('rejects chart slides when dataset values do not match labels length', () => {
    const result = validateSlide({
      type: 'chart',
      chartType: 'bar',
      data: {
        labels: ['Jan', 'Feb'],
        datasets: [{ label: 'Automated', values: [10] }],
      },
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Slide type "chart" data.datasets[0].values length must match labels length');
  });

  it('delegates layout slides to the layout validator', () => {
    const result = validateSlide({
      type: 'layout',
      layout: 'single-center',
      blocks: [
        { slot: 'title', kind: 'heading', text: 'Quarterly Review' },
        { slot: 'body', kind: 'text', text: 'Strong customer retention and margin growth.' },
      ],
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects layout slide with wrong kind in slot', () => {
    const result = validateSlide({
      type: 'layout',
      layout: 'single-center',
      blocks: [
        { slot: 'title', kind: 'heading', text: 'Quarterly Review' },
        { slot: 'body', kind: 'heading', text: 'Not allowed here' },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('kind "heading" not allowed in slot "body"');
  });
});

describe('validateBlock', () => {
  it('passes for valid heading block', () => {
    const result = validateBlock({ kind: 'heading', text: 'Quarterly Review' });
    expect(result).toEqual({ valid: true, errors: [] });
  });

  it('fails for missing required field', () => {
    const result = validateBlock({ kind: 'metric', value: '42%' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Block kind "metric" missing required field: label');
  });

  it('fails for unknown kind', () => {
    const result = validateBlock({ kind: 'sparkles' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Unknown block kind: sparkles');
  });

  it('validates chart blocks with enabled chart types', () => {
    const result = validateBlock({
      kind: 'chart',
      type: 'pie',
      data: {
        labels: ['P1', 'P2'],
        datasets: [{ label: 'Tickets', values: [5, 7] }],
      },
    });

    expect(result).toEqual({ valid: true, errors: [] });
  });

  it('rejects chart blocks with invalid dataset lengths', () => {
    const result = validateBlock({
      kind: 'chart',
      type: 'bar',
      data: {
        labels: ['Jan', 'Feb'],
        datasets: [{ label: 'Tickets', values: [5] }],
      },
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Block kind "chart" data.datasets[0].values length must match labels length');
  });
});

// --- validateDeck ---

describe('validateDeck', () => {
  it('validates a correct deck', () => {
    const deck = createDeck({ title: 'Valid' });
    const result = validateDeck(deck);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('fails when slides is missing', () => {
    const result = validateDeck({ title: 'Bad' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Deck must have a slides array');
  });

  it('fails when slides is not an array', () => {
    const result = validateDeck({ slides: 'nope' });
    expect(result.valid).toBe(false);
  });

  it('fails when slides is empty', () => {
    const result = validateDeck({ slides: [] });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Deck must have at least one slide');
  });

  it('reports per-slide errors with slide numbers', () => {
    const deck = {
      slides: [
        { type: 'title', title: 'OK' },
        { type: 'content' }, // missing title and points
      ],
    };
    const result = validateDeck(deck);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.startsWith('Slide 2:'))).toBe(true);
  });
});

// --- EXAMPLE_DECK ---

describe('EXAMPLE_DECK', () => {
  it('passes deck validation', () => {
    const result = validateDeck(EXAMPLE_DECK);
    expect(result.valid).toBe(true);
  });

  it('has expected number of slides', () => {
    expect(EXAMPLE_DECK.slides.length).toBe(6);
  });

  it('uses a variety of slide types', () => {
    const types = new Set(EXAMPLE_DECK.slides.map(s => s.type));
    expect(types.size).toBeGreaterThanOrEqual(4);
  });
});
