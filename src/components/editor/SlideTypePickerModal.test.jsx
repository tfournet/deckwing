/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SlideTypePickerModal } from './SlideTypePickerModal';

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
});
