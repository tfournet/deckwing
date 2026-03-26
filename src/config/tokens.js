/**
 * Design Tokens - Rewst Deck Builder
 * Centralized styling constants for UI components
 */

export const COLORS = {
  bg: {
    card: 'bg-slate-900/50',
    cardDark: 'bg-slate-900/80',
    cardHover: 'bg-slate-800/50',
    input: 'bg-slate-800',
    overlay: 'bg-black/30',
  },
  border: {
    default: 'border-slate-700',
    input: 'border-slate-600',
    subtle: 'border-slate-800',
  },
  status: {
    success: { bg: 'bg-green-900/50', text: 'text-green-400', border: 'border-green-500/50' },
    error: { bg: 'bg-red-900/50', text: 'text-red-400', border: 'border-red-500/50' },
    warning: { bg: 'bg-yellow-900/50', text: 'text-yellow-400', border: 'border-yellow-500/50' },
    info: { bg: 'bg-blue-900/50', text: 'text-blue-400', border: 'border-blue-500/50' },
    neutral: { bg: 'bg-slate-800', text: 'text-slate-400', border: 'border-slate-700' },
  },
};

export const TOKENS = {
  card: {
    base: 'bg-slate-900/50 rounded-xl border border-slate-700',
    padded: 'bg-slate-900/50 rounded-xl p-4 border border-slate-700',
    large: 'bg-slate-900/50 rounded-2xl p-6 border border-slate-700',
  },
  badge: {
    base: 'px-2 py-1 rounded text-xs font-bold',
    success: 'px-2 py-1 rounded bg-green-900/50 text-green-400',
    error: 'px-2 py-1 rounded bg-red-900/50 text-red-400',
    warning: 'px-2 py-1 rounded bg-yellow-900/50 text-yellow-400',
    info: 'px-2 py-1 rounded bg-blue-900/50 text-blue-400',
    neutral: 'px-2 py-1 rounded bg-slate-800 text-slate-500',
  },
  input: {
    base: 'bg-slate-800 border border-slate-600 rounded-xl focus:outline-none transition-colors',
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-4 py-4 text-lg',
  },
  button: {
    base: 'rounded-xl font-bold transition-colors flex items-center gap-2',
    primary: 'bg-bot-teal-400 hover:bg-bot-teal-500 text-white',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-white',
    ghost: 'bg-transparent hover:bg-slate-800 text-slate-400',
    disabled: 'bg-slate-700 cursor-not-allowed text-slate-500',
    sm: 'px-3 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  },
  code: {
    inline: 'font-mono text-sm bg-slate-950 px-2 py-1 rounded',
    block: 'font-mono text-sm bg-slate-950 p-4 rounded-lg overflow-x-auto',
  },
  progress: {
    track: 'h-2 bg-slate-800 rounded-full overflow-hidden',
    bar: 'h-full rounded-full transition-all duration-300',
    barTeal: 'bg-bot-teal-400',
    barGreen: 'bg-green-500',
    barAmber: 'bg-trigger-amber-400',
    barCoral: 'bg-alert-coral-400',
  },
  metric: {
    container: 'bg-slate-900/50 rounded-xl p-4 border border-slate-700 text-center',
    value: 'text-3xl font-black',
    label: 'text-slate-400 text-sm',
  },
};

export const ANIMATIONS = {
  fadeIn: 'animate-in fade-in duration-500',
  slideIn: 'animate-in slide-in-from-bottom duration-300',
  pulse: 'animate-pulse',
};

export const SPACING = {
  gap: { xs: 'gap-1', sm: 'gap-2', md: 'gap-4', lg: 'gap-6', xl: 'gap-8' },
  space: { xs: 'space-y-1', sm: 'space-y-2', md: 'space-y-4', lg: 'space-y-6', xl: 'space-y-8' },
};

export function tw(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function getSeverityStyle(severity) {
  const styles = {
    critical: COLORS.status.critical,
    high: COLORS.status.high,
    medium: COLORS.status.medium,
    low: COLORS.status.low,
  };
  return styles[severity?.toLowerCase()] || COLORS.status.neutral;
}

export default { COLORS, TOKENS, ANIMATIONS, SPACING, tw, getSeverityStyle };
