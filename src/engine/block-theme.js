import { getTheme } from '../config/themes.js';

/**
 * Generate CSS custom properties for block rendering.
 * Block components use these vars instead of Tailwind classes.
 */
export function getBlockThemeVars(themeName, customColors = null) {
  const theme = getTheme(themeName);
  const hex = theme.hex;

  return {
    '--block-bg': customColors?.bg || customColors?.background || hex.bg,
    '--block-card-bg': customColors?.cardBg || hex.cardBg,
    '--block-text': customColors?.text || hex.text,
    '--block-text-muted': customColors?.textMuted || hex.textMuted,
    '--block-accent': customColors?.primary || customColors?.accent || hex.accent,
    '--block-accent-light': customColors?.accentLight || hex.accentLight,
  };
}

export default getBlockThemeVars;
