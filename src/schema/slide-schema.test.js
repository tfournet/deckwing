import { describe, it, expect } from 'vitest';
import { SLIDE_TYPES, createSlide, createDeck, validateSlide, validateDeck, EXAMPLE_DECK } from './slide-schema.js';

describe('slide-schema re-export', () => {
  it('re-exports all expected symbols from shared/', () => {
    expect(SLIDE_TYPES).toBeDefined();
    expect(typeof createSlide).toBe('function');
    expect(typeof createDeck).toBe('function');
    expect(typeof validateSlide).toBe('function');
    expect(typeof validateDeck).toBe('function');
    expect(EXAMPLE_DECK).toBeDefined();
  });
});
