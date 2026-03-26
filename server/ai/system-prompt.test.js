import { describe, it, expect } from 'vitest';
import { SYSTEM_PROMPT } from './system-prompt.js';
import { getLayoutNames } from '../../shared/layouts/index.js';

describe('SYSTEM_PROMPT', () => {
  it('contains the layout section text', () => {
    expect(SYSTEM_PROMPT).toContain('## LAYOUT SLIDES');
    expect(SYSTEM_PROMPT).toContain('When the user asks for a custom or complex layout, use type "layout".');
  });

  it('includes all registered layout IDs', () => {
    for (const layoutId of getLayoutNames()) {
      expect(SYSTEM_PROMPT).toContain(`- ${layoutId}:`);
    }
  });

  it('mentions the custom layout option', () => {
    expect(SYSTEM_PROMPT).toContain('layout: "custom"');
    expect(SYSTEM_PROMPT).toContain('Custom slots: use the 12x6 grid, no overlaps, max 6 slots');
  });

  it('includes block kind field requirements', () => {
    expect(SYSTEM_PROMPT).toContain('Block kinds and required fields:');
    expect(SYSTEM_PROMPT).toContain('- heading: text (required), size (sm/md/lg/xl)');
    expect(SYSTEM_PROMPT).toContain('- metric: value (required), label (required), color (optional)');
    expect(SYSTEM_PROMPT).toContain('- image: src (required), fit (optional), alt (optional)');
  });
});
