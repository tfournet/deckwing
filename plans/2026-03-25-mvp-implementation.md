# Rewst Deck Builder - MVP Implementation Plan

> **Status:** DRAFT

## Specification

**Problem:** Rewst internal team (sales, marketing, SEs) manually builds presentation decks, which is time-consuming and leads to inconsistent branding. There's no tool that generates on-brand Rewst presentations from natural language.

**Goal:** An internal web app where a Rewst team member can describe a presentation topic, have AI generate a complete slide deck in Rewst brand style, refine it through conversation, and export it.

**Scope:**
- IN: Conversational deck builder, 8 slide types, 5 Rewst themes, PDF export, localStorage persistence
- OUT: Multi-user auth, database persistence, PPTX export, interactive demos, collaboration, custom themes

**Success Criteria:**
- [ ] User can generate a complete 10-slide deck from a single prompt in < 60 seconds
- [ ] All generated slides conform to Rewst brand guidelines (colors, fonts, spacing)
- [ ] User can refine individual slides through conversational chat
- [ ] Decks can be presented in fullscreen presenter mode
- [ ] Decks persist across browser sessions (localStorage)
- [ ] PDF export works

---

## Context Loading

_Run before starting:_

```bash
read src/schema/slide-schema.js
read src/engine/renderer.jsx
read src/App.jsx
read src/config/themes.js
read server/index.js
```

---

## Phase 1: Conversational AI Engine

### Task 1: AI Chat Backend

**Context:** `server/index.js`, `src/schema/slide-schema.js`

**Steps:**

1. [ ] Create `server/ai/chat-engine.js` with the Claude API integration
   - System prompt that understands the slide schema (all 8 types + their fields)
   - Includes Rewst brand writing rules (no triplet bullets, no em-dashes, educational tone)
   - Returns structured JSON: `{ action: 'create_deck' | 'update_slide' | 'add_slide' | 'remove_slide' | 'reorder', data: {...} }`
2. [ ] Create `server/ai/system-prompt.js` with the full system prompt
   - Slide type definitions and constraints
   - Brand voice guidelines
   - JSON output format specification
3. [ ] Wire up `POST /api/chat` endpoint to use the chat engine
   - Accepts: `{ message: string, deck: object, currentSlideIndex: number }`
   - Returns: `{ reply: string, action: object | null }`
4. [ ] Add conversation history management (in-memory per session)
5. [ ] Test with curl: generate a deck, modify a slide, add a slide

**Verify:** `curl -X POST http://localhost:3001/api/chat -H 'Content-Type: application/json' -d '{"message":"Create a 5-slide deck about why MSPs need automation"}'`

---

### Task 2: Chat UI Component

**Context:** `src/App.jsx`, `src/components/chat/`

**Steps:**

1. [ ] Create `src/components/chat/ChatPanel.jsx` - the right sidebar chat interface
   - Message list (user + AI messages)
   - Input with send button
   - Loading state while AI processes
   - Auto-scroll to latest message
2. [ ] Create `src/components/chat/ChatMessage.jsx` - individual message bubble
   - User messages: right-aligned, indigo bg
   - AI messages: left-aligned, with Bot Teal accent
   - Support for "action previews" (show what the AI will change)
3. [ ] Wire ChatPanel into App.jsx, replacing the placeholder
4. [ ] Connect to `POST /api/chat` endpoint
5. [ ] Apply AI responses to deck state (create deck, update slides, etc.)

**Verify:** Open the app, type a prompt, see AI-generated slides appear in the preview.

---

## Phase 2: Slide Editor

### Task 3: Inline Slide Editing

**Context:** `src/App.jsx`, `src/engine/renderer.jsx`, `src/components/editor/`

**Steps:**

1. [ ] Create `src/components/editor/SlideEditor.jsx` - edit panel below the preview
   - Form fields that adapt to slide type (title gets title+subtitle, content gets title+points, etc.)
   - Theme selector per slide (dropdown of 5 themes)
   - Slide type changer (dropdown)
2. [ ] Create `src/components/editor/PointsEditor.jsx` - editable bullet point list
   - Add/remove/reorder points
   - Inline text editing
3. [ ] Create `src/components/editor/GridItemEditor.jsx` - editable grid items
   - Add/remove items
   - Edit title, description, icon per item
4. [ ] Wire editor changes back to deck state in App.jsx
5. [ ] Live preview updates as user edits

**Verify:** Click a slide, edit its title in the editor, see the preview update in real-time.

---

### Task 3b: JSON Edit Mode

**Context:** `src/components/editor/`, `src/schema/slide-schema.js`

**Steps:**

1. [ ] Create `src/components/editor/JsonEditor.jsx` - raw schema editor
   - Textarea (MVP) or Monaco editor showing the current slide's JSON
   - Toggle button in the editor panel to flip between visual editor and JSON mode
   - Syntax highlighting via a lightweight lib or plain monospace textarea
2. [ ] Validate edits against `validateSlide()` on every change (debounced)
   - Show validation errors inline below the editor
   - Only apply valid JSON to deck state
3. [ ] Add "Format JSON" button to auto-prettify
4. [ ] Support editing the full deck JSON (not just current slide) via a "Deck JSON" toggle
   - Validates with `validateDeck()` before applying

**Verify:** Toggle to JSON mode, hand-edit a slide title in JSON, see preview update. Introduce a schema error, see validation message. Fix it, see it apply.

---

### Task 4: Slide Reordering and Management

**Context:** `src/App.jsx`

**Steps:**

1. [ ] Add drag-to-reorder in the slide outline panel (left sidebar)
   - Use native HTML drag-and-drop (no library needed for MVP)
2. [ ] Add duplicate slide action
3. [ ] Add keyboard shortcuts: arrow keys to navigate, Delete to remove, Ctrl+D to duplicate
4. [ ] Slide type quick-add: click "+" shows a type picker (title, content, grid, etc.)

**Verify:** Drag slides to reorder, use keyboard shortcuts, add slides via type picker.

---

## Phase 3: Persistence & Export

### Task 5: localStorage Persistence

**Context:** `src/App.jsx`, `src/schema/slide-schema.js`

**Steps:**

1. [ ] Create `src/store/deck-store.js` - deck persistence layer
   - Save deck to localStorage on every change (debounced)
   - Load deck from localStorage on app start
   - Support multiple saved decks (list view)
2. [ ] Add deck list view (simple modal or route)
   - Show saved decks with title, date, slide count
   - Create new / Open existing / Delete
3. [ ] Auto-save indicator in the top bar

**Verify:** Create a deck, refresh the page, deck is still there.

---

### Task 6: PDF Export

**Context:** `src/engine/renderer.jsx`

**Steps:**

1. [ ] Create `src/engine/export-pdf.js` - client-side PDF generation
   - Render each slide to a canvas using html2canvas (or similar)
   - Assemble into PDF using pdf-lib or jsPDF
   - Respect slide aspect ratio (16:9)
2. [ ] Add "Export PDF" button in the top bar
3. [ ] Show progress during export (slide X of Y)

**Verify:** Click Export PDF, download opens with all slides rendered correctly.

---

## Phase 4: Polish

### Task 7: Presenter Mode

**Context:** `src/App.jsx`

**Steps:**

1. [ ] Enhance presenter mode with keyboard shortcuts
   - Space/Right = next, Left = prev, Escape = exit
   - N = toggle presenter notes view
   - Progress bar at bottom
2. [ ] Add speaker notes field to slide schema and editor
3. [ ] Speaker notes display (separate window or overlay)

**Verify:** Enter presenter mode, navigate with keyboard, toggle notes.

---

### Task 8: Starter Templates

**Context:** `src/schema/slide-schema.js`

**Steps:**

1. [ ] Create `src/data/templates.js` with pre-built deck templates:
   - QBR (Quarterly Business Review)
   - Security Assessment Summary
   - Customer Onboarding
   - Product Demo / Feature Overview
   - Team Update / All-Hands
2. [ ] Add "Start from template" option in new deck flow
3. [ ] Templates should be complete decks (6-10 slides each) with placeholder content

**Verify:** Create a new deck from QBR template, see pre-populated slides.

---

## Dependency Graph

```
Phase 1 (AI Engine)          Phase 2 (Editor)
  Task 1: AI Backend ──────► Task 3: Inline Editing
  Task 2: Chat UI ──────────► Task 4: Slide Management

Phase 3 (Persistence)       Phase 4 (Polish)
  Task 5: localStorage       Task 7: Presenter Mode
  Task 6: PDF Export         Task 8: Templates

Phases 1-2 can run in parallel.
Phase 3 depends on Phase 1 (need decks to save).
Phase 4 is independent and can run anytime.
```

---

## Review Notes

Key risks identified:
- **AI output quality:** The system prompt must be very precise about JSON format. Invalid JSON from Claude will break the UI. Plan: Validate all AI output against slide schema before applying.
- **Schema evolution:** As we add slide types, existing saved decks may not match new schema. Plan: Version the schema, add migration on load.
- **PDF rendering fidelity:** html2canvas may not capture Tailwind styles perfectly. Plan: Test early in Phase 3, consider Puppeteer server-side as fallback.
