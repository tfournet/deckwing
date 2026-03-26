# Contributing to DeckWing

Welcome! You don't need to be a programmer to contribute to DeckWing. If you're working with an AI assistant (like Claude Code), it will read this guide and help you make safe changes.

## What You Can Change Safely

These areas are designed for non-technical contributors. Changes here won't break the app:

### Colors and Branding
- **`src/config/design/colors.json`** — The color palette. All Rewst brand colors.
- **`src/config/design/typography.json`** — Font families, sizes, and weights.
- **`src/config/design/borders.json`** — Border radii, widths, shapes.
- **`src/config/design/spacing.json`** — Padding, margins, gaps.
- **`src/config/design/shadows.json`** — Shadow and glow effects.
- **`src/config/design/icons.json`** — Available Lucide icon set.
- **`src/config/design/images.json`** — Logo paths and display settings.
- **`src/config/themes.js`** — The 5 slide themes (uses values from the JSON files above).
- **`tailwind.config.js`** — Tailwind CSS configuration. Changes here affect the entire color system.

All design files are JSON — pure data, no code. See `src/config/design/README.md` for a full guide.

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
3. Tell Claude what you want to change **and why** — be specific:
   - "I want to make the Bot Teal color slightly darker because it washes out on projectors"
   - "Add a new template for security incident reports — our IR team needs one for client-facing presentations"
   - "The AI generates too many bullet points — can we limit it to 4 max? Slides look crowded."
   - "Add an 'ocean' theme with blue tones for our marine industry clients"
4. **Claude will ask clarifying questions** — answer them! The more context you give, the better the result:
   - "How much darker? Like a deep ocean teal, or just slightly richer?"
   - "What slides should the IR template include? What's the audience?"
   - "Should the 4-bullet limit apply to all slide types or just content slides?"
5. Claude creates a branch, makes changes, tests them, and opens a Pull Request
6. Review the PR on GitHub — someone will approve it before it goes live

### Step by step: your first contribution

Don't worry if you've never used git. Just tell Claude what to do:

**You say:** "I want to make the teal color a bit darker"

**Claude will:**
1. Create a new branch (like `design/darker-teal`)
2. Ask you how much darker and why
3. Edit `src/config/design/colors.json`
4. Run the tests to make sure nothing broke
5. Show you the change and ask if it looks right
6. Commit with a clear message: "design: darken Bot Teal to #189E9E for projector readability"
7. Push the branch and create a Pull Request
8. The team reviews and approves it

### What happens after you create a PR

Your Pull Request goes through a review process before it goes live:

1. **Automated tests run** — GitHub Actions checks that all tests pass and the app builds. If tests fail, the PR can't be merged. Claude will help you fix any issues.

2. **Review required** — A maintainer reviews your changes. They may:
   - **Approve** — your change is good, it gets merged
   - **Request changes** — they'll explain what needs to be different. Claude can help you make the fixes.
   - **Comment** — they have questions. Answer them on the PR.

3. **Who can approve:**
   - **@tfournet (Tim)** — project owner, can approve anything
   - If you're unsure who to ask, comment on your PR: "Ready for review" and someone will pick it up

4. **After approval** — a maintainer merges your PR into `main`. Your change is now part of DeckWing.

5. **Don't worry about releases** — the maintainers handle when changes get packaged into a new version.

**You never have to type a git command.** Just describe what you want.

### If Claude asks you to run something

Sometimes Claude will ask you to preview the change:
- `npm run dev` — opens the app so you can see your change live
- `npm test` — checks nothing is broken

Just paste these into the terminal when asked.

### What makes a good contribution

- **One thing at a time.** Don't change colors AND templates AND the AI prompt in one PR.
- **Explain why, not just what.** "Darker teal" is okay. "Darker teal because it's hard to read on conference room projectors" is much better.
- **Test visually.** Run `npm run dev` and look at the slides. Do they look right?
- **Trust the tests.** If `npm test` fails, something is wrong. Don't skip it.

### What Claude should do for every contribution

Claude Code agents helping contributors should follow this checklist:

1. **Understand intent** — Ask what the contributor wants and WHY before touching code
2. **Confirm scope** — "So you want to change X, not Y. Correct?"
3. **Check safety** — Is the file in the safe-to-edit list? If not, explain and suggest alternatives
4. **Create a branch** — Never work on `main` directly
5. **Make the change** — Edit the appropriate file(s)
6. **Test** — Run `npm test`. If it fails, fix it before proceeding
7. **Preview** — Offer to run `npm run dev` so the contributor can see the result
8. **Commit with context** — Message must explain what changed AND why
9. **Push and create PR** — Push the branch, create a Pull Request with a clear description
10. **Explain what happened** — Tell the contributor what was changed, in plain English

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
- All colors must be defined in `src/config/design/colors.json` first
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

- **Slack:** `#proj-deckwing` — ask questions, discuss changes, request PR reviews
- **Issues:** Open a GitHub issue for bugs or feature requests
- **Your AI assistant:** Claude has read this guide and CLAUDE.md — ask it anything about the project
- **PR reviews:** Tag `@tfournet` on your PR or ask in `#proj-deckwing` for a review
