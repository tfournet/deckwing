# Claude Code Instructions — DeckWing

## IMPORTANT: Read Before Making Changes

This project is contributed to by people of all skill levels, many using AI assistants. Follow these rules strictly to prevent breaking things.

## Git Workflow — ALWAYS Follow This

**NEVER commit directly to `main`.** All changes go through branches and Pull Requests.

### Before starting any work:
```bash
git checkout main
git pull origin main
git checkout -b <descriptive-branch-name>
```

Branch naming: `design/darker-teal`, `content/new-qbr-template`, `prompt/concise-bullets`, etc.

### Before committing, understand the contributor's intent:
1. **Ask what they want to change and WHY** — not just "what file"
2. **Confirm the scope** — "So you want to change just the teal color, not the whole palette?"
3. **Check if it's in the safe-to-edit list** — if not, explain why and suggest alternatives
4. **Test first** — `npm test` must pass, `npm run dev` should look right

### Writing commit messages:
Commit messages must explain WHAT changed and WHY. Interview the contributor if needed.

Good: `design: darken Bot Teal from #1EAFAF to #1A9E9E for better contrast on projectors`
Good: `content: add Security Incident Response template for IR team presentations`
Good: `prompt: reduce max bullet points from 5 to 4 — slides were too crowded`

Bad: `updated colors`
Bad: `fixed stuff`
Bad: `changes`

### Creating Pull Requests:
```bash
git add .
git commit -m "descriptive message explaining what and why"
git push origin <branch-name>
```
Then create a PR on GitHub. The PR description should include:
- What was changed
- Why it was changed
- How to verify (e.g., "switch to dramatic theme and check the accent color")

### If tests fail:
DO NOT force-push or skip tests. Fix the issue or revert. Ask for help in `#proj-deckwing` on Slack.

### Communication:
- **Slack:** `#proj-deckwing` for questions, discussions, and review requests
- **PR reviews:** Tag `@tfournet` or ask in Slack
- **If the contributor is unsure about something:** ASK before making changes. It's better to clarify than to guess wrong.

---

## Safety Rules

### NEVER modify these without developer approval:
- `server/ai/chat-engine.js` — AI API integration
- `server/app.js` — Express routes and auth
- `server/ai/claude-oauth.js` — OAuth authentication flow
- `server/ai/find-claude.js` — Claude binary discovery
- `shared/schema/slide-schema.js` — Schema validation functions (createSlide, validateSlide, etc.)
- `src/engine/renderer.jsx` — Slide rendering engine
- `src/engine/export-*.js` — Export pipelines
- `electron/` — Desktop app packaging
- `.github/` — CI/CD pipelines
- `bin/` — CLI entry point
- `scripts/` — Install scripts

### Safe to modify (design/content work):
- `src/config/design/*.json` — All design tokens (colors, typography, borders, spacing, shadows, icons, images). Pure JSON data files — no code, safe to edit.
- `src/config/design/README.md` — Guide for design contributors
- `src/config/themes.js` — Theme definitions (uses values from design/)
- `src/data/templates.js` — Starter deck templates
- `server/ai/system-prompt.js` — AI behavior and voice rules
- `shared/layouts/` — Slide layout definitions
- `public/images/` — Static assets (logos, images)
- `CONTRIBUTING.md`, `README.md` — Documentation

### Always run before committing:
```bash
npm test    # ALL tests must pass
npm run build   # Build must succeed
```

If tests fail, DO NOT commit. Fix the issue or revert your changes.

## Project Overview

DeckWing is an AI-powered presentation builder for Rewst. Users describe what they want, Deckster (the AI assistant) generates on-brand slide decks, and users can refine through conversation or manual editing.

### Architecture

```
shared/               Shared between frontend and server
  schema/             Canonical slide schema + validation
  layouts/            Layout definitions (JSON)
  models.js           Claude model configuration
  settings.js         App settings service
  deck-file.js        .deckwing file format
  autosave.js         Version history

server/               Backend (Express)
  ai/                 Claude integration
    system-prompt.js  AI behavior rules (SAFE TO EDIT)
    chat-engine.js    API calls (DO NOT EDIT)
    claude-oauth.js   Authentication (DO NOT EDIT)
    find-claude.js    Binary discovery (DO NOT EDIT)
    review-agent.js   Quality checks
  app.js              Routes (DO NOT EDIT)

src/                  Frontend (React 18 + Vite + Tailwind)
  config/             Design system (SAFE TO EDIT)
    colors.js         Brand color palette
    themes.js         5 slide themes
    typography.js     Font families and sizes
    tokens.js         Spacing and style tokens
  engine/             Rendering (DO NOT EDIT)
    renderer.jsx      Slide renderer
    export-pdf.js     PDF export
    export-pptx.js    PPTX export
    export-html.js    HTML export
  components/         UI components
    chat/             Deckster chat panel
    editor/           Slide editor
    presenter/        Fullscreen presenter mode
    auth/             Login flow
  data/               Content (SAFE TO EDIT)
    templates.js      Starter deck templates
  store/              Persistence (DO NOT EDIT)
  hooks/              React hooks (DO NOT EDIT)

electron/             Desktop app (DO NOT EDIT)
```

### Design System

All visual design follows Rewst brand guidelines:

| Color | Hex | Usage | Tailwind |
|-------|-----|-------|----------|
| Bot Teal | #1EAFAF | Primary accent | `bot-teal-*` |
| Ops Indigo | #141121 | Dark backgrounds | `ops-indigo-*` |
| Trigger Amber | #F9A100 | Highlights, warnings | `trigger-amber-*` |
| Alert Coral | #F15B5B | Errors, danger | `alert-coral-*` |
| Cloud Gray | #E6E6E6 | Neutrals | `cloud-gray-*` |

Typography: **Goldplay** (display/headings) + **Montserrat** (body text)

### Slide Types

9 types: `title`, `content`, `grid`, `image`, `quote`, `metric`, `section`, `blank`, `layout`

Each type has required/optional fields defined in `shared/schema/slide-schema.js`. The `layout` type supports custom block-based arrangements.

### Brand Voice Rules (enforced in system-prompt.js)

- No buzzwords ("AI-powered", "seamless", "robust")
- No em-dashes (—) in slide text
- No triplet marketing bullets ("Fast • Simple • Powerful")
- Educational tone, not sales pitch
- Real numbers (73% not 80%)
- Max 4-5 bullet points per slide
- Active voice
- Sound human, not AI-generated

### Running

```bash
npm run dev:full  # Frontend + backend with hot reload
npm run dev       # Frontend only (port 3000)
npm run server    # Backend only (port 3001)
npm test          # Run all tests
npm run build     # Production build
npx electron .    # Desktop app (local dev)
```

## How to Make Changes

### Changing colors
1. Edit hex values in `src/config/design/colors.json`
2. Values must be valid hex codes (`#1EAFAF`, not `teal`)
3. If adding a new color, also add Tailwind classes in `tailwind.config.js`
4. Test contrast with `checkContrast()` from `src/config/contrast.js` — minimum 4.5:1 ratio
5. Run `npm test` to verify

### Changing typography
1. Edit `src/config/design/typography.json`
2. Slide font sizes must meet the minimum (28px) — see the Photo Test rule
3. Run `npm test` and visually check with `npm run dev`

### Changing borders, spacing, shadows
1. Edit the corresponding `.json` file in `src/config/design/`
2. All sizes must include units (`16px`, not `16`)
3. Run `npm test` to verify

### Changing icons
1. Edit `src/config/design/icons.json`
2. Icon names are case-sensitive Lucide names — check https://lucide.dev
3. Run `npm test` to verify

### Changing logos and images
1. Drop image files in `public/images/`
2. Update paths in `src/config/design/images.json`
3. Adjust logo display settings (position, opacity, size) in the same file

### Changing themes
1. Edit theme tokens in `src/config/themes.js`
2. Themes reference colors from `src/config/design/colors.json` via the `hex` section
3. Each theme needs: bg, cardBg, cardBorder, textPrimary, textSecondary, textMuted, accent colors, gradient, hex section
4. Run `npm test -- src/config/themes` to verify
5. Visually check: `npm run dev`, switch themes in the editor

### Adding a template
1. Add a new deck in `src/data/templates.js` using `createSlide()` and `createDeck()`
2. Follow the pattern of existing templates
3. Must pass `validateDeck()` — the tests check this
4. Use mixed slide types, include speaker notes, use specific metrics
5. Run `npm test -- src/data/` to verify

### Changing AI behavior
1. Edit `server/ai/system-prompt.js`
2. The prompt is a template literal — be careful with backticks and `${}`
3. Test by chatting with Deckster after changes
4. Run `npm test -- server/ai/` to verify

### Adding a layout
1. Create a JSON file in `shared/layouts/`
2. Follow the schema: id, name, description, promptDescription, slots[]
3. Each slot needs: name, kinds[], position {col, row, colSpan, rowSpan}
4. Grid is 12 columns × 6 rows
5. Run `npm test -- shared/layouts/` to verify

### Adding images
1. Drop files in `public/images/`
2. Reference in slides as `/images/filename.png`
3. Keep images under 500KB for performance

## Common Mistakes to Avoid

- **Don't delete exports.** If a function is exported, something else imports it.
- **Don't rename files** without updating all imports.
- **Don't change function signatures** in shared/ or server/ — other code depends on them.
- **Don't add npm packages** without discussing first — they affect bundle size and Electron builds.
- **Don't modify dist/** — it's auto-generated by `npm run build`.
- **Don't modify package-lock.json** manually — it's auto-generated by `npm install`.
- **Test before committing.** `npm test` must pass. `npm run build` must succeed.
