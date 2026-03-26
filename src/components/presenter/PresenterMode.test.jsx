import { describe, expect, it } from 'vitest';
import { clampSlideIndex, handlePresenterKeyDown } from './PresenterMode';

describe('handlePresenterKeyDown', () => {
  const context = {
    totalSlides: 10,
    currentIndex: 2,
    showNotes: false,
  };

  it('maps forward navigation keys to next', () => {
    expect(handlePresenterKeyDown({ ...context, key: ' ' })).toEqual({ type: 'next' });
    expect(handlePresenterKeyDown({ ...context, key: 'ArrowRight' })).toEqual({ type: 'next' });
    expect(handlePresenterKeyDown({ ...context, key: 'PageDown' })).toEqual({ type: 'next' });
  });

  it('maps backward navigation keys to prev', () => {
    expect(handlePresenterKeyDown({ ...context, key: 'ArrowLeft' })).toEqual({ type: 'prev' });
    expect(handlePresenterKeyDown({ ...context, key: 'PageUp' })).toEqual({ type: 'prev' });
  });

  it('maps escape to exit', () => {
    expect(handlePresenterKeyDown({ ...context, key: 'Escape' })).toEqual({ type: 'exit' });
  });

  it('maps n and N to toggle notes', () => {
    expect(handlePresenterKeyDown({ ...context, key: 'n' })).toEqual({ type: 'toggle_notes' });
    expect(handlePresenterKeyDown({ ...context, key: 'N' })).toEqual({ type: 'toggle_notes' });
  });

  it('maps Home to first and End to last', () => {
    expect(handlePresenterKeyDown({ ...context, key: 'Home' })).toEqual({ type: 'first' });
    expect(handlePresenterKeyDown({ ...context, key: 'End' })).toEqual({ type: 'last' });
  });

  it('returns null for unhandled keys', () => {
    expect(handlePresenterKeyDown({ ...context, key: 'x' })).toBeNull();
  });
});

describe('clampSlideIndex', () => {
  it('clamps negative indexes to zero', () => {
    expect(clampSlideIndex(-1, 5)).toBe(0);
  });

  it('clamps indexes beyond the slide count to the last slide', () => {
    expect(clampSlideIndex(99, 5)).toBe(4);
  });

  it('returns in-range indexes unchanged', () => {
    expect(clampSlideIndex(2, 5)).toBe(2);
  });

  it('returns zero when there are no slides', () => {
    expect(clampSlideIndex(-1, 0)).toBe(0);
    expect(clampSlideIndex(3, 0)).toBe(0);
  });
});
