/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LayoutSlide } from './LayoutSlide.jsx';

describe('LayoutSlide', () => {
  it('renders named-layout blocks in CSS grid positions', () => {
    const slide = {
      type: 'layout',
      layout: 'two-column',
      blocks: [
        { slot: 'title', kind: 'heading', text: 'QBR' },
        { slot: 'left', kind: 'text', text: 'Left content' },
        { slot: 'right', kind: 'list', items: ['A', 'B'] },
      ],
    };

    const { container } = render(<LayoutSlide slide={slide} />);

    expect(screen.getByText('QBR')).toBeTruthy();
    expect(screen.getByText('Left content')).toBeTruthy();
    expect(screen.getByText('A')).toBeTruthy();

    const titleSlot = container.querySelector('[data-slot="title"]');
    const leftSlot = container.querySelector('[data-slot="left"]');
    const rightSlot = container.querySelector('[data-slot="right"]');

    expect(titleSlot.style.gridColumn).toBe('1 / span 12');
    expect(titleSlot.style.gridRow).toBe('1 / span 1');
    expect(leftSlot.style.gridColumn).toBe('1 / span 6');
    expect(leftSlot.style.gridRow).toBe('2 / span 5');
    expect(rightSlot.style.gridColumn).toBe('7 / span 6');
    expect(rightSlot.style.gridRow).toBe('2 / span 5');
  });

  it('handles custom layouts with inline slots', () => {
    const slide = {
      type: 'layout',
      layout: 'custom',
      slots: [
        { name: 'headline', position: { col: 1, row: 1, colSpan: 12, rowSpan: 1 } },
        { name: 'body', position: { col: 1, row: 2, colSpan: 12, rowSpan: 5 } },
      ],
      blocks: [
        { slot: 'headline', kind: 'heading', text: 'Custom title' },
        { slot: 'body', kind: 'text', text: 'Custom body' },
      ],
    };

    const { container } = render(<LayoutSlide slide={slide} />);

    expect(screen.getByText('Custom title')).toBeTruthy();
    expect(screen.getByText('Custom body')).toBeTruthy();
    expect(container.querySelector('[data-slot="headline"]')).toBeTruthy();
    expect(container.querySelector('[data-slot="body"]')).toBeTruthy();
  });

  it('skips blocks with invalid slot names', () => {
    const slide = {
      type: 'layout',
      layout: 'two-column',
      blocks: [
        { slot: 'title', kind: 'heading', text: 'Visible title' },
        { slot: 'does-not-exist', kind: 'text', text: 'Invisible text' },
      ],
    };

    const { container } = render(<LayoutSlide slide={slide} />);

    expect(screen.getByText('Visible title')).toBeTruthy();
    expect(screen.queryByText('Invisible text')).toBeNull();
    expect(container.querySelector('[data-slot="does-not-exist"]')).toBeNull();
  });
});
