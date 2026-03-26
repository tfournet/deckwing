import { getLayout } from '../layouts/index.js';

function preserveSlideMetadata(slide) {
  const preserved = {};

  for (const key of ['id', 'theme', 'notes']) {
    if (key in slide) {
      preserved[key] = slide[key];
    }
  }

  return preserved;
}

function createLayoutSlide(slide, layout, blocks) {
  return {
    ...preserveSlideMetadata(slide),
    type: 'layout',
    layout,
    blocks,
  };
}

function buildTitleBodyText(slide) {
  let text = slide.subtitle || '';

  if (slide.author) {
    text += text ? ` — ${slide.author}` : slide.author;
  }

  if (slide.date) {
    text += text ? `, ${slide.date}` : slide.date;
  }

  return text || null;
}

function buildGridItemText(item = {}) {
  if (item.title && item.description) {
    return `${item.title}: ${item.description}`;
  }

  return item.title || item.description || '';
}

export const PRESET_EXPANDERS = {
  title(slide) {
    const blocks = [
      { slot: 'title', kind: 'heading', size: 'xl', text: slide.title },
    ];

    const bodyText = buildTitleBodyText(slide);
    if (bodyText) {
      blocks.push({ slot: 'body', kind: 'text', text: bodyText });
    }

    return createLayoutSlide(slide, 'single-center', blocks);
  },

  content(slide) {
    return createLayoutSlide(slide, 'single-center', [
      { slot: 'title', kind: 'heading', size: 'lg', text: slide.title },
      { slot: 'body', kind: 'list', items: slide.points },
    ]);
  },

  grid(slide) {
    const itemCount = Array.isArray(slide.items) ? slide.items.length : 0;

    if (itemCount === 0 || itemCount > 6) {
      return slide;
    }

    const layoutId = itemCount <= 4 ? 'feature-grid-2x2' : 'feature-grid-2x3';
    const layoutDef = getLayout(layoutId);
    if (!layoutDef) {
      return slide;
    }

    // Grid preset expansion is coupled to the layout's `card*` slot naming.
    // Pull the actual slot list from the layout definition so the expander stays
    // aligned if those names ever change.
    const cardSlots = layoutDef.slots.filter((slot) => slot.name.startsWith('card'));
    if (cardSlots.length < itemCount) {
      return slide;
    }
    const cardBlocks = slide.items.slice(0, cardSlots.length).map((item, index) => ({
      slot: cardSlots[index].name,
      kind: 'text',
      text: buildGridItemText(item),
    }));

    return createLayoutSlide(slide, layoutId, [
      { slot: 'title', kind: 'heading', text: slide.title },
      ...cardBlocks,
    ]);
  },

  metric(slide) {
    const metrics = Array.isArray(slide.metrics) ? slide.metrics.slice(0, 4) : [];
    if (metrics.length === 0) {
      return slide;
    }

    const layoutIdByCount = {
      1: 'single-center',
      2: 'two-column',
      3: 'three-column',
      4: 'four-column',
    };
    const layoutId = layoutIdByCount[metrics.length] || 'four-column';
    const layoutDef = getLayout(layoutId);
    if (!layoutDef) {
      return slide;
    }

    const metricSlots = layoutDef.slots.filter(
      (slot) => slot.name !== 'title' && slot.kinds?.includes('metric'),
    );
    if (metricSlots.length < metrics.length) {
      return slide;
    }

    return createLayoutSlide(slide, layoutId, [
      { slot: 'title', kind: 'heading', text: slide.title || '' },
      ...metrics.map((metric, index) => ({
        slot: metricSlots[index]?.name,
        kind: 'metric',
        value: metric.value,
        label: metric.label,
        ...(metric.color ? { color: metric.color } : {}),
      })),
    ]);
  },

  quote(slide) {
    return createLayoutSlide(slide, 'single-center', [
      { slot: 'title', kind: 'heading', text: '' },
      {
        slot: 'body',
        kind: 'quote',
        text: slide.quote,
        ...(slide.attribution ? { attribution: slide.attribution } : {}),
        ...(slide.role ? { role: slide.role } : {}),
      },
    ]);
  },

  section(slide) {
    const blocks = [
      { slot: 'title', kind: 'heading', size: 'xl', text: slide.title },
    ];

    if (slide.subtitle) {
      blocks.push({ slot: 'body', kind: 'text', text: slide.subtitle });
    }

    return createLayoutSlide(slide, 'single-center', blocks);
  },

  image(slide) {
    return createLayoutSlide(slide, 'single-center', [
      { slot: 'title', kind: 'heading', text: slide.title || '' },
      {
        slot: 'body',
        kind: 'image',
        src: slide.src,
        ...(slide.fit ? { fit: slide.fit } : {}),
        ...(slide.caption ? { alt: slide.caption } : {}),
      },
    ]);
  },
};

export function expandPresetToLayout(slide) {
  const expander = slide?.type ? PRESET_EXPANDERS[slide.type] : null;
  return expander ? expander(slide) : slide;
}
