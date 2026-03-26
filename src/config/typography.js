/**
 * Typography Configuration - Rewst Brand
 *
 * Goldplay: Titles, Buttons, Links
 * Montserrat: Body text, paragraphs
 */

export const FONTS = {
  display: "'Goldplay', 'Montserrat', system-ui, sans-serif",
  sans: "'Montserrat', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
};

export const FONT_CLASSES = {
  display: 'font-display',
  sans: 'font-sans',
  mono: 'font-mono',
};

export const SIZES = {
  h1: 'text-[clamp(3rem,8vw,7rem)]',
  h2: 'text-[clamp(2rem,5vw,4rem)]',
  h3: 'text-[clamp(1.5rem,3vw,2.5rem)]',
  body: 'text-[clamp(1.25rem,2vw,1.75rem)]',
  bodyLg: 'text-xl',
  bodySm: 'text-base',
  code: 'text-sm',
  badge: 'text-xs',
  label: 'text-sm',
};

export const WEIGHTS = {
  light: 'font-light',
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
  black: 'font-black',
};

export const TEXT_STYLES = {
  heading1: 'font-display font-black text-[clamp(3rem,8vw,7rem)] leading-tight tracking-normal',
  heading2: 'font-display font-bold text-[clamp(2rem,5vw,4rem)] leading-snug tracking-normal',
  heading3: 'font-display font-bold text-[clamp(1.5rem,3vw,2.5rem)] leading-normal tracking-normal',
  subtitle: 'font-sans font-black text-xl leading-relaxed tracking-wide uppercase',
  body: 'font-sans text-[clamp(1.25rem,2vw,1.75rem)] leading-relaxed',
  bodyLight: 'font-sans font-light text-[clamp(1.25rem,2vw,1.75rem)] leading-relaxed',
  label: 'font-sans text-sm font-medium text-cloud-gray-400',
  badge: 'font-display text-xs font-bold uppercase',
  stat: 'font-display text-3xl font-black',
  button: 'font-display font-bold rounded-full px-6 py-2',
  link: 'font-display font-bold text-bot-teal-400 hover:text-bot-teal-300 underline underline-offset-2',
};

export const DESIGN_RULES = {
  buttonRadius: 'rounded-full',
  cardRadius: 'rounded-xl',
  modalRadius: 'rounded-2xl',
};

export default { FONTS, FONT_CLASSES, SIZES, WEIGHTS, TEXT_STYLES, DESIGN_RULES };
