/**
 * WCAG Contrast Checker
 */

function getLuminance(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return 0;
  const [r, g, b] = [result[1], result[2], result[3]].map(v => {
    const n = parseInt(v, 16) / 255;
    return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function getContrastRatio(hex1, hex2) {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

export function checkContrast(bgHex, textHex, minRatio = 4.5) {
  const ratio = getContrastRatio(bgHex, textHex);
  return {
    ratio: ratio.toFixed(2),
    passes: ratio >= minRatio,
    level: ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : ratio >= 3 ? 'AA-large' : 'FAIL'
  };
}

export default { checkContrast, getContrastRatio };
