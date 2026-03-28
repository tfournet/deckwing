import { useState, useCallback } from 'react';
import { exportDeckToPDF, downloadBlob } from '../engine/export-pdf';
import { exportDeckToPPTX } from '../engine/export-pptx';
import { exportDeckToHTML, downloadHTMLFile } from '../engine/export-html';
import { useOffscreenRenderer } from './useOffscreenRenderer';

export function useExport({ deck }) {
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState(null); // 'pdf' | 'pptx' | 'html'
  const [exportError, setExportError] = useState(null);
  const { captureSlide, cleanup } = useOffscreenRenderer();

  const handleExportPDF = useCallback(async () => {
    if (exporting) return;

    setExportError(null);
    setExporting(true);
    setExportType('pdf');
    try {
      const blob = await exportDeckToPDF({
        deck,
        defaultTheme: deck.defaultTheme,
        captureSlide,
      });
      downloadBlob(blob, `${deck.title || 'presentation'}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
      setExportError(err instanceof Error ? err.message : 'PDF export failed.');
    } finally {
      cleanup();
      setExporting(false);
      setExportType(null);
    }
  }, [deck, exporting, captureSlide, cleanup]);

  // PPTX export builds slides natively via PptxGenJS from structured slide
  // data, so it does not need the offscreen DOM renderer (captureSlide/cleanup).
  const handleExportPPTX = useCallback(async () => {
    if (exporting) return;

    setExportError(null);
    setExporting(true);
    setExportType('pptx');
    try {
      const blob = await exportDeckToPPTX(deck);
      downloadBlob(blob, `${deck.title || 'presentation'}.pptx`);
    } catch (err) {
      console.error('PPTX export failed:', err);
      setExportError(err instanceof Error ? err.message : 'PPTX export failed.');
    } finally {
      setExporting(false);
      setExportType(null);
    }
  }, [deck, exporting]);

  const handleExportHTML = useCallback(async () => {
    if (exporting) return;

    setExportError(null);
    setExporting(true);
    setExportType('html');
    try {
      const html = await exportDeckToHTML({
        deck,
        defaultTheme: deck.defaultTheme,
        captureSlide,
      });
      downloadHTMLFile(html, `${deck.title || 'presentation'}.html`);
    } catch (err) {
      console.error('HTML export failed:', err);
      setExportError(err instanceof Error ? err.message : 'HTML export failed.');
    } finally {
      cleanup();
      setExporting(false);
      setExportType(null);
    }
  }, [deck, exporting, captureSlide, cleanup]);

  return {
    exporting,
    exportType,
    exportError,
    handleExportPDF,
    handleExportPPTX,
    handleExportHTML,
  };
}

export default useExport;
