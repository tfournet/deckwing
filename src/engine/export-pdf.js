import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const PAGE_WIDTH_MM = 338.667;
const PAGE_HEIGHT_MM = 190.5;

/**
 * Export a deck to PDF.
 * @param {object} params
 * @param {HTMLElement} params.slideContainer - DOM element that renders one slide at a time
 * @param {object} params.deck - the deck object (has .slides array, .title, .defaultTheme)
 * @param {string} params.defaultTheme - deck's default theme
 * @param {function} params.onProgress - called with (currentSlide, totalSlides)
 * @returns {Promise<Blob>} - PDF blob for download
 */
export async function exportDeckToPDF({ slideContainer, deck, defaultTheme, onProgress }) {
  void defaultTheme;

  const slides = deck?.slides ?? [];
  const totalSlides = slides.length;
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [PAGE_WIDTH_MM, PAGE_HEIGHT_MM],
  });

  for (let i = 0; i < totalSlides; i += 1) {
    if (typeof onProgress === 'function') {
      onProgress(i + 1, totalSlides);
    }

    const canvas = await html2canvas(slideContainer, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
    });
    const imageData = canvas.toDataURL('image/png');

    if (i > 0) {
      doc.addPage();
    }

    doc.addImage(imageData, 'PNG', 0, 0, PAGE_WIDTH_MM, PAGE_HEIGHT_MM);
  }

  return doc.output('blob');
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
