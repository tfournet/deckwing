import { describe, it, expect } from 'vitest';
import { MODELS, DEFAULT_MODEL } from './models.js';

describe('MODELS', () => {
  it('has 3 entries', () => {
    expect(MODELS).toHaveLength(3);
  });

  it('each model has id, label, and description', () => {
    for (const model of MODELS) {
      expect(model).toMatchObject({
        id: expect.any(String),
        label: expect.any(String),
        description: expect.any(String),
      });
    }
  });
});

describe('DEFAULT_MODEL', () => {
  it('matches a valid model id', () => {
    expect(MODELS.some(model => model.id === DEFAULT_MODEL)).toBe(true);
  });
});
