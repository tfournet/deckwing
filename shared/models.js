export const MODELS = [
  { id: 'haiku', apiId: 'claude-haiku-4-5-20251001', label: 'Haiku', description: 'Fast, good for quick edits' },
  { id: 'sonnet', apiId: 'claude-sonnet-4-6-20250514', label: 'Sonnet', description: 'Balanced speed and quality' },
  { id: 'opus', apiId: 'claude-opus-4-6-20250807', label: 'Opus', description: 'Best quality, slower' },
];

export const DEFAULT_MODEL = 'sonnet';

/** Resolve a model alias to the full API model ID */
export function resolveModelId(alias) {
  const model = MODELS.find(m => m.id === alias);
  return model ? model.apiId : alias;
}

