/**
 * DeckWing Image Assets
 *
 * SAFE TO EDIT — this file defines paths to logos and images
 * used throughout the app and in slides.
 *
 * To add a new image:
 * 1. Drop the file in public/images/
 * 2. Add an entry here
 * 3. Reference it by the key name in your code
 */

export const logos = {
  /** Rewst logo — used in slide overlays */
  rewst: '/images/rewst-logo.png',

  /** Add partner logos here for co-branded presentations */
  // datto: '/images/datto-logo.png',
  // connectwise: '/images/connectwise-logo.png',
};

/**
 * Logo display settings for slides
 */
export const logoSettings = {
  /** Default logo to show on slides */
  defaultLogo: 'rewst',

  /** Logo height on slides (at 1920x1080 canvas) */
  height: '32px',

  /** Logo opacity (0-1) — subtle, not distracting */
  opacity: 0.6,

  /** Default position for different slide types */
  defaultPositions: {
    title: 'none',          // Title slides: no logo
    section: 'none',        // Section dividers: no logo
    content: 'bottom-right',
    grid: 'bottom-right',
    image: 'bottom-right',
    quote: 'bottom-right',
    metric: 'bottom-right',
    blank: 'none',
    layout: 'bottom-right',
  },
};
