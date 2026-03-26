/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BlockRenderer, BLOCK_RENDERERS } from './BlockRenderer.jsx';

const BLOCK_FIXTURES = {
  heading: { kind: 'heading', text: 'Quarterly Review' },
  text: { kind: 'text', text: 'Body copy' },
  list: { kind: 'list', items: ['One', 'Two'] },
  metric: { kind: 'metric', value: '42%', label: 'Efficiency' },
  chart: { kind: 'chart', type: 'bar', data: [{ x: 'A', y: 1 }] },
  table: { kind: 'table', headers: ['Col'], rows: [['Val']] },
  image: { kind: 'image', src: 'https://example.com/test.png', alt: 'Example' },
  icon: { kind: 'icon', name: 'Zap', size: 32 },
  quote: { kind: 'quote', text: 'Strong retention', attribution: 'DeckWing' },
  callout: { kind: 'callout', text: 'Heads up', variant: 'amber' },
  divider: { kind: 'divider', direction: 'horizontal' },
  spacer: { kind: 'spacer' },
};

describe('BlockRenderer', () => {
  it('has renderers registered for all 12 block kinds', () => {
    expect(Object.keys(BLOCK_RENDERERS)).toEqual([
      'heading',
      'text',
      'list',
      'metric',
      'chart',
      'table',
      'image',
      'icon',
      'quote',
      'callout',
      'divider',
      'spacer',
    ]);
  });

  it('renders each of the 12 block kinds without error', () => {
    for (const block of Object.values(BLOCK_FIXTURES)) {
      const { unmount } = render(<BlockRenderer block={block} />);
      unmount();
    }
  });

  it('renders heading text content', () => {
    render(<BlockRenderer block={BLOCK_FIXTURES.heading} />);

    expect(screen.getByText('Quarterly Review')).toBeTruthy();
  });

  it('renders the correct number of list items', () => {
    render(<BlockRenderer block={BLOCK_FIXTURES.list} />);

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('renders metric value and label', () => {
    render(<BlockRenderer block={BLOCK_FIXTURES.metric} />);

    expect(screen.getByText('42%')).toBeTruthy();
    expect(screen.getByText('Efficiency')).toBeTruthy();
  });

  it('shows an error message for an unknown kind', () => {
    render(<BlockRenderer block={{ kind: 'unknown-kind' }} />);

    expect(screen.getByText('Unknown block: unknown-kind')).toBeTruthy();
  });
});
