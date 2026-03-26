/**
 * DeckWing Border & Shape System
 *
 * SAFE TO EDIT — this file defines border radii, widths, and shapes.
 * Change values here to make things rounder, sharper, thicker, etc.
 */

export const borderRadius = {
  /** Small elements — badges, chips, small buttons */
  sm: '4px',

  /** Standard — buttons, inputs, dropdowns */
  default: '6px',

  /** Cards, panels, editor sections */
  lg: '8px',

  /** Large cards, modals, slide preview frame */
  xl: '12px',

  /** Fully round — avatar circles, dot indicators */
  full: '9999px',
};

export const borderWidth = {
  /** Default border — most elements */
  default: '1px',

  /** Thick border — active/selected states */
  thick: '2px',

  /** Divider lines */
  divider: '1px',
};

/**
 * Opacity values for borders
 * Borders on dark backgrounds use opacity to stay subtle
 */
export const borderOpacity = {
  /** Subtle border — barely visible, structural */
  subtle: '30%',

  /** Default border — visible but not prominent */
  default: '50%',

  /** Active/focused border — clearly visible */
  active: '60%',
};
