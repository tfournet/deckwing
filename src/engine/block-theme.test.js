import { describe, expect, it } from 'vitest';
import { getThemeNames, themes } from '../config/themes.js';
import { getBlockThemeVars } from './block-theme.js';

describe('getBlockThemeVars', () => {
  it('returns all expected CSS variables for the default theme', () => {
    expect(getBlockThemeVars('rewst')).toEqual({
      '--block-bg': themes.rewst.hex.bg,
      '--block-card-bg': themes.rewst.hex.cardBg,
      '--block-text': themes.rewst.hex.text,
      '--block-text-muted': themes.rewst.hex.textMuted,
      '--block-accent': themes.rewst.hex.accent,
      '--block-accent-light': themes.rewst.hex.accentLight,
    });
  });

  it('uses theme defaults when customColors is null', () => {
    expect(getBlockThemeVars('dramatic', null)).toEqual({
      '--block-bg': themes.dramatic.hex.bg,
      '--block-card-bg': themes.dramatic.hex.cardBg,
      '--block-text': themes.dramatic.hex.text,
      '--block-text-muted': themes.dramatic.hex.textMuted,
      '--block-accent': themes.dramatic.hex.accent,
      '--block-accent-light': themes.dramatic.hex.accentLight,
    });
  });

  it('uses theme defaults when customColors is undefined', () => {
    expect(getBlockThemeVars('dramatic', undefined)).toEqual({
      '--block-bg': themes.dramatic.hex.bg,
      '--block-card-bg': themes.dramatic.hex.cardBg,
      '--block-text': themes.dramatic.hex.text,
      '--block-text-muted': themes.dramatic.hex.textMuted,
      '--block-accent': themes.dramatic.hex.accent,
      '--block-accent-light': themes.dramatic.hex.accentLight,
    });
  });

  it('overrides only --block-accent when customColors.primary is provided', () => {
    const vars = getBlockThemeVars('dramatic', {
      primary: '#FFE066',
    });

    expect(vars).toEqual({
      '--block-bg': themes.dramatic.hex.bg,
      '--block-card-bg': themes.dramatic.hex.cardBg,
      '--block-text': themes.dramatic.hex.text,
      '--block-text-muted': themes.dramatic.hex.textMuted,
      '--block-accent': '#FFE066',
      '--block-accent-light': themes.dramatic.hex.accentLight,
    });
  });

  it('overrides only --block-bg when customColors.bg is provided', () => {
    const vars = getBlockThemeVars('dramatic', {
      bg: '#101820',
    });

    expect(vars).toEqual({
      '--block-bg': '#101820',
      '--block-card-bg': themes.dramatic.hex.cardBg,
      '--block-text': themes.dramatic.hex.text,
      '--block-text-muted': themes.dramatic.hex.textMuted,
      '--block-accent': themes.dramatic.hex.accent,
      '--block-accent-light': themes.dramatic.hex.accentLight,
    });
  });

  it('overrides both --block-accent and --block-bg when both colors are provided', () => {
    const vars = getBlockThemeVars('dramatic', {
      bg: '#101820',
      primary: '#FFE066',
    });

    expect(vars).toEqual({
      '--block-bg': '#101820',
      '--block-card-bg': themes.dramatic.hex.cardBg,
      '--block-text': themes.dramatic.hex.text,
      '--block-text-muted': themes.dramatic.hex.textMuted,
      '--block-accent': '#FFE066',
      '--block-accent-light': themes.dramatic.hex.accentLight,
    });
  });

  it('each theme produces defined hex values', () => {
    const hexPattern = /^#[0-9A-F]{6}$/i;

    for (const themeName of getThemeNames()) {
      const vars = getBlockThemeVars(themeName);

      for (const [name, value] of Object.entries(vars)) {
        expect(value, `${themeName}.${name}`).toBeDefined();
        expect(value, `${themeName}.${name}`).toMatch(hexPattern);
      }
    }
  });
});
