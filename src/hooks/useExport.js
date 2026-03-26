import { useState, useRef, useCallback } from 'react';
import { exportDeckToPDF, downloadBlob } from '../engine/export-pdf';
import { exportDeckToPPTX } from '../engine/export-pptx';
import { exportDeckToHTML, downloadHTMLFile } from '../engine/export-html';

export function useExport({ deck }) {
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState(null); // 'pdf' | 'pptx' | 'html'
  const [exportError, setExportError] = useState(null);
  const slideContainerRef = useRef(null);

  const handleExportPDF = useCallback(async () => {
    const container = slideContainerRef.current;
    if (!container || exporting) return;

    setExportError(null);
    setExporting(true);
    setExportType('pdf');
    try {
      const blob = await exportDeckToPDF({
        slideContainer: container,
        deck,
        defaultTheme: deck.defaultTheme,
        onProgress: () => {},
      });
      downloadBlob(blob, `${deck.title || 'presentation'}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
      setExportError(err instanceof Error ? err.message : 'PDF export failed.');
    } finally {
      setExporting(false);
      setExportType(null);
    }
  }, [deck, exporting]);

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
    const container = slideContainerRef.current;
    if (!container || exporting) return;

    setExportError(null);
    setExporting(true);
    setExportType('html');
    try {
      const html = await exportDeckToHTML({
        slideContainer: container,
        deck,
        defaultTheme: deck.defaultTheme,
        onProgress: () => {},
      });
      downloadHTMLFile(html, `${deck.title || 'presentation'}.html`);
    } catch (err) {
      console.error('HTML export failed:', err);
      setExportError(err instanceof Error ? err.message : 'HTML export failed.');
    } finally {
      setExporting(false);
      setExportType(null);
    }
  }, [deck, exporting]);

  return {
    exporting,
    exportType,
    exportError,
    slideContainerRef,
    handleExportPDF,
    handleExportPPTX,
    handleExportHTML,
  };
}

export default useExport;
