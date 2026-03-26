/**
 * DeckWing Color Palette
 *
 * SAFE TO EDIT — this file defines all colors used in the app.
 * Change hex values here to update colors everywhere.
 *
 * Usage guide:
 * - Bot Teal: primary brand color, buttons, accents (50% of palette)
 * - Ops Indigo: dark backgrounds, depth (15%)
 * - Trigger Amber: highlights, calls to action (10%)
 * - Alert Coral: errors, warnings, destructive actions (5%)
 * - Cloud Gray: neutral text, borders, subtle backgrounds (20%)
 */

export const palette = {
  teal: {
    primary: '#1EAFAF',   // Bot Teal — the main Rewst brand color
    light: '#78CFCF',     // Lighter teal for hover states
    lighter: '#A5DFDF',   // Very light teal for subtle highlights
    dark: '#005655',      // Dark teal for text on teal backgrounds
    darkest: '#082C2C',   // Very dark teal for deep backgrounds
  },

  indigo: {
    primary: '#504384',   // Ops Indigo — the secondary brand color
    light: '#968EB5',     // Light indigo for subtle accents
    lighter: '#BAB3CF',   // Very light indigo
    dark: '#282242',      // Dark indigo for card backgrounds
    darkest: '#141121',   // Darkest indigo — main app background
  },

  amber: {
    primary: '#F9A100',   // Trigger Amber — highlights and CTAs
    light: '#FBC766',     // Light amber for hover states
    lighter: '#FDD999',   // Very light amber
    dark: '#7D5100',      // Dark amber for text on amber backgrounds
    darkest: '#3F2900',   // Very dark amber
  },

  coral: {
    primary: '#F15B5B',   // Alert Coral — errors and warnings
    light: '#F79D9D',     // Light coral for hover states
    lighter: '#F9BDBD',   // Very light coral
    dark: '#792E2E',      // Dark coral
    darkest: '#3C1717',   // Very dark coral
  },

  gray: {
    primary: '#E6E6E6',   // Cloud Gray — neutral color
    light: '#F5F5F5',     // Light gray for subtle backgrounds
    dark: '#B3B3B3',      // Medium gray for muted text
    darker: '#666666',    // Darker gray for secondary text
    darkest: '#333333',   // Very dark gray
  },

  pure: {
    black: '#000000',
    white: '#FFFFFF',
  },
};
