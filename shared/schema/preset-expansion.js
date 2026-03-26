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

    const layout = itemCount <= 4 ? 'feature-grid-2x2' : 'feature-grid-2x3';
    const cardBlocks = slide.items.map((item, index) => ({
      slot: `card${index + 1}`,
      kind: 'text',
      text: buildGridItemText(item),
    }));

    return createLayoutSlide(slide, layout, [
      { slot: 'title', kind: 'heading', text: slide.title },
      ...cardBlocks,
    ]);
  },

  metric(slide) {
    const metrics = Array.isArray(slide.metrics) ? slide.metrics.slice(0, 4) : [];

    return createLayoutSlide(slide, 'four-column', [
      { slot: 'title', kind: 'heading', text: slide.title || '' },
      ...metrics.map((metric, index) => ({
        slot: `m${index + 1}`,
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
