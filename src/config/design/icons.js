/**
 * DeckWing Icon System
 *
 * SAFE TO EDIT — this file defines which icons are available
 * and their default sizes in different contexts.
 *
 * All icons come from Lucide (https://lucide.dev).
 * Use exact icon names — they are case-sensitive.
 */

/**
 * Icons available for use in slides.
 * Organized by category for easy browsing.
 * The AI system prompt references these too.
 */
export const slideIcons = {
  general: [
    'Zap', 'Star', 'Shield', 'Lock', 'Check', 'X',
    'AlertTriangle', 'Info', 'HelpCircle',
  ],
  navigation: [
    'ChevronRight', 'ArrowRight', 'ArrowLeft',
    'Home', 'ExternalLink',
  ],
  people: [
    'User', 'Users', 'UserCheck', 'Building', 'Building2',
  ],
  tech: [
    'Code', 'Terminal', 'Server', 'Database', 'Cloud',
    'Wifi', 'Cpu', 'HardDrive', 'Monitor', 'MonitorSmartphone',
  ],
  automation: [
    'Workflow', 'Bot', 'Cog', 'Settings', 'Repeat',
    'RefreshCw', 'Layers', 'GitBranch',
  ],
  business: [
    'BarChart', 'TrendingUp', 'DollarSign', 'CreditCard',
    'Package', 'Briefcase', 'FileText', 'Mail', 'Target',
    'Sparkles',
  ],
  time: [
    'Clock', 'Calendar', 'Timer', 'Hourglass',
  ],
  communication: [
    'MessageSquare', 'Phone', 'Video', 'Headphones', 'Bell',
  ],
  actions: [
    'Play', 'Pause', 'Plus', 'Minus', 'Edit', 'Trash2',
    'Download', 'Upload', 'Search', 'Filter',
  ],
  links: [
    'Link', 'Link2', 'Unlink', 'Share2', 'Network',
  ],
};

/** All available icons as a flat array */
export const allIcons = Object.values(slideIcons).flat();

/**
 * Default icon sizes for different contexts
 */
export const iconSizes = {
  /** Icons in slide content (next to headings) */
  slideContent: 56,

  /** Icons in grid cards */
  gridCard: 40,

  /** Icons in the app UI (buttons, menus) */
  uiSmall: 14,
  uiMedium: 16,
  uiLarge: 18,
};
