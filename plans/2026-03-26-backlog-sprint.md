# DeckWing Backlog Sprint — Implementation Plan

> **Status:** DRAFT

## Specification

**Problem:** DeckWing's MVP is functional but has 5 outstanding backlog items: rough slide insertion UX, no PPTX export, no AI quality review, no offline HTML export, and no detached editor window.

**Goal:** Complete all 5 remaining items so DeckWing is polished enough for Rewst team daily use — smooth authoring, multiple export formats, AI-assisted quality, and flexible editing.

**Scope:**
- IN: Slide insert UX, PPTX export, AI review agent (async), HTML presentation export, detached editor window
- OUT: Auto-expanding chat input (already done), database persistence, hosted deployment, user accounts
- DERISKED: HTML export uses canvas-based rendering (like PDF), not a standalone React-free renderer

**Success Criteria:**
- [ ] Slides can be inserted between any two slides via hover-gap + button
- [ ] PPTX export produces a valid .pptx file with all 8 slide types mapped
- [ ] AI review agent runs asynchronously after deck creation and surfaces improvement suggestions via SSE
- [ ] HTML export produces a self-contained .html file with presenter and audience modes
- [ ] Editor can be detached to a separate browser window with live state sync
- [ ] All existing 145 tests still pass + new tests for each feature

## Context Loading

_Run before starting:_

```bash
read src/components/editor/SlideOutline.jsx
read src/components/editor/SlideEditor.jsx
read src/engine/renderer.jsx
read src/engine/export-pdf.js
read server/ai/chat-engine.js
read src/App.jsx
read src/config/themes.js
read src/config/colors.js
```

---

## Prerequisite: App.jsx Decomposition

### Task 0: Extract App.jsx into focused modules

**Context:** `src/App.jsx` (473 lines, growing)

Before wiring in 3 new export formats and a detached editor, App.jsx needs decomposition. This prevents the file from becoming unmaintainable.

**Steps:**

1. [ ] Extract `src/hooks/useDeckState.js` — all deck state management (deck, setDeck, currentSlideIndex, goToSlide, addSlide, removeSlide, duplicateSlide, reorderSlides, updateSlide, applyAction)
2. [ ] Extract `src/hooks/useExport.js` — export logic (handleExportPDF, exporting state)
3. [ ] Extract `src/components/auth/AuthGate.jsx` — the auth check + login flow (authState, polling, startLogin)
4. [ ] App.jsx becomes a thin layout shell that composes these hooks and components
5. [ ] All 145 existing tests still pass

**Verify:** `npm test && npm run build`

---

## UI Polish Tasks

### Task 1: Slide Insert UX Overhaul

**Context:** `src/components/editor/SlideOutline.jsx`, `src/components/editor/SlideTypePickerModal.jsx`

The existing SlideOutline has a complete drag-and-drop system (dragStart, dragOver, drop, dragEnd with drop indicators). The hover-gap insert must coexist with drag reorder — they use different interaction patterns: hover-gap triggers on mouse idle between slides (no drag active), while reorder triggers on dragStart.

**Steps:**

1. [ ] Remove the `+` button from the SlideOutline header
2. [ ] Add a "mini-slide" placeholder card at the bottom of the slide list — dashed border, `+` icon, clicking opens SlideTypePickerModal
3. [ ] Add hover-gap insert points between slides:
   - Track `hoverBetween` state (index) separate from `dropIndicator` (drag state)
   - Only show hover-gap when NOT dragging (`dragIndex.current === null`)
   - On hover between rows for >200ms, expand a gap with a small `+` button
   - Clicking the `+` opens SlideTypePickerModal with `insertAt` context
4. [ ] Update `onAddSlide` callback signature to `onAddSlide(slide, insertAt?)` — insertAt is optional, defaults to after current slide
5. [ ] Update App.jsx `addSlide` to respect `insertAt` parameter
6. [ ] Verify drag-and-drop still works correctly with hover-gap elements present

**Verify:** `npm test` + manual: hover between slides → + appears, click → type picker → slide inserted at that position. Drag still reorders.

---

## Export Tasks (gpt-5.4 via clink — worktree isolation)

### Task 2: PPTX Export Engine

**Context:** `src/engine/export-pdf.js` (pattern), `shared/schema/slide-schema.js`, `src/config/colors.js`

**Steps:**

1. [ ] Install `pptxgenjs` dependency
2. [ ] Create `src/engine/export-pptx.js` with `exportDeckToPPTX(deck)` function
3. [ ] Map all 8 slide types to pptxgenjs API calls:
   - title → centered text with title + subtitle
   - content → title + bullet list (use addText with bullet options)
   - grid → table or multi-column text layout
   - image → addImage (note: cross-origin images may fail — log warning, skip gracefully)
   - quote → centered italic text + attribution below
   - metric → table with large value cells + label cells
   - section → centered divider text
   - blank → empty slide
4. [ ] Map 5 Rewst themes to PPTX color schemes using hex values from `colors.js` palette
5. [ ] Return a Blob for download
6. [ ] Create `src/engine/export-pptx.test.js` (TDD):
   - Each slide type produces output without error
   - Theme colors are applied
   - Graceful handling of slides with missing optional fields
   - Cross-origin image slides produce a warning, not a crash

**Verify:** `npm test -- src/engine/export-pptx.test.js`

---

### Task 3: AI Review Agent (Async via SSE)

**Context:** `server/ai/chat-engine.js`, `server/app.js`

The review must be async to avoid doubling the 5-15 second deck generation latency. Use Server-Sent Events to push results to the client after the initial response.

**Steps:**

1. [ ] Create `server/ai/review-agent.js` with `reviewDeck(deck)` function
2. [ ] Build a review system prompt that evaluates:
   - Slide count vs. content density
   - Repeated slide types in sequence (3+ same type)
   - Missing section dividers in decks > 8 slides
   - Slides with > 5 bullet points
   - Theme variety
   - Empty/placeholder content
3. [ ] Return: `{ suggestions: [{ slideIndex, category, message }] }`
4. [ ] The review can run locally (no Claude API) — it's just schema analysis, not AI generation. This means zero additional API cost and instant results.
5. [ ] Add `GET /api/chat/review?sessionId=X` endpoint in `server/app.js` that runs the review on the current deck
6. [ ] Frontend: after receiving a `create_deck` action, fire a background fetch to the review endpoint
7. [ ] Display suggestions as a follow-up chat message (non-blocking)
8. [ ] Create `server/ai/review-agent.test.js` (TDD):
   - 10 content slides in a row → suggests section dividers
   - Good variety deck → no suggestions
   - 7-point bullet slide → suggests splitting

**Verify:** `npm test -- server/ai/review-agent.test.js`

---

## HTML Export Task (main thread)

### Task 4: Self-Contained HTML Presentation Export

**Context:** `src/engine/export-pdf.js` (html2canvas pattern), `src/engine/renderer.jsx`, `src/components/presenter/PresenterMode.jsx`

**Approach:** Use the same html2canvas strategy as the PDF exporter — render each slide to a PNG at 1920x1080, then embed the images in an HTML file with keyboard navigation. This avoids the impossible task of recreating the entire React/Tailwind renderer without React.

**Steps:**

1. [ ] Create `src/engine/export-html.js` with `exportDeckToHTML({ slideContainer, deck, defaultTheme, onProgress })` function
2. [ ] For each slide, capture it via html2canvas at 1920x1080 (reuse the pattern from export-pdf.js)
3. [ ] Build an HTML template string containing:
   - Slide images as base64 data URIs
   - Speaker notes per slide as a JSON data block
   - CSS for fullscreen display, transitions, and the notes panel
   - JavaScript for keyboard navigation (same keys as PresenterMode)
4. [ ] Implement mode toggle (floating button, bottom-right):
   - **Presenter:** slide image + bottom panel with notes + "Slide N/Total" + next slide title
   - **Audience:** clean fullscreen slide images + progress bar
5. [ ] Return as a string, trigger download as `.html`
6. [ ] Create `src/engine/export-html.test.js`:
   - Output contains base64 image data
   - Output contains speaker notes JSON
   - Output contains keyboard event listeners
   - Output is a complete valid HTML document

**Verify:** `npm test -- src/engine/export-html.test.js` + manual: export, open file, arrow keys work, N toggles notes

---

## Detached Editor Window

### Task 5: Extract Deck State + Detached Window

**Context:** `src/App.jsx`, `src/components/editor/SlideEditor.jsx`

This is a two-part task: first extract deck state into a shareable store, then build the cross-window sync.

**Steps:**

1. [ ] Create `src/store/deck-state.js` — a simple pub/sub store (no library needed):
   - `getState()`, `setState(partial)`, `subscribe(listener)`
   - Wraps the deck, currentSlideIndex, and slide operations
   - This is what `useDeckState.js` (from Task 0) will consume
2. [ ] Create `src/hooks/useDetachedEditor.js`:
   - `openEditor()` — calls `window.open()` with the editor page URL
   - On state change in parent, `postMessage` the serialized state to child
   - On edit event from child (`postMessage` back), apply to store
   - `closeEditor()` — close the window, revert to inline editor
   - Detect popup blocker: if `window.open()` returns null, fall back to modal
3. [ ] Create `public/editor.html` — a standalone page that:
   - Loads a thin React app mounting just EditorContent
   - Listens for postMessage with slide data
   - Sends postMessage back on edits
4. [ ] Add Vite multi-page config: `build.rollupOptions.input` includes both `index.html` and `public/editor.html`
5. [ ] Update SlideEditor pop-out button to use `useDetachedEditor` instead of the modal
6. [ ] Handle edge cases: popup blocked → modal fallback, window closed → revert to inline, parent navigates away → child closes
7. [ ] Create `src/hooks/useDetachedEditor.test.js`:
   - postMessage event shape
   - State sync round-trip
   - Popup blocker detection (window.open returns null)

**Verify:** `npm test -- src/hooks/useDetachedEditor.test.js` + manual: pop out, edit, see main window update

---

## Integration

### Task 6: Wire Features + Final Verification

**Context:** `src/App.jsx`, `src/hooks/useExport.js` (from Task 0), all new modules

**Steps:**

1. [ ] Wire Task 1: `addSlide(slide, insertAt)` in useDeckState
2. [ ] Wire Task 2: add `exportDeckToPPTX` to useExport hook
3. [ ] Wire Task 3: after `create_deck` action, fire async review + display suggestions
4. [ ] Wire Task 4: add `exportDeckToHTML` to useExport hook
5. [ ] Replace individual export buttons with a dropdown: PDF | PPTX | HTML Presentation
6. [ ] Wire Task 5: connect useDetachedEditor to SlideEditor
7. [ ] Full test suite: `npm test`
8. [ ] Build: `npm run build`
9. [ ] Tag release: `npm version minor && git push --tags`

**Verify:** `npm test && npm run build`

---

## Execution Plan

```
Phase 1 (parallel):
┌────────────────────────────────────────┐
│ Task 0: App.jsx Decomposition          │ (main thread, prerequisite)
└────────────────────────────────────────┘

Phase 2 (parallel after Task 0):
┌─────────────────────────┐  ┌──────────────────────────┐
│ Task 1: Slide Insert UX │  │ Task 2: PPTX Export      │ (gpt-5.4 clink)
│ (main thread)           │  │ Task 3: AI Review Agent  │ (gpt-5.4 clink)
└─────────────────────────┘  └──────────────────────────┘

Phase 3 (parallel after Phase 2):
┌─────────────────────────┐  ┌──────────────────────────┐
│ Task 4: HTML Export      │  │ Task 5: Detached Editor  │
│ (main thread)           │  │ (main thread)            │
└─────────────────────────┘  └──────────────────────────┘

Phase 4 (sequential):
┌────────────────────────────────────────┐
│ Task 6: Integration + Release          │
└────────────────────────────────────────┘
```

**Team assignment:**
- Tasks 2 + 3 → gpt-5.4 via clink (worktree isolation, must pass `npm test` before merge)
- Task 0 + 1 → main thread (touches App.jsx/SlideOutline)
- Tasks 4 + 5 → main thread (renderer/React coupling)
- Task 6 → main thread (integration)

## Review Notes

Devil's advocate review caught:
- **Auto-expanding chat input was already implemented** — removed from plan
- **HTML export standalone renderer is impractical** — switched to html2canvas approach (render slides to PNG, embed in HTML). Loses text selectability but ships in hours not weeks.
- **AI review should be async** — redesigned as local schema analysis (zero API cost, instant) + SSE push to avoid blocking deck generation
- **Detached editor needs state extraction first** — added Task 0 (App.jsx decomposition) and Task 5 part 1 (deck-state store) as prerequisites
- **App.jsx is too large for more features** — added Task 0 to decompose before wiring in new features
- **PPTX cross-origin images will fail** — added graceful skip + warning to Task 2
- **Drag-and-drop vs hover-gap conflict** — added explicit coexistence design to Task 1 (hover-gap only when not dragging)
