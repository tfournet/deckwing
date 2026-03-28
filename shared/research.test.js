import { describe, it, expect } from 'vitest';
import { getEnabledSources, isAllowedUrl, formatCitation } from './research.js';

describe('research helpers', () => {
  it('returns only enabled sources', () => {
    expect(getEnabledSources()).toEqual([
      expect.objectContaining({ id: 'rewst-main', domain: 'rewst.io', enabled: true }),
      expect.objectContaining({ id: 'rewst-docs', domain: 'docs.rewst.io', enabled: true }),
    ]);
  });

  it('allows whitelisted domains and subdomains', () => {
    expect(isAllowedUrl('https://rewst.io/platform')).toBe(true);
    expect(isAllowedUrl('https://docs.rewst.io/api')).toBe(true);
    expect(isAllowedUrl('https://status.docs.rewst.io/health')).toBe(true);
  });

  it('rejects non-whitelisted and invalid URLs', () => {
    expect(isAllowedUrl('https://example.com/rewst')).toBe(false);
    expect(isAllowedUrl('not a url')).toBe(false);
  });

  it('formats citations from config template', () => {
    expect(formatCitation('Rewst Docs', 'https://docs.rewst.io/api')).toBe(
      'Source: Rewst Docs (https://docs.rewst.io/api)',
    );
  });
});
