# DeckWing

AI-powered presentation builder for Rewst. Describe what you want, get on-brand slides instantly, refine through conversation, present anywhere.

## Quick Install

**Mac/Linux:**
```bash
curl -fsSL https://raw.githubusercontent.com/tfournet/deckwing/main/scripts/install.sh | bash
```

**Windows (PowerShell):**
```powershell
irm https://raw.githubusercontent.com/tfournet/deckwing/main/scripts/install.ps1 | iex
```

**Or with npm directly:**
```bash
npm install -g github:tfournet/deckwing
deckwing
```

The install scripts handle everything: Node.js, Claude Code, and the app itself.

## What It Does

- **Conversational deck building** — tell the AI what you need, get a full slide deck
- **8 slide types** — title, content, grid, image, quote, metric, section, blank
- **5 Rewst brand themes** — rewst, dramatic, terminal, highlight, warning
- **Live editing** — visual editor or raw JSON mode with schema validation
- **Drag-and-drop** — reorder, duplicate, delete slides from the outline panel
- **Presenter mode** — fullscreen with keyboard nav, speaker notes (N key), progress bar
- **Auto-save** — decks persist in localStorage automatically
- **PDF export** — client-side rendering to downloadable PDF
- **5 starter templates** — QBR, Security Assessment, Onboarding, Product Demo, All-Hands

## Usage

```bash
deckwing
```

Opens the app at `http://localhost:3000`. Start typing in the AI chat panel to generate slides.

**Keyboard shortcuts in Presenter Mode:**
| Key | Action |
|-----|--------|
| Space / Right / PageDown | Next slide |
| Left / PageUp | Previous slide |
| N | Toggle speaker notes |
| Home | First slide |
| End | Last slide |
| Escape | Exit presenter mode |

## Authentication

DeckWing uses Claude for AI generation. It supports two auth modes:

1. **Claude Code OAuth** (default) — if you have Claude Code installed and logged in, it just works. No API key needed.
2. **API key** — set `ANTHROPIC_API_KEY` as an environment variable for direct API access.

If you're not authenticated, the app shows a login screen with instructions.

## Development

```bash
git clone https://github.com/tfournet/deckwing.git
cd deckwing
npm install
npm run dev:full    # Frontend (port 3000) + backend (port 3001)
npm test            # Run 145 tests
npm run test:watch  # Watch mode
```

### Architecture

```
src/                    Frontend (React 18 + Vite + Tailwind)
  schema/               Slide data model (re-exports from shared/)
  engine/               Renderer (schema to React) + PDF export
  config/               Themes, colors, tokens, typography
  components/
    chat/               AI chat panel
    editor/             Slide editor, outline, deck list modal
    presenter/          Fullscreen presenter mode
  store/                localStorage persistence
  hooks/                useChat, useDeckPersistence
  data/                 Starter templates

server/                 Backend (Express)
  ai/                   Claude chat engine + system prompt
  app.js                Express routes (testable, no side effects)
  index.js              Server entry point

shared/                 Shared between frontend and server
  schema/               Canonical slide schema (Clean Architecture)

bin/                    CLI entry point for npm package
scripts/                One-liner install scripts (Mac/Linux/Windows)
.github/workflows/      CI (test + build) and Release (GitHub Releases)
```

### Slide Schema

Each slide is a JSON object with a `type` field that determines its layout:

```json
{
  "type": "content",
  "title": "Why Automate Onboarding",
  "icon": "Zap",
  "points": [
    "New user setup takes 3-5 hours manually",
    "Steps span 6-8 different tools",
    "Rewst reduces this to under 20 minutes"
  ],
  "theme": "rewst",
  "notes": "Mention the Stackline case study here"
}
```

Types: `title`, `content`, `grid`, `image`, `quote`, `metric`, `section`, `blank`

### Running Tests

```bash
npm test                        # All 145 tests
npm test -- src/schema/         # Schema tests only
npm test -- server/             # API + chat engine tests
npm run test:watch              # Watch mode
```

Test coverage:
- Slide schema validation (30 tests)
- Theme configuration (6 tests)
- WCAG contrast checking (8 tests)
- Chat engine with mocked Claude API (17 tests)
- Express API endpoints (16 tests)
- localStorage persistence (15 tests)
- React persistence hook (7 tests)
- Presenter mode logic (10 tests)
- PDF export (6 tests)
- Starter templates validation (6 tests)
- Plus re-export verification and integration tests

## Releasing

```bash
# Bump version
npm version patch  # or minor, major

# Push tag — triggers CI + GitHub Release
git push --tags
```

The CI pipeline runs tests on Node 18/20/22 and builds the frontend. Tagged releases create GitHub Releases automatically.

## License

MIT
