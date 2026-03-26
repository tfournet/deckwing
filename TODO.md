# Rewst Deck Builder — Current State & Next Steps

> Last updated: 2026-03-25

## What's Done

### Phase 1: AI Chat Engine (complete)
- `server/ai/system-prompt.js` — full system prompt with slide schema, brand rules, JSON output format
- `server/ai/chat-engine.js` — Claude API integration, session management, JSON parsing with fallback, schema validation
- `server/index.js` — `POST /api/chat` and `POST /api/chat/reset` endpoints wired up
- `src/hooks/useChat.js` — chat state hook with `sendMessage`, `resetChat`, `isLoading`
- `src/components/chat/ChatPanel.jsx` — right sidebar with message list, auto-scroll, suggested prompts
- `src/components/chat/ChatMessage.jsx` — user/AI message bubbles, action preview badges, typing indicator
- `src/App.jsx` — `applyAction()` handles all 5 action types (create_deck, update_slide, add_slide, remove_slide, reorder)

### Phase 2: Editor (components built, partially wired)
- `src/components/editor/SlideEditor.jsx` — **WIRED into App.jsx** — type-adaptive form, theme selector, speaker notes
- `src/components/editor/PointsEditor.jsx` — bullet list editor (add/remove/reorder, max 5)
- `src/components/editor/GridItemEditor.jsx` — grid item editor (title/desc/icon per item)
- `src/components/editor/MetricsEditor.jsx` — metrics editor (value/label/color, max 4)
- `src/components/editor/JsonEditor.jsx` — **NOT wired** — standalone component, needs integration
- `src/components/editor/SlideOutline.jsx` — **NOT wired** — standalone component, needs integration
- `src/components/editor/SlideTypePickerModal.jsx` — used by SlideOutline

## What Needs Doing

### Integration Work (do first)

**Wire SlideOutline into App.jsx:**
- Replace the inline slide list in the left `<aside>` with `<SlideOutline>`
- Add callbacks: `onReorderSlides`, `onDuplicateSlide`, `onAddSlide` (by type)
- `onAddSlide` receives a slide type string → use `createSlide(type, defaults)` from schema
- `onDuplicateSlide` receives an index → copy slide, generate new ID, insert after current
- `onReorderSlides` receives the new slides array → replace `deck.slides`

**Wire JsonEditor into SlideEditor:**
- Add a toggle in `SlideEditor.jsx` to flip between visual editor and `<JsonEditor>`
- Pass `value={currentSlide}`, `mode="slide"`, `onChange={handleJsonChange}`
- `handleJsonChange` should call `onUpdateSlide(index, newSlideData)` — replace entire slide fields
- Consider adding a "Deck JSON" toggle that shows the full deck (use `mode="deck"`)

### Phase 3: Persistence & Export

**Task 5: localStorage Persistence**
- Create `src/store/deck-store.js`:
  - `saveDeck(deck)` — debounced save to localStorage (key: `rewst-deck-${deck.id}`)
  - `loadDeck(id)` — load from localStorage
  - `listDecks()` — return all saved deck metadata (id, title, updatedAt, slideCount)
  - `deleteDeck(id)` — remove from localStorage
- In App.jsx: load deck from localStorage on mount, save on every deck state change (debounced 500ms)
- Add a deck list modal: "New Deck" / "Open" / "Delete" — triggered from header
- Auto-save indicator in the header bar (shows "Saved" or "Saving...")

**Task 6: PDF Export**
- Create `src/engine/export-pdf.js`:
  - Render each slide to canvas (html2canvas or dom-to-image)
  - Assemble into PDF (jsPDF or pdf-lib — both already patterns from the original repo)
  - 16:9 aspect ratio per page
- Add "Export PDF" button in the header
- Progress indicator during export
- Will need new deps: `npm install html2canvas jspdf`

### Phase 4: Polish

**Task 7: Presenter Mode**
- Current presenter mode in App.jsx is minimal (keyboard nav + progress bar)
- Add: speaker notes overlay (toggle with N key)
- Add: slide notes field is already in SlideEditor, just needs rendering in present mode
- Consider: separate presenter window (window.open) showing notes + next slide preview

**Task 8: Starter Templates**
- Create `src/data/templates.js` with 5 pre-built decks:
  - QBR (Quarterly Business Review) — 8 slides
  - Security Assessment Summary — 6 slides
  - Customer Onboarding — 7 slides
  - Product Demo / Feature Overview — 8 slides
  - Team Update / All-Hands — 6 slides
- Each template: complete deck with realistic placeholder content, mixed slide types, appropriate themes
- Add "Start from template" in the new deck flow (deck list modal)

## Architecture Notes

- **Slide schema** (`src/schema/slide-schema.js`): 8 typed slide types, each with required/optional fields. `createSlide()` generates IDs. `validateSlide()`/`validateDeck()` for validation.
- **Renderer** (`src/engine/renderer.jsx`): `renderSlide(slide, defaultTheme)` maps schema → React component. `SlideFrame` wraps with theme background.
- **AI output**: Claude returns `{ reply: string, action: { type, data } | null }`. Actions modify deck state in `applyAction()`.
- **Model**: Using `claude-sonnet-4-6-20250514` for generation (set in `server/ai/chat-engine.js`).
- **No database**: MVP is localStorage only. Auth and DB are V2 concerns.
- **Fragile import**: `server/ai/chat-engine.js` imports from `../../src/schema/slide-schema.js` — works but should eventually be a shared module.

## Running

```bash
cp .env.example .env        # Add your ANTHROPIC_API_KEY
npm install
npm run dev:full             # Frontend (port 3000) + backend (port 3001)
```
