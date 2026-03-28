import React, { useCallback, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas';
import { SlideFrame } from '../engine/renderer';

const RENDER_WIDTH = 1920;
const RENDER_HEIGHT = 1080;

/**
 * Wait for the offscreen container to finish rendering by polling for
 * non-zero layout dimensions. Falls back to a timeout so we never hang
 * indefinitely if the element stays hidden (e.g., in a test environment).
 */
const SETTLE_POLL_INTERVAL_MS = 10;
const SETTLE_TIMEOUT_MS = 2000;

function waitForRenderSettle(container) {
  return new Promise((resolve) => {
    const deadline = Date.now() + SETTLE_TIMEOUT_MS;

    function check() {
      const { width } = container.getBoundingClientRect();
      if (width > 0 || Date.now() >= deadline) {
        resolve();
        return;
      }
      setTimeout(check, SETTLE_POLL_INTERVAL_MS);
    }

    // Kick off the first check after the browser has had a
    // chance to lay out the newly-rendered React tree.
    const schedule = typeof requestAnimationFrame === 'function'
      ? requestAnimationFrame
      : (cb) => setTimeout(cb, 0);
    schedule(check);
  });
}

/**
 * Hook for rendering any slide off-screen and capturing as PNG.
 * Used by all exporters (PDF, HTML, PPTX) for consistent capture.
 */
export function useOffscreenRenderer() {
  const containerRef = useRef(null);
  const rootRef = useRef(null);
  const capturingRef = useRef(false);

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
    if (capturingRef.current) {
      throw new Error('Capture already in progress');
    }

    capturingRef.current = true;

    try {
      const { container, root } = getContainer();

      root.render(
        React.createElement(SlideFrame, {
          slide,
          defaultTheme,
        }),
      );

      await waitForRenderSettle(container);

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        width: RENDER_WIDTH,
        height: RENDER_HEIGHT,
      });

      return canvas.toDataURL('image/png');
    } catch (error) {
      cleanup();
      throw error;
    } finally {
      capturingRef.current = false;
    }
  }, [cleanup, getContainer]);

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
