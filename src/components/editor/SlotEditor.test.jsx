/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { SlotEditor } from './SlotEditor';

describe('SlotEditor', () => {
  it('renders slot fields for a two-column layout slide', () => {
    const { container } = render(
      <SlotEditor
        slide={{
          type: 'layout',
          layout: 'two-column',
          blocks: [
            { slot: 'title', kind: 'heading', text: 'Quarterly Review' },
            { slot: 'left', kind: 'text', text: 'Left content' },
          ],
        }}
        onUpdateBlocks={() => {}}
      />,
    );

    expect(container.querySelector('[data-slot-editor="title"]')).toBeTruthy();
    expect(screen.getByText('Left Column')).toBeTruthy();
    expect(screen.getByText('Right Column')).toBeTruthy();
  });

  it('kind selector shows allowed kinds for each slot', () => {
    const { container } = render(
      <SlotEditor
        slide={{
          type: 'layout',
          layout: 'two-column',
          blocks: [
            { slot: 'title', kind: 'heading', text: 'Quarterly Review' },
            { slot: 'left', kind: 'text', text: 'Left content' },
          ],
        }}
        onUpdateBlocks={() => {}}
      />,
    );

    const leftEditor = container.querySelector('[data-slot-editor="left"]');
    const kindSelect = within(leftEditor).getByLabelText('Left Column block kind');
    const optionValues = Array.from(kindSelect.options).map((option) => option.value);

    expect(optionValues).toEqual(['list', 'text', 'metric', 'chart', 'image']);
  });

  it('editing a text field calls onUpdateBlocks with the correct data', () => {
    const onUpdateBlocks = vi.fn();
    const { container } = render(
      <SlotEditor
        slide={{
          type: 'layout',
          layout: 'two-column',
          blocks: [
            { slot: 'title', kind: 'heading', text: 'Quarterly Review' },
            { slot: 'left', kind: 'text', text: 'Old copy' },
          ],
        }}
        onUpdateBlocks={onUpdateBlocks}
      />,
    );

    const leftEditor = container.querySelector('[data-slot-editor="left"]');
    fireEvent.change(within(leftEditor).getByLabelText('Left Column text'), {
      target: { value: 'Updated copy' },
    });

    expect(onUpdateBlocks).toHaveBeenCalledWith([
      { slot: 'title', kind: 'heading', text: 'Quarterly Review' },
      { slot: 'left', kind: 'text', text: 'Updated copy' },
    ]);
  });

  it('shows an empty editor for missing blocks without crashing', () => {
    const { container } = render(
      <SlotEditor
        slide={{
          type: 'layout',
          layout: 'two-column',
          blocks: [{ slot: 'title', kind: 'heading', text: 'Quarterly Review' }],
        }}
        onUpdateBlocks={() => {}}
      />,
    );

    const rightEditor = container.querySelector('[data-slot-editor="right"]');
    expect(rightEditor).toBeTruthy();
    expect(within(rightEditor).getByLabelText('Right Column block kind').value).toBe('list');
  });
});
