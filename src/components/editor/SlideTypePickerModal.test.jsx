/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SlideTypePickerModal } from './SlideTypePickerModal';

vi.mock('../../../shared/layouts/index.js', async () => {
  const actual = await vi.importActual('../../../shared/layouts/index.js');

  return {
    ...actual,
    getAllLayouts: () => [
      ...actual.getAllLayouts(),
      {
        id: 'missing-kinds-layout',
        name: 'Missing Kinds Layout',
        description: 'Required slot without kinds should fall back to text.',
        slots: [
          {
            name: 'title',
            label: 'Title',
            required: true,
            kinds: ['heading'],
            position: { col: 1, row: 1, colSpan: 12, rowSpan: 1 },
          },
          {
            name: 'body',
            label: 'Body',
            required: true,
            position: { col: 1, row: 2, colSpan: 12, rowSpan: 5 },
          },
        ],
      },
    ],
  };
});

describe('SlideTypePickerModal', () => {
  it('renders both preset and layout tabs', () => {
    render(<SlideTypePickerModal onSelect={() => {}} onClose={() => {}} />);

    expect(screen.getByRole('tab', { name: 'Presets' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Layouts' })).toBeTruthy();
    expect(screen.getByText('Title')).toBeTruthy();

    fireEvent.click(screen.getByRole('tab', { name: 'Layouts' }));

    expect(screen.getByText('Two Columns')).toBeTruthy();
    expect(screen.getByText('Side-by-side content areas.')).toBeTruthy();
  });

  it('creates a layout slide when selecting a layout card', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();

    render(<SlideTypePickerModal onSelect={onSelect} onClose={onClose} />);

    fireEvent.click(screen.getByRole('tab', { name: 'Layouts' }));
    const twoColumnsCard = screen
      .getAllByRole('button')
      .find((button) => button.textContent.includes('Two Columns') && button.textContent.includes('Side-by-side content areas.'));
    expect(twoColumnsCard).toBeTruthy();
    fireEvent.click(twoColumnsCard);

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);

    const slide = onSelect.mock.calls[0][0];
    expect(slide.type).toBe('layout');
    expect(slide.layout).toBe('two-column');
    expect(slide.blocks).toEqual([
      { slot: 'title', kind: 'heading', text: '', size: 'lg' },
      { slot: 'left', kind: 'list', items: [] },
      { slot: 'right', kind: 'list', items: [] },
    ]);
  });

  it('falls back to a text block when a required slot has no kinds', () => {
    const onSelect = vi.fn();

    render(<SlideTypePickerModal onSelect={onSelect} onClose={() => {}} />);

    fireEvent.click(screen.getByRole('tab', { name: 'Layouts' }));
    fireEvent.click(screen.getByRole('button', { name: /Missing Kinds Layout/i }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0].blocks).toEqual([
      { slot: 'title', kind: 'heading', text: '', size: 'lg' },
      { slot: 'body', kind: 'text', text: '' },
    ]);
  });
});
