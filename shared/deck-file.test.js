import { describe, expect, it } from 'vitest';
import { deserializeDeck, DECKWING_EXTENSION, DECKWING_FILE_FILTER, serializeDeck } from './deck-file.js';

const IMAGE_DATA_URL = 'data:image/png;base64,ZmFrZS1pbWFnZS1ieXRlcw==';

const SAMPLE_DECK = {
  title: 'Asset Extraction Demo',
  author: 'DeckWing',
  createdAt: '2026-03-26T13:45:00.000Z',
  updatedAt: '2026-03-26T13:50:00.000Z',
  defaultTheme: 'rewst',
  slides: [
    { id: 'slide-1', type: 'title', title: 'Hello' },
    { id: 'slide-2', type: 'image', src: IMAGE_DATA_URL, caption: 'Inline image' },
    {
      id: 'slide-3',
      type: 'grid',
      title: 'Nested image references',
      items: [
        { title: 'Card', media: { src: IMAGE_DATA_URL } },
      ],
    },
  ],
};

describe('deck-file', () => {
  it('exports the .deckwing constants', () => {
    expect(DECKWING_EXTENSION).toBe('.deckwing');
    expect(DECKWING_FILE_FILTER).toEqual({
      name: 'DeckWing Presentation',
      extensions: ['deckwing'],
    });
  });

  it('extracts inline image data URLs into assets during serialization', () => {
    const serialized = serializeDeck(SAMPLE_DECK);
    const parsed = JSON.parse(serialized);
    const assetIds = Object.keys(parsed.assets);

    expect(parsed.deckwing).toBe(1);
    expect(assetIds).toHaveLength(1);
    expect(parsed.assets[assetIds[0]]).toBe(IMAGE_DATA_URL);
    expect(parsed.slides[1].src).toBe(`asset:${assetIds[0]}`);
    expect(parsed.slides[2].items[0].media.src).toBe(`asset:${assetIds[0]}`);
  });

  it('round-trips .deckwing content back to in-memory deck data', () => {
    const serialized = serializeDeck(SAMPLE_DECK);
    const deserialized = deserializeDeck(serialized);

    expect(deserialized).toEqual(SAMPLE_DECK);
  });

  it('preserves existing asset references when asset data is supplied on the deck', () => {
    const serialized = serializeDeck({
      ...SAMPLE_DECK,
      assets: {
        img_existing: IMAGE_DATA_URL,
      },
      slides: [
        { id: 'slide-9', type: 'image', src: 'asset:img_existing' },
      ],
    });

    const parsed = JSON.parse(serialized);
    expect(parsed.assets).toEqual({ img_existing: IMAGE_DATA_URL });
    expect(deserializeDeck(serialized).slides[0].src).toBe(IMAGE_DATA_URL);
  });
});
