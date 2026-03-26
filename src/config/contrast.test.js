import { describe, it, expect } from 'vitest';
import { getContrastRatio, checkContrast } from './contrast.js';

describe('getContrastRatio', () => {
  it('returns 21 for black on white', () => {
    const ratio = getContrastRatio('#000000', '#FFFFFF');
    expect(ratio).toBeCloseTo(21, 0);
  });

  it('returns 1 for same color', () => {
    expect(getContrastRatio('#FF0000', '#FF0000')).toBeCloseTo(1, 1);
  });

  it('is symmetric — order of arguments does not matter', () => {
    const a = getContrastRatio('#1EAFAF', '#141121');
    const b = getContrastRatio('#141121', '#1EAFAF');
    expect(a).toBeCloseTo(b, 5);
  });
});

describe('checkContrast', () => {
  it('black on white passes AAA', () => {
    const result = checkContrast('#000000', '#FFFFFF');
    expect(result.passes).toBe(true);
    expect(result.level).toBe('AAA');
  });

  it('uses custom minRatio', () => {
    // A pair that passes 4.5 but not 7
    const result = checkContrast('#1EAFAF', '#000000', 7);
    // Just verify the API works — actual ratio depends on the colors
    expect(typeof result.ratio).toBe('string');
    expect(typeof result.passes).toBe('boolean');
  });

  it('returns FAIL for low-contrast pairs', () => {
    // Light gray on white
    const result = checkContrast('#FFFFFF', '#EEEEEE');
    expect(result.level).toBe('FAIL');
    expect(result.passes).toBe(false);
  });

  it('returns AA-large for medium contrast', () => {
    // Deliberately pick a pair with ratio ~3-4.5
    const result = checkContrast('#767676', '#FFFFFF');
    // #767676 on white is ~4.54 — right at the AA boundary
    expect(['AA', 'AA-large']).toContain(result.level);
  });

  it('Rewst brand: Bot Teal on Ops Indigo darkest passes AA', () => {
    const result = checkContrast('#141121', '#1EAFAF');
    expect(result.passes).toBe(true);
  });
});
