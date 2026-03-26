/**
 * DeckWing Typography
 *
 * SAFE TO EDIT — this file defines all fonts and text styles.
 *
 * Font families must be installed or loaded via CSS.
 * Current fonts are loaded in src/fonts/fonts.css and index.html.
 */

export const fonts = {
  /** Display font — used for headings, buttons, slide titles */
  display: {
    family: "'Goldplay', system-ui, sans-serif",
    weights: {
      medium: 500,
      semibold: 600,
      bold: 700,
      black: 900,
    },
  },

  /** Body font — used for paragraphs, labels, descriptions */
  body: {
    family: "'Montserrat', system-ui, sans-serif",
    weights: {
      light: 300,
      regular: 400,
      medium: 500,
      bold: 700,
    },
  },

  /** Monospace font — used for code, JSON editor, technical content */
  mono: {
    family: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    weights: {
      regular: 400,
      medium: 500,
    },
  },
};

/**
 * Font sizes for slides (at 1920x1080 virtual canvas)
 *
 * These are the MINIMUM sizes for readability when projected.
 * The "Photo Test": can someone read this from a photo taken
 * at the back of a conference room?
 */
export const slideFontSizes = {
  /** Slide title — the biggest text on the slide */
  title: {
    large: '96px',    // Short titles (under 35 chars)
    medium: '72px',   // Medium titles (35-60 chars)
    small: '56px',    // Long titles (60+ chars)
  },

  /** Subtitle — below the title */
  subtitle: '36px',

  /** Body text — bullet points, descriptions */
  body: '36px',

  /** Body text when there are many items (5+ bullets) */
  bodyCompact: '32px',

  /** Card titles in grid layouts */
  cardTitle: '32px',

  /** Card descriptions, secondary text */
  cardBody: '28px',

  /** Metric values — big numbers */
  metricValue: '72px',

  /** Metric labels — what the number means */
  metricLabel: '28px',

  /** Quote text */
  quote: '44px',
  quoteCompact: '36px',  // For long quotes (120+ chars)

  /** Attribution, dates, roles — smallest allowed text */
  caption: '28px',

  /** MINIMUM allowed font size on any slide element */
  minimum: '28px',
};

/**
 * Font sizes for the app UI (editor, chat, menus)
 * These are normal screen-reading sizes, not projection sizes.
 */
export const uiFontSizes = {
  xs: '0.75rem',    // 12px — labels, badges
  sm: '0.875rem',   // 14px — secondary text
  base: '1rem',     // 16px — body text
  lg: '1.125rem',   // 18px — slightly larger body
  xl: '1.25rem',    // 20px — section headers
};
