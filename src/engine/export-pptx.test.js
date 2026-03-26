import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  instances: [],
  mockPptxGenJS: vi.fn(),
}));

vi.mock('pptxgenjs', () => ({
  default: mocks.mockPptxGenJS,
}));

import { exportDeckToPPTX } from './export-pptx.js';

function createDeck(slides, defaultTheme = 'rewst') {
  return {
    title: 'Test Deck',
    defaultTheme,
    slides,
  };
}

function getLastInstance() {
  return mocks.instances.at(-1);
}

describe('export-pptx', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    mocks.instances.length = 0;

    mocks.mockPptxGenJS.mockImplementation(function MockPptxGenJS() {
      const slides = [];
      const instance = {
        defineLayout: vi.fn(),
        addSlide: vi.fn(() => {
          const slide = {};
          slide.addText = vi.fn(function addText() {
            return slide;
          });
          slide.addImage = vi.fn(function addImage() {
            return slide;
          });
          slides.push(slide);
          return slide;
        }),
        write: vi.fn(async function write() {
          return new Blob(['pptx'], {
          type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          });
        }),
        slides,
        layout: undefined,
        title: undefined,
      };

      mocks.instances.push(instance);
      return instance;
    });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }));
  });

  it('creates slides for all 8 supported slide types', async () => {
    const deck = createDeck([
      { type: 'title', title: 'Welcome', subtitle: 'Kickoff', author: 'Tim', date: '2026-03-26' },
      { type: 'content', title: 'Agenda', subtitle: 'Today', points: ['Intro', 'Demo', 'Wrap-up'] },
      {
        type: 'grid',
        title: 'Capabilities',
        items: [
          { title: 'Fast', description: 'Quick exports' },
          { title: 'Flexible', description: 'Many slide types' },
          { title: 'Reliable', description: 'Tested behavior' },
        ],
        columns: 3,
      },
      { type: 'image', title: 'Architecture', src: 'https://example.com/image.png', caption: 'System overview' },
      { type: 'quote', quote: 'Great decks tell a story.', attribution: 'DeckWing', role: 'Product' },
      { type: 'metric', title: 'Impact', metrics: [{ value: '98%', label: 'Satisfaction' }, { value: '4x', label: 'Faster' }] },
      { type: 'section', title: 'Next', subtitle: 'Implementation plan' },
      { type: 'blank' },
    ]);

    await exportDeckToPPTX(deck);

    const instance = getLastInstance();

    expect(instance.addSlide).toHaveBeenCalledTimes(8);
    expect(instance.slides[0].addText).toHaveBeenCalled();
    expect(instance.slides[1].addText).toHaveBeenCalledTimes(5);
    expect(instance.slides[2].addText).toHaveBeenCalledTimes(7);
    expect(instance.slides[3].addImage).toHaveBeenCalledWith(expect.objectContaining({ path: 'https://example.com/image.png' }));
    expect(instance.slides[4].addText).toHaveBeenCalled();
    expect(instance.slides[5].addText).toHaveBeenCalledTimes(5);
    expect(instance.slides[6].addText).toHaveBeenCalled();
    expect(instance.slides[7].addText).not.toHaveBeenCalled();
    expect(instance.slides[7].addImage).not.toHaveBeenCalled();
  });

  it('applies theme background colors to slides', async () => {
    const deck = createDeck([
      { type: 'blank', theme: 'terminal' },
      { type: 'blank' },
    ], 'warning');

    await exportDeckToPPTX(deck);

    const instance = getLastInstance();

    expect(instance.slides[0].background).toEqual({ color: '000000' });
    expect(instance.slides[1].background).toEqual({ color: '141121' });
    expect(instance.slides[1].color).toBe('FFFFFF');
  });

  it('does not crash when optional fields are missing', async () => {
    const deck = createDeck([
      { type: 'title', title: 'Only Title' },
      { type: 'content', title: 'Bare Content', points: ['One point'] },
      { type: 'grid', title: 'Grid', items: [{ title: 'A', description: 'B' }] },
      { type: 'image', src: 'https://example.com/no-caption.png' },
      { type: 'quote', quote: 'Simple quote' },
      { type: 'metric', metrics: [{ value: '12', label: 'Items' }] },
      { type: 'section', title: 'Divider' },
    ]);

    await expect(exportDeckToPPTX(deck)).resolves.toBeInstanceOf(Blob);
  });

  it('returns a Blob', async () => {
    const result = await exportDeckToPPTX(createDeck([
      { type: 'blank' },
    ]));

    const instance = getLastInstance();

    expect(instance.defineLayout).toHaveBeenCalledWith({
      name: 'DECKWING_WIDE',
      width: 13.333,
      height: 7.5,
    });
    expect(instance.layout).toBe('DECKWING_WIDE');
    expect(instance.write).toHaveBeenCalledWith({ outputType: 'blob' });
    expect(result).toBeInstanceOf(Blob);
  });

  it('handles image fetch errors gracefully', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('CORS failure')));

    const result = await exportDeckToPPTX(createDeck([
      { type: 'image', src: 'https://example.com/broken.png', title: 'Broken image' },
    ]));

    const instance = getLastInstance();

    expect(result).toBeInstanceOf(Blob);
    expect(warnSpy).toHaveBeenCalled();
    expect(instance.slides[0].addImage).not.toHaveBeenCalled();
    expect(instance.slides[0].addText).toHaveBeenCalledWith(
      'Image could not be embedded',
      expect.objectContaining({ align: 'center' }),
    );

    warnSpy.mockRestore();
  });

  it('falls back to the rewst theme when no theme is specified', async () => {
    await exportDeckToPPTX({
      title: 'Fallback Deck',
      slides: [
        { type: 'title', title: 'Fallback Title' },
      ],
    });

    const instance = getLastInstance();
    const [text, options] = instance.slides[0].addText.mock.calls[0];

    expect(instance.slides[0].background).toEqual({ color: '141121' });
    expect(text).toBe('Fallback Title');
    expect(options.color).toBe('1EAFAF');
  });
});
