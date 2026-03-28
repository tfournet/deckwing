# Charts, Research Sources, and Pre-Generation Interview

> **Status:** DRAFT
> **Date:** 2026-03-26
> **Scope:** Three interlocking features that improve deck generation quality

## Problem

Deckster generates plausible-sounding content, but it has three weaknesses that reduce trust and quality:

1. **No data visualization.** The `chart` block kind exists in the schema but renders a placeholder. MSP presentations rely on data storytelling (ROI, ticket volume trends, SLA compliance) and currently the only option is metric slides with static numbers. Charts would make these decks dramatically more useful for QBRs, sales pitches, and all-hands meetings.

2. **Hallucinated facts.** Deckster invents metrics, feature names, and product details. There is no mechanism to ground its output in real Rewst documentation or marketing content. This is a trust problem: if a branding officer notices a wrong feature claim, confidence in the tool drops.

3. **Weak first drafts.** Deckster generates immediately on any prompt, which means it guesses at audience, purpose, length, and emphasis. A 30-second interview would produce dramatically better first drafts and reduce the edit-regenerate cycle.

These three features connect: the interview captures what data the user wants to show (charts), Deckster researches approved sources to get accurate content, and then generates a deck with real data visualizations and cited facts.

## Goal

After this work ships, a user can:

1. Ask Deckster to build a deck
2. Answer 3-5 quick questions about audience, purpose, and key data
3. Watch Deckster research approved sources for accurate product information
4. Receive a deck that includes branded charts with real data, cited facts, and content tailored to their stated audience and purpose

Branding officers can customize chart styles, approved research sources, and interview questions by editing JSON config files. No code changes required.

## Success Criteria

- [ ] Charts render identically in web preview, PDF, PPTX, and HTML exports
- [ ] All research citations trace back to whitelisted domains
- [ ] Interview can be skipped entirely with no degradation to the current experience
- [ ] Branding officers can modify all three config files without developer help
- [ ] Chart colors always use the Rewst brand palette unless explicitly overridden

---

## 1. Unified User Flow

The three features form a pipeline. Here is the happy path, then the skip paths.

### Happy Path

```
User: "Build a QBR deck for Acme Corp"
                    |
                    v
        +-------------------+
        |  PRE-GENERATION   |
        |    INTERVIEW      |
        +-------------------+
        Deckster asks 3-5 questions:
        - Who is the audience?
        - What is the purpose?
        - Key message?
        - Talk length?
        - Specific data to include?
                    |
        User answers (inline chat)
                    |
                    v
        +-------------------+
        |  RESEARCH PHASE   |
        +-------------------+
        Chat shows: "Checking rewst.io for current features..."
        Deckster fetches from whitelisted sources
        Gathers product facts, pricing, features
                    |
                    v
        +-------------------+
        |  GENERATION WITH  |
        |  CHARTS + CITED   |
        |  CONTENT          |
        +-------------------+
        Deck includes:
        - Chart slides with branded visuals
        - Cited facts in speaker notes
        - Content tailored to audience/purpose
                    |
                    v
        User reviews and iterates
```

### Skip Paths

**Skip interview:** User says "just make a 10-slide deck about automation ROI" -- Deckster detects the request is specific enough and skips the interview. Or user says "skip the questions" explicitly.

**Skip research:** When generating content that does not require external facts (e.g., a generic training deck), Deckster skips the research phase. No loading indicator shown.

**Skip charts:** If the user's topic does not involve data, Deckster uses metric slides instead of chart slides. Charts are additive, not required.

---

## 2. Data-Driven Charts

### Design Decision: Rendering Library

**Recommendation: Chart.js (via react-chartjs-2 for web, pptxgenjs native charts for PPTX, canvas-based for PDF/HTML)**

Why Chart.js over alternatives:

| Library | Web rendering | PPTX export | PDF/HTML export | Bundle size | Verdict |
|---------|--------------|-------------|-----------------|-------------|---------|
| Chart.js | Canvas-based, looks identical everywhere | pptxgenjs has native chart API that accepts same data shape | Canvas can be exported as image for PDF/HTML | ~60KB gzipped | Best cross-export story |
| Recharts | SVG-based, React-native | Would need SVG-to-image conversion | SVG works in HTML, needs conversion for PDF | ~45KB gzipped | Good for web, harder for PPTX |
| D3 | Maximum flexibility | No PPTX story at all | SVG works but complex | ~30KB (core) | Overkill for branded charts |

The deciding factor: **pptxgenjs has native chart support** that accepts data arrays directly. If we use Chart.js for web rendering and pptxgenjs's built-in chart API for PPTX, the data model stays the same but each export path uses its native rendering. This means charts look native in PowerPoint (editable, not images) and native in the browser.

For PDF and HTML export, we render Chart.js to a canvas, convert to PNG, and embed the image. This ensures pixel-identical output across all paths.

### Chart Types

Start with four types that cover 90% of MSP presentation needs:

| Type | Use case | Example |
|------|----------|---------|
| `bar` | Comparisons, before/after | "Ticket volume by category" |
| `line` | Trends over time | "Monthly resolution time trend" |
| `pie` | Composition, distribution | "Ticket distribution by priority" |
| `doughnut` | Same as pie, with center metric | "Time allocation breakdown" |

Future candidates (not in v1): `stacked-bar`, `area`, `horizontal-bar`, `radar`. Add these to the config as `"enabled": false` so branding officers can see what is coming.

### Schema: Chart Data Model

Charts appear in two contexts:
1. As a **block** inside a `layout` slide (existing `chart` block kind)
2. As a new **`chart` slide type** for full-slide charts

#### Chart Block (inside layout slides)

Already defined in `BLOCK_KINDS` as `{ required: ['type', 'data'], optional: [] }`. Expand the optional fields:

```json
{
  "slot": "main-chart",
  "kind": "chart",
  "type": "bar",
  "title": "Monthly Ticket Volume",
  "data": {
    "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    "datasets": [
      {
        "label": "Automated",
        "values": [120, 145, 167, 198, 234, 271]
      },
      {
        "label": "Manual",
        "values": [340, 312, 289, 245, 201, 178]
      }
    ]
  },
  "options": {
    "showLegend": true,
    "showGrid": true,
    "stacked": false
  }
}
```

#### Chart Slide Type (new)

Add `chart` to `SLIDE_TYPES`:

```json
{
  "type": "chart",
  "title": "Automation Reduces Manual Ticket Work",
  "subtitle": "6-month trend across all clients",
  "chartType": "line",
  "data": {
    "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    "datasets": [
      {
        "label": "Automated tickets",
        "values": [120, 145, 167, 198, 234, 271],
        "color": "teal"
      },
      {
        "label": "Manual tickets",
        "values": [340, 312, 289, 245, 201, 178],
        "color": "coral"
      }
    ]
  },
  "options": {
    "showLegend": true,
    "showGrid": true,
    "stacked": false
  },
  "notes": "Speaker notes here"
}
```

Schema addition to `SLIDE_TYPES`:

```js
chart: {
  required: ['chartType', 'data'],
  optional: ['title', 'subtitle', 'options', 'theme', 'logo', 'notes'],
}
```

#### Data Model Rules

- `data.labels`: Array of strings. X-axis labels (or pie segment labels).
- `data.datasets`: Array of `{ label, values, color? }`. Each dataset is one series.
- `values`: Array of numbers. Must match `labels` length.
- `color`: Optional. References a key from `charts.json` color palette (e.g., `"teal"`, `"coral"`, `"amber"`). If omitted, colors are assigned in order from the palette.
- `options.showLegend`: Boolean. Default `true` for multi-dataset, `false` for single.
- `options.showGrid`: Boolean. Default `true` for bar/line, `false` for pie/doughnut.
- `options.stacked`: Boolean. Only applies to bar charts.

### Config File: `src/config/design/charts.json`

```json
{
  "chartTypes": {
    "bar": { "enabled": true, "description": "Vertical bars for comparisons" },
    "line": { "enabled": true, "description": "Lines for trends over time" },
    "pie": { "enabled": true, "description": "Pie chart for composition" },
    "doughnut": { "enabled": true, "description": "Doughnut with center space" },
    "stacked-bar": { "enabled": false, "description": "Stacked vertical bars (future)" },
    "horizontal-bar": { "enabled": false, "description": "Horizontal bars (future)" },
    "area": { "enabled": false, "description": "Filled line chart (future)" }
  },

  "palette": {
    "order": ["teal", "coral", "amber", "indigo", "gray"],
    "colors": {
      "teal": { "fill": "#1EAFAF", "fillLight": "rgba(30, 175, 175, 0.15)" },
      "coral": { "fill": "#F15B5B", "fillLight": "rgba(241, 91, 91, 0.15)" },
      "amber": { "fill": "#F9A100", "fillLight": "rgba(249, 161, 0, 0.15)" },
      "indigo": { "fill": "#504384", "fillLight": "rgba(80, 67, 132, 0.15)" },
      "gray": { "fill": "#B3B3B3", "fillLight": "rgba(179, 179, 179, 0.15)" }
    }
  },

  "style": {
    "fontFamily": "Montserrat, system-ui, sans-serif",
    "fontSize": {
      "title": 18,
      "axisLabel": 12,
      "tickLabel": 11,
      "legend": 12,
      "dataLabel": 11
    },
    "gridColor": "rgba(255, 255, 255, 0.08)",
    "axisColor": "rgba(255, 255, 255, 0.2)",
    "textColor": "#E6E6E6",
    "textMutedColor": "#B3B3B3",
    "backgroundColor": "transparent",
    "borderRadius": 6,
    "barPercentage": 0.7,
    "lineWidth": 2.5,
    "pointRadius": 4,
    "legendPosition": "bottom"
  },

  "export": {
    "pptx": {
      "renderMode": "native",
      "notes": "pptxgenjs renders charts natively in PowerPoint. Charts are editable in PowerPoint."
    },
    "pdf": {
      "renderMode": "image",
      "resolution": 2,
      "notes": "Chart.js canvas exported as 2x PNG for crisp PDF rendering."
    },
    "html": {
      "renderMode": "image",
      "resolution": 2,
      "notes": "Chart.js canvas exported as 2x PNG for self-contained HTML files."
    }
  }
}
```

**What branding officers can customize:**
- `palette.order` -- change which colors are assigned first
- `palette.colors` -- change the actual hex values (must stay on-brand)
- `style.*` -- change fonts, sizes, grid appearance, bar width, line thickness
- `chartTypes.*.enabled` -- enable/disable chart types
- `export.pdf.resolution` -- adjust export quality vs. file size

### PPTX Export Strategy

pptxgenjs supports charts natively via `slide.addChart()`. The data model maps cleanly:

```js
// Web: Chart.js config
{
  type: 'bar',
  data: {
    labels: ['Jan', 'Feb', 'Mar'],
    datasets: [{
      label: 'Automated',
      data: [120, 145, 167],
      backgroundColor: '#1EAFAF'
    }]
  }
}

// PPTX: pptxgenjs chart config
slide.addChart(pres.charts.BAR, [
  { name: 'Automated', labels: ['Jan', 'Feb', 'Mar'], values: [120, 145, 167] }
], {
  x: 0.75, y: 1.5, w: 11.8, h: 5.0,
  showLegend: true,
  legendPos: 'b',
  chartColors: ['1EAFAF'],
  titleColor: '1EAFAF',
  catAxisLabelColor: 'E6E6E6',
  valAxisLabelColor: 'E6E6E6',
  // ... more style from charts.json
});
```

A shared `chartDataToExportFormat(slideData, chartConfig)` utility transforms the schema data model into both Chart.js and pptxgenjs formats. This lives in `shared/` so both frontend and export pipelines can use it.

The key advantage: charts exported to PPTX are **native PowerPoint charts**, not images. Users can edit the data directly in PowerPoint if needed.

### UI: Chart Rendering in the Web App

The ChartBlock component (currently a placeholder in `BlockRenderer.jsx`) gets replaced with a real Chart.js rendering. The chart slide type gets a new renderer in `renderer.jsx`.

**Chart slide layout:**
- Title at top (same position as content slide titles)
- Optional subtitle below title
- Chart fills the remaining space with generous padding
- Legend at bottom if multiple datasets
- Branded colors applied from `charts.json`

**Chart block layout (inside layout slides):**
- Chart fills its grid slot
- Title rendered above chart if provided
- Responsive to slot dimensions

**States:**
- **Normal:** Branded chart with data
- **Empty data:** Message "No data provided" with a chart icon, same dashed-border style as current placeholder
- **Invalid data:** Message "Chart data format error" with details in a tooltip
- **Loading:** Skeleton pulse in the chart area (same shape as the chart type)

---

## 3. Whitelisted Research Sources

### How It Works

When Deckster generates content that benefits from factual grounding (product features, pricing, integrations, customer stories), it fetches information from approved sources before generating.

The chat engine already supports `WebSearch` and `WebFetch` tools via the Agent SDK path. For the direct API path, we add a server-side fetch step that runs before the Claude API call.

### Architecture: Two Paths

**Agent SDK path (Claude Code binary):**
- Already has `allowedTools: ['WebSearch', 'WebFetch']`
- The system prompt instructs Deckster which domains to check
- Claude uses its built-in tools to fetch and process content
- We add domain validation: the system prompt restricts fetching to whitelisted domains only

**Direct API path (ANTHROPIC_API_KEY):**
- No tool use available in the current simple `messages.create` call
- Add a pre-fetch step: before calling Claude, the server fetches relevant pages from whitelisted sources based on the user's topic
- Inject the fetched content into the system prompt as `<research_context>` blocks
- This keeps the direct API path simple (no tool use) while still grounding content

### Config File: `src/config/design/research-sources.json`

```json
{
  "enabled": true,

  "sources": [
    {
      "id": "rewst-main",
      "domain": "rewst.io",
      "name": "Rewst Website",
      "description": "Main product site with features, pricing, and use cases",
      "pages": [
        { "path": "/", "topic": "overview" },
        { "path": "/platform", "topic": "features" },
        { "path": "/integrations", "topic": "integrations" },
        { "path": "/pricing", "topic": "pricing" },
        { "path": "/customers", "topic": "case-studies" }
      ],
      "trustLevel": "primary",
      "maxPagesPerRequest": 3
    },
    {
      "id": "rewst-docs",
      "domain": "docs.rewst.io",
      "name": "Rewst Documentation",
      "description": "Technical documentation, API reference, and how-to guides",
      "pages": [
        { "path": "/", "topic": "overview" },
        { "path": "/getting-started", "topic": "onboarding" }
      ],
      "trustLevel": "primary",
      "maxPagesPerRequest": 2
    },
    {
      "id": "rewst-blog",
      "domain": "blog.rewst.io",
      "name": "Rewst Blog",
      "description": "Product updates, customer stories, and industry insights",
      "pages": [],
      "trustLevel": "secondary",
      "maxPagesPerRequest": 2
    }
  ],

  "rules": {
    "maxTotalPagesPerGeneration": 5,
    "timeoutMs": 8000,
    "retryCount": 1,
    "cacheMinutes": 30,
    "citationFormat": "inline",
    "citationStyle": "Source: {name} ({url})"
  },

  "topicMapping": {
    "features": ["rewst-main", "rewst-docs"],
    "pricing": ["rewst-main"],
    "integrations": ["rewst-main", "rewst-docs"],
    "case-studies": ["rewst-main", "rewst-blog"],
    "technical": ["rewst-docs"],
    "general": ["rewst-main"]
  }
}
```

**What branding officers can customize:**
- `sources` -- add or remove approved domains and pages
- `sources[].pages` -- specify which pages to check for each topic
- `rules.citationFormat` / `rules.citationStyle` -- change how citations appear
- `rules.cacheMinutes` -- how long to cache fetched content
- `topicMapping` -- which sources to check for different topics
- `enabled` -- disable research entirely (useful for offline/air-gapped use)

### UI: Research Indicators

When Deckster researches sources, the chat UI shows progress:

**Research status messages** appear as a distinct visual element in the chat stream, not as regular assistant messages. They use a muted style with a subtle animation:

```
[ Researching ]
  Checking rewst.io for current features...        done
  Checking docs.rewst.io for integration list...   done
  2 sources loaded. Generating deck...
```

Design details:
- Container: `bg-ops-indigo-dark/50` with `border-l-2 border-bot-teal-500`
- Text: `text-cloud-gray-dark` (muted, not primary)
- Status indicator: Small dot that pulses while fetching, turns to a checkmark when done
- Appears inline in the chat stream between the user's message and Deckster's response
- Collapses to a single line after generation completes: "Researched 2 sources" (expandable)

**When research fails:**
- Timeout: "Could not reach rewst.io (timed out). Generating without external data."
- 404: Source silently skipped, no user-facing error
- All sources fail: "Could not reach any research sources. Generating from training data only."

Failures are non-blocking. Deckster always generates a deck, just with less grounded content.

### Citations in Slides and Speaker Notes

Citations appear in **speaker notes only**, not on slide faces. Slide faces stay clean.

Format in speaker notes:
```
Source: Rewst Documentation (https://docs.rewst.io/integrations)
- Rewst integrates with 45+ tools including ConnectWise, Datto, and Microsoft 365
```

The citation block appears at the end of the speaker notes, separated by a blank line, using the format from `research-sources.json > rules.citationStyle`.

### System Prompt Additions for Research

```
## RESEARCH AND CITATIONS

When generating content about Rewst products, features, integrations, pricing,
or customer results, you SHOULD research approved sources for accurate information.

Approved domains (ONLY fetch from these):
{dynamically injected from research-sources.json}

Rules:
- NEVER cite a URL that is not on the approved list
- NEVER fabricate URLs or page paths
- When you use information from a source, add a citation in the speaker notes
- If research is unavailable, generate from your training data but do NOT invent
  specific feature names, pricing, or statistics
- Prefer specific facts over vague claims: "integrates with 45+ tools" not
  "integrates with many tools"

Citation format in speaker notes:
Source: {source name} ({url})
- Key fact used from this source
```

---

## 4. Pre-Generation Interview

### How It Works

When Deckster receives a deck generation request, it first evaluates whether enough context was provided. If the request is vague (e.g., "make a deck about Rewst"), Deckster asks clarifying questions. If the request is specific (e.g., "make a 10-slide QBR deck for MSP owners about Q1 automation ROI with ticket volume charts"), it skips straight to generation.

### Config File: `src/config/design/interview-questions.json`

```json
{
  "enabled": true,
  "maxQuestions": 5,
  "skipTriggers": [
    "just make it",
    "skip questions",
    "skip the interview",
    "no questions",
    "go ahead",
    "just generate"
  ],

  "questions": [
    {
      "id": "audience",
      "question": "Who will be watching this presentation?",
      "options": [
        { "label": "MSP owners and leadership", "value": "executives", "tone": "business-focused, ROI-driven" },
        { "label": "Technical engineers", "value": "engineers", "tone": "technical, detailed, integration-focused" },
        { "label": "Sales prospects", "value": "prospects", "tone": "educational, problem-focused, not salesy" },
        { "label": "Partners and vendors", "value": "partners", "tone": "collaborative, integration-focused" },
        { "label": "Internal team (all-hands)", "value": "internal", "tone": "transparent, progress-focused" }
      ],
      "influencesGeneration": "tone and vocabulary",
      "required": true
    },
    {
      "id": "purpose",
      "question": "What is this deck for?",
      "options": [
        { "label": "Quarterly Business Review (QBR)", "value": "qbr", "structure": "data-heavy, charts, metrics, trends" },
        { "label": "Sales or demo", "value": "sales", "structure": "problem-solution, proof points, call to action" },
        { "label": "Training or onboarding", "value": "training", "structure": "step-by-step, progressive complexity" },
        { "label": "Conference or webinar", "value": "conference", "structure": "story arc, big ideas, memorable moments" },
        { "label": "Internal update", "value": "internal-update", "structure": "status, blockers, next steps" }
      ],
      "influencesGeneration": "deck structure and slide type mix",
      "required": true
    },
    {
      "id": "keyMessage",
      "question": "What is the one thing the audience should remember?",
      "type": "freeform",
      "placeholder": "e.g., Automation saved us 400 hours last quarter",
      "influencesGeneration": "headline framing and closing slide",
      "required": true
    },
    {
      "id": "duration",
      "question": "How long is the talk?",
      "options": [
        { "label": "5 minutes (lightning talk)", "value": "5min", "slideCount": "4-6 slides" },
        { "label": "15 minutes", "value": "15min", "slideCount": "8-12 slides" },
        { "label": "30 minutes", "value": "30min", "slideCount": "15-20 slides" },
        { "label": "60 minutes (deep dive)", "value": "60min", "slideCount": "25-35 slides" }
      ],
      "influencesGeneration": "slide count and depth of content",
      "required": false
    },
    {
      "id": "specificContent",
      "question": "Any specific data, stories, or topics to include?",
      "type": "freeform",
      "placeholder": "e.g., Include our Q1 ticket automation numbers, mention the ConnectWise integration",
      "influencesGeneration": "specific slides and data to include",
      "required": false
    }
  ],

  "generationMapping": {
    "notes": "These mappings tell the AI how interview answers shape the output",
    "audience": {
      "executives": { "chartDensity": "high", "metricSlides": true, "technicalDepth": "low" },
      "engineers": { "chartDensity": "medium", "metricSlides": true, "technicalDepth": "high" },
      "prospects": { "chartDensity": "medium", "metricSlides": true, "technicalDepth": "low" },
      "partners": { "chartDensity": "low", "metricSlides": false, "technicalDepth": "medium" },
      "internal": { "chartDensity": "medium", "metricSlides": true, "technicalDepth": "medium" }
    },
    "purpose": {
      "qbr": { "suggestCharts": true, "suggestResearch": false, "openWithData": true },
      "sales": { "suggestCharts": true, "suggestResearch": true, "openWithData": false },
      "training": { "suggestCharts": false, "suggestResearch": true, "openWithData": false },
      "conference": { "suggestCharts": true, "suggestResearch": true, "openWithData": false },
      "internal-update": { "suggestCharts": true, "suggestResearch": false, "openWithData": true }
    }
  }
}
```

**What branding officers can customize:**
- `questions` -- add, remove, or reorder questions
- `questions[].options` -- change the available choices and their labels
- `questions[].question` -- rephrase the question text
- `skipTriggers` -- add more phrases that bypass the interview
- `generationMapping` -- change how answers map to generation behavior
- `maxQuestions` -- reduce if users complain about too many questions
- `enabled` -- disable the interview entirely

### UI: Interview in the Chat

The interview is a conversation, not a form. Deckster asks one question at a time. But the UI provides quick-select buttons for the predefined options.

**Question presentation:**

Deckster's message includes the question text. Below the text, quick-select option buttons appear as a horizontal row of pill-shaped buttons (or wrapped to two rows if needed). The user can either click a button or type a freeform answer.

Visual treatment:
- Question text: Regular assistant message bubble
- Option buttons: Compact pills below the message, `bg-ops-indigo-dark border border-bot-teal-500/30 text-cloud-gray-primary hover:bg-bot-teal-500/10 hover:border-bot-teal-500`
- Selected state: `bg-bot-teal-500/20 border-bot-teal-500 text-bot-teal-light`
- Freeform input: The regular chat input field works as normal
- Skip link: Small text below the options: "Skip remaining questions" in `text-cloud-gray-dark`

**Flow:**

```
Deckster: "I'd love to build this for you. A few quick questions to
           get the right tone and structure."

           "Who will be watching this presentation?"

           [ MSP owners ] [ Engineers ] [ Sales prospects ]
           [ Partners ] [ Internal team ]
                                        Skip remaining questions

User clicks: [ MSP owners ]

Deckster: "Got it, business audience. What is this deck for?"

           [ QBR ] [ Sales/demo ] [ Training ]
           [ Conference ] [ Internal update ]
                                        Skip remaining questions

User clicks: [ QBR ]

Deckster: "What is the one thing the audience should remember?"

           (user types in chat input)

User: "Automation saved us 400 technician hours in Q1"

Deckster: "How long is the talk?"

           [ 5 min ] [ 15 min ] [ 30 min ] [ 60 min ]
                                        Skip remaining questions

User clicks: [ 30 min ]

Deckster: "Any specific data, stories, or topics to include?"

           (user types in chat input, or clicks Skip)

User: "Include ticket volume trends and ConnectWise integration stats"

Deckster: "Perfect. Building a 30-minute QBR deck for MSP leadership,
           focused on the 400-hour automation story with ticket volume
           charts and ConnectWise integration data."

           [ Researching ]
             Checking rewst.io for integration details...     done
             Checking docs.rewst.io for ConnectWise info...   done

           (generates deck)
```

### How the Interview Triggers

The system prompt includes logic to evaluate whether the user's request is specific enough:

**Specific enough to skip interview** (all of these present):
- Audience is stated or obvious
- Purpose/format is clear
- Topic is concrete
- Approximate length is given or standard

**Not specific enough (trigger interview):**
- "Make a deck about Rewst"
- "Create a presentation for our team meeting"
- "Build me something about automation"

The system prompt instructs Deckster to use the `action: null` response format during the interview (no deck changes), and to ask one question at a time. The interview answers are accumulated in the conversation history and inform the final generation.

### System Prompt Additions for Interview

```
## PRE-GENERATION INTERVIEW

When a user asks you to create a new deck, evaluate whether you have enough
context to generate a good first draft. You need to understand:
1. Audience (who is watching)
2. Purpose (what the deck is for)
3. Key message (what should stick)

If ANY of these are unclear, conduct a brief interview before generating.
Ask ONE question at a time. Keep it conversational, not interrogative.

Available questions (ask in this order, skip if already answered):
{dynamically injected from interview-questions.json}

Rules:
- Maximum {maxQuestions} questions. If you have enough context after 2-3, stop asking.
- If the user says any of these, skip the interview entirely:
  {dynamically injected skipTriggers}
- During the interview, set "action" to null (do not generate slides yet)
- After gathering answers, summarize what you understood before generating
- Use the audience to set tone, purpose to set structure, duration to set slide count
- When purpose is "qbr" or "internal-update", prefer chart slides for data
- When purpose is "sales" or "conference", prefer story-driven structure with
  metric slides for proof points

Interview answers guide generation:
{dynamically injected generationMapping}
```

---

## 5. System Prompt Changes Summary

The existing system prompt needs these additions (in order of placement):

### 1. New slide type documentation (in SLIDE SCHEMA section)

Add after the `blank` type and before the `layout` type:

```
**chart** -- Data visualization slide. Use for trends, comparisons, and distributions.
Required: chartType (string), data (object)
Optional: title (string), subtitle (string), options (object), theme, logo, notes

chartType values: "bar", "line", "pie", "doughnut"

data format:
{
  "labels": ["Label1", "Label2", ...],
  "datasets": [
    { "label": "Series name", "values": [number, ...], "color": "teal" }
  ]
}

The "color" field references named colors from the chart palette. If omitted,
colors are assigned automatically from the brand palette.

options:
- showLegend: boolean (default: true for multi-dataset)
- showGrid: boolean (default: true for bar/line, false for pie/doughnut)
- stacked: boolean (only for bar charts)

Example:
{
  "type": "chart",
  "title": "Ticket Automation Trend",
  "chartType": "line",
  "data": {
    "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    "datasets": [
      { "label": "Automated", "values": [120, 145, 167, 198, 234, 271], "color": "teal" },
      { "label": "Manual", "values": [340, 312, 289, 245, 201, 178], "color": "coral" }
    ]
  }
}

IMPORTANT: Chart data must be realistic and specific. Do not use round numbers.
If the user provides data, use it exactly. If not, generate plausible data
that follows realistic patterns (e.g., automation metrics should trend upward).
```

### 2. Research section (new section after CONCEPT OWNERSHIP)

See "System Prompt Additions for Research" above.

### 3. Interview section (new section after RESEARCH AND CITATIONS)

See "System Prompt Additions for Interview" above.

### 4. Updated chart block documentation (in LAYOUT SLIDES block kinds)

Update the chart line:
```
- chart: type (required: bar/line/pie/doughnut), data (required: { labels, datasets }), title (optional), options (optional: { showLegend, showGrid, stacked })
```

### 5. Updated deck structure guidelines

Add to DECK STRUCTURE GUIDELINES:
```
- Use chart slides when presenting quantitative trends or comparisons.
  Charts are more impactful than listing numbers in bullet points.
- For QBR decks, aim for 2-3 chart slides showing key metrics.
- Pair chart slides with content slides that explain the significance.
- Do not use more than 4 chart slides in a single deck. Too many charts
  overwhelm the audience.
```

---

## 6. Branding Officer Customization Summary

| What to customize | File to edit | Example change |
|-------------------|-------------|----------------|
| Chart colors | `src/config/design/charts.json` > `palette` | Change teal chart color to a darker shade |
| Chart fonts and sizes | `src/config/design/charts.json` > `style` | Increase axis label size from 12 to 14 |
| Available chart types | `src/config/design/charts.json` > `chartTypes` | Enable `horizontal-bar` |
| Chart bar width | `src/config/design/charts.json` > `style.barPercentage` | Change from 0.7 to 0.8 for thicker bars |
| Approved research sites | `src/config/design/research-sources.json` > `sources` | Add `community.rewst.io` |
| Citation format | `src/config/design/research-sources.json` > `rules.citationStyle` | Change to "Via {name}" |
| Research timeout | `src/config/design/research-sources.json` > `rules.timeoutMs` | Increase to 12000 for slow networks |
| Interview questions | `src/config/design/interview-questions.json` > `questions` | Add "What industry?" question |
| Interview skip phrases | `src/config/design/interview-questions.json` > `skipTriggers` | Add "no interview" |
| Audience options | `src/config/design/interview-questions.json` > `questions[0].options` | Add "Channel partners" |
| Disable interview | `src/config/design/interview-questions.json` > `enabled` | Set to `false` |
| Disable research | `src/config/design/research-sources.json` > `enabled` | Set to `false` |

All files are pure JSON. No code knowledge needed. Run `npm test` after editing to validate.

---

## 7. Implementation Order

These features have dependencies. Here is the build order:

### Phase 1: Chart Infrastructure (foundation, no AI changes)

**Why first:** Charts require schema changes, a new slide type, rendering infrastructure, and export support. This is the most technically complex piece and has zero dependency on the other two features.

Tasks:
1. Add `chart` to `SLIDE_TYPES` in `shared/schema/slide-schema.js`
2. Create `src/config/design/charts.json` with the config structure above
3. Create `shared/chart-utils.js` with `chartDataToChartJS()` and `chartDataToPptxGen()` transform functions
4. Install `chart.js` and `react-chartjs-2` dependencies
5. Replace the placeholder `ChartBlock` in `BlockRenderer.jsx` with a real Chart.js renderer
6. Add `ChartSlide` renderer to `renderer.jsx` for the new `chart` slide type
7. Add `renderChartSlide()` to `export-pptx.js` using pptxgenjs native chart API
8. Add chart-to-image export for PDF and HTML paths
9. Update the system prompt with chart slide documentation
10. Add tests for schema validation, chart transforms, and export

**Verify:** Create a deck with chart slides. Confirm they render in the web app and export to PPTX with native editable charts.

### Phase 2: Research Sources (server-side, no UI changes beyond indicators)

**Why second:** Research requires server-side fetch logic and system prompt changes, but no schema changes. It can be built independently of charts and benefits from the chart infrastructure being in place (researched data can feed into charts).

Tasks:
1. Create `src/config/design/research-sources.json`
2. Create `server/ai/research.js` with fetch, cache, and domain validation logic
3. Update `chat-engine.js` to run pre-fetch for the direct API path
4. Update `system-prompt.js` to inject approved domains and research rules
5. Add research status messaging to the chat response format
6. Add research indicator component to the chat UI
7. Add tests for domain validation, caching, and timeout behavior

**Verify:** Ask Deckster to create a deck about Rewst integrations. Confirm it fetches from approved sources and includes citations in speaker notes.

### Phase 3: Pre-Generation Interview (AI behavior + UI)

**Why third:** The interview depends on the other two features being in place. It needs to know what chart types are available (to suggest data visualization) and that research is available (to offer grounded content). It is also the simplest to implement since it is primarily a system prompt change and a small UI addition.

Tasks:
1. Create `src/config/design/interview-questions.json`
2. Update `system-prompt.js` with interview behavior rules
3. Build interview option buttons component for the chat UI
4. Update `chat-engine.js` to inject interview config into the system prompt
5. Add skip-interview detection
6. Add tests for interview flow and skip behavior

**Verify:** Start a new conversation with "Make a deck about Rewst." Confirm Deckster asks questions with clickable options. Confirm "just make it" skips the interview.

### Phase 4: Integration and Polish

Tasks:
1. End-to-end test: Interview -> Research -> Generate with charts
2. Verify all export paths work with charts
3. Test branding officer workflow: edit each JSON config, run tests, see changes
4. Update `src/config/design/README.md` with documentation for all three new config files
5. Update `CONTRIBUTING.md` with guidance for the new features
6. Performance test: research fetch should not add more than 10 seconds to generation

---

## 8. Schema Changes Summary

### `shared/schema/slide-schema.js`

Add to `SLIDE_TYPES`:

```js
chart: {
  required: ['chartType', 'data'],
  optional: ['title', 'subtitle', 'options', 'theme', 'logo', 'notes'],
}
```

Update `BLOCK_KINDS.chart`:

```js
chart: { required: ['type', 'data'], optional: ['title', 'options'] },
```

### `CURRENT_SCHEMA_VERSION`

Increment to `3` when chart slide type is added.

### Validation additions

Add to `validateSlide` for chart type:
- `chartType` must be one of the enabled types in `charts.json`
- `data.labels` must be a non-empty array of strings
- `data.datasets` must be a non-empty array
- Each dataset must have `values` array matching `labels` length

Add to `validateBlock` for chart kind:
- Same validation as chart slide but with `type` field instead of `chartType`

---

## 9. Files Created or Modified

### New files
- `src/config/design/charts.json` -- Chart styling and palette config
- `src/config/design/research-sources.json` -- Approved research domains
- `src/config/design/interview-questions.json` -- Pre-generation interview config
- `shared/chart-utils.js` -- Chart data transform utilities

### Modified files (safe to edit)
- `server/ai/system-prompt.js` -- Add chart, research, and interview sections
- `src/config/design/README.md` -- Document new config files
- `CONTRIBUTING.md` -- Add guidance for new features

### Modified files (require developer approval)
- `shared/schema/slide-schema.js` -- Add chart slide type, update chart block validation
- `src/engine/blocks/BlockRenderer.jsx` -- Replace chart placeholder with Chart.js
- `src/engine/renderer.jsx` -- Add chart slide renderer
- `src/engine/export-pptx.js` -- Add native PPTX chart export
- `src/engine/export-pdf.js` -- Add chart-to-image for PDF
- `src/engine/export-html.js` -- Add chart-to-image for HTML
- `server/ai/chat-engine.js` -- Add research pre-fetch for direct API path
- `package.json` -- Add chart.js and react-chartjs-2 dependencies

---

## 10. Open Questions

1. **Chart data editing in the UI.** Should users be able to edit chart data directly in the slide editor (spreadsheet-style)? Or only through conversation with Deckster? Recommend: Start with conversation-only. Add a data editor in a later phase if users request it.

2. **Research caching strategy.** The config specifies 30 minutes. Should we persist the cache to disk for the Electron app, or keep it in-memory only? Recommend: In-memory for v1. Disk cache for Electron in a later phase.

3. **Interview question ordering.** Should the order be fixed or should Deckster adapt based on what it already knows? Recommend: Fixed order from config, but Deckster skips questions it can infer from context. This is simpler to test and debug.

4. **Chart animation in the web app.** Chart.js supports entrance animations. Should charts animate when the slide comes into view? Recommend: Yes, a brief 300ms fade-in. Disabled in presenter mode for instant display.

5. **Custom data upload.** Should users be able to paste CSV data for charts? Recommend: Not in v1. The AI can interpret pasted tabular data in the chat and convert it to the chart schema. True CSV import can come later.
