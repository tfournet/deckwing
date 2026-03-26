import React, { useCallback, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas';
import { SlideFrame } from '../engine/renderer';

const RENDER_WIDTH = 1920;
const RENDER_HEIGHT = 1080;

function waitForNextPaint() {
  return new Promise((resolve) => {
    const schedule = typeof requestAnimationFrame === 'function'
      ? requestAnimationFrame
      : (callback) => setTimeout(callback, 0);

    schedule(() => {
      setTimeout(resolve, 50);
    });
  });
}

/**
 * Hook for rendering any slide off-screen and capturing as PNG.
 * Used by all exporters (PDF, HTML, PPTX) for consistent capture.
 */
export function useOffscreenRenderer() {
  const containerRef = useRef(null);
  const rootRef = useRef(null);

  const cleanup = useCallback(() => {
    if (rootRef.current) {
      rootRef.current.unmount();
      rootRef.current = null;
    }

    if (containerRef.current) {
      containerRef.current.remove();
      containerRef.current = null;
    }
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const getContainer = useCallback(() => {
    if (!containerRef.current) {
      const element = document.createElement('div');
      element.style.cssText = `position:fixed;left:-9999px;top:0;width:${RENDER_WIDTH}px;height:${RENDER_HEIGHT}px;overflow:hidden;`;
      document.body.appendChild(element);

      containerRef.current = element;
      rootRef.current = createRoot(element);
    }

    return {
      container: containerRef.current,
      root: rootRef.current,
    };
  }, []);

  /**
   * Render a slide off-screen and capture as base64 PNG.
   * @param {object} slide
   * @param {string} defaultTheme
   * @returns {Promise<string>}
   */
  const captureSlide = useCallback(async (slide, defaultTheme) => {
    const { container, root } = getContainer();

    root.render(
      React.createElement(SlideFrame, {
        slide,
        defaultTheme,
      }),
    );

    await waitForNextPaint();

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      width: RENDER_WIDTH,
      height: RENDER_HEIGHT,
    });

    return canvas.toDataURL('image/png');
  }, [getContainer]);

  /**
   * Capture all slides in a deck sequentially.
   * @param {object} deck
   * @param {(currentIndex: number, total: number) => void} onProgress
   * @returns {Promise<string[]>}
   */
  const captureAllSlides = useCallback(async (deck, onProgress) => {
    const slides = deck?.slides ?? [];
    const total = slides.length;
    const images = [];

    for (let i = 0; i < total; i += 1) {
      if (typeof onProgress === 'function') {
        onProgress(i, total);
      }

      const dataUri = await captureSlide(slides[i], deck?.defaultTheme);
      images.push(dataUri);
    }

    return images;
  }, [captureSlide]);

  return { captureSlide, captureAllSlides, cleanup };
}

export default useOffscreenRenderer;
