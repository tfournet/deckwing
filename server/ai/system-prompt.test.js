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

  it('contains customColors in the slide schema instructions', () => {
    expect(SYSTEM_PROMPT).toContain('"customColors"');
  });

  it('contains partner branding instructions', () => {
    expect(SYSTEM_PROMPT).toMatch(/partner branding|partner\/vendor brand colors/i);
  });

  it('contains the customColors JSON format example', () => {
    expect(SYSTEM_PROMPT).toContain('{ "customColors": { "primary": "#hexcolor", "bg": "#hexcolor", "label": "Partner name" } }');
  });

  it('includes chart generation instructions', () => {
    expect(SYSTEM_PROMPT).toContain('## CHART GENERATION');
    expect(SYSTEM_PROMPT).toContain('type "chart"');
    expect(SYSTEM_PROMPT).toContain('Use type "metric" when the user only needs 1-4 headline numbers');
  });

  it('includes research and citation instructions', () => {
    expect(SYSTEM_PROMPT).toContain('## RESEARCH AND CITATIONS');
    expect(SYSTEM_PROMPT).toContain('Citations belong in speaker notes only, never on slide faces');
    expect(SYSTEM_PROMPT).toContain('Rewst Documentation (docs.rewst.io)');
  });

  it('includes pre-generation interview instructions', () => {
    expect(SYSTEM_PROMPT).toContain('## PRE-GENERATION INTERVIEW');
    expect(SYSTEM_PROMPT).toContain('action to null until you have enough context to generate');
    expect(SYSTEM_PROMPT).toContain('skip questions');
  });
});
