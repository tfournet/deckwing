import { describe, expect, it, vi } from 'vitest';
import { BLOCK_KINDS } from '../../../shared/schema/slide-schema.js';
import {
  slotToInches,
  exportHeading,
  exportList,
  exportMetric,
  exportLayoutSlide,
  NATIVE_EXPORTERS,
  IMAGE_RENDER_KINDS,
} from './export-pptx-blocks.js';

function createPptxSlide() {
  return {
    addText: vi.fn(),
    addImage: vi.fn(),
    addShape: vi.fn(),
    background: undefined,
  };
}

function createPresentation(slide = createPptxSlide()) {
  return {
    addSlide: vi.fn(() => slide),
  };
}

describe('export-pptx-blocks', () => {
  it('PPTX exporters cover all BLOCK_KINDS', () => {
    const schemaKinds = Object.keys(BLOCK_KINDS).sort();
    const exporterKinds = [...new Set([
      ...Object.keys(NATIVE_EXPORTERS),
      ...IMAGE_RENDER_KINDS,
    ])].sort();

    expect(exporterKinds).toEqual(schemaKinds);
  });

  it('slotToInches converts grid position to inches', () => {
    const pos = slotToInches({ col: 2, row: 3, colSpan: 4, rowSpan: 2 });

    expect(pos.x).toBeCloseTo(1.52775, 4);
    expect(pos.y).toBeCloseTo(2.6666667, 4);
    expect(pos.w).toBeCloseTo(4.111, 4);
    expect(pos.h).toBeCloseTo(2.1666667, 4);
  });

  it('exportHeading adds text with heading properties', () => {
    const slide = createPptxSlide();

    exportHeading(
      { text: 'Quarterly Review', size: 'xl' },
      slide,
      { x: 1, y: 2, w: 3, h: 1 },
      { accent: '1EAFAF' },
    );

    expect(slide.addText).toHaveBeenCalledWith('Quarterly Review', expect.objectContaining({
      x: 1,
      y: 2,
      w: 3,
      h: 1,
      fontSize: 44,
      color: '1EAFAF',
      bold: true,
      fontFace: 'Montserrat',
    }));
  });

  it('exportList adds bulleted text runs', () => {
    const slide = createPptxSlide();

    exportList(
      { items: ['First', 'Second'] },
      slide,
      { x: 1, y: 1, w: 4, h: 2 },
      { text: 'FFFFFF' },
    );

    const [runs, options] = slide.addText.mock.calls[0];
    expect(runs).toHaveLength(2);
    expect(runs[0]).toEqual(expect.objectContaining({
      text: 'First',
      options: expect.objectContaining({
        bullet: { type: 'bullet' },
        fontSize: 16,
        color: 'FFFFFF',
      }),
    }));
    expect(options).toEqual(expect.objectContaining({ x: 1, y: 1, w: 4, h: 2 }));
  });

  it('exportMetric adds value and label text blocks', () => {
    const slide = createPptxSlide();

    exportMetric(
      { value: '73%', label: 'Reduction in manual work' },
      slide,
      { x: 0.5, y: 1, w: 2.5, h: 2 },
      { accent: '1EAFAF', text: 'FFFFFF' },
    );

    expect(slide.addText).toHaveBeenCalledTimes(2);
    expect(slide.addText).toHaveBeenNthCalledWith(1, '73%', expect.objectContaining({
      x: 0.5,
      y: 1,
      w: 2.5,
      h: 1.2,
      fontSize: 36,
      align: 'center',
      color: '1EAFAF',
    }));
    expect(slide.addText).toHaveBeenNthCalledWith(2, 'Reduction in manual work', expect.objectContaining({
      x: 0.5,
      y: 2.2,
      w: 2.5,
      h: 0.8,
      fontSize: 12,
      align: 'center',
      color: 'FFFFFF',
    }));
  });

  it('exportLayoutSlide creates a slide and exports native blocks', async () => {
    const slide = createPptxSlide();
    const pres = createPresentation(slide);

    await exportLayoutSlide({
      type: 'layout',
      layout: 'single-center',
      blocks: [
        { slot: 'title', kind: 'heading', text: 'Title' },
        { slot: 'body', kind: 'text', text: 'Body copy' },
      ],
    }, pres, 'rewst');

    expect(pres.addSlide).toHaveBeenCalledTimes(1);
    expect(slide.background).toEqual({ color: '141121' });
    expect(slide.addText).toHaveBeenCalledTimes(2);
    expect(slide.addText).toHaveBeenNthCalledWith(1, 'Title', expect.objectContaining({
      color: '1EAFAF',
      fontFace: 'Montserrat',
    }));
    expect(slide.addText).toHaveBeenNthCalledWith(2, 'Body copy', expect.objectContaining({
      color: 'FFFFFF',
      fontFace: 'Montserrat',
    }));
  });

  it('image-render kinds use renderBlockToPNG callback', async () => {
    const slide = createPptxSlide();
    const pres = createPresentation(slide);
    const renderBlockToPNG = vi.fn().mockResolvedValue('data:image/png;base64,mock');

    await exportLayoutSlide({
      type: 'layout',
      layout: 'custom',
      slots: [
        { name: 'callout', position: { col: 1, row: 1, colSpan: 3, rowSpan: 2 } },
      ],
      blocks: [
        { slot: 'callout', kind: 'icon', name: 'Zap' },
      ],
    }, pres, 'rewst', { renderBlockToPNG });

    expect(renderBlockToPNG).toHaveBeenCalledTimes(1);
    expect(renderBlockToPNG).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'icon', name: 'Zap' }),
      expect.objectContaining({ x: expect.any(Number), y: expect.any(Number), w: expect.any(Number), h: expect.any(Number) }),
    );
    expect(slide.addImage).toHaveBeenCalledWith(expect.objectContaining({
      data: 'data:image/png;base64,mock',
      x: expect.any(Number),
      y: expect.any(Number),
      w: expect.any(Number),
      h: expect.any(Number),
    }));
  });

  it('missing renderBlockToPNG callback shows placeholder text', async () => {
    const slide = createPptxSlide();
    const pres = createPresentation(slide);

    await exportLayoutSlide({
      type: 'layout',
      layout: 'custom',
      slots: [
        { name: 'chart', position: { col: 1, row: 1, colSpan: 6, rowSpan: 3 } },
      ],
      blocks: [
        { slot: 'chart', kind: 'chart', type: 'bar', data: [] },
      ],
    }, pres, 'rewst');

    expect(slide.addImage).not.toHaveBeenCalled();
    expect(slide.addText).toHaveBeenCalledWith('[chart]', expect.objectContaining({
      fontSize: 12,
      color: 'B3B3B3',
      align: 'center',
    }));
  });
});
