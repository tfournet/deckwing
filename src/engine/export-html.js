import html2canvas from 'html2canvas';
import { THEME_COLORS } from '../../shared/theme-colors.js';

function formatHexColor(color) {
  return `#${color}`;
}

function resolveTheme(defaultTheme) {
  const theme = THEME_COLORS[defaultTheme] || THEME_COLORS.rewst;
  return {
    accent: formatHexColor(theme.accent),
    panel: formatHexColor(theme.bg),
    text: formatHexColor(theme.text),
  };
}

function escapeScriptContent(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function waitForNextPaint() {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => resolve());
      return;
    }

    setTimeout(resolve, 0);
  });
}

function buildHTMLDocument({ deckTitle, slides, themeName, theme }) {
  const safeDeckTitle = escapeHTML(deckTitle || 'DeckWing Presentation');
  const safeThemeName = escapeHTML(themeName);
  const serializedSlides = escapeScriptContent(slides);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark" />
  <title>${safeDeckTitle}</title>
  <style>
    :root {
      --dw-bg: #000000;
      --dw-panel: ${theme.panel};
      --dw-accent: ${theme.accent};
      --dw-text: ${theme.text};
      --dw-muted: rgba(255, 255, 255, 0.72);
      --dw-border: rgba(255, 255, 255, 0.12);
      --dw-font: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    * { box-sizing: border-box; }

    html, body {
      margin: 0;
      min-height: 100%;
      background: var(--dw-bg);
      color: var(--dw-text);
      font-family: var(--dw-font);
    }

    body {
      overflow: hidden;
    }

    button {
      font: inherit;
      color: inherit;
    }

    .app {
      position: relative;
      width: 100vw;
      height: 100vh;
      background: var(--dw-bg);
    }

    .viewer {
      position: absolute;
      inset: 0 0 4px 0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      transition: inset 180ms ease;
    }

    .slide-image {
      display: block;
      max-width: 100vw;
      max-height: 100vh;
      width: auto;
      height: auto;
      object-fit: contain;
      box-shadow: 0 24px 48px rgba(0, 0, 0, 0.35);
    }

    .empty-state {
      font-size: 18px;
      color: var(--dw-muted);
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .progress-track {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: 4px;
      background: rgba(255, 255, 255, 0.08);
    }

    .progress-bar {
      height: 100%;
      width: 0%;
      background: var(--dw-accent);
      transition: width 180ms ease;
    }

    .presenter-panel {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 4px;
      height: 30vh;
      display: none;
      grid-template-columns: minmax(0, 2fr) minmax(260px, 1fr);
      gap: 20px;
      padding: 24px;
      background: var(--dw-panel);
      border-top: 1px solid var(--dw-border);
    }

    .presenter-mode .viewer {
      inset: 0 0 calc(30vh + 4px) 0;
    }

    .presenter-mode .slide-image {
      max-height: calc(70vh - 48px);
    }

    .presenter-mode .presenter-panel {
      display: grid;
    }

    .eyebrow {
      margin: 0 0 10px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--dw-accent);
    }

    .notes {
      margin: 0;
      white-space: pre-wrap;
      line-height: 1.6;
      font-size: 16px;
      color: var(--dw-text);
    }

    .panel-card {
      border: 1px solid var(--dw-border);
      border-radius: 16px;
      padding: 16px;
      background: rgba(0, 0, 0, 0.24);
    }

    .meta-label {
      margin: 0 0 8px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--dw-muted);
    }

    .meta-value {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      line-height: 1.35;
    }

    .meta-subtle {
      margin: 8px 0 0;
      font-size: 12px;
      color: var(--dw-muted);
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }

    .counter {
      margin-top: 18px;
      font-size: 14px;
      color: var(--dw-muted);
      font-variant-numeric: tabular-nums;
    }

    .mode-toggle {
      position: fixed;
      right: 18px;
      bottom: 18px;
      width: 48px;
      height: 48px;
      border: 1px solid var(--dw-border);
      border-radius: 999px;
      background: rgba(20, 17, 33, 0.9);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
    }

    .mode-toggle:hover {
      border-color: var(--dw-accent);
    }

    .mode-toggle-label {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
  </style>
</head>
<body data-theme="${safeThemeName}">
  <div class="app" id="app">
    <div class="viewer">
      <img class="slide-image" id="slide-image" alt="" />
      <div class="empty-state" id="empty-state" hidden>No slides available</div>
    </div>

    <section class="presenter-panel" id="presenter-panel" aria-live="polite">
      <section>
        <p class="eyebrow">Speaker Notes</p>
        <p class="notes" id="speaker-notes">No speaker notes for this slide.</p>
      </section>

      <aside>
        <div class="panel-card">
          <p class="meta-label">Next Slide</p>
          <p class="meta-value" id="next-slide-title">End of deck</p>
          <p class="meta-subtle" id="next-slide-type"></p>
        </div>
        <div class="counter" id="slide-counter">0 / 0</div>
      </aside>
    </section>

    <div class="progress-track" aria-hidden="true">
      <div class="progress-bar" id="progress-bar"></div>
    </div>

    <button class="mode-toggle" id="mode-toggle" type="button" aria-label="Toggle presenter mode">
      <span class="mode-toggle-label">N</span>
    </button>
  </div>

  <script id="deck-data" type="application/json">${serializedSlides}</script>
  <script>
    const slides = JSON.parse(document.getElementById('deck-data').textContent);
    let currentSlide = 0;
    let presenterMode = false;

    const app = document.getElementById('app');
    const slideImage = document.getElementById('slide-image');
    const emptyState = document.getElementById('empty-state');
    const speakerNotes = document.getElementById('speaker-notes');
    const nextSlideTitle = document.getElementById('next-slide-title');
    const nextSlideType = document.getElementById('next-slide-type');
    const slideCounter = document.getElementById('slide-counter');
    const progressBar = document.getElementById('progress-bar');
    const modeToggle = document.getElementById('mode-toggle');

    function clampSlide(index) {
      if (!slides.length) return 0;
      return Math.max(0, Math.min(index, slides.length - 1));
    }

    function renderSlide() {
      if (!slides.length) {
        slideImage.hidden = true;
        emptyState.hidden = false;
        speakerNotes.textContent = 'No speaker notes for this slide.';
        nextSlideTitle.textContent = 'End of deck';
        nextSlideType.textContent = '';
        slideCounter.textContent = '0 / 0';
        progressBar.style.width = '0%';
        return;
      }

      const slide = slides[currentSlide];
      const nextSlide = slides[currentSlide + 1];
      const progress = ((currentSlide + 1) / slides.length) * 100;

      slideImage.hidden = false;
      emptyState.hidden = true;
      slideImage.src = slide.imageDataURI;
      slideImage.alt = slide.title || ('Slide ' + (currentSlide + 1));
      speakerNotes.textContent = (slide.notes || '').trim() || 'No speaker notes for this slide.';
      nextSlideTitle.textContent = nextSlide ? (nextSlide.title || 'Untitled slide') : 'End of deck';
      nextSlideType.textContent = nextSlide && nextSlide.type ? String(nextSlide.type).toUpperCase() : '';
      slideCounter.textContent = (currentSlide + 1) + ' / ' + slides.length;
      progressBar.style.width = progress + '%';
    }

    function togglePresenterMode(forceState) {
      presenterMode = typeof forceState === 'boolean' ? forceState : !presenterMode;
      app.classList.toggle('presenter-mode', presenterMode);
      renderSlide();
    }

    function goToSlide(index) {
      currentSlide = clampSlide(index);
      renderSlide();
    }

    function goNext() {
      goToSlide(currentSlide + 1);
    }

    function goPrev() {
      goToSlide(currentSlide - 1);
    }

    window.addEventListener('keydown', (event) => {
      switch (event.key) {
        case ' ':
        case 'ArrowRight':
        case 'PageDown':
          event.preventDefault();
          goNext();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          event.preventDefault();
          goPrev();
          break;
        case 'Home':
          event.preventDefault();
          goToSlide(0);
          break;
        case 'End':
          event.preventDefault();
          goToSlide(slides.length - 1);
          break;
        case 'n':
        case 'N':
          event.preventDefault();
          togglePresenterMode();
          break;
        case 'Escape':
          if (presenterMode) {
            event.preventDefault();
            togglePresenterMode(false);
          }
          break;
        default:
          break;
      }
    });

    modeToggle.addEventListener('click', () => togglePresenterMode());
    renderSlide();
  </script>
</body>
</html>`;
}

/**
 * Export a deck as a self-contained offline HTML presentation.
 * @param {object} params
 * @param {HTMLElement} params.slideContainer
 * @param {object} params.deck
 * @param {string} params.defaultTheme
 * @param {(currentSlide:number,totalSlides:number)=>void} [params.onProgress]
 * @returns {Promise<string>}
 */
export async function exportDeckToHTML({ slideContainer, deck, defaultTheme, onProgress }) {
  const slides = deck?.slides ?? [];
  const totalSlides = slides.length;
  const themeName = defaultTheme || deck?.defaultTheme || 'rewst';
  const theme = resolveTheme(themeName);
  const exportedSlides = [];

  for (let i = 0; i < totalSlides; i += 1) {
    if (typeof onProgress === 'function') {
      onProgress(i + 1, totalSlides);
    }

    await waitForNextPaint();

    const canvas = await html2canvas(slideContainer, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
    });

    exportedSlides.push({
      imageDataURI: canvas.toDataURL('image/png'),
      notes: slides[i]?.notes ?? '',
      title: slides[i]?.title ?? '',
      type: slides[i]?.type ?? 'slide',
    });
  }

  return buildHTMLDocument({
    deckTitle: deck?.title,
    slides: exportedSlides,
    themeName,
    theme,
  });
}

export function downloadHTMLFile(htmlString, filename) {
  const blob = new Blob([htmlString], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
