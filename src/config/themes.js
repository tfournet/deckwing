/**
 * Theme Configuration - DeckWing
 *
 * Rewst brand themes with consistent dark foundation.
 * Each theme provides a complete set of Tailwind utility classes
 * for backgrounds, text, accents, and effects.
 */

import { palette } from './colors.js';

export const themes = {
  rewst: {
    name: 'Rewst',
    bg: 'bg-ops-indigo-900',
    cardBg: 'bg-ops-indigo-800/80',
    cardBorder: 'border-ops-indigo-600/50',
    textOnPage: 'text-white',
    textOnPageMuted: 'text-cloud-gray-400',
    textPrimary: 'text-white',
    textSecondary: 'text-cloud-gray-200',
    textMuted: 'text-cloud-gray-400',
    accent: 'bot-teal',
    accentColor: 'text-bot-teal-400',
    accentColorOnDark: 'text-bot-teal-400',
    accentBg: 'bg-bot-teal-400',
    accentBorder: 'border-bot-teal-400/60',
    gradient: 'from-ops-indigo-900 via-ops-indigo-800 to-ops-indigo-900',
    highlightBg: 'bg-bot-teal-400/10',
    accentGlow: 'shadow-bot-teal-400/20',
    hex: {
      bg: palette.indigo.darkest,
      cardBg: palette.indigo.dark,
      text: palette.pure.white,
      textMuted: palette.gray.dark,
      accent: palette.teal.primary,
      accentLight: palette.teal.light,
    },
  },

  dramatic: {
    name: 'Dramatic',
    bg: 'bg-ops-indigo-900',
    cardBg: 'bg-ops-indigo-800/80',
    cardBorder: 'border-alert-coral-700/50',
    textOnPage: 'text-white',
    textOnPageMuted: 'text-cloud-gray-400',
    textPrimary: 'text-white',
    textSecondary: 'text-cloud-gray-200',
    textMuted: 'text-cloud-gray-400',
    accent: 'alert-coral',
    accentColor: 'text-alert-coral-400',
    accentColorOnDark: 'text-alert-coral-400',
    accentBg: 'bg-alert-coral-400',
    accentBorder: 'border-alert-coral-400/60',
    gradient: 'from-ops-indigo-900 via-alert-coral-900/20 to-ops-indigo-900',
    highlightBg: 'bg-alert-coral-400/10',
    accentGlow: 'shadow-alert-coral-400/20',
    hex: {
      bg: palette.indigo.darkest,
      cardBg: palette.indigo.dark,
      text: palette.pure.white,
      textMuted: palette.gray.dark,
      accent: palette.coral.primary,
      accentLight: palette.coral.light,
    },
  },

  terminal: {
    name: 'Terminal',
    bg: 'bg-black',
    cardBg: 'bg-ops-indigo-950/90',
    cardBorder: 'border-emerald-900/50',
    textOnPage: 'text-emerald-400',
    textOnPageMuted: 'text-emerald-600',
    textPrimary: 'text-emerald-400',
    textSecondary: 'text-emerald-300',
    textMuted: 'text-emerald-600',
    accent: 'emerald',
    accentColor: 'text-emerald-400',
    accentColorOnDark: 'text-emerald-400',
    accentBg: 'bg-emerald-600',
    accentBorder: 'border-emerald-500/60',
    gradient: 'from-black via-emerald-950/10 to-black',
    highlightBg: 'bg-emerald-500/10',
    accentGlow: 'shadow-emerald-500/20',
    hex: {
      bg: palette.pure.black,
      cardBg: palette.indigo.darkest,
      text: '#10B981',
      textMuted: '#059669',
      accent: '#10B981',
      accentLight: '#34D399',
    },
  },

  highlight: {
    name: 'Highlight',
    bg: 'bg-ops-indigo-900',
    cardBg: 'bg-ops-indigo-800/80',
    cardBorder: 'border-ops-indigo-600/50',
    textOnPage: 'text-white',
    textOnPageMuted: 'text-cloud-gray-400',
    textPrimary: 'text-white',
    textSecondary: 'text-cloud-gray-200',
    textMuted: 'text-cloud-gray-400',
    accent: 'bot-teal',
    accentColor: 'text-bot-teal-200',
    accentColorOnDark: 'text-bot-teal-200',
    accentBg: 'bg-bot-teal-400',
    accentBorder: 'border-bot-teal-200/60',
    gradient: 'from-ops-indigo-900 via-bot-teal-900/20 to-ops-indigo-900',
    highlightBg: 'bg-bot-teal-200/10',
    accentGlow: 'shadow-bot-teal-200/20',
    hex: {
      bg: palette.indigo.darkest,
      cardBg: palette.indigo.dark,
      text: palette.pure.white,
      textMuted: palette.gray.dark,
      accent: palette.teal.light,
      accentLight: palette.teal.lighter,
    },
  },

  warning: {
    name: 'Warning',
    bg: 'bg-ops-indigo-900',
    cardBg: 'bg-ops-indigo-800/80',
    cardBorder: 'border-trigger-amber-700/50',
    textOnPage: 'text-white',
    textOnPageMuted: 'text-cloud-gray-400',
    textPrimary: 'text-white',
    textSecondary: 'text-cloud-gray-200',
    textMuted: 'text-cloud-gray-400',
    accent: 'trigger-amber',
    accentColor: 'text-trigger-amber-400',
    accentColorOnDark: 'text-trigger-amber-400',
    accentBg: 'bg-trigger-amber-400',
    accentBorder: 'border-trigger-amber-400/60',
    gradient: 'from-ops-indigo-900 via-trigger-amber-900/20 to-ops-indigo-900',
    highlightBg: 'bg-trigger-amber-400/10',
    accentGlow: 'shadow-trigger-amber-400/20',
    hex: {
      bg: palette.indigo.darkest,
      cardBg: palette.indigo.dark,
      text: palette.pure.white,
      textMuted: palette.gray.dark,
      accent: palette.amber.primary,
      accentLight: palette.amber.light,
    },
  },
};

export function getTheme(themeName) {
  return themes[themeName] || themes.rewst;
}

export function getThemeNames() {
  return Object.keys(themes);
}

export default themes;
