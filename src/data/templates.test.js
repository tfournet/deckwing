import { describe, it, expect } from 'vitest';

import { TEMPLATES, getTemplate } from './templates.js';
import { validateDeck } from '../schema/slide-schema.js';

const EXPECTED_SLIDE_COUNTS = {
  qbr: 8,
  security: 6,
  onboarding: 7,
  demo: 8,
  'all-hands': 6,
};

describe('templates', () => {
  it('validates every template deck against the slide schema', () => {
    for (const template of TEMPLATES) {
      const result = validateDeck(template.deck);
      expect(result.valid, `${template.id}: ${result.errors.join('; ')}`).toBe(true);
    }
  });

  it('has the expected slide count for each template', () => {
    for (const template of TEMPLATES) {
      expect(template.deck.slides).toHaveLength(EXPECTED_SLIDE_COUNTS[template.id]);
    }
  });

  it('returns the correct template by id', () => {
    for (const template of TEMPLATES) {
      expect(getTemplate(template.id)).toBe(template);
    }
  });

  it('returns null for unknown template ids', () => {
    expect(getTemplate('unknown-template')).toBeNull();
  });

  it('ensures all templates expose required fields', () => {
    for (const template of TEMPLATES) {
      expect(template).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          description: expect.any(String),
          deck: expect.any(Object),
        })
      );
    }
  });

  it('has no duplicate template ids', () => {
    const ids = TEMPLATES.map(template => template.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
