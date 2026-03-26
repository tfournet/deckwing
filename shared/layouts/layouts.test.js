import { describe, it, expect } from 'vitest';
import {
  getLayout,
  getLayoutNames,
  getAllLayouts,
  validateLayoutSlide,
} from './index.js';

const REGISTERED_LAYOUT_IDS = [
  'single-center',
  'two-column',
  'four-column',
  'dashboard',
  'comparison',
  'image-left',
];

describe('layout registry', () => {
  it('getLayout returns a valid layout for each registered ID', () => {
    for (const id of REGISTERED_LAYOUT_IDS) {
      expect(getLayout(id)).toMatchObject({ id });
    }
  });

  it('getLayout returns null for unknown ID', () => {
    expect(getLayout('does-not-exist')).toBeNull();
  });

  it('getLayoutNames returns all registered IDs', () => {
    expect(getLayoutNames()).toEqual(REGISTERED_LAYOUT_IDS);
  });

  it('each registered layout has all required fields', () => {
    for (const layout of getAllLayouts()) {
      expect(layout).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        description: expect.any(String),
        promptDescription: expect.any(String),
        editorLabel: expect.any(String),
        slots: expect.any(Array),
      });
    }
  });
});

describe('validateLayoutSlide', () => {
  it('passes for valid layout slide', () => {
    const result = validateLayoutSlide({
      type: 'layout',
      layout: 'single-center',
      blocks: [
        { slot: 'title', kind: 'heading', text: 'Quarterly Review' },
        { slot: 'body', kind: 'text', text: 'Strong customer retention and margin growth.' },
      ],
    });

    expect(result).toEqual({ valid: true, errors: [] });
  });

  it('fails for unknown layout', () => {
    const result = validateLayoutSlide({
      type: 'layout',
      layout: 'mystery-layout',
      blocks: [],
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Unknown layout: "mystery-layout"');
  });

  it('fails for wrong kind in slot', () => {
    const result = validateLayoutSlide({
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

  it('fails for duplicate slot', () => {
    const result = validateLayoutSlide({
      type: 'layout',
      layout: 'single-center',
      blocks: [
        { slot: 'title', kind: 'heading', text: 'Quarterly Review' },
        { slot: 'body', kind: 'text', text: 'First block' },
        { slot: 'body', kind: 'list', items: ['Duplicate'] },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Block 2: duplicate slot "body"');
  });

  it('fails for missing required slot', () => {
    const result = validateLayoutSlide({
      type: 'layout',
      layout: 'single-center',
      blocks: [
        { slot: 'title', kind: 'heading', text: 'Quarterly Review' },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Required slot "body" not filled');
  });

  it('fails when required slots are empty', () => {
    const result = validateLayoutSlide({
      type: 'layout',
      layout: 'single-center',
      blocks: [],
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Required slot "title" not filled');
    expect(result.errors).toContain('Required slot "body" not filled');
  });

  it('passes for custom layout with valid slots', () => {
    const result = validateLayoutSlide({
      type: 'layout',
      layout: 'custom',
      slots: [
        { name: 'left', position: { col: 1, row: 1, colSpan: 6, rowSpan: 3 } },
        { name: 'right', position: { col: 7, row: 1, colSpan: 6, rowSpan: 3 } },
      ],
      blocks: [
        { slot: 'left', kind: 'text', text: 'Left content' },
        { slot: 'right', kind: 'metric', value: '42%', label: 'Efficiency' },
      ],
    });

    expect(result).toEqual({ valid: true, errors: [] });
  });

  it('fails for custom layout with overlapping slots', () => {
    const result = validateLayoutSlide({
      type: 'layout',
      layout: 'custom',
      slots: [
        { name: 'left', position: { col: 1, row: 1, colSpan: 6, rowSpan: 3 } },
        { name: 'right', position: { col: 6, row: 2, colSpan: 6, rowSpan: 3 } },
      ],
      blocks: [],
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Slots "left" and "right" overlap');
  });

  it('fails for custom layout with out-of-bounds slots', () => {
    const result = validateLayoutSlide({
      type: 'layout',
      layout: 'custom',
      slots: [
        { name: 'overflow', position: { col: 10, row: 5, colSpan: 4, rowSpan: 3 } },
      ],
      blocks: [],
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Slot "overflow": exceeds column bounds');
    expect(result.errors).toContain('Slot "overflow": exceeds row bounds');
  });

  it('fails for custom layout with non-positive spans', () => {
    const result = validateLayoutSlide({
      type: 'layout',
      layout: 'custom',
      slots: [
        { name: 'zero-width', position: { col: 1, row: 1, colSpan: 0, rowSpan: 2 } },
      ],
      blocks: [],
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Slot "zero-width": position values must be positive integers');
  });
});
