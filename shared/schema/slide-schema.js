import { validateLayoutSlide } from '../layouts/index.js';

/**
 * Slide Schema - DeckWing
 *
 * This defines the data model for presentation slides.
 * AI generates JSON conforming to this schema.
 * The renderer maps schema objects to React components.
 *
 * Each slide has a `type` that determines its layout and required fields.
 */

/**
 * Supported slide types and their required/optional fields.
 *
 * title:    Hero slide with big text
 * content:  Icon + heading + bullet points
 * grid:     Multi-column card layout
 * image:    Full-slide image with optional caption
 * quote:    Large quote with attribution
 * metric:   Stats/numbers display
 * section:  Section divider between topics
 * blank:    Empty slide for custom content
 */
export const CURRENT_SCHEMA_VERSION = 2;

/**
 * Logo position options:
 *   'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'none'
 *   Default: 'bottom-right' (set in SlideFrame renderer)
 *   Title and section slides default to 'none'
 */

export const SLIDE_TYPES = {
  title: {
    required: ['title'],
    optional: ['subtitle', 'author', 'date', 'theme', 'logo'],
  },
  content: {
    required: ['title', 'points'],
    optional: ['subtitle', 'icon', 'theme', 'logo'],
  },
  grid: {
    required: ['title', 'items'],
    optional: ['subtitle', 'columns', 'theme', 'logo'],
  },
  image: {
    required: ['src'],
    optional: ['title', 'caption', 'fit', 'theme', 'logo'],
  },
  quote: {
    required: ['quote'],
    optional: ['attribution', 'role', 'theme', 'logo'],
  },
  metric: {
    required: ['metrics'],
    optional: ['title', 'subtitle', 'theme', 'logo'],
  },
  section: {
    required: ['title'],
    optional: ['subtitle', 'theme', 'logo'],
  },
  blank: {
    required: [],
    optional: ['theme', 'logo'],
  },
  layout: {
    required: ['layout', 'blocks'],
    optional: ['slots', 'customColors', 'theme', 'notes'],
  },
};

export const BLOCK_KINDS = {
  heading: { required: ['text'], optional: ['size'] },
  text: { required: ['text'], optional: ['style'] },
  list: { required: ['items'], optional: ['style'] },
  metric: { required: ['value', 'label'], optional: ['color'] },
  chart: { required: ['type', 'data'], optional: [] },
  table: { required: ['headers', 'rows'], optional: [] },
  image: { required: ['src'], optional: ['fit', 'alt'] },
  icon: { required: ['name'], optional: ['size'] },
  quote: { required: ['text'], optional: ['attribution', 'role'] },
  callout: { required: ['text'], optional: ['variant'] },
  divider: { required: [], optional: ['direction'] },
  spacer: { required: [], optional: [] },
};

/**
 * Create a new slide with defaults
 * @param {string} type - Slide type from SLIDE_TYPES
 * @param {object} data - Slide content fields
 * @returns {object} Complete slide object
 */
export function createSlide(type, data = {}) {
  if (!SLIDE_TYPES[type]) {
    throw new Error(`Unknown slide type: ${type}. Valid types: ${Object.keys(SLIDE_TYPES).join(', ')}`);
  }

  return {
    id: data.id || generateId(),
    type,
    theme: 'rewst',
    notes: '',
    ...data,
  };
}

/**
 * Create a new empty deck
 * @param {object} metadata - Deck metadata
 * @returns {object} Complete deck object
 */
export function createDeck(metadata = {}) {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    schemaVersion: CURRENT_SCHEMA_VERSION,
    title: metadata.title || 'Untitled Presentation',
    author: metadata.author || '',
    createdAt: now,
    updatedAt: now,
    defaultTheme: metadata.theme || 'rewst',
    slides: metadata.slides || [
      createSlide('title', { title: metadata.title || 'Untitled Presentation' }),
    ],
  };
}

/**
 * Migrate old decks to the current schema version
 * @param {object} deck - Deck to migrate
 * @returns {object} Migrated deck object
 */
export function migrateDeck(deck) {
  const version = deck.schemaVersion || 1;
  let migrated = {
    ...deck,
    slides: Array.isArray(deck.slides) ? deck.slides.map(slide => ({ ...slide })) : deck.slides,
  };

  if (version < 2) {
    migrated.schemaVersion = 2;
  }

  return migrated;
}

/**
 * Validate a slide against its type schema
 * @param {object} slide - Slide to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateSlide(slide) {
  const errors = [];

  if (!slide.type) {
    errors.push('Slide missing required field: type');
    return { valid: false, errors };
  }

  if (slide.type === 'layout') {
    return validateLayoutSlide(slide);
  }

  const schema = SLIDE_TYPES[slide.type];
  if (!schema) {
    errors.push(`Unknown slide type: ${slide.type}`);
    return { valid: false, errors };
  }

  for (const field of schema.required) {
    if (slide[field] === undefined || slide[field] === null) {
      errors.push(`Slide type "${slide.type}" missing required field: ${field}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a block against its kind schema
 * @param {object} block - Block to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateBlock(block) {
  const errors = [];

  if (!block.kind) {
    errors.push('Block missing required field: kind');
    return { valid: false, errors };
  }

  const schema = BLOCK_KINDS[block.kind];
  if (!schema) {
    errors.push(`Unknown block kind: ${block.kind}`);
    return { valid: false, errors };
  }

  for (const field of schema.required) {
    if (block[field] === undefined || block[field] === null) {
      errors.push(`Block kind "${block.kind}" missing required field: ${field}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate an entire deck
 * @param {object} deck
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateDeck(deck) {
  const errors = [];

  if (!deck.slides || !Array.isArray(deck.slides)) {
    errors.push('Deck must have a slides array');
    return { valid: false, errors };
  }

  if (deck.slides.length === 0) {
    errors.push('Deck must have at least one slide');
  }

  deck.slides.forEach((slide, i) => {
    const result = validateSlide(slide);
    result.errors.forEach(e => errors.push(`Slide ${i + 1}: ${e}`));
  });

  return { valid: errors.length === 0, errors };
}

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

/**
 * Example deck — models good presentation practices.
 * Every slide follows DeckWing's content rules:
 * - No buzzwords, no triplet bullets, no em-dashes
 * - Educational tone, not sales pitch
 * - Concept ownership (each idea introduced once)
 * - Speaker notes with transition/core/landing structure
 */
export const EXAMPLE_DECK = createDeck({
  title: 'Why MSPs Lose Money on Manual Processes',
  author: 'Rewst Team',
  slides: [
    createSlide('title', {
      title: 'Why MSPs Lose Money on Manual Processes',
      subtitle: 'And what the top 10% do differently',
      author: 'Rewst Team',
      notes: 'Open with the question: how many hours did your team spend on repetitive tasks last week? Let them think about it before advancing.',
    }),
    createSlide('content', {
      title: 'The Hidden Cost of Manual Work',
      icon: 'Clock',
      points: [
        'The average MSP technician spends 37% of their week on tasks that follow a script',
        'User onboarding alone takes 3-5 hours per new hire across 6-8 tools',
        'Each manual touchpoint is a chance for inconsistency or error',
        'The labor cost compounds: $67/hr blended rate times thousands of repetitions per year',
      ],
      notes: 'Transition: We all know manual work is a problem. But most MSPs underestimate the real number.\n\nCore: Walk through each point. Pause on the $67/hr figure. Ask if that matches their experience.\n\nLanding: The cost is not any single task. It is the volume of repetitions across your entire client base.',
    }),
    createSlide('metric', {
      title: 'What the Data Shows',
      metrics: [
        { value: '37%', label: 'Technician time on scriptable tasks', color: 'text-alert-coral-400' },
        { value: '$281', label: 'Average labor cost per user onboarding', color: 'text-trigger-amber-400' },
        { value: '4.2x', label: 'ROI in first year of automation', color: 'text-bot-teal-400' },
      ],
      notes: 'Transition: Let me put concrete numbers on this.\n\nCore: These come from aggregated data across Rewst customers. The 37% is self-reported time tracking. The $281 is calculated from blended rates and average task duration. The 4.2x ROI is measured at 12 months.\n\nLanding: The 37% is the number that should bother you. That is more than a third of your payroll going to work a script could do.',
    }),
    createSlide('grid', {
      title: 'Where Automation Pays Off First',
      subtitle: 'Three workflows with the fastest ROI',
      columns: 3,
      items: [
        { title: 'User Onboarding', description: 'M365 account creation, security groups, PSA ticket updates, and welcome email in under 20 minutes', icon: 'UserCheck' },
        { title: 'Ticket Triage', description: 'Categorize, prioritize, and route incoming tickets based on content and client SLA', icon: 'Filter' },
        { title: 'Password Resets', description: 'Verify identity, reset in Active Directory, update the ticket, and notify the user', icon: 'Lock' },
      ],
      notes: 'Transition: So where do you start? These three workflows have the fastest payback.\n\nCore: Each of these happens dozens of times per week at most MSPs. They follow a predictable script. And they touch multiple tools that can be connected.\n\nLanding: Start with onboarding. It has the most steps, the most tools, and the highest labor cost per execution.',
    }),
    createSlide('quote', {
      quote: 'We onboard new client users in 18 minutes now. It used to take half a day.',
      attribution: 'Alex Rivera',
      role: 'Operations Lead, Stackline MSP',
      theme: 'dramatic',
      notes: 'Transition: This is not theory. Here is what it looks like in practice.\n\nCore: Stackline is a 40-person MSP managing 3,200 endpoints. They automated onboarding first, then expanded to offboarding and ticket triage.\n\nLanding: Half a day to 18 minutes. That is not incremental improvement. That is a different operating model.',
    }),
    createSlide('section', {
      title: 'Getting Started',
      subtitle: 'The 30-day path from manual to automated',
      theme: 'highlight',
      notes: 'Transition: You do not have to automate everything at once. Here is a realistic timeline.',
    }),
  ],
});
