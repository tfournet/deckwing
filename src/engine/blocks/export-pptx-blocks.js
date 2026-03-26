import { THEME_COLORS } from '../../../shared/theme-colors.js';

// Grid-to-inches conversion (13.333" x 7.5" slide with 0.5" padding)
const PAD = 0.5;
const COL_W = (13.333 - PAD * 2) / 12;
const ROW_H = (7.5 - PAD * 2) / 6;

export function slotToInches(position) {
  return {
    x: PAD + (position.col - 1) * COL_W,
    y: PAD + (position.row - 1) * ROW_H,
    w: position.colSpan * COL_W,
    h: position.rowSpan * ROW_H,
  };
}

function resolveTheme(slide, deckDefaultTheme) {
  const themeName = slide?.theme || deckDefaultTheme || 'rewst';
  return THEME_COLORS[themeName] || THEME_COLORS.rewst;
}

export function exportHeading(block, pptxSlide, pos, theme) {
  pptxSlide.addText(block.text || '', {
    x: pos.x,
    y: pos.y,
    w: pos.w,
    h: pos.h,
    fontSize: { sm: 18, md: 24, lg: 32, xl: 44 }[block.size] || 32,
    color: theme.accent,
    bold: true,
    fontFace: 'Montserrat',
    valign: 'middle',
  });
}

export function exportText(block, pptxSlide, pos, theme) {
  const sizes = { body: 16, caption: 12, small: 10 };
  pptxSlide.addText(block.text || '', {
    x: pos.x,
    y: pos.y,
    w: pos.w,
    h: pos.h,
    fontSize: sizes[block.style] || 16,
    color: theme.text,
    fontFace: 'Montserrat',
    valign: 'top',
  });
}

export function exportList(block, pptxSlide, pos, theme) {
  const items = (block.items || []).map((item) => ({
    text: item,
    options: {
      bullet: { type: 'bullet' },
      fontSize: 16,
      color: theme.text,
      fontFace: 'Montserrat',
    },
  }));

  pptxSlide.addText(items, {
    x: pos.x,
    y: pos.y,
    w: pos.w,
    h: pos.h,
    valign: 'top',
  });
}

export function exportMetric(block, pptxSlide, pos, theme) {
  const valueH = pos.h * 0.6;
  const labelH = pos.h * 0.4;

  pptxSlide.addText(block.value || '', {
    x: pos.x,
    y: pos.y,
    w: pos.w,
    h: valueH,
    fontSize: 36,
    bold: true,
    color: theme.accent,
    fontFace: 'Montserrat',
    align: 'center',
    valign: 'bottom',
  });

  pptxSlide.addText(block.label || '', {
    x: pos.x,
    y: pos.y + valueH,
    w: pos.w,
    h: labelH,
    fontSize: 12,
    color: theme.text,
    fontFace: 'Montserrat',
    align: 'center',
    valign: 'top',
  });
}

export function exportQuote(block, pptxSlide, pos, theme) {
  pptxSlide.addText(`"${block.text || ''}"`, {
    x: pos.x,
    y: pos.y,
    w: pos.w,
    h: pos.h * 0.7,
    fontSize: 22,
    italic: true,
    color: theme.text,
    fontFace: 'Montserrat',
    valign: 'middle',
    align: 'center',
  });

  if (block.attribution) {
    pptxSlide.addText(block.attribution, {
      x: pos.x,
      y: pos.y + pos.h * 0.7,
      w: pos.w,
      h: pos.h * 0.3,
      fontSize: 14,
      bold: true,
      color: theme.accent,
      fontFace: 'Montserrat',
      valign: 'top',
      align: 'center',
    });
  }
}

export function exportImage(block, pptxSlide, pos) {
  try {
    pptxSlide.addImage({
      path: block.src,
      x: pos.x,
      y: pos.y,
      w: pos.w,
      h: pos.h,
      sizing: {
        type: block.fit === 'cover' ? 'cover' : 'contain',
        w: pos.w,
        h: pos.h,
      },
    });
  } catch {
    pptxSlide.addText('Image could not be embedded', {
      x: pos.x,
      y: pos.y,
      w: pos.w,
      h: pos.h,
      fontSize: 12,
      color: 'B3B3B3',
      align: 'center',
      valign: 'middle',
    });
  }
}

export async function exportImageRenderBlock(block, pptxSlide, pos, renderBlockToPNG) {
  if (!renderBlockToPNG) {
    pptxSlide.addText(`[${block.kind}]`, {
      x: pos.x,
      y: pos.y,
      w: pos.w,
      h: pos.h,
      fontSize: 12,
      color: 'B3B3B3',
      align: 'center',
      valign: 'middle',
    });
    return;
  }

  const png = await renderBlockToPNG(block, pos);
  pptxSlide.addImage({ data: png, x: pos.x, y: pos.y, w: pos.w, h: pos.h });
}

const NATIVE_EXPORTERS = {
  heading: exportHeading,
  text: exportText,
  list: exportList,
  metric: exportMetric,
  quote: exportQuote,
  image: exportImage,
  divider: (block, slide, pos, theme) => {
    const isVertical = block.direction === 'vertical';
    slide.addShape('line', {
      x: isVertical ? pos.x + (pos.w / 2) : pos.x + (pos.w * 0.1),
      y: isVertical ? pos.y + (pos.h * 0.1) : pos.y + (pos.h / 2),
      w: isVertical ? 0 : pos.w * 0.8,
      h: isVertical ? pos.h * 0.8 : 0,
      line: { color: theme.accent, width: 1.5 },
    });
  },
  spacer: () => {},
};

const IMAGE_RENDER_KINDS = new Set(['icon', 'callout', 'chart', 'table']);

export async function exportLayoutSlide(slide, pres, deckDefaultTheme, options = {}) {
  const theme = resolveTheme(slide, deckDefaultTheme);
  const pptxSlide = pres.addSlide();
  pptxSlide.background = { color: theme.bg };

  const isCustom = slide.layout === 'custom';
  let slots;
  if (isCustom) {
    slots = slide.slots || [];
  } else {
    const { getLayout } = await import('../../../shared/layouts/index.js');
    const layoutDef = getLayout(slide.layout);
    slots = layoutDef?.slots || [];
  }

  for (const block of (slide.blocks || [])) {
    const slotDef = slots.find((slot) => slot.name === block.slot);
    if (!slotDef) continue;

    const pos = slotToInches(slotDef.position);

    if (IMAGE_RENDER_KINDS.has(block.kind)) {
      await exportImageRenderBlock(block, pptxSlide, pos, options.renderBlockToPNG);
      continue;
    }

    const exporter = NATIVE_EXPORTERS[block.kind];
    if (exporter) {
      exporter(block, pptxSlide, pos, theme);
    }
  }
}
