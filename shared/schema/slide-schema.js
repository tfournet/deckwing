/**
 * Slide Schema - Rewst Deck Builder
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
export const SLIDE_TYPES = {
  title: {
    required: ['title'],
    optional: ['subtitle', 'author', 'date', 'theme'],
  },
  content: {
    required: ['title', 'points'],
    optional: ['subtitle', 'icon', 'theme'],
  },
  grid: {
    required: ['title', 'items'],
    optional: ['subtitle', 'columns', 'theme'],
  },
  image: {
    required: ['src'],
    optional: ['title', 'caption', 'fit', 'theme'],
  },
  quote: {
    required: ['quote'],
    optional: ['attribution', 'role', 'theme'],
  },
  metric: {
    required: ['metrics'],
    optional: ['title', 'subtitle', 'theme'],
  },
  section: {
    required: ['title'],
    optional: ['subtitle', 'theme'],
  },
  blank: {
    required: [],
    optional: ['theme'],
  },
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
 * Example deck for testing/demo purposes
 */
export const EXAMPLE_DECK = createDeck({
  title: 'Example Presentation',
  author: 'Rewst Team',
  slides: [
    createSlide('title', {
      title: 'Example Presentation',
      subtitle: 'Built with Rewst Deck Builder',
      author: 'Rewst Team',
    }),
    createSlide('content', {
      title: 'Key Features',
      subtitle: 'What makes this special',
      icon: 'Zap',
      points: [
        'AI-powered slide generation from natural language',
        'Rewst brand themes built in',
        'Conversational editing — refine slides by chatting',
        'PDF and PPTX export',
      ],
    }),
    createSlide('grid', {
      title: 'How It Works',
      columns: 3,
      items: [
        { title: 'Describe', description: 'Tell the AI what your presentation is about', icon: 'MessageSquare' },
        { title: 'Refine', description: 'Chat to adjust content, layout, and style', icon: 'Pencil' },
        { title: 'Present', description: 'Export and deliver with confidence', icon: 'Play' },
      ],
    }),
    createSlide('metric', {
      title: 'By the Numbers',
      metrics: [
        { value: '5', label: 'Built-in themes', color: 'text-bot-teal-400' },
        { value: '8', label: 'Slide types', color: 'text-trigger-amber-400' },
        { value: '< 1min', label: 'Time to first deck', color: 'text-alert-coral-400' },
      ],
    }),
    createSlide('quote', {
      quote: 'The best presentations tell stories, not list features.',
      attribution: 'Nancy Duarte',
      role: 'Communication Expert',
    }),
    createSlide('section', {
      title: 'Next Steps',
      subtitle: 'Where we go from here',
      theme: 'highlight',
    }),
  ],
});
