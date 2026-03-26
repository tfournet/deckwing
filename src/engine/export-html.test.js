/**
 * @vitest-environment jsdom
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockHtml2canvas, mockToDataURL } = vi.hoisted(() => ({
  mockHtml2canvas: vi.fn(),
  mockToDataURL: vi.fn(() => 'data:image/png;base64,fake-slide'),
}));

vi.mock('html2canvas', () => ({
  default: mockHtml2canvas,
}));

import { downloadHTMLFile, exportDeckToHTML } from './export-html.js';

function createDeck(slideCount) {
  return {
    title: 'Offline Deck',
    defaultTheme: 'rewst',
    slides: Array.from({ length: slideCount }, (_, index) => ({
      id: `slide-${index + 1}`,
      type: index % 2 === 0 ? 'title' : 'content',
      title: `Slide ${index + 1}`,
      notes: `Speaker note ${index + 1}`,
    })),
  };
}

describe('export-html', () => {
  let anchor;
  let createElement;
  let createObjectURL;
  let revokeObjectURL;

  beforeEach(() => {
    vi.clearAllMocks();

    mockHtml2canvas.mockResolvedValue({
      toDataURL: mockToDataURL,
    });

    anchor = {
      href: '',
      download: '',
      click: vi.fn(),
    };

    createElement = vi.fn((tagName) => {
      if (tagName === 'a') {
        return anchor;
      }

      return { tagName };
    });

    createObjectURL = vi.fn(() => 'blob:html-export');
    revokeObjectURL = vi.fn();

    Object.defineProperty(globalThis, 'document', {
      value: {
        createElement,
      },
      configurable: true,
      writable: true,
    });

    Object.defineProperty(globalThis, 'URL', {
      value: {
        createObjectURL,
        revokeObjectURL,
      },
      configurable: true,
      writable: true,
    });
  });

  it('exportDeckToHTML returns a string starting with doctype', async () => {
    const html = await exportDeckToHTML({
      slideContainer: {},
      deck: createDeck(1),
      defaultTheme: 'rewst',
    });

    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
  });

  it('output contains base64 image data', async () => {
    const html = await exportDeckToHTML({
      slideContainer: {},
      deck: createDeck(2),
      defaultTheme: 'rewst',
    });

    expect(html).toContain('data:image/png;base64,fake-slide');
    expect(mockHtml2canvas).toHaveBeenCalledTimes(2);
    expect(mockHtml2canvas).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ scale: 2 }),
    );
  });

  it('output contains speaker notes from the deck', async () => {
    const html = await exportDeckToHTML({
      slideContainer: {},
      deck: createDeck(2),
      defaultTheme: 'rewst',
    });

    expect(html).toContain('Speaker note 1');
    expect(html).toContain('Speaker note 2');
  });

  it('output contains keyboard navigation listener code', async () => {
    const html = await exportDeckToHTML({
      slideContainer: {},
      deck: createDeck(1),
      defaultTheme: 'rewst',
    });

    expect(html).toContain("window.addEventListener('keydown'");
    expect(html).toContain("case 'ArrowRight'");
    expect(html).toContain("case 'PageDown'");
    expect(html).toContain("case 'N'");
  });

  it('output contains the presenter mode toggle button', async () => {
    const html = await exportDeckToHTML({
      slideContainer: {},
      deck: createDeck(1),
      defaultTheme: 'rewst',
    });

    expect(html).toContain('id="mode-toggle"');
    expect(html).toContain('Toggle presenter mode');
  });

  it('downloadHTMLFile creates and clicks an anchor element', () => {
    downloadHTMLFile('<!DOCTYPE html><html></html>', 'deck.html');

    expect(createElement).toHaveBeenCalledWith('a');
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(anchor.href).toBe('blob:html-export');
    expect(anchor.download).toBe('deck.html');
    expect(anchor.click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:html-export');
  });

  it('calls onProgress for each slide', async () => {
    const onProgress = vi.fn();

    await exportDeckToHTML({
      slideContainer: {},
      deck: createDeck(3),
      defaultTheme: 'rewst',
      onProgress,
    });

    expect(onProgress).toHaveBeenCalledTimes(3);
    expect(onProgress).toHaveBeenNthCalledWith(1, 1, 3);
    expect(onProgress).toHaveBeenNthCalledWith(2, 2, 3);
    expect(onProgress).toHaveBeenNthCalledWith(3, 3, 3);
  });
});
