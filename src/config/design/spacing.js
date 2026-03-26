/**
 * DeckWing Spacing System
 *
 * SAFE TO EDIT — this file defines all spacing values.
 * Used for padding, margins, gaps between elements.
 */

export const spacing = {
  /** Tiny — between icon and label, between badge elements */
  xs: '4px',

  /** Small — between related items in a group */
  sm: '8px',

  /** Medium — between sections, card padding */
  md: '16px',

  /** Large — between major sections, generous padding */
  lg: '24px',

  /** Extra large — between page sections, slide padding */
  xl: '32px',
};

/**
 * Slide-specific spacing (at 1920x1080 virtual canvas)
 * These are larger because slides are viewed from a distance
 */
export const slideSpacing = {
  /** Padding inside the slide frame */
  framePadding: '64px',

  /** Gap between slide elements (heading to content) */
  elementGap: '24px',

  /** Gap between bullet points */
  bulletGap: '20px',

  /** Gap between grid cards */
  gridGap: '32px',

  /** Gap between metric cards */
  metricGap: '40px',
};

/**
 * Layout widths for the main app panels
 */
export const panelWidths = {
  /** Left sidebar — slide outline */
  slideOutline: '208px',  // w-52 in Tailwind

  /** Right sidebar — Deckster chat */
  chatPanel: '320px',     // w-80 in Tailwind

  /** Everything else goes to the slide preview (flex-1) */
};
