/**
 * Centralized Color Palette - Rewst Brand Guidelines
 *
 * Color Usage Distribution:
 * - Bot Teal: 50% (Primary brand color)
 * - Cloud Gray: 20% (Neutral backgrounds)
 * - Ops Indigo: 15% (Dark backgrounds, contrast)
 * - Trigger Amber: 10% (Highlights, CTAs)
 * - Alert Coral: 5% (Warnings, errors)
 */

export const palette = {
  teal: {
    primary: '#1EAFAF',
    light: '#78CFCF',
    lighter: '#A5DFDF',
    dark: '#005655',
    darkest: '#082C2C',
  },
  indigo: {
    primary: '#504384',
    light: '#968EB5',
    lighter: '#BAB3CF',
    dark: '#282242',
    darkest: '#141121',
  },
  amber: {
    primary: '#F9A100',
    light: '#FBC766',
    lighter: '#FDD999',
    dark: '#7D5100',
    darkest: '#3F2900',
  },
  coral: {
    primary: '#F15B5B',
    light: '#F79D9D',
    lighter: '#F9BDBD',
    dark: '#792E2E',
    darkest: '#3C1717',
  },
  gray: {
    primary: '#E6E6E6',
    light: '#F5F5F5',
    dark: '#B3B3B3',
    darker: '#666666',
    darkest: '#333333',
  },
  pure: {
    black: '#000000',
    white: '#FFFFFF',
  },
};

export const semantic = {
  bgDark: palette.indigo.darkest,
  bgDarkAlt: palette.indigo.dark,
  bgMuted: palette.indigo.primary,
  primary: palette.teal.primary,
  primaryLight: palette.teal.light,
  primaryDark: palette.teal.dark,
  highlight: palette.amber.primary,
  highlightLight: palette.amber.light,
  success: palette.teal.primary,
  warning: palette.amber.primary,
  danger: palette.coral.primary,
  info: palette.teal.light,
  neutral: palette.gray.primary,
  neutralDark: palette.gray.darker,
  textPrimary: palette.pure.white,
  textSecondary: palette.gray.primary,
  textMuted: palette.gray.dark,
  textOnTeal: palette.teal.dark,
  textOnAmber: palette.amber.dark,
};

export function getCSSVariables() {
  return {
    '--color-bg-dark': palette.indigo.darkest,
    '--color-bg-dark-alt': palette.indigo.dark,
    '--color-bg-muted': palette.indigo.primary,
    '--color-primary': palette.teal.primary,
    '--color-primary-light': palette.teal.light,
    '--color-primary-dark': palette.teal.dark,
    '--color-highlight': palette.amber.primary,
    '--color-highlight-light': palette.amber.light,
    '--color-warning': palette.amber.primary,
    '--color-danger': palette.coral.primary,
    '--color-success': palette.teal.primary,
    '--color-neutral': palette.gray.primary,
  };
}

export default palette;
