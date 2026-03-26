export const DECKWING_EXTENSION = '.deckwing';
export const DECKWING_FILE_FILTER = {
  name: 'DeckWing Presentation',
  extensions: ['deckwing'],
};

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isInlineImageDataUrl(value) {
  return typeof value === 'string' && /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(value);
}

function isAssetReference(value) {
  return typeof value === 'string' && value.startsWith('asset:');
}

function transformSlideSources(value, transformSource) {
  if (Array.isArray(value)) {
    return value.map(item => transformSlideSources(item, transformSource));
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => {
        if (key === 'src' && typeof entryValue === 'string') {
          return [key, transformSource(entryValue)];
        }

        return [key, transformSlideSources(entryValue, transformSource)];
      }),
    );
  }

  return value;
}

function createAssetIdGenerator(usedIds = new Set()) {
  let counter = 1;

  return () => {
    let assetId = `img_${counter.toString(36).padStart(4, '0')}`;
    while (usedIds.has(assetId)) {
      counter += 1;
      assetId = `img_${counter.toString(36).padStart(4, '0')}`;
    }
    usedIds.add(assetId);
    counter += 1;
    return assetId;
  };
}

function createFileFormat(deck) {
  const sourceDeck = isPlainObject(deck) ? deepClone(deck) : {};
  const sourceAssets = isPlainObject(sourceDeck.assets) ? { ...sourceDeck.assets } : {};
  const assets = {};
  const dataUrlToAssetId = new Map();
  const nextAssetId = createAssetIdGenerator(new Set(Object.keys(sourceAssets)));

  const slides = transformSlideSources(sourceDeck.slides ?? [], (src) => {
    if (isInlineImageDataUrl(src)) {
      if (!dataUrlToAssetId.has(src)) {
        const assetId = nextAssetId();
        dataUrlToAssetId.set(src, assetId);
        assets[assetId] = src;
      }

      return `asset:${dataUrlToAssetId.get(src)}`;
    }

    if (isAssetReference(src)) {
      const assetId = src.slice('asset:'.length);
      if (sourceAssets[assetId]) {
        assets[assetId] = sourceAssets[assetId];
      }
    }

    return src;
  });

  return {
    deckwing: 1,
    meta: {
      title: sourceDeck.title ?? 'Untitled Presentation',
      author: sourceDeck.author ?? '',
      createdAt: sourceDeck.createdAt ?? new Date().toISOString(),
      updatedAt: sourceDeck.updatedAt ?? new Date().toISOString(),
    },
    defaultTheme: sourceDeck.defaultTheme ?? 'rewst',
    slides,
    assets,
  };
}

export function serializeDeck(deck) {
  return JSON.stringify(createFileFormat(deck), null, 2);
}

export function deserializeDeck(fileContent) {
  const parsed = typeof fileContent === 'string' ? JSON.parse(fileContent) : deepClone(fileContent);

  if (!isPlainObject(parsed) || parsed.deckwing !== 1) {
    throw new Error('Unsupported .deckwing file format version');
  }

  const assets = isPlainObject(parsed.assets) ? parsed.assets : {};
  const slides = transformSlideSources(parsed.slides ?? [], (src) => {
    if (!isAssetReference(src)) {
      return src;
    }

    const assetId = src.slice('asset:'.length);
    return assets[assetId] ?? assets[assetId.replace(/^img_/, 'asset_')] ?? assets[assetId.replace(/^asset_/, 'img_')] ?? src;
  });

  return {
    title: parsed.meta?.title ?? 'Untitled Presentation',
    author: parsed.meta?.author ?? '',
    createdAt: parsed.meta?.createdAt ?? null,
    updatedAt: parsed.meta?.updatedAt ?? null,
    defaultTheme: parsed.defaultTheme ?? 'rewst',
    slides,
  };
}
