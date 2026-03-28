/**
 * Shared slide rendering utilities.
 * Used by renderer.jsx, ChartSlide.jsx, and any future slide components.
 */

/** Pick a font size class based on text length to prevent overflow.
 *  Sizes are designed for the 1920x1080 virtual canvas. */
export function titleSize(text, base = 'text-[80px]', shrink = 'text-[60px]', tiny = 'text-[48px]') {
  if (!text) return base;
  if (text.length > 60) return tiny;
  if (text.length > 35) return shrink;
  return base;
}
