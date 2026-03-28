/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import html2canvas from 'html2canvas';

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
  const originalGetBCR = Element.prototype.getBoundingClientRect;

  beforeEach(() => {
    vi.mocked(html2canvas).mockReset();
    vi.mocked(html2canvas).mockResolvedValue({
      toDataURL: () => 'data:image/png;base64,mockPNG',
    });
    // jsdom returns 0x0 for getBoundingClientRect — stub non-zero
    // dimensions so waitForRenderSettle resolves immediately.
    Element.prototype.getBoundingClientRect = function () {
      return { width: 1920, height: 1080, x: 0, y: 0, top: 0, left: 0, right: 1920, bottom: 1080, toJSON() {} };
    };
  });

  afterEach(() => {
    Element.prototype.getBoundingClientRect = originalGetBCR;
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

  it('rejects concurrent captures', async () => {
    let resolveCanvas;
    vi.mocked(html2canvas).mockImplementationOnce(() => new Promise((resolve) => {
      resolveCanvas = () => resolve({ toDataURL: () => 'data:image/png;base64,slowPNG' });
    }));

    const { result } = renderHook(() => useOffscreenRenderer());

    let firstCapture;
    await act(async () => {
      firstCapture = result.current.captureSlide({ type: 'title', title: 'Slow' }, 'rewst');
      // Let waitForRenderSettle resolve so html2canvas is called (and blocked)
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    await act(async () => {
      await expect(
        result.current.captureSlide({ type: 'title', title: 'Second' }, 'rewst'),
      ).rejects.toThrow('Capture already in progress');
    });

    await act(async () => {
      resolveCanvas();
      await firstCapture;
    });
  });

  it('cleans up after capture errors', async () => {
    vi.mocked(html2canvas).mockRejectedValueOnce(new Error('boom'));

    const { result } = renderHook(() => useOffscreenRenderer());

    await act(async () => {
      await expect(
        result.current.captureSlide({ type: 'blank' }, 'rewst'),
      ).rejects.toThrow('boom');
    });

    expect(document.querySelector('[style*="-9999px"]')).toBeNull();
  });
});
