# DeckWing Design System

All visual design values live in this directory as JSON files. **These are safe to edit.**

## Files

| File | What it controls | Example change |
|------|-----------------|----------------|
| `colors.json` | Brand color palette | "Make the teal darker" |
| `typography.json` | Fonts and sizes | "Use Inter instead of Montserrat" |
| `borders.json` | Border radii, widths | "Make buttons rounder" |
| `spacing.json` | Padding, margins, gaps | "Add more space between slides" |
| `shadows.json` | Shadows and glow effects | "Make cards look flatter" |
| `icons.json` | Available Lucide icons | "Add the Rocket icon" |
| `images.json` | Logo paths and settings | "Move the logo to top-left by default" |

## How to edit

1. Open the JSON file you want to change
2. Edit the values (hex colors, pixel sizes, icon names, etc.)
3. Run `npm test` to validate your changes
4. Run `npm run dev` to see them live

## Rules

- All colors must be valid hex codes (`#1EAFAF`, not `teal`)
- All sizes must include units (`16px`, not `16`)
- Icon names are case-sensitive Lucide names (check https://lucide.dev)
- Don't edit `index.js` — it's the bridge between JSON and the app
- Don't edit `design.schema.json` unless you're adding new properties

## Color usage guide

- **Teal** (50% of palette): buttons, links, active states, primary accents
- **Indigo** (15%): backgrounds, dark surfaces, depth
- **Amber** (10%): highlights, calls to action, attention
- **Coral** (5%): errors, warnings, destructive actions
- **Gray** (20%): text, borders, neutral backgrounds
