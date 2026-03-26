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

  it('overrides accent and bg when customColors are provided', () => {
    const vars = getBlockThemeVars('dramatic', {
      bg: '#101820',
      primary: '#FFE066',
    });

    expect(vars['--block-bg']).toBe('#101820');
    expect(vars['--block-accent']).toBe('#FFE066');
    expect(vars['--block-text']).toBe(themes.dramatic.hex.text);
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
