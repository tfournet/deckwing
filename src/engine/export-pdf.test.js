import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockAddImage,
  mockAddPage,
  mockHtml2canvas,
  mockJsPDF,
  mockOutput,
  mockToDataURL,
} = vi.hoisted(() => ({
  mockAddImage: vi.fn(),
  mockAddPage: vi.fn(),
  mockHtml2canvas: vi.fn(),
  mockJsPDF: vi.fn(),
  mockOutput: vi.fn(() => new Blob(['pdf'], { type: 'application/pdf' })),
  mockToDataURL: vi.fn(() => 'data:image/png;base64,fake'),
}));

vi.mock('html2canvas', () => ({
  default: mockHtml2canvas,
}));

vi.mock('jspdf', () => ({
  default: mockJsPDF,
}));

import { downloadBlob, exportDeckToPDF } from './export-pdf.js';

function createDeck(slideCount) {
  return {
    title: 'Test Deck',
    defaultTheme: 'rewst',
    slides: Array.from({ length: slideCount }, (_, index) => ({
      id: `slide-${index + 1}`,
      type: 'title',
      title: `Slide ${index + 1}`,
    })),
  };
}

describe('export-pdf', () => {
  let anchor;
  let createObjectURL;
  let revokeObjectURL;
  let createElement;

  beforeEach(() => {
    vi.clearAllMocks();

    mockHtml2canvas.mockResolvedValue({
      toDataURL: mockToDataURL,
    });

    mockJsPDF.mockImplementation(function jsPDFMock() {
      return {
        addPage: mockAddPage,
        addImage: mockAddImage,
        output: mockOutput,
      };
    });

    anchor = {
      href: '',
      download: '',
      click: vi.fn(),
    };

    createObjectURL = vi.fn(() => 'blob:fake-url');
    revokeObjectURL = vi.fn();
    createElement = vi.fn(() => anchor);

    Object.defineProperty(globalThis, 'URL', {
      value: {
        createObjectURL,
        revokeObjectURL,
      },
      configurable: true,
      writable: true,
    });

    Object.defineProperty(globalThis, 'document', {
      value: {
        createElement,
      },
      configurable: true,
      writable: true,
    });
  });

  it('downloadBlob creates an anchor, clicks it, and revokes the object URL', () => {
    const blob = new Blob(['test'], { type: 'application/pdf' });

    downloadBlob(blob, 'deck.pdf');

    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(createElement).toHaveBeenCalledWith('a');
    expect(anchor.href).toBe('blob:fake-url');
    expect(anchor.download).toBe('deck.pdf');
    expect(anchor.click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake-url');
  });

  it('exportDeckToPDF calls onProgress for each slide', async () => {
    const onProgress = vi.fn();

    await exportDeckToPDF({
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

  it('exportDeckToPDF returns a Blob', async () => {
    const result = await exportDeckToPDF({
      slideContainer: {},
      deck: createDeck(2),
      defaultTheme: 'rewst',
    });

    expect(mockOutput).toHaveBeenCalledWith('blob');
    expect(result).toBeInstanceOf(Blob);
  });

  it('exportDeckToPDF adds pages for multi-slide decks', async () => {
    await exportDeckToPDF({
      slideContainer: {},
      deck: createDeck(3),
      defaultTheme: 'rewst',
    });

    expect(mockAddPage).toHaveBeenCalledTimes(2);
    expect(mockAddImage).toHaveBeenCalledTimes(3);
  });

  it('exportDeckToPDF handles single slide without addPage', async () => {
    await exportDeckToPDF({
      slideContainer: {},
      deck: createDeck(1),
      defaultTheme: 'rewst',
    });

    expect(mockAddPage).not.toHaveBeenCalled();
    expect(mockAddImage).toHaveBeenCalledTimes(1);
  });

  it('exportDeckToPDF works with no onProgress callback', async () => {
    await expect(
      exportDeckToPDF({
        slideContainer: {},
        deck: createDeck(2),
        defaultTheme: 'rewst',
      }),
    ).resolves.toBeInstanceOf(Blob);
  });
});
