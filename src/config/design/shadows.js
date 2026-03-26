/**
 * DeckWing Shadow System
 *
 * SAFE TO EDIT — this file defines shadow and glow effects.
 * Shadows add depth. Glows add emphasis to accent elements.
 */

export const shadows = {
  /** No shadow */
  none: 'none',

  /** Subtle shadow — cards, dropdowns */
  sm: '0 1px 2px rgba(0, 0, 0, 0.2)',

  /** Medium shadow — modals, floating panels */
  md: '0 4px 12px rgba(0, 0, 0, 0.3)',

  /** Large shadow — slide preview frame, main panels */
  lg: '0 8px 24px rgba(0, 0, 0, 0.4)',

  /** Extra large — the slide preview in the editor */
  xl: '0 16px 48px rgba(0, 0, 0, 0.5)',
};

/**
 * Glow effects for accent-colored elements
 * Used on bullet dots, active icons, focused buttons
 */
export const glows = {
  teal: '0 0 20px rgba(30, 175, 175, 0.2)',
  coral: '0 0 20px rgba(241, 91, 91, 0.2)',
  amber: '0 0 20px rgba(249, 161, 0, 0.2)',
  emerald: '0 0 20px rgba(16, 185, 129, 0.2)',
};
