import { describe, it, expect } from 'vitest';
import { themes, getTheme, getThemeNames } from './themes.js';

describe('themes', () => {
  it('defines all 5 brand themes', () => {
    expect(getThemeNames()).toEqual(['rewst', 'dramatic', 'terminal', 'highlight', 'warning']);
  });

  it('each theme has all required property keys', () => {
    const requiredKeys = [
      'name', 'bg', 'cardBg', 'cardBorder',
      'textPrimary', 'textSecondary', 'textMuted',
      'accent', 'accentColor', 'accentBg', 'accentBorder',
      'gradient', 'highlightBg', 'accentGlow',
    ];
    for (const [themeName, theme] of Object.entries(themes)) {
      for (const key of requiredKeys) {
        expect(theme[key], `${themeName}.${key}`).toBeDefined();
        expect(typeof theme[key], `${themeName}.${key}`).toBe('string');
      }
    }
  });

  it('each theme has a hex section with bg, text, and accent fields', () => {
    for (const [themeName, theme] of Object.entries(themes)) {
      expect(theme.hex, `${themeName}.hex`).toBeDefined();
      expect(theme.hex.bg, `${themeName}.hex.bg`).toBeDefined();
      expect(theme.hex.text, `${themeName}.hex.text`).toBeDefined();
      expect(theme.hex.accent, `${themeName}.hex.accent`).toBeDefined();
    }
  });
});

describe('getTheme', () => {
  it('returns the requested theme', () => {
    expect(getTheme('terminal').name).toBe('Terminal');
    expect(getTheme('dramatic').accent).toBe('alert-coral');
  });

  it('falls back to rewst for unknown theme', () => {
    expect(getTheme('nonexistent')).toBe(themes.rewst);
  });

  it('falls back to rewst for undefined', () => {
    expect(getTheme(undefined)).toBe(themes.rewst);
  });
});

describe('getThemeNames', () => {
  it('returns an array of strings', () => {
    const names = getThemeNames();
    expect(names.every(n => typeof n === 'string')).toBe(true);
  });
});
