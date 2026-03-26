# Contributing to DeckWing

Welcome! You don't need to be a programmer to contribute to DeckWing. If you're working with an AI assistant (like Claude Code), it will read this guide and help you make safe changes.

## What You Can Change Safely

These areas are designed for non-technical contributors. Changes here won't break the app:

### Colors and Branding
- **`src/config/colors.js`** — The color palette. All Rewst brand colors are defined here.
- **`src/config/themes.js`** — The 5 slide themes (rewst, dramatic, terminal, highlight, warning). Each theme is a set of color tokens.
- **`tailwind.config.js`** — Tailwind CSS configuration including custom colors. Changes here affect the entire app's color system.

### Typography and Spacing
- **`src/config/typography.js`** — Font families, sizes, and weights.
- **`src/config/tokens.js`** — Design tokens for spacing, borders, and common styles.

### Slide Content and Templates
- **`src/data/templates.js`** — The 5 starter templates (QBR, Security, Onboarding, Demo, All-Hands). Edit content, add new templates, change slide order.
- **`shared/schema/slide-schema.js`** — The example deck that shows on first load. Edit to demonstrate good practices.

### AI Behavior and Voice
- **`server/ai/system-prompt.js`** — How Deckster (the AI) generates slides. Brand voice rules, content guidelines, and generation examples.

### Slide Layouts
- **`shared/layouts/`** — Layout definitions (JSON). Add new layouts or adjust existing ones.

### Images and Assets
- **`public/images/`** — Static images like logos. Drop files here and reference them in slides.

## What You Should NOT Change

These areas require programming knowledge. Ask a developer for help:

- **`server/`** (except `system-prompt.js`) — Backend API, authentication, AI engine
- **`electron/`** — Desktop app packaging
- **`src/engine/`** — Slide renderer, PDF/PPTX export
- **`src/hooks/`** — React state management
- **`src/store/`** — Data persistence
- **`shared/schema/slide-schema.js`** (the code parts) — Validation logic, createSlide/createDeck functions
- **`.github/`** — CI/CD pipelines
- **`bin/`** — CLI entry point
- **`scripts/`** — Install scripts

## How to Contribute

### If you have Claude Code installed

1. Open a terminal in the DeckWing project folder
2. Run `claude` to start Claude Code
3. Describe what you want to change in plain English:
   - "Make the Bot Teal color slightly darker"
   - "Add a new template for a security incident report presentation"
   - "Change the AI to be more concise in its bullet points"
   - "Add a new slide theme called 'ocean' with blue tones"
4. Claude will make the changes and explain what it did
5. Test with `npm run dev` to see your changes
6. Run `npm test` to make sure nothing broke

### If you're making a Pull Request

1. Create a branch: `git checkout -b my-change`
2. Make your changes (or let Claude make them)
3. Run `npm test` — all tests must pass
4. Run `npm run build` — the build must succeed
5. Commit and push: `git add . && git commit -m "description of change" && git push`
6. Open a Pull Request on GitHub

### What makes a good contribution

- **One thing at a time.** Don't change colors AND templates AND the AI prompt in one PR.
- **Test visually.** Run `npm run dev` and look at the slides. Do they look right?
- **Run the tests.** `npm test` catches broken schemas, invalid themes, and bad exports.
- **Describe why.** In your PR description, explain what you changed and why.

## Testing Your Changes

```bash
npm test              # Run all tests (must pass)
npm run dev           # Start the app with hot reload
npm run build         # Build for production (must succeed)
```

### Quick checks for specific areas

| Changed | Test command | Visual check |
|---------|-------------|-------------|
| Colors/themes | `npm test -- src/config/` | Open the app, switch themes, check contrast |
| Templates | `npm test -- src/data/` | Open the app, create deck from template |
| System prompt | `npm test -- server/ai/` | Chat with Deckster, check output quality |
| Layouts | `npm test -- shared/layouts/` | Create a layout slide, check rendering |
| Schema | `npm test -- shared/schema/` | Generate a deck, check all slide types render |

## Style Guide

### Colors
- All colors must be defined in `src/config/colors.js` first
- Use semantic names, not hex codes, in components
- New colors need WCAG AA contrast ratio (4.5:1) against their background
- Test with `src/config/contrast.js` — the `checkContrast()` function

### Slide Content
- Follow the brand voice rules in `server/ai/system-prompt.js`
- No buzzwords ("AI-powered", "seamless", "robust")
- No em-dashes (—) in slide text
- Max 4-5 bullet points per slide
- Educational tone, not sales pitch

### Templates
- Each template needs: id, name, description, and a complete deck
- Decks must pass `validateDeck()` (the tests check this)
- Use mixed slide types (don't repeat the same type 3+ times in a row)
- Include speaker notes on every slide
- Use real, specific metrics (73% not 80%)

## Getting Help

- **Issues:** Open a GitHub issue at https://github.com/tfournet/deckwing/issues
- **Questions:** Ask your AI assistant — it has read this guide and the CLAUDE.md file
