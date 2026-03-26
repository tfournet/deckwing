# Block-Based Slide System — Design Document

> Status: DESIGN — no code yet
> Author: Tim + Claude
> Date: 2026-03-26

## Problem

The current 8 fixed slide types (title, content, grid, metric, quote, section, image, blank) are fast to generate but hit walls quickly. Users can't mix a metric with a quote, put two lists side by side, or create anything the predefined types don't support. The AI is constrained to generating content that fits rigid templates.

## Goal

Any slide layout that a human could sketch on a whiteboard should be expressible in the schema, generable by AI, renderable in the app, and exportable to PPTX — all while enforcing Rewst brand guidelines by default.

## Core Concept

A slide is a **grid of blocks**. Each block is a typed content element (heading, text, list, metric, image, etc.) placed on a 12-column grid with explicit row/column positioning.

The existing 8 slide types become **presets** — shorthand that expands to a block arrangement. Full backward compatibility.

---

## Slide Schema

### Current (preserved as presets)

```json
{
  "type": "content",
  "title": "Why Automate",
  "points": ["Point 1", "Point 2"],
  "icon": "Zap",
  "theme": "rewst"
}
```

### New (freeform)

```json
{
  "type": "freeform",
  "theme": "rewst",
  "customColors": null,
  "notes": "Speaker notes here",
  "grid": { "columns": 12, "rows": 6, "gap": "md" },
  "blocks": [
    {
      "id": "b1",
      "kind": "heading",
      "text": "Why Automate",
      "size": "xl",
      "position": { "col": 1, "row": 1, "colSpan": 8, "rowSpan": 1 }
    },
    {
      "id": "b2",
      "kind": "icon",
      "name": "Zap",
      "size": 48,
      "position": { "col": 10, "row": 1, "colSpan": 3, "rowSpan": 1 }
    },
    {
      "id": "b3",
      "kind": "list",
      "items": ["Saves 4 hours per onboarding", "Zero manual errors"],
      "style": "bullet",
      "position": { "col": 1, "row": 2, "colSpan": 6, "rowSpan": 4 }
    },
    {
      "id": "b4",
      "kind": "metric",
      "value": "73%",
      "label": "Time reduction",
      "position": { "col": 7, "row": 2, "colSpan": 6, "rowSpan": 4 }
    }
  ]
}
```

### Hybrid (preset with overrides)

```json
{
  "type": "content",
  "title": "Why Automate",
  "points": ["Point 1", "Point 2"],
  "extraBlocks": [
    {
      "id": "extra1",
      "kind": "callout",
      "text": "New in Q2!",
      "variant": "amber",
      "position": { "col": 9, "row": 5, "colSpan": 4, "rowSpan": 2 }
    }
  ]
}
```

This lets users start with a preset and add blocks on top without going full freeform.

---

## Grid System

### Dimensions
- **12 columns** (industry standard — divisible by 2, 3, 4, 6)
- **6 rows** (16:9 aspect ratio, gives enough vertical resolution)
- **Gap sizes**: `none`, `sm` (8px), `md` (16px), `lg` (24px)

### Positioning
Every block has:
- `col`: starting column (1-12)
- `row`: starting row (1-6)
- `colSpan`: width in columns (1-12)
- `rowSpan`: height in rows (1-6)

### PPTX Mapping
At 1920x1080 reference resolution:
- Column width: 1920 / 12 = 160px = ~1.67 inches
- Row height: 1080 / 6 = 180px = ~1.875 inches
- PPTX uses inches from top-left: `left = (col - 1) * 1.67"`, `top = (row - 1) * 1.875"`
- Padding applied within each cell

### Alignment
Blocks snap to the grid — no sub-column positioning. This keeps layouts clean and export deterministic. If a user wants a block centered, they use `col: 4, colSpan: 6` (centered 6 of 12 columns).

---

## Block Kinds

Every block kind must satisfy three requirements before being added:
1. **Renderable** in the React app
2. **Exportable** to PPTX
3. **Generable** by AI (documented in system prompt)

### Text Blocks

| Kind | Fields | PPTX Mapping |
|------|--------|-------------|
| `heading` | `text`, `size` (sm/md/lg/xl) | Text box, title formatting |
| `text` | `text`, `style` (body/caption/small) | Text box, body formatting |
| `list` | `items[]`, `style` (bullet/numbered/check) | Text box with bullet formatting |

### Data Blocks

| Kind | Fields | PPTX Mapping |
|------|--------|-------------|
| `metric` | `value`, `label`, `color?` | Two text boxes (value + label) |
| `chart` | `type` (bar/line/pie), `data[]` | PPTX native chart |
| `table` | `headers[]`, `rows[][]` | PPTX native table |

### Media Blocks

| Kind | Fields | PPTX Mapping |
|------|--------|-------------|
| `image` | `src`, `fit` (contain/cover), `alt?` | Picture element |
| `icon` | `name` (Lucide), `size` | Exported as PNG, picture element |

### Decorative Blocks

| Kind | Fields | PPTX Mapping |
|------|--------|-------------|
| `divider` | `direction` (horizontal/vertical) | Line shape |
| `callout` | `text`, `variant` (teal/amber/coral) | Rounded rectangle with text |
| `spacer` | (none — just takes grid space) | Empty space |
| `quote` | `text`, `attribution?`, `role?` | Text box with quote formatting |

### Future Blocks (not in v1)

| Kind | Notes |
|------|-------|
| `code` | Syntax-highlighted code block — PPTX as monospace text box |
| `embed` | Video/iframe — web only, PPTX gets placeholder image |
| `shape` | Basic shapes (circle, arrow, rectangle) — PPTX native shapes |

---

## Presets → Blocks Expansion

When the renderer encounters a classic slide type, it internally expands to blocks before rendering. This is a pure transformation — no data loss.

### `title` preset

```
[heading xl, centered, row 2-3]
[text body, centered, row 4]      ← subtitle
[text caption, centered, row 5]   ← author/date
```

### `content` preset

```
[icon, col 1-2, row 1]  [heading lg, col 3-12, row 1]
                         [text body, col 3-12, row 1]   ← subtitle
[list bullet, col 1-12, row 2-6]
```

### `grid` preset

```
[heading lg, col 1-12, row 1]
[card, col 1-4, row 2-6]  [card, col 5-8, row 2-6]  [card, col 9-12, row 2-6]
```

Each "card" in the grid is a group of blocks (icon + heading + text) inside a bordered region.

### `metric` preset

```
[heading lg, col 1-12, row 1]
[metric, col 1-4, row 2-5]  [metric, col 5-8, row 2-5]  [metric, col 9-12, row 2-5]
```

### `quote` preset

```
[text xl (quote mark), centered, row 1]
[quote, centered, row 2-4]
[text body (attribution), centered, row 5]
```

---

## Brand Enforcement

### Default behavior
- All blocks inherit colors from the slide's theme
- Heading sizes, fonts, spacing all come from theme tokens
- No block can specify arbitrary hex colors

### Partner color override
- Slide-level `customColors` object:
  ```json
  "customColors": {
    "primary": "#FF6B00",
    "accent": "#1A1A2E",
    "label": "Datto partnership"
  }
  ```
- When present:
  - Blocks that use `accentColor` or `accentBg` get the partner colors instead
  - A badge appears in the editor: "Using Datto partnership colors"
  - The AI mentions it in chat: "I used Datto's brand orange for the accent on slides 3-5"
- Not present by default — AI only uses it when user explicitly mentions a partner

### Warning levels
1. **Green** — all brand, no overrides → no indicator
2. **Yellow** — partner colors active → "Partner branding" badge
3. **Red** — would need manual hex entry (future) → "Custom colors — not Rewst brand"

---

## AI Generation

### System prompt additions

The AI needs to know:
1. The block kinds and their fields
2. The grid system (12 cols, 6 rows)
3. When to use freeform vs presets
4. Common layout patterns

### AI decision tree

```
User asks for a standard slide?
  → Use preset type (title, content, grid, etc.)
  → Faster, simpler JSON

User asks for something custom?
  → Use type: "freeform" with blocks
  → Position blocks on the grid
  → Use common layout patterns (two-column, dashboard, etc.)

User asks for a mix?
  → Use preset + extraBlocks
  → Keeps the base structure, adds custom elements
```

### Common freeform patterns the AI should know

**Two-column comparison:**
```
[heading, col 1-12, row 1]
[heading sm, col 1-6, row 2]     [heading sm, col 7-12, row 2]
[list, col 1-6, row 3-6]         [list, col 7-12, row 3-6]
```

**Dashboard:**
```
[heading, col 1-12, row 1]
[metric, col 1-4, row 2-3]  [metric, col 5-8, row 2-3]  [metric, col 9-12, row 2-3]
[list, col 1-6, row 4-6]    [callout, col 7-12, row 4-6]
```

**Image + text:**
```
[image, col 1-6, row 1-6]   [heading, col 7-12, row 1-2]
                              [text, col 7-12, row 3-5]
                              [callout, col 7-12, row 6]
```

**Quote with context:**
```
[quote, col 1-8, row 1-4]
[image (avatar), col 9-10, row 2-3]  [text (name+role), col 11-12, row 2-3]
[divider, col 1-12, row 5]
[metric, col 1-4, row 6]  [metric, col 5-8, row 6]  [metric, col 9-12, row 6]
```

---

## Rendering

### React renderer changes

Current: `RENDERERS[slide.type]` → one component per type

New: two paths:
1. **Preset slides**: expand to blocks internally, then render blocks
2. **Freeform slides**: render blocks directly

The block renderer uses CSS Grid:
```jsx
<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(12, 1fr)',
  gridTemplateRows: 'repeat(6, 1fr)',
  gap: theme.gap,
  width: '100%',
  height: '100%',
}}>
  {blocks.map(block => (
    <div style={{
      gridColumn: `${block.position.col} / span ${block.position.colSpan}`,
      gridRow: `${block.position.row} / span ${block.position.rowSpan}`,
    }}>
      <BlockRenderer block={block} theme={theme} />
    </div>
  ))}
</div>
```

Each `BlockRenderer` case is a small component using theme tokens.

### PPTX export changes

Each block kind has an `exportBlock(block, pptxSlide, position, theme)` function that adds PPTX elements at the correct coordinates. The grid-to-inches conversion is a pure math function.

---

## Editor UX

### Phase 1 (MVP)
- Visual editor shows blocks as labeled rectangles on a grid preview
- Click a block to edit its content in a side panel
- Drag blocks to reposition (snaps to grid)
- "Add block" button shows block kind picker
- JSON editor still works (shows the full freeform schema)

### Phase 2 (Polish)
- Drag handles to resize blocks
- Block templates: "Add a two-column layout" adds multiple blocks at once
- AI assistant: "Make the right side bigger" → AI adjusts grid positions
- Copy/paste blocks between slides

### Phase 3 (Advanced)
- Visual grid overlay with snap lines
- Block groups (lock multiple blocks together)
- Animation hints (enter from left, fade in, etc.) — web-only, ignored in PPTX

---

## Migration Path

1. **No breaking changes** — existing presets still work exactly as before
2. **Renderer detects type** — if `type === 'freeform'`, use block renderer; otherwise use preset renderer
3. **Gradual adoption** — AI starts using freeform only when users ask for custom layouts
4. **Preset expansion is internal** — users never see their `content` slides become blocks unless they switch to JSON view
5. **Export handles both** — PPTX exporter has paths for presets (existing) and blocks (new)

---

## Open Questions

1. **Block overlap** — should blocks be allowed to overlap on the grid? PPTX supports it, but it makes the editor complex. Recommendation: no overlap in v1, allow in v2.

2. **Responsive blocks** — should blocks auto-resize on smaller screens? Recommendation: no, slides are always 1920x1080. The grid is fixed.

3. **Block-level theme override** — should individual blocks be able to override theme colors (beyond slide-level customColors)? Recommendation: not in v1. Slide-level is enough.

4. **AI reliability** — generating block positions is harder than generating a preset. Will the AI place blocks correctly? Mitigation: provide common layout patterns in the system prompt, validate positions, and fall back to presets when freeform generation fails.

5. **Chart blocks** — how do we handle data visualization? pptxgenjs supports native charts. Recommendation: start with simple bar/pie charts backed by inline data arrays. No external data sources in v1.

---

## Implementation Order

1. **Block schema + validation** — define the schema, add to slide-schema.js, write tests
2. **Block renderer** — CSS Grid renderer for all block kinds, theme-aware
3. **Preset expansion** — internal function that converts preset types to blocks
4. **PPTX block export** — one export function per block kind
5. **AI system prompt** — teach the AI about blocks, grid, and layout patterns
6. **Editor UI** — grid preview, block editing, drag-to-position
7. **Partner colors** — customColors override with warnings
8. **HTML export** — block-based slides in the self-contained HTML export
