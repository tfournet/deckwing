# Claude Code Instructions - Rewst Deck Builder

## Project Overview

AI-powered presentation builder for Rewst internal team. Generates on-brand slide decks through a conversational interface.

### Architecture

- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend:** Express.js API + Anthropic Claude SDK
- **Data model:** JSON slide schema (see `src/schema/slide-schema.js`)
- **Rendering:** Schema-driven renderer maps JSON to React components (see `src/engine/renderer.jsx`)

### Key Directories

- `src/schema/` - Slide data model and validation
- `src/engine/` - Schema-to-component renderer
- `src/config/` - Themes, colors, tokens, typography (ported from Rewst brand guidelines)
- `src/components/ui/` - Reusable UI components (Card, Badge, CodeBlock, etc.)
- `src/components/editor/` - Editor UI components (TODO)
- `src/components/chat/` - AI chat interface components (TODO)
- `server/` - Express API backend

### Design System

All visual design follows Rewst brand guidelines:
- **Bot Teal (#1EAFAF):** Primary accent - 50% usage
- **Ops Indigo (#141121):** Dark backgrounds - 15%
- **Trigger Amber (#F9A100):** Highlights - 10%
- **Alert Coral (#F15B5B):** Warnings - 5%
- **Cloud Gray (#E6E6E6):** Neutrals - 20%

Typography: Goldplay (display) + Montserrat (body)

### Slide Types

Supported: `title`, `content`, `grid`, `image`, `quote`, `metric`, `section`, `blank`

Each type has required/optional fields defined in the schema. The AI generates JSON conforming to this schema.

### Running

```bash
npm run dev       # Frontend (port 3000)
npm run server    # Backend (port 3001)
npm run dev:full  # Both concurrently
```
