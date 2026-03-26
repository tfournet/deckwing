/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderSlide, SlideFrame } from './renderer.jsx';

const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    disconnect() {}
  });

  Element.prototype.getBoundingClientRect = vi.fn(() => ({
    width: 1920,
    height: 1080,
    top: 0,
    left: 0,
    right: 1920,
    bottom: 1080,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  }));
});

afterEach(() => {
  Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
  vi.unstubAllGlobals();
});

describe('renderer layout integration', () => {
  it('renderSlide renders layout slides via LayoutSlide', () => {
    const slide = {
      type: 'layout',
      layout: 'single-center',
      blocks: [
        { slot: 'title', kind: 'heading', text: 'Layout title' },
        { slot: 'body', kind: 'text', text: 'Layout body' },
      ],
    };

    render(renderSlide(slide, 'rewst'));

    expect(screen.getByText('Layout title')).toBeTruthy();
    expect(screen.getByText('Layout body')).toBeTruthy();
  });

  it('SlideFrame injects block theme vars for layout slides', () => {
    const slide = {
      type: 'layout',
      layout: 'single-center',
      customColors: {
        bg: '#101010',
        primary: '#123456',
        text: '#ABCDEF',
      },
      blocks: [
        { slot: 'title', kind: 'heading', text: 'Styled layout' },
        { slot: 'body', kind: 'text', text: 'Theme vars' },
      ],
    };

    const { container } = render(<SlideFrame slide={slide} defaultTheme="rewst" />);
    const frame = container.firstChild;

    expect(frame.style.getPropertyValue('--block-bg')).toBe('#101010');
    expect(frame.style.getPropertyValue('--block-accent')).toBe('#123456');
    expect(frame.style.getPropertyValue('--block-text')).toBe('#ABCDEF');
  });
});
