/**
 * Trigger a browser file download from a Blob.
 *
 * @param {Blob} blob - the content to download
 * @param {string} filename - suggested filename for the download
 */
export function downloadFile(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Convenience wrapper: converts an HTML string to a Blob and downloads it.
 *
 * @param {string} htmlString - raw HTML document content
 * @param {string} filename - suggested filename for the download
 */
export function downloadHTMLFile(htmlString, filename) {
  const blob = new Blob([htmlString], { type: 'text/html' });
  downloadFile(blob, filename);
}
