import { describe, it, expect } from 'vitest';
import { PRESET_EXPANDERS, expandPresetToLayout } from './preset-expansion.js';

describe('PRESET_EXPANDERS', () => {
  it('has expanders for each supported preset conversion', () => {
    expect(Object.keys(PRESET_EXPANDERS).sort()).toEqual([
      'content',
      'grid',
      'image',
      'metric',
      'quote',
      'section',
      'title',
    ]);
  });
});

describe('expandPresetToLayout', () => {
  it('expands title slide to layout with heading + text blocks', () => {
    const slide = {
      type: 'title',
      title: 'DeckWing',
      subtitle: 'Built for engineers',
      author: 'Tim',
      date: 'March 26, 2026',
    };

    expect(expandPresetToLayout(slide)).toEqual({
      type: 'layout',
      layout: 'single-center',
      blocks: [
        { slot: 'title', kind: 'heading', size: 'xl', text: 'DeckWing' },
        { slot: 'body', kind: 'text', text: 'Built for engineers — Tim, March 26, 2026' },
      ],
    });
  });

  it('expands content slide to layout with heading + list blocks', () => {
    const slide = {
      type: 'content',
      title: 'Agenda',
      points: ['Intro', 'Demo'],
    };

    expect(expandPresetToLayout(slide)).toEqual({
      type: 'layout',
      layout: 'single-center',
      blocks: [
        { slot: 'title', kind: 'heading', size: 'lg', text: 'Agenda' },
        { slot: 'body', kind: 'list', items: ['Intro', 'Demo'] },
      ],
    });
  });

  it('expands metric slide to layout with heading + metric blocks', () => {
    const slide = {
      type: 'metric',
      title: 'Results',
      metrics: [
        { value: '42%', label: 'Efficiency', color: '#1EAFAF' },
        { value: '7', label: 'Automations' },
        { value: '99.9%', label: 'Success rate' },
        { value: '$12k', label: 'Savings' },
      ],
    };

    expect(expandPresetToLayout(slide)).toEqual({
      type: 'layout',
      layout: 'four-column',
      blocks: [
        { slot: 'title', kind: 'heading', text: 'Results' },
        { slot: 'm1', kind: 'metric', value: '42%', label: 'Efficiency', color: '#1EAFAF' },
        { slot: 'm2', kind: 'metric', value: '7', label: 'Automations' },
        { slot: 'm3', kind: 'metric', value: '99.9%', label: 'Success rate' },
        { slot: 'm4', kind: 'metric', value: '$12k', label: 'Savings' },
      ],
    });
  });

  it('chooses narrower metric layouts when there are fewer than four metrics', () => {
    expect(expandPresetToLayout({
      type: 'metric',
      title: 'One KPI',
      metrics: [{ value: '42%', label: 'Efficiency' }],
    })).toEqual({
      type: 'layout',
      layout: 'single-center',
      blocks: [
        { slot: 'title', kind: 'heading', text: 'One KPI' },
        { slot: 'body', kind: 'metric', value: '42%', label: 'Efficiency' },
      ],
    });

    expect(expandPresetToLayout({
      type: 'metric',
      title: 'Two KPIs',
      metrics: [
        { value: '42%', label: 'Efficiency' },
        { value: '7', label: 'Automations' },
      ],
    })).toEqual({
      type: 'layout',
      layout: 'two-column',
      blocks: [
        { slot: 'title', kind: 'heading', text: 'Two KPIs' },
        { slot: 'left', kind: 'metric', value: '42%', label: 'Efficiency' },
        { slot: 'right', kind: 'metric', value: '7', label: 'Automations' },
      ],
    });

    expect(expandPresetToLayout({
      type: 'metric',
      title: 'Three KPIs',
      metrics: [
        { value: '42%', label: 'Efficiency' },
        { value: '7', label: 'Automations' },
        { value: '99.9%', label: 'Success rate' },
      ],
    })).toEqual({
      type: 'layout',
      layout: 'three-column',
      blocks: [
        { slot: 'title', kind: 'heading', text: 'Three KPIs' },
        { slot: 'col1', kind: 'metric', value: '42%', label: 'Efficiency' },
        { slot: 'col2', kind: 'metric', value: '7', label: 'Automations' },
        { slot: 'col3', kind: 'metric', value: '99.9%', label: 'Success rate' },
      ],
    });
  });

  it('returns metric slides unchanged when there are no metrics to place', () => {
    const slide = {
      type: 'metric',
      title: 'Results',
      metrics: [],
    };

    expect(expandPresetToLayout(slide)).toBe(slide);
  });

  it('preserves id, theme, notes from original slide', () => {
    const slide = {
      id: 'slide-1',
      type: 'content',
      title: 'Agenda',
      points: ['Intro'],
      theme: 'midnight',
      notes: 'Talk through timing.',
      logo: 'top-right',
    };

    expect(expandPresetToLayout(slide)).toEqual({
      id: 'slide-1',
      type: 'layout',
      layout: 'single-center',
      theme: 'midnight',
      notes: 'Talk through timing.',
      blocks: [
        { slot: 'title', kind: 'heading', size: 'lg', text: 'Agenda' },
        { slot: 'body', kind: 'list', items: ['Intro'] },
      ],
    });
  });

  it('returns blank slides unchanged', () => {
    const slide = { type: 'blank', theme: 'rewst' };

    expect(expandPresetToLayout(slide)).toBe(slide);
  });

  it('returns unknown types unchanged', () => {
    const slide = { type: 'custom-preset', title: 'No-op' };

    expect(expandPresetToLayout(slide)).toBe(slide);
  });

  it('grid with <=4 items uses feature-grid-2x2, with 5-6 items uses feature-grid-2x3', () => {
    const fourItemGrid = {
      type: 'grid',
      title: 'Capabilities',
      items: [
        { title: 'One', description: 'First' },
        { title: 'Two' },
        { description: 'Third' },
        { title: 'Four', description: 'Fourth' },
      ],
    };
    const sixItemGrid = {
      type: 'grid',
      title: 'Capabilities',
      items: Array.from({ length: 6 }, (_, index) => ({ title: `Item ${index + 1}` })),
    };

    expect(expandPresetToLayout(fourItemGrid)).toEqual({
      type: 'layout',
      layout: 'feature-grid-2x2',
      blocks: [
        { slot: 'title', kind: 'heading', text: 'Capabilities' },
        { slot: 'card1', kind: 'text', text: 'One: First' },
        { slot: 'card2', kind: 'text', text: 'Two' },
        { slot: 'card3', kind: 'text', text: 'Third' },
        { slot: 'card4', kind: 'text', text: 'Four: Fourth' },
      ],
    });

    expect(expandPresetToLayout(sixItemGrid)).toMatchObject({
      type: 'layout',
      layout: 'feature-grid-2x3',
      blocks: [
        { slot: 'title', kind: 'heading', text: 'Capabilities' },
        { slot: 'card1', kind: 'text', text: 'Item 1' },
        { slot: 'card2', kind: 'text', text: 'Item 2' },
        { slot: 'card3', kind: 'text', text: 'Item 3' },
        { slot: 'card4', kind: 'text', text: 'Item 4' },
        { slot: 'card5', kind: 'text', text: 'Item 5' },
        { slot: 'card6', kind: 'text', text: 'Item 6' },
      ],
    });
  });

  it('quote expansion puts quote block in body slot', () => {
    const slide = {
      type: 'quote',
      quote: 'Automate the toil.',
      attribution: 'Rewst',
      role: 'Platform team',
    };

    expect(expandPresetToLayout(slide)).toEqual({
      type: 'layout',
      layout: 'single-center',
      blocks: [
        { slot: 'title', kind: 'heading', text: '' },
        {
          slot: 'body',
          kind: 'quote',
          text: 'Automate the toil.',
          attribution: 'Rewst',
          role: 'Platform team',
        },
      ],
    });
  });

  it('title slide with no subtitle/author/date only has heading block', () => {
    const slide = {
      type: 'title',
      title: 'DeckWing',
    };

    expect(expandPresetToLayout(slide)).toEqual({
      type: 'layout',
      layout: 'single-center',
      blocks: [
        { slot: 'title', kind: 'heading', size: 'xl', text: 'DeckWing' },
      ],
    });
  });
});
