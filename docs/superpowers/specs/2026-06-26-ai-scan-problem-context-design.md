# AI Scan — Problem / Context Input

**Date:** 2026-06-26
**Status:** Approved design, ready for implementation plan
**Area:** File Support view → "Smart scan" (AI Scan) of imported Digi support archives

## Problem

When a user runs an AI Scan on an imported support archive, they need to tell the
agent the context of the problem they are troubleshooting (e.g. "the router drops
its cellular connection every night and recovers on its own"). Today the only input
is a **single-line search box** labeled *"Ask AI to scan this support file"*
(`renderer.js:6065`, `createSupportSmartScanControls`). It technically feeds the AI
prompt, but:

1. It is one line — awkward for describing a real problem with detail.
2. It is labeled/styled like a search query, so it does not invite problem context.

The goal is a clear, comfortable way to give the agent the **problem / context** that
should frame its analysis.

## Goals

- Let the user type a free-form, multi-line description of the problem/context.
- Make that text frame the AI's analysis (the agent's lens), not act as a search query.
- Keep an empty input working as today: a general first-pass scan.

## Non-goals (YAGNI)

- No structured fields (model / firmware / steps tried). User chose a single free-form box.
- No separate "context" + "query" fields. One combined box.
- No persistence to disk. Text stays in session memory only.
- No keyboard-shortcut submit. Scan is triggered only by the button.

## Decisions (from brainstorming)

| Question | Decision |
|----------|----------|
| Kind of context | Free-form problem description |
| UI shape | One large textarea (replaces the single-line input) |
| Persistence | Session only — in-memory, resets on reload (unchanged behavior) |
| Enter key | Enter = newline. Scan triggers **only** via the AI Scan button |
| Empty input | Falls back to the existing general first-pass scan |

## Current behavior (reference)

- State: `supportSmartScanState.query` is in-memory (`renderer.js:2311`), reset on reload.
- UI: `createSupportSmartScanControls()` builds a `<form>` with `<input type="search">`
  (id `file-support-smart-scan-query`, classes `file-support-search-input
  file-support-smart-scan-input`) + a submit button. Form submit → `handleSupportSmartScan()`
  (`renderer.js:6065-6101`).
- Flow: `query` → `handleSupportSmartScan()` → `requestFileSupportAnalysis({ query, ... })`
  → IPC `analyze-support-file` → `analyzeSupportFiles({ query })`
  → `buildFileSupportUserPrompt({ query, files, summary })` (`template-generator.js:155`).
- Current prompt framing:
  ```
  Analyze the imported Digi support archive for this request:
  <query or default "Run a first-pass troubleshooting scan of this support archive.">
  ```

## Design

### 1. UI — `renderer.js`, `createSupportSmartScanControls()`

Replace the `<input type="search">` with a `<textarea>`:

- Element: `document.createElement('textarea')` (drop `input.type`).
- `rows = 3` (resizable vertically via CSS).
- Keep: `id`, classes (`file-support-search-input file-support-smart-scan-input`),
  `value = supportSmartScanState.query`, `disabled` logic, and the `input` event
  handler that writes back to `supportSmartScanState.query`.
- New placeholder / aria-label (English, to match the rest of the UI):
  `Describe the problem or context for the AI (optional). e.g. "Router drops cellular every night around 2am and recovers itself"`
- No `keydown` handler. Because a `<textarea>` inside a `<form>` does **not** submit on
  Enter (only single-line inputs do), Enter naturally inserts a newline and the
  `type="submit"` button remains the only trigger — exactly the desired behavior.

Layout: textarea full width on top, **AI Scan** button below it, right-aligned.

```
┌────────────────────────────────────────────┐
│ Describe the problem or context for the AI  │
│ (optional). e.g. "Router drops cellular     │
│ every night around 2am and recovers itself" │
└────────────────────────────────────────────┘
                            [ AI Scan (Claude) ]
```

### 2. Prompt — `template-generator.js`, `buildFileSupportUserPrompt()`

When the text is present, frame it as the reported problem/context the AI should
analyze around; when empty, keep the existing default. Proposed new body:

```js
function buildFileSupportUserPrompt({ query, files, summary }) {
  const problem = String(query || '').trim();
  const intro = problem
    ? [
        'The user is troubleshooting this reported problem / context:',
        problem,
        '',
        'Use it as the lens for your analysis. Focus your findings on this issue.'
      ]
    : ['Run a first-pass troubleshooting scan of this support archive.'];
  return [
    ...intro,
    '',
    'Dashboard summary JSON:',
    JSON.stringify(summary || {}, null, 2),
    '',
    'Relevant archive excerpts:',
    buildFileSupportContext(files)
  ].join('\n');
}
```

This is the change that makes the agent "know the context." The system instructions
in `buildFileSupportInstructions()` are unchanged.

### 3. State — no change

Text continues to live in `supportSmartScanState.query` (in-memory). The internal
field name `query` is kept to avoid churn across the ~6 sites that reference it
(`scanQuery`, `resultQuery`, etc.); only the user-facing label and the prompt framing
change.

### 4. CSS — 4 base themes (+ verify modern)

The textarea inherits the shared look from `.file-support-search-input`
(styles.css:4096). Changes per base theme — `styles.css`, `styles_aqua.css`,
`styles_dark.css`, `styles_grey.css`:

- `.file-support-smart-scan`: change from a 2-column grid
  (`grid-template-columns: minmax(0,1fr) auto`) to a single-column stack with the
  button right-aligned. e.g. `display:flex; flex-direction:column; gap:8px;` plus
  `.file-support-smart-scan-button { align-self: flex-end; }`.
- `.file-support-smart-scan-input` (textarea additions): `min-height` (~72px),
  `resize: vertical`, `font: inherit`, `line-height: 1.4`, `width: 100%`.
- Mobile media queries that force `grid-template-columns: 1fr`
  (styles.css:4937, styles_dark.css:393 & 4554, styles_aqua.css:80, styles_grey.css:77)
  become redundant with a flex column; verify they don't break and simplify if needed.

`styles_modern.css` has **no** `.file-support-smart-scan` rules (only a generic
`textarea:focus-visible`). Expected: no change needed — verify the textarea renders
correctly under the modern layer.

## Files to change

| File | Change |
|------|--------|
| `renderer.js` | `createSupportSmartScanControls()` — input → textarea, new placeholder/aria-label |
| `template-generator.js` | `buildFileSupportUserPrompt()` — reframe text as reported problem/context |
| `styles.css` | smart-scan layout → column; textarea styling |
| `styles_aqua.css` | same |
| `styles_dark.css` | same |
| `styles_grey.css` | same |
| `styles_modern.css` | verify only (likely no change) |

## Verification

- `npm start`, open File Support, import a support archive.
- Textarea: multi-line, resizable, placeholder shows; Enter inserts a newline and does
  **not** trigger a scan; button triggers the scan; disabled while loading / with no session.
- With text: confirm the scan runs and the result reflects the described problem.
- Empty: confirm the general first-pass scan still runs.
- Repeat the four-theme visual check (Digi/aqua/dark/grey) + modern layer for layout
  and the textarea look.
