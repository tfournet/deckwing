import jsPDF from 'jspdf';

// Re-export the shared download helper so existing call sites that import
// `downloadBlob` from this module continue to work without changes.
export { downloadFile as downloadBlob } from './download.js';

const PAGE_WIDTH_MM = 338.667;
const PAGE_HEIGHT_MM = 190.5;

/**
 * Export a deck to PDF.
 *
 * Each slide is rendered off-screen via the supplied `captureSlide`
 * function (from useOffscreenRenderer) so every slide is captured
 * independently -- not just the currently-visible one.
 *
 * @param {object} params
 * @param {object} params.deck - the deck object (has .slides array, .title, .defaultTheme)
 * @param {string} params.defaultTheme - deck's default theme
 * @param {(slide:object, theme:string)=>Promise<string>} params.captureSlide
 * @param {function} params.onProgress - called with (currentSlide, totalSlides)
 * @returns {Promise<Blob>} - PDF blob for download
 */
export async function exportDeckToPDF({ deck, defaultTheme, captureSlide, onProgress }) {
  const slides = deck?.slides ?? [];
  const totalSlides = slides.length;
  const themeName = defaultTheme || deck?.defaultTheme || 'rewst';
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [PAGE_WIDTH_MM, PAGE_HEIGHT_MM],
  });

  for (let i = 0; i < totalSlides; i += 1) {
    if (typeof onProgress === 'function') {
      onProgress(i + 1, totalSlides);
    }

    const imageData = await captureSlide(slides[i], themeName);

    if (i > 0) {
      doc.addPage();
    }

    doc.addImage(imageData, 'PNG', 0, 0, PAGE_WIDTH_MM, PAGE_HEIGHT_MM);
  }

  return doc.output('blob');
}

