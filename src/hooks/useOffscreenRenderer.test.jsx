/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

vi.mock('html2canvas', () => ({
  default: vi.fn(() => Promise.resolve({
    toDataURL: () => 'data:image/png;base64,mockPNG',
  })),
}));

vi.mock('../engine/renderer', () => ({
  SlideFrame: () => null,
}));

import { useOffscreenRenderer } from './useOffscreenRenderer';

describe('useOffscreenRenderer', () => {
  afterEach(() => {
    document.querySelectorAll('[style*="-9999px"]').forEach((element) => element.remove());
  });

  it('captureSlide returns a base64 data URI', async () => {
    const { result } = renderHook(() => useOffscreenRenderer());

    let dataUri;
    await act(async () => {
      dataUri = await result.current.captureSlide(
        { type: 'title', title: 'Test' },
        'rewst',
      );
    });

    expect(dataUri).toBe('data:image/png;base64,mockPNG');
  });

  it('captureAllSlides captures each slide and calls onProgress', async () => {
    const { result } = renderHook(() => useOffscreenRenderer());
    const onProgress = vi.fn();

    const deck = {
      defaultTheme: 'rewst',
      slides: [
        { type: 'title', title: 'Slide 1' },
        { type: 'content', title: 'Slide 2', points: ['a'] },
      ],
    };

    let images;
    await act(async () => {
      images = await result.current.captureAllSlides(deck, onProgress);
    });

    expect(images).toHaveLength(2);
    expect(onProgress).toHaveBeenCalledTimes(2);
    expect(onProgress).toHaveBeenCalledWith(0, 2);
    expect(onProgress).toHaveBeenCalledWith(1, 2);
  });

  it('cleanup removes the off-screen container', async () => {
    const { result } = renderHook(() => useOffscreenRenderer());

    await act(async () => {
      await result.current.captureSlide({ type: 'blank' }, 'rewst');
    });

    expect(document.querySelector('[style*="-9999px"]')).not.toBeNull();

    act(() => {
      result.current.cleanup();
    });

    expect(document.querySelector('[style*="-9999px"]')).toBeNull();
  });
});
