import { useState, useRef, useCallback } from 'react';
import { exportDeckToPDF, downloadBlob } from '../engine/export-pdf';

export function useExport({ deck }) {
  const [exporting, setExporting] = useState(false);
  const slideContainerRef = useRef(null);

  const handleExportPDF = useCallback(async () => {
    const container = slideContainerRef.current;
    if (!container || exporting) return;

    setExporting(true);
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
    } finally {
      setExporting(false);
    }
  }, [deck, exporting]);

  return { exporting, slideContainerRef, handleExportPDF };
}

export default useExport;
