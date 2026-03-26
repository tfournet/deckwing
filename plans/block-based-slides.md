# Block-Based Slide System — Design Document

> Status: DESIGN — no code yet
> Author: Tim + Claude
> Date: 2026-03-26
> Updated: 2026-03-26 (layout-first, PPTX strategy, adversarial review r2, custom layouts, export pipeline)

## Problem

The current 8 fixed slide types (title, content, grid, metric, quote, section, image, blank) are fast to generate but hit walls quickly. Users can't mix a metric with a quote, put two lists side by side, or create anything the predefined types don't support. The AI is constrained to generating content that fits rigid templates.

## Goal

Any slide layout that a human could sketch on a whiteboard should be expressible in the schema, generable by AI, renderable in the app, and exportable to PPTX — all while enforcing Rewst brand guidelines by default.

## Core Concept

A slide is a **grid of blocks**. Each block is a typed content element (heading, text, list, metric, image, etc.) placed on a 12-column, 6-row grid.

**Key design decision: Layout-First approach.** Instead of having the AI calculate raw grid coordinates, slides use **named layouts with slots**. The AI picks a layout and fills slots with content. A layout system resolves slots to grid positions. This separates content generation (AI is good at) from spatial layout (deterministic code).

The existing 8 slide types remain as **presets** — backward compatible, unchanged.

---

## Architecture: Four Tiers (Distinct Types)

Each tier has its own `type` value. No overloading. Progressive complexity.

```
type: "title" | "content" | "grid" | ... (presets)
  → Backward compatible, fast, existing renderer
  → AI uses by default for standard slides
  → Schema v1 (unchanged)

type: "layout" with layout: "<name>" (named layout)
  → Pick from ~21 templates with named slots
  → AI picks layout name + fills slots with content
  → Schema v2

type: "layout" with layout: "custom" (custom layout)
  → AI defines slots inline on the 12×6 grid
  → Same validation, rendering, and export as named layouts
  → For unique arrangements that don't match any template
  → Schema v2 (same type, just inline slots)

type: "freeform" (FUTURE — raw per-block grid, v3 only)
  → Power users, full control, per-block positioning
  → Many blocks with individual positions (not slots)
  → Schema v3
```

**The custom layout tier fills the gap** between "pick from 21 templates" and "full freeform." The AI defines 4-6 slot rectangles on the grid — much simpler than positioning 15 individual blocks. The same renderer, exporter, and validator handle both named and custom layouts because the data shape is identical (slots + blocks). The only difference is whether slots come from the registry or inline.

### AI Decision Tree

```
User asks for a standard slide?
  → Preset (title, content, grid, etc.)

User asks for a common custom layout?
  → Named layout (two-column, dashboard, etc.)

User asks for something unique?
  → Custom layout (AI defines 4-6 slots on the grid)

Power user wants full control in editor?
  → Freeform (v3 — per-block positioning)
```

---

## Prerequisites: Infrastructure Before Features

These must land BEFORE any block/layout code:

### P1: Schema Versioning + Deck Migration

`shared/schema/slide-schema.js` and `src/store/deck-store.js` need:

```js
// Every deck gets a version
export const CURRENT_SCHEMA_VERSION = 2;

// createDeck() stamps the version on new decks
export function createDeck(metadata = {}) {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    schemaVersion: CURRENT_SCHEMA_VERSION,  // <-- always stamped
    title: metadata.title || 'Untitled Presentation',
    // ... rest of existing fields
  };
}

// On load, migrate old decks
export function migrateDeck(deck) {
  const version = deck.schemaVersion || 1;
  if (version === 1) {
    // v1 → v2: add schemaVersion field, no structural changes
    return { ...deck, schemaVersion: 2 };
  }
  return deck;
}
```

`createDeck()` stamps `schemaVersion` on every new deck. `deck-store.js` calls `migrateDeck()` on every `loadDeck()`. Old decks (no `schemaVersion`) are treated as v1 and upgraded transparently. This is a standalone change that benefits the existing codebase — ship it now, before any block work.

### P2: Fix `update_slide` Validation Bypass

In `server/ai/chat-engine.js`, `validateActionSlides()` only validates `update_slide` changes when `changes.type` is present. Block-only updates (`changes.blocks = [...]`) bypass validation entirely.

Fix: when `update_slide` includes blocks, validate the **merged slide state** against the layout definition — not just field presence:

```js
} else if (action.type === 'update_slide' && action.data.changes) {
  const changes = action.data.changes;

  // If changing type, validate the new type
  if (changes.type) {
    const result = validateSlide({ ...changes });
    result.errors.forEach(e => errors.push(`Update changes: ${e}`));
  }

  // If changing blocks on a layout slide, validate against the layout
  if (Array.isArray(changes.blocks)) {
    const layoutId = changes.layout || currentSlide?.layout;
    if (layoutId && layoutId !== 'custom') {
      const layout = getLayout(layoutId);
      if (layout) {
        // Check each block against the layout's slot definitions
        const usedSlots = new Set();
        changes.blocks.forEach((block, i) => {
          if (!block.kind) errors.push(`Block ${i}: missing "kind"`);
          if (!block.slot) errors.push(`Block ${i}: missing "slot"`);

          const slotDef = layout.slots.find(s => s.name === block.slot);
          if (!slotDef) {
            errors.push(`Block ${i}: slot "${block.slot}" not in layout "${layoutId}"`);
          } else if (!slotDef.kinds.includes(block.kind)) {
            errors.push(`Block ${i}: kind "${block.kind}" not allowed in slot "${block.slot}"`);
          }

          if (usedSlots.has(block.slot)) {
            errors.push(`Block ${i}: duplicate slot "${block.slot}"`);
          }
          usedSlots.add(block.slot);
        });

        // Check required slots are filled
        layout.slots.filter(s => s.required).forEach(s => {
          if (!usedSlots.has(s.name)) {
            errors.push(`Required slot "${s.name}" not filled`);
          }
        });
      }
    }
    // Custom layouts: validate slots don't overlap and fit the grid
    if (layoutId === 'custom' && Array.isArray(changes.slots)) {
      validateCustomSlots(changes.slots, errors);
    }
  }
  return errors;
}
```

This validates the actual semantic correctness — not just "does the JSON have the right shape" but "does the content match the layout contract."

### Merge Semantics for Partial Updates

When `update_slide` receives `changes`, the validator must reconstruct the candidate slide before validating:

```js
// Reconstruct the full slide state after merge
const candidateSlide = {
  ...currentSlide,           // existing slide data
  ...changes,                // scalar field overrides (title, theme, etc.)
};

// blocks and slots are REPLACED, not merged (array replace semantics)
if (changes.blocks) candidateSlide.blocks = changes.blocks;
if (changes.slots) candidateSlide.slots = changes.slots;

// Now validate the candidate as a complete slide
validateLayoutSlide(candidateSlide);
```

**Array replace, not merge:** If `changes.blocks` is present, it replaces the entire blocks array. This avoids complex per-block diffing and matches how the AI generates updates ("here's the new blocks array"). Same for `slots` on custom layouts.

### P3: Shared Layout Registry

Create `shared/layouts/` as the **single source of truth** for all layout definitions. Every consumer imports from here:

```
shared/layouts/
  index.js          — exports all layouts, getLayout(), getLayoutNames()
  two-column.json   — layout definition
  dashboard.json    — layout definition
  ...
```

Each layout JSON file is **self-contained** with ALL metadata:

```json
{
  "id": "two-column",
  "name": "Two Columns",
  "description": "Side-by-side content areas",
  "promptDescription": "Use for comparing two things, before/after, or splitting content into two parallel sections.",
  "editorLabel": "Two Columns",
  "editorIcon": "Columns",
  "thumbnail": "two-column.svg",
  "slots": [
    {
      "name": "title",
      "label": "Title",
      "kinds": ["heading"],
      "required": true,
      "position": { "col": 1, "row": 1, "colSpan": 12, "rowSpan": 1 },
      "maxContent": { "text": 80 }
    },
    {
      "name": "left",
      "label": "Left Column",
      "kinds": ["list", "text", "metric", "chart", "image"],
      "required": true,
      "position": { "col": 1, "row": 2, "colSpan": 6, "rowSpan": 5 },
      "maxContent": { "list": 5, "text": 300 }
    },
    {
      "name": "right",
      "label": "Right Column",
      "kinds": ["list", "text", "metric", "chart", "image"],
      "required": true,
      "position": { "col": 7, "row": 2, "colSpan": 6, "rowSpan": 5 },
      "maxContent": { "list": 5, "text": 300 }
    }
  ],
  "pptx": {
    "slotOverrides": {}
  }
}
```

Fields:
- `promptDescription` — injected into AI system prompt (generated dynamically, not hardcoded)
- `editorLabel` + `editorIcon` — used by the layout picker UI
- `thumbnail` — SVG filename in `shared/layouts/thumbnails/` for visual preview in the layout picker
- `slots[].label` — used by slot editor forms
- `slots[].kinds` — validation: which block types fit this slot
- `slots[].required` — validation: must be filled
- `slots[].maxContent` — review agent content capacity hints
- `pptx.slotOverrides` — hand-tuned PPTX coordinates when grid math isn't optimal

**One file = one layout. Truly self-contained.** Adding a layout means adding one JSON file. A `validate-layouts` CI step checks all required fields.

---

## Slide Schema

### Current: Presets (unchanged, schema v1)

```json
{
  "type": "content",
  "title": "Why Automate",
  "points": ["Point 1", "Point 2"],
  "icon": "Zap",
  "theme": "rewst"
}
```

### New: Layout-based (schema v2)

```json
{
  "type": "layout",
  "layout": "two-column",
  "theme": "rewst",
  "customColors": null,
  "notes": "Speaker notes here",
  "blocks": [
    {
      "slot": "title",
      "kind": "heading",
      "text": "Before vs After Automation",
      "size": "lg"
    },
    {
      "slot": "left",
      "kind": "list",
      "items": ["Manual: 4 hours per user", "6-8 tools touched", "Error-prone"],
      "style": "bullet"
    },
    {
      "slot": "right",
      "kind": "metric",
      "value": "18min",
      "label": "Automated onboarding time"
    }
  ]
}
```

The AI never sees grid coordinates. It picks a layout name and fills named slots.

### Hybrid (preset with extra blocks)

```json
{
  "type": "content",
  "title": "Why Automate",
  "points": ["Point 1", "Point 2"],
  "extraBlocks": [
    {
      "slot": "bottom-right",
      "kind": "callout",
      "text": "New in Q2!",
      "variant": "amber"
    }
  ]
}
```

**Note:** `extraBlocks` on presets requires defining anchor positions for each preset type. This is Phase 2 work — not in the initial layout implementation.

### Custom Layout (schema v2 — inline slots)

When no template matches, the AI defines slots inline:

```json
{
  "type": "layout",
  "layout": "custom",
  "theme": "rewst",
  "notes": "Custom arrangement for this specific content",
  "slots": [
    { "name": "quote", "position": { "col": 1, "row": 1, "colSpan": 6, "rowSpan": 4 } },
    { "name": "m1", "position": { "col": 7, "row": 1, "colSpan": 6, "rowSpan": 2 } },
    { "name": "m2", "position": { "col": 7, "row": 3, "colSpan": 6, "rowSpan": 2 } },
    { "name": "callout", "position": { "col": 1, "row": 5, "colSpan": 12, "rowSpan": 2 } }
  ],
  "blocks": [
    { "slot": "quote", "kind": "quote", "text": "...", "attribution": "..." },
    { "slot": "m1", "kind": "metric", "value": "73%", "label": "Time saved" },
    { "slot": "m2", "kind": "metric", "value": "18min", "label": "Avg runtime" },
    { "slot": "callout", "kind": "callout", "text": "Now available in Crate Marketplace", "variant": "amber" }
  ]
}
```

**Why this is simpler than raw freeform:**
- Only 4-6 slot rectangles to position (not 15+ individual blocks)
- Each slot is a content area, not a single text element
- Validation checks for overlaps and grid bounds on slots
- Same renderer and exporter — `layout: "custom"` just reads slots from the slide instead of the registry

**Custom slot defaults (when metadata is omitted by AI):**

| Field | Default when omitted | Rationale |
|-------|---------------------|-----------|
| `label` | Derived from `name` (capitalize) | Editor needs display text |
| `kinds` | All block kinds | No restriction — user chose custom for flexibility |
| `required` | `false` | Slots may be intentionally empty |
| `maxContent` | `{ list: 8, text: 500 }` | Generous defaults, review agent still warns on excess |

The validator/editor/review-agent apply these defaults when processing custom layouts. The AI doesn't need to specify them — it just defines `name` + `position`.

**Custom slot validation (`validateCustomSlots`):**
```js
function validateCustomSlots(slots, errors) {
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    const { col, row, colSpan, rowSpan } = s.position;
    if (col < 1 || col + colSpan - 1 > 12) errors.push(`Slot "${s.name}": exceeds column bounds`);
    if (row < 1 || row + rowSpan - 1 > 6) errors.push(`Slot "${s.name}": exceeds row bounds`);
    // Check overlaps with other slots
    for (let j = i + 1; j < slots.length; j++) {
      if (slotsOverlap(s.position, slots[j].position)) {
        errors.push(`Slots "${s.name}" and "${slots[j].name}" overlap`);
      }
    }
  }
}
```

### Future: Raw freeform (schema v3)

```json
{
  "type": "freeform",
  "grid": { "columns": 12, "rows": 6, "gap": "md" },
  "blocks": [
    {
      "id": "b1",
      "kind": "heading",
      "text": "Why Automate",
      "size": "xl",
      "position": { "col": 1, "row": 1, "colSpan": 8, "rowSpan": 1 }
    }
  ]
}
```

Separate type from `"layout"`. Different validation path, different editor, different export logic.

---

## Layout Library (~21 layouts)

Expanded from 15 based on adversarial review of common MSP presentation use cases:

| Layout | Description | Slots |
|--------|-------------|-------|
| `single-center` | One big content area | title, body |
| `two-column` | Side by side | title, left, right |
| `two-column-wide-left` | 2/3 + 1/3 | title, main, sidebar |
| `two-column-wide-right` | 1/3 + 2/3 | title, sidebar, main |
| `three-column` | Three equal | title, col1, col2, col3 |
| `four-column` | Four equal (metrics) | title, m1, m2, m3, m4 |
| `top-bottom` | Stacked | title, top, bottom |
| `image-left` | Image + text | image, title, body |
| `image-right` | Text + image | title, body, image |
| `dashboard` | Metrics + content | title, m1, m2, m3, body1, body2 |
| `comparison` | Side by side with headers | title, left-header, right-header, left-body, right-body |
| `timeline-4` | 4 sequential steps | title, step1, step2, step3, step4 |
| `timeline-6` | 6 sequential steps (2 rows of 3) | title, step1-step6 |
| `quote-context` | Quote + supporting data | quote, attribution, m1, m2, m3 |
| `feature-grid-2x2` | 2×2 cards | title, card1, card2, card3, card4 |
| `feature-grid-2x3` | 2×3 cards | title, card1-card6 |
| `hero-sidebar` | Big content + narrow side | hero, sidebar-top, sidebar-bottom |
| `comparison-table` | Tabular comparison | title, table |
| `logo-wall` | Integration/partner logos | title, logo1-logo8 |
| `annotated-image` | Image + labeled callouts | image, callout1-callout4 |
| `quadrant` | 2×2 matrix with axis labels | title, axis-x, axis-y, q1, q2, q3, q4 |

Adding a new layout = adding one JSON file to `shared/layouts/`. CI validates structure.

### Grid Dimensions

- **12 columns** (divisible by 2, 3, 4, 6)
- **6 rows** (16:9 aspect ratio)
- **Gap sizes**: `none`, `sm` (8px), `md` (16px), `lg` (24px)

At 1920×1080: column = 160px, row = 180px.

---

## Block Kinds

Every block kind must be: Renderable (React), Exportable (PPTX), Generable (AI prompt).

### Text Blocks (PPTX: native text — editable in PowerPoint)

| Kind | Fields | PPTX Export |
|------|--------|-------------|
| `heading` | `text`, `size` (sm/md/lg/xl) | Native text box |
| `text` | `text`, `style` (body/caption/small) | Native text box |
| `list` | `items[]`, `style` (bullet/numbered/check) | Native text box with bullets |

### Data Blocks (PPTX: native — editable in PowerPoint)

| Kind | Fields | PPTX Export |
|------|--------|-------------|
| `metric` | `value`, `label`, `color?` | Native text boxes |
| `chart` | `type` (bar/line/pie), `data[]` | pptxgenjs native chart |
| `table` | `headers[]`, `rows[][]` | pptxgenjs native table |

### Media Blocks (PPTX: image)

| Kind | Fields | PPTX Export |
|------|--------|-------------|
| `image` | `src`, `fit` (contain/cover), `alt?` | addImage |
| `icon` | `name` (Lucide), `size` | Image render (SVG → PNG) |

### Decorative Blocks (PPTX: image render)

| Kind | Fields | PPTX Export |
|------|--------|-------------|
| `divider` | `direction` (horizontal/vertical) | Line shape (native) |
| `callout` | `text`, `variant` (teal/amber/coral) | Image render |
| `spacer` | (none) | Empty space |
| `quote` | `text`, `attribution?`, `role?` | Native text box (italic) |

---

## PPTX Export Strategy

### Hybrid: Native Text + Image Render

**Rule: text-heavy blocks → native PPTX (editable). Visual blocks → image render (pixel-perfect).**

| Category | PPTX method | Editable? |
|----------|-------------|-----------|
| Text blocks (heading, text, list) | Native text | Yes |
| Data blocks (metric, chart, table) | Native elements | Yes |
| Icons | Image render (SVG → PNG) | No |
| Callouts, styled cards | Image render (html2canvas) | No |
| Complex slides (fallback) | Whole-slide image render | No |

### Export API Change

Current `exportDeckToPPTX(deck)` is pure data — no DOM access. Image render needs a browser context.

**New API:**

```js
export async function exportDeckToPPTX(deck, options = {}) {
  // options.renderBlockToPNG: async (block, theme, position) => base64PNG
  // options.renderSlideToPNG: async (slideIndex) => base64PNG
  // Both are optional — provided by useExport hook which has DOM access
}
```

The caller (useExport hook) provides render callbacks. The exporter stays testable — tests mock the callbacks. Native-text blocks never call them.

### PPTX Raster Decision: Per-Block vs Per-Slide

**Default: per-block image render.** Visual blocks (icons, callouts, styled cards) are individually captured as PNGs and placed at their grid coordinates. Text blocks are native PPTX text. This gives the best mix of editability and fidelity.

**Whole-slide fallback:** If a slide has >3 visual blocks, or if any block capture fails, fall back to capturing the entire slide as one PNG. Rationale: many small PNGs at precise PPTX coordinates is fragile. One big PNG is guaranteed correct.

```
Decision tree per slide:
  Count visual blocks (icon, callout, image-render types)
  If count == 0 → all native text, no raster needed
  If count <= 3 → per-block capture (precise placement)
  If count > 3 or any capture fails → whole-slide PNG fallback
```

Users see this as the "export quality" dropdown:
- **Editable** → all native text, visual blocks get simplified placeholders
- **Balanced** (default) → native text + per-block capture for visual blocks
- **Image** → every slide as a full PNG

### Off-Screen Rendering Pipeline

**The hard problem:** The app only has one live slide in the DOM (`slideContainerRef`). Export needs to render all slides sequentially. The current PDF and HTML exporters have this same bug — they capture the current slide repeatedly.

**Solution: Hidden off-screen render container.**

```jsx
// In useExport hook or a dedicated useOffscreenRenderer hook:
const offscreenRef = useRef(null);

// Hidden container, same size as the visible slide, positioned off-screen
<div
  ref={offscreenRef}
  style={{
    position: 'fixed',
    left: '-9999px',
    width: 1920,
    height: 1080,
  }}
/>
```

**Export flow:**
```
for each slide in deck.slides:
  1. Render <SlideFrame slide={slide} /> into offscreenRef (via ReactDOM.createPortal or root.render)
  2. Wait for paint (requestAnimationFrame + setTimeout(0))
  3. Capture offscreenRef via html2canvas → base64 PNG
  4. For PPTX: native-text blocks skip capture, visual blocks use the PNG
  5. Call onProgress(i, total)
```

**Why this works:**
- Off-screen container is invisible but fully rendered (fonts loaded, CSS applied)
- Fixed 1920×1080 size matches the virtual canvas — consistent capture resolution
- ReactDOM.createPortal or a separate React root lets us render any slide without affecting the visible UI
- The same pipeline serves PDF, HTML, and PPTX image-render exports

**Why this is non-trivial:**
- Font loading: must ensure Goldplay/Montserrat are loaded before capture
- Async rendering: React renders asynchronously — need to wait for commit + paint
- Image loading: slides with `<img>` tags need those images loaded before capture
- Memory: holding 15+ base64 PNGs in memory simultaneously (consider streaming to output)

**This replaces the broken pattern in all three exporters** (PDF, HTML, PPTX) and should be built as shared infrastructure, not per-exporter.

### Export Quality Modes

User chooses in the export dropdown:

- **"Editable" mode** — native text only, visual blocks get simplified placeholders. Fully editable in PowerPoint.
- **"Pixel-perfect" mode** (default) — native text + image render for visual blocks. Best fidelity, partial editability.
- **"Image" mode** — every slide as a full PNG. Zero PPTX fidelity issues, zero editability.

### Font Strategy

- **Web**: Goldplay (display) + Montserrat (body)
- **PPTX**: Montserrat for everything (widely available)
- **Documentation**: install Goldplay on presentation machine for perfect brand match

---

## Theme System: CSS Variables for customColors

### The Problem

Current themes use Tailwind class strings (`text-bot-teal-400`, `bg-ops-indigo-800/80`) throughout `renderer.jsx`. You can't inject arbitrary hex colors into class strings. `customColors` requires a real refactor.

### The Scope (honest assessment)

This is NOT a bolt-on. The current renderer has ~50 references to theme class strings like `t.accentColor`, `t.textOnPage`, `t.cardBg`. Moving to CSS variables means:

1. **Refactor `src/config/themes.js`** — each theme exports both Tailwind classes (for presets) AND hex values (for CSS vars and PPTX)
2. **New block renderer uses CSS vars** — block components use `style={{color: 'var(--theme-accent)'}}` instead of `className={t.accentColor}`
3. **Existing preset renderer unchanged** — presets keep using Tailwind classes. Only the new `LayoutSlide` / `BlockRenderer` uses CSS vars.
4. **SlideFrame wraps with CSS var injection** — when `customColors` is present, override the vars

This means two rendering models coexist:
- Presets: Tailwind classes (existing, untouched)
- Layouts/blocks: CSS variables (new, supports customColors)

### Implementation

```jsx
// SlideFrame wraps every slide
function SlideFrame({ slide, defaultTheme, children }) {
  const theme = getTheme(slide.theme || defaultTheme);
  const customColors = slide.customColors;

  const cssVars = {
    '--theme-accent': customColors?.primary || theme.accentHex,
    '--theme-bg': customColors?.accent || theme.bgHex,
    '--theme-text': theme.textHex,
  };

  return (
    <div className={`w-full h-full ${theme.bg} ...`} style={cssVars}>
      {children || renderSlide(slide, defaultTheme)}
    </div>
  );
}

// Block components use CSS vars
function HeadingBlock({ block }) {
  return (
    <h2 style={{ color: 'var(--theme-accent)', fontSize: SIZES[block.size] }}>
      {block.text}
    </h2>
  );
}
```

**Estimated effort:** 1-2 days for the theme refactor. Add hex values to each theme in `themes.js`, build block components with CSS vars, update SlideFrame. Presets untouched.

### PPTX export

PPTX exporter reads `customColors` directly (hex values, no CSS needed). Already works with the `shared/theme-colors.js` hex map.

### Partner Color Override

```json
"customColors": {
  "primary": "#FF6B00",
  "accent": "#1A1A2E",
  "label": "Datto partnership"
}
```

- Badge in editor: "Using Datto partnership colors"
- AI mentions it: "I used Datto's brand orange"
- Not present by default — AI only uses when user mentions a partner

### Warning Levels

1. **Green** — all brand, no overrides
2. **Yellow** — partner colors active → badge
3. **Red** — manual hex entry (future) → "Custom colors — not Rewst brand"

---

## AI System Prompt: Dynamic Generation

### The Problem

Hardcoding ~21 layouts in the system prompt adds 500-1000 tokens and gets out of sync when layouts are added/removed.

### The Fix

Generate the layout section of the system prompt dynamically from `shared/layouts/` at server startup:

```js
// server/ai/system-prompt.js
import { getAllLayouts } from '../../shared/layouts/index.js';

function buildLayoutPromptSection() {
  const layouts = getAllLayouts();
  return layouts.map(l =>
    `- ${l.id}: ${l.promptDescription}\n  Slots: ${l.slots.map(s => s.name).join(', ')}`
  ).join('\n');
}

export const SYSTEM_PROMPT = `...existing prompt...

## LAYOUT SLIDES

When the user asks for a custom or complex layout, use type "layout".

If a named layout fits, set layout to its name:
${buildLayoutPromptSection()}

If no named layout fits, use layout: "custom" and define 4-6 slots inline:
{ "type": "layout", "layout": "custom",
  "slots": [{ "name": "...", "position": { "col": 1, "row": 1, "colSpan": 6, "rowSpan": 6 } }, ...],
  "blocks": [{ "slot": "...", "kind": "...", ... }, ...] }

Rules:
- Fill each slot with one block: { "slot": "name", "kind": "heading|list|metric|...", ...fields }
- Custom slots: use the 12×6 grid, no overlaps, max 6 slots
- Use presets for standard slides, named layouts for common patterns, custom only when neither fits
`;
```

This keeps the prompt in sync with the layout registry automatically.

---

## Validation + Review Agent

### Schema Validation (slide-schema.js)

For `type: "layout"` slides, validate:
1. `layout` field exists and matches a known layout ID
2. Each block has `slot` and `kind` fields
3. Slot names match the layout definition
4. Block kind is in the slot's `kinds` array
5. No duplicate slot assignments
6. Required slots are filled

### Review Agent (review-agent.js)

Extend the review agent with block-awareness:
- **Content overflow**: check block content against slot `maxContent` hints
- **Unbalanced columns**: flag slots with vastly different content density
- **Long labels in metric blocks**: flag metric labels > 40 chars (PPTX will shrink text)
- **Image aspect mismatch**: flag image blocks in slots with incompatible proportions

### Validation on `update_slide`

Fix the existing bypass: validate `blocks[]` array when present, regardless of whether `changes.type` is set.

---

## Editor UX

### Phase 1 (MVP) — Layout Picker + Slot Editors

1. Slide type picker shows two tabs: **Presets** (existing 8 types) and **Layouts** (~21 templates)
2. Layout tab shows visual thumbnails from layout JSON metadata
3. Choosing a layout shows slot editors — one form per slot, using `slots[].label`
4. JSON mode shows full `type: "layout"` schema
5. No drag-and-drop. Layout picker IS the positioning UI.

### Phase 2 — Visual Grid Preview + Hybrid Presets

- Click-to-select blocks on a visual grid preview
- `extraBlocks` on presets (requires defining anchor positions per preset)
- Move blocks via arrow keys or size buttons

### Phase 3 — Full Grid Editor (for `type: "freeform"`)

- Drag blocks to reposition
- Resize handles
- Grid overlay with snap lines
- Block groups

---

## Testing Strategy

### Layer 1: Schema Validation Tests

- `type: "layout"` with valid slots → passes
- Invalid layout name → fails
- Wrong block kind in slot → fails
- Missing required slot → fails
- Duplicate slot → fails
- Block array content validation
- Migration fixtures: v1 deck loads and upgrades to v2

### Layer 2: Renderer Tests

- Each layout renders without error
- Short/medium/long content fixtures
- Overflow cases (too many bullets, long text)
- Theme application

### Layer 3: PPTX Structural Tests

- Generate real `.pptx` (not mocked)
- Unzip the pptx (it's a zip file)
- Assert `ppt/slides/slideN.xml` contains expected text runs, coordinates, media refs
- Verify native text blocks are editable XML text runs
- Verify image blocks are relationship-referenced PNGs

### Layer 4: Visual Regression (stretch goal)

- Render PPTX to images via LibreOffice headless in CI
- Compare against golden screenshots
- Catches "valid PPTX, ugly slide" issues

### Layer 5: Layout CI Validation

- `validate-layouts` CI step checks every JSON file in `shared/layouts/`:
  - Has all required fields (id, name, description, promptDescription, editorLabel, slots)
  - Every slot has name, kinds, position, maxContent
  - Positions don't overlap
  - Slot names are unique

---

## Migration Path

### Schema Versioning

```
v1: Existing presets (title, content, grid, etc.)
    No schemaVersion field (implicit v1)

v2: Adds type: "layout" support
    schemaVersion: 2
    Old presets still work unchanged
    migrateDeck() adds schemaVersion on load

v3 (future): Adds type: "freeform"
    schemaVersion: 3
```

### Deck Store Migration

```js
// src/store/deck-store.js
export function loadDeck(id) {
  const raw = localStorage.getItem(KEY_PREFIX + id);
  if (!raw) return null;
  try {
    const deck = JSON.parse(raw);
    return migrateDeck(deck); // Always migrate on load
  } catch {
    return null;
  }
}
```

### "Convert to Blocks" Button

In the slide editor, a "Convert to layout" button:
1. Expands the preset to its equivalent layout (e.g., `content` → `single-center` with heading + list blocks)
2. Saves as `type: "layout"` — now customizable
3. One-way conversion (can't go back to preset)
4. `duplicateSlide()` must handle nested block arrays correctly

---

## Resolved Questions

1. **Block overlap** — No in v1/v2 (grid slots don't overlap). Allow in v3 raw freeform.
2. **Responsive blocks** — No. Slides are always 1920×1080.
3. **Block-level theme override** — Not in v1. Slide-level `customColors` is enough.
4. **AI reliability** — SOLVED by layout-first approach. AI picks layout names and fills slots. Custom layouts for unique arrangements.
5. **Chart blocks** — Simple bar/pie/line with name/value pairs. No multi-series in v1.
6. **PPTX fidelity** — SOLVED by hybrid native + image render. Export quality modes. Off-screen render pipeline.
7. **Icon export** — Image render (SVG → PNG at export time).
8. **Font portability** — Montserrat for all PPTX text.
9. **Type overloading** — SOLVED. `type: "layout"` (named + custom) and `type: "freeform"` (raw grid) are distinct.
10. **Schema migration** — SOLVED. `schemaVersion` stamped by `createDeck()`, `migrateDeck()` on load.
11. **Validation gaps** — SOLVED. `update_slide` validates merged block state against layout definition (slot names, kinds, required slots, overlap detection for custom layouts).
12. **Custom layouts** — SOLVED. `layout: "custom"` with inline slots. AI defines 4-6 slot rectangles. Same renderer/exporter/validator as named layouts.
13. **Off-screen rendering** — SOLVED. Hidden off-screen container renders each slide before capture. Shared infrastructure for PDF/HTML/PPTX exporters.
14. **customColors vs Tailwind** — SOLVED honestly. New block renderer uses CSS variables. Existing preset renderer keeps Tailwind classes. Two models coexist. ~1-2 day refactor.
15. **Layout thumbnails** — SOLVED. `thumbnail` field in layout JSON, SVGs in `shared/layouts/thumbnails/`.

---

## Implementation Order

### Phase 0: Prerequisites (before any block code)

1. **Schema versioning** — add `schemaVersion` to `createDeck()`, `migrateDeck()` to deck-store, migration fixture tests
2. **Validation fix** — `update_slide` validates merged block state against layout definition
3. **Shared layout registry** — create `shared/layouts/` with index.js + `validate-layouts` CI step
4. **Off-screen render pipeline** — shared infrastructure for capturing any slide as PNG (fixes existing bug in PDF/HTML exporters too)

### Phase 1: Core Block System

5. **Layout definitions** — ~21 JSON files + thumbnails in `shared/layouts/`
6. **Block schema + validation** — add `type: "layout"` to slide-schema.js, slot/block/custom-layout validation
7. **Theme refactor** — add hex values to themes.js, CSS variable injection in SlideFrame, block components use vars (~1-2 days)
8. **Block renderer** — CSS Grid `LayoutSlide` + `BlockRenderer` per block kind
9. **PPTX block export** — per-block-kind functions, `renderBlockToPNG` callback API, export quality modes
10. **AI system prompt** — dynamic layout section generated from registry, custom layout instructions

### Phase 2: Editor + Polish

11. **Editor UI** — layout picker tab (with thumbnails) + slot editors
12. **Review agent** — block-aware content capacity, unbalanced columns, long metric labels
13. **Partner colors** — `customColors` override with CSS vars + warning badges
14. **Preset expansion** — "Convert to layout" button
15. **HTML block export** — layout slides in self-contained HTML export

### Phase 3: Advanced (v3)

16. **Raw freeform type** — `type: "freeform"` with per-block grid positioning
17. **Visual grid editor** — drag, resize, snap
18. **extraBlocks on presets** — anchor positions per preset type
