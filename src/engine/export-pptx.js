import PptxGenJS from 'pptxgenjs';
import { THEME_COLORS } from '../../shared/theme-colors.js';

export { THEME_COLORS };

const PPTX_LAYOUT = {
  name: 'DECKWING_WIDE',
  width: 13.333,
  height: 7.5,
};

const SLIDE_SIZE = {
  width: PPTX_LAYOUT.width,
  height: PPTX_LAYOUT.height,
};

const MARGINS = {
  left: 0.75,
  right: 0.75,
  top: 0.55,
  bottom: 0.55,
};

function resolveTheme(slideTheme, defaultTheme) {
  if (slideTheme && THEME_COLORS[slideTheme]) {
    return THEME_COLORS[slideTheme];
  }

  if (defaultTheme && THEME_COLORS[defaultTheme]) {
    return THEME_COLORS[defaultTheme];
  }

  return THEME_COLORS.rewst;
}

function normalizeHexColor(color, fallback) {
  if (typeof color !== 'string') {
    return fallback;
  }

  const normalized = color.replace('#', '').trim();
  return /^[0-9A-Fa-f]{6}$/.test(normalized) ? normalized.toUpperCase() : fallback;
}

function applyTheme(slide, theme) {
  slide.background = { color: theme.bg };
  slide.color = theme.text;
}

function addTitleText(slide, text, options = {}) {
  if (text === undefined || text === null || text === '') {
    return;
  }

  slide.addText(String(text), {
    x: MARGINS.left,
    y: MARGINS.top,
    w: SLIDE_SIZE.width - MARGINS.left - MARGINS.right,
    h: 0.7,
    fontFace: 'Arial',
    fontSize: 24,
    bold: true,
    color: options.color,
    align: options.align ?? 'left',
    italic: options.italic ?? false,
    valign: options.valign,
    margin: 0,
    ...options,
  });
}

function addBodyText(slide, text, options = {}) {
  if (text === undefined || text === null || text === '') {
    return;
  }

  slide.addText(String(text), {
    fontFace: 'Arial',
    fontSize: 16,
    color: options.color,
    margin: 0,
    ...options,
  });
}

function renderTitleSlide(slide, slideData, theme) {
  addBodyText(slide, slideData.title, {
    x: 1.15,
    y: 2.0,
    w: 11.05,
    h: 1.0,
    fontSize: 26,
    bold: true,
    color: theme.accent,
    align: 'center',
    valign: 'mid',
  });

  addBodyText(slide, slideData.subtitle, {
    x: 1.6,
    y: 3.05,
    w: 10.15,
    h: 0.7,
    fontSize: 16,
    color: theme.text,
    align: 'center',
  });

  const footerParts = [slideData.author, slideData.date].filter(Boolean);
  if (footerParts.length > 0) {
    addBodyText(slide, footerParts.join(' • '), {
      x: 1.0,
      y: 6.65,
      w: 11.35,
      h: 0.3,
      fontSize: 10,
      color: theme.text,
      align: 'center',
    });
  }
}

function renderContentSlide(slide, slideData, theme) {
  addTitleText(slide, slideData.title, { color: theme.accent });

  addBodyText(slide, slideData.subtitle, {
    x: MARGINS.left,
    y: 1.3,
    w: SLIDE_SIZE.width - MARGINS.left - MARGINS.right,
    h: 0.4,
    fontSize: 12,
    color: theme.text,
  });

  const points = Array.isArray(slideData.points) ? slideData.points : [];
  const startY = slideData.subtitle ? 2.0 : 1.65;

  points.forEach((point, index) => {
    addBodyText(slide, point, {
      x: 1.0,
      y: startY + (index * 0.58),
      w: 11.3,
      h: 0.38,
      fontSize: 18,
      color: theme.text,
      bullet: true,
      breakLine: true,
    });
  });
}

function renderGridSlide(slide, slideData, theme) {
  addTitleText(slide, slideData.title, { color: theme.accent });

  addBodyText(slide, slideData.subtitle, {
    x: MARGINS.left,
    y: 1.25,
    w: SLIDE_SIZE.width - MARGINS.left - MARGINS.right,
    h: 0.35,
    fontSize: 11,
    color: theme.text,
  });

  const items = Array.isArray(slideData.items) ? slideData.items : [];
  const columns = Math.max(1, Number(slideData.columns) || 3);
  const gap = 0.3;
  const contentTop = slideData.subtitle ? 1.95 : 1.55;
  const usableWidth = SLIDE_SIZE.width - MARGINS.left - MARGINS.right;
  const cardWidth = (usableWidth - (gap * (columns - 1))) / columns;
  const rows = Math.max(1, Math.ceil(items.length / columns));
  const usableHeight = SLIDE_SIZE.height - contentTop - MARGINS.bottom;
  const cardHeight = (usableHeight - (gap * (rows - 1))) / rows;

  items.forEach((item, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = MARGINS.left + (column * (cardWidth + gap));
    const y = contentTop + (row * (cardHeight + gap));

    addBodyText(slide, item?.title, {
      x,
      y,
      w: cardWidth,
      h: 0.35,
      fontSize: 16,
      bold: true,
      color: theme.accent,
    });

    addBodyText(slide, item?.description, {
      x,
      y: y + 0.42,
      w: cardWidth,
      h: Math.max(0.5, cardHeight - 0.42),
      fontSize: 11,
      color: theme.text,
      fit: 'shrink',
      valign: 'top',
    });
  });
}

async function verifyImageSource(src) {
  if (!src || typeof fetch !== 'function') {
    return;
  }

  if (!/^https?:\/\//i.test(src)) {
    return;
  }

  const response = await fetch(src);
  if (!response.ok) {
    throw new Error(`Image request failed with status ${response.status}`);
  }
}

function getImageOptions(src, fit) {
  const x = 1.0;
  const y = 1.3;
  const w = 11.35;
  const h = 4.95;
  const sizingType = fit === 'contain' ? 'contain' : fit === 'crop' ? 'crop' : 'cover';

  return {
    path: src,
    x,
    y,
    w,
    h,
    sizing: {
      type: sizingType,
      w,
      h,
    },
  };
}

async function renderImageSlide(slide, slideData, theme) {
  addTitleText(slide, slideData.title, { color: theme.accent });

  try {
    await verifyImageSource(slideData.src);
    slide.addImage(getImageOptions(slideData.src, slideData.fit));
  } catch (error) {
    console.warn(`Unable to embed image in PPTX export: ${slideData.src}`, error);
    addBodyText(slide, 'Image could not be embedded', {
      x: 1.2,
      y: 3.2,
      w: 10.9,
      h: 0.5,
      fontSize: 18,
      bold: true,
      color: theme.text,
      align: 'center',
      valign: 'mid',
    });
  }

  addBodyText(slide, slideData.caption, {
    x: 1.0,
    y: 6.45,
    w: 11.35,
    h: 0.35,
    fontSize: 10,
    color: theme.text,
    align: 'center',
  });
}

function renderQuoteSlide(slide, slideData, theme) {
  addBodyText(slide, slideData.quote ? `“${slideData.quote}”` : '', {
    x: 1.1,
    y: 2.0,
    w: 11.1,
    h: 1.7,
    fontSize: 24,
    italic: true,
    color: theme.accent,
    align: 'center',
    valign: 'mid',
    fit: 'shrink',
  });

  const attributionParts = [slideData.attribution, slideData.role].filter(Boolean);
  addBodyText(slide, attributionParts.join(' — '), {
    x: 1.5,
    y: 4.4,
    w: 10.3,
    h: 0.5,
    fontSize: 13,
    color: theme.text,
    align: 'center',
  });
}

function renderMetricSlide(slide, slideData, theme) {
  addTitleText(slide, slideData.title, { color: theme.accent });

  const metrics = Array.isArray(slideData.metrics) ? slideData.metrics : [];
  const gap = 0.35;
  const columnCount = Math.max(1, metrics.length);
  const totalWidth = SLIDE_SIZE.width - MARGINS.left - MARGINS.right;
  const columnWidth = (totalWidth - (gap * (columnCount - 1))) / columnCount;

  metrics.forEach((metric, index) => {
    const x = MARGINS.left + (index * (columnWidth + gap));
    const valueColor = normalizeHexColor(metric?.color, theme.accent);

    addBodyText(slide, metric?.value, {
      x,
      y: 2.35,
      w: columnWidth,
      h: 0.9,
      fontSize: 28,
      bold: true,
      color: valueColor,
      align: 'center',
      valign: 'mid',
      fit: 'shrink',
    });

    addBodyText(slide, metric?.label, {
      x,
      y: 3.45,
      w: columnWidth,
      h: 0.55,
      fontSize: 14,
      color: theme.text,
      align: 'center',
      valign: 'mid',
      fit: 'shrink',
    });
  });
}

function renderSectionSlide(slide, slideData, theme) {
  addBodyText(slide, slideData.title, {
    x: 1.1,
    y: 2.25,
    w: 11.1,
    h: 0.9,
    fontSize: 28,
    bold: true,
    color: theme.accent,
    align: 'center',
    valign: 'mid',
  });

  addBodyText(slide, slideData.subtitle, {
    x: 1.5,
    y: 3.3,
    w: 10.3,
    h: 0.5,
    fontSize: 15,
    color: theme.text,
    align: 'center',
  });
}

async function renderSlide(slide, slideData, theme) {
  switch (slideData?.type) {
    case 'title':
      renderTitleSlide(slide, slideData, theme);
      break;
    case 'content':
      renderContentSlide(slide, slideData, theme);
      break;
    case 'grid':
      renderGridSlide(slide, slideData, theme);
      break;
    case 'image':
      await renderImageSlide(slide, slideData, theme);
      break;
    case 'quote':
      renderQuoteSlide(slide, slideData, theme);
      break;
    case 'metric':
      renderMetricSlide(slide, slideData, theme);
      break;
    case 'section':
      renderSectionSlide(slide, slideData, theme);
      break;
    case 'blank':
      break;
    default:
      addBodyText(slide, 'Unsupported slide type', {
        x: 1.2,
        y: 3.2,
        w: 10.9,
        h: 0.45,
        fontSize: 18,
        bold: true,
        color: theme.text,
        align: 'center',
      });
  }
}

export async function exportDeckToPPTX(deck) {
  const pres = new PptxGenJS();
  pres.defineLayout(PPTX_LAYOUT);
  pres.layout = PPTX_LAYOUT.name;
  pres.title = deck?.title || 'DeckWing Presentation';

  const slides = Array.isArray(deck?.slides) ? deck.slides : [];

  for (const slideData of slides) {
    const slide = pres.addSlide();
    const theme = resolveTheme(slideData?.theme, deck?.defaultTheme);

    applyTheme(slide, theme);
    await renderSlide(slide, slideData, theme);
  }

  return pres.write({ outputType: 'blob' });
}
