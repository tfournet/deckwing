# Claude Code Instructions — DeckWing

Read CONTRIBUTING.md first. It has the full project guide. This file adds AI-specific rules.

## Protected Files — Do NOT Modify Without Approval

- `server/ai/chat-engine.js` — AI API integration
- `server/ai/claude-oauth.js` — OAuth authentication flow
- `server/ai/find-claude.js` — Claude binary discovery
- `server/app.js` — Express routes and auth
- `shared/schema/slide-schema.js` — Schema validation (createSlide, validateSlide, etc.)
- `src/engine/` — Renderer and all export pipelines
- `src/hooks/` — React hooks
- `src/store/` — Data persistence
- `electron/` — Desktop app packaging
- `.github/` — CI/CD pipelines
- `bin/`, `scripts/` — CLI and install scripts

## Before Committing

```bash
npm test        # Must pass
npm run build   # Must succeed
```

If either fails, fix or revert. Do not commit broken code.

## Rules for AI Assistants

- Don't add npm packages without asking — they affect bundle size and Electron builds.
- Don't rename files or change exported function signatures without checking all importers.
- Don't modify `dist/` or `package-lock.json` — both are auto-generated.
- Don't tag releases without being asked. Tags trigger CI builds and Electron releases.
