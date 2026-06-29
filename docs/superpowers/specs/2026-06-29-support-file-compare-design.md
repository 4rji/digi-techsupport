# Support File Compare — side-by-side diff of two archives

**Date:** 2026-06-29
**Status:** Approved design, ready for implementation plan
**Area:** New top-level "Compare" view, alongside File Support and DRM

## Problem

A technician often needs to compare two Digi support archives — e.g. a working
device vs. a broken one, or the same device before vs. after a config change.
Today the File Support view (`__file_support__`) only holds **one** archive at a
time (`supportFileState`, `renderer.js:2316`): you can browse and search one
report, but there is no way to see *which files differ* between two reports, nor
to compare a single file across both.

The goal is to import/select **two** archives, see the list of files that differ
between them (filtered by category to hide log/timestamp noise), and view a
**side-by-side line diff** of any individual file in the same window.

## Goals

- Load two archives (each side independently) via **Import** (file dialog) or
  **Saved** (existing support library).
- Compute a cheap **manifest** of which files are `changed`, `only-a`, `only-b`,
  or `identical`, keyed by archive path.
- Group/filter the differing-files list by **category** (Config / Logs / JSON /
  Other) so log/timestamp noise can be hidden with one click. Identical files are
  hidden by default.
- View any single file as a **side-by-side, two-column diff** with added/removed
  lines highlighted, in the same window.
- Reuse the existing session, import, saved-library, and entry-content
  infrastructure; load file content **lazily** (only the open file).

## Non-goals (YAGNI)

- No unified/inline diff view. Side-by-side only (user chose this).
- No intra-line (character-level) highlighting in v1. Whole changed lines are
  highlighted.
- No "ignore whitespace" / normalization toggles in v1.
- No persistence of the comparison itself. Comparison lives in session memory and
  resets on reload (same model as the current single-archive view).
- No diffing of more than two archives.
- No new npm dependency. The line-diff algorithm is written in-repo.

## Decisions (from brainstorming)

| Question | Decision |
|----------|----------|
| Where it lives | New dedicated built-in tab **"Compare"** (`__compare__`), not folded into File Support |
| File sources | Each side: **Import** *or* pick from **Saved** library |
| Comparison scope | Compare **everything**, but list is filterable/grouped by category to hide noise |
| Diff presentation | **Side-by-side** two columns, red = removed (A-only), green = added (B-only) |
| Diff location | Manifest by **hash** in main; per-file line diff in renderer via a pure module |
| Diff algorithm | Written in-repo (LCS), no `diff` npm dependency |
| UI copy | English, to match the rest of the app (File Support, DRM, Notes) |

## Current behavior (reference)

- **Sessions (main):** `supportArchiveSessions` Map (`index.js:20`). Each session:
  `{ ownerId, fileName, tree, filesById, contentById, summary, savedFileId, createdAt }`
  (`createSupportArchiveSession`, `index.js:1799`). The map already holds multiple
  sessions concurrently and is pruned by `pruneSupportArchiveSessions`.
  - `filesById`: Map `entryId → { path, size, previewMessage, ... }`.
  - `contentById`: Map `entryId → { text, truncated }` (text entries only;
    binary/unreadable entries may be absent).
- **Import (main):** `import-support-file` IPC (`index.js:1989`) →
  `importSupportFileFromDialog` → returns
  `{ success, sessionId, fileName, tree, stats, summary, savedFile }`. Import also
  persists the file to the saved library.
- **Open saved (main):** `open-saved-support-file` → `openSavedSupportFile`
  (`index.js:1857`) → same session-shaped result.
- **Entry content (main):** `get-support-file-entry-content(sessionId, entryId)`
  IPC (`index.js:1997`) → `{ success, path, size, text, truncated }`. Reused as-is.
- **Categorization:** `classifySupportEntry(entry)` in `support-search.js:11`
  returns tags from `['json','logs','config']` (pure, dependency-free). Reused for
  the category filter; entries with no tag are "Other".
- **Tabs/views (renderer):** built-in tabs created by `createBuiltInTabButton(viewId, label)`
  (`renderer.js:3409`); `File Support` and `DRM` added at `renderer.js:3429-3430`,
  `Notes` (templates) at `3480`. The built-in view ids are registered in the array
  near `renderer.js:58-64`. View dispatch happens in `renderProductApp` /
  the `activeLineId === FILE_SUPPORT_VIEW_ID` branch (`renderer.js:3568`).
- **Preload bridge:** `window.appAPI` (`preload.js`) exposes `importSupportFile`
  (`:145`), `getSupportFileEntryContent` (`:148`), `openSavedSupportFile`,
  `listSavedSupportFiles`. Every call is logged via `logWrapper`.

## Design

### Architecture overview

```
renderer.js  (Compare view + supportCompareState)
  │  importSupportFile / openSavedSupportFile  ── reuse ──▶  index.js sessions
  │  listSavedSupportFiles (Saved picker)       ── reuse ──▶  support library
  │
  ├─ compareSupportArchives(idA, idB) ──IPC──▶ index.js
  │        buildCompareManifest(indexA, indexB)  (pure, testable)
  │        ◀── manifest { files[], counts } ──
  │
  ├─ getSupportFileEntryContent(id, entryId) ──IPC──▶ index.js  (reuse, per side)
  │
  └─ support-diff.js  (pure, no deps)
         diffLines(aText, bText) → aligned rows  → side-by-side render
```

The split mirrors the existing `support-search.js` precedent: a pure,
dependency-free module that the renderer requires and that is unit-testable
without Electron.

### New module: `support-diff.js` (pure, no dependencies)

```js
// diffLines(aText, bText, opts?) → { rows, tooLarge, addedCount, removedCount }
//   rows: [{ type, aNo, bNo, aText, bText }]
//     type: 'equal' | 'change' | 'add' | 'del'
//       equal  → aNo,bNo set; aText===bText
//       change → aNo,bNo set; aText!==bText (a removed, b added on same row)
//       del    → aNo set, bNo null  (line only in A)
//       add    → bNo set, aNo null  (line only in B)
//   tooLarge: true when input exceeds the guard (skip diff, see edge cases)
//   addedCount / removedCount: for the +/- counter in the viewer header
//
// Algorithm: line-level LCS (longest common subsequence) producing aligned rows
// suitable for two-column rendering. Adjacent del+add are coalesced into 'change'
// rows so they line up visually.
//
// Guard: if either side > MAX_DIFF_BYTES (2 MB) or > MAX_DIFF_LINES (20000),
// return { tooLarge: true, rows: [] }.
```

`support-diff.js` also re-exports a small `compareCategoryForTags(tags)` helper
that maps `classifySupportEntry` tags to a single display category
(`config | logs | json | other`) so the renderer and main agree on category names.

### Main process changes (`index.js`)

New pure function (testable in isolation):

```js
// buildCompareManifest(indexA, indexB) → { files, counts }
//   indexA / indexB: Map path → { entryId, size, hash, binary, category }
//     hash:   stable hash of the entry's text content (null when content absent)
//     binary: true when no text content is available for the entry
//   For each path in (A ∪ B):
//     - in both:   status 'identical' if (hash equal) OR (hash null on both AND size equal);
//                  else 'changed'.  approxComparison flag set when decided by size only.
//     - only in A: status 'only-a'
//     - only in B: status 'only-b'
//   files: [{ path, category, status, entryIdA, entryIdB, sizeA, sizeB,
//             binary, approxComparison }]
//   counts: { changed, onlyA, onlyB, identical, byCategory: {config,logs,json,other} }
```

New IPC handler `compare-support-archives(idA, idB)`:
1. Validate both sessions exist and `ownerId === event.sender.id` (same guard as
   `get-support-file-entry-content`); otherwise `createSupportFileFailure('invalid-file', …)`.
2. Build a `path → { entryId, size, hash, binary, category }` index per session
   from `filesById` + `contentById`. Hashes are computed once and **cached on the
   session** (`session.contentHashById`) so re-compare / swap is cheap.
   - `hash` = hash of `contentById.get(entryId).text` (e.g. crypto SHA-1) when
     present; `null` + `binary:true` when absent.
   - `category` = `compareCategoryForTags(classifySupportEntry(fileEntry))`.
3. `return { success:true, files, counts }` from `buildCompareManifest(indexA, indexB)`.

Reuses `get-support-file-entry-content` unchanged for per-side content.

### Preload changes (`preload.js`)

Add to `window.appAPI`:
```js
compareSupportArchives: logWrapper('compareSupportArchives',
  (idA, idB) => ipcRenderer.invoke('compare-support-archives', idA, idB)),
```

### Renderer changes (`renderer.js`)

- Constant `COMPARE_VIEW_ID = '__compare__'`; add to the built-in view-id array
  (`renderer.js:~58-64`); `createBuiltInTabButton(COMPARE_VIEW_ID, 'Compare')`.
- View dispatch: in the render switch, when `activeLineId === COMPARE_VIEW_ID`
  call `renderCompareView(workspace)` and set a body class `is-compare-view`.
- New state:

```js
let supportCompareState = {
  a: { sessionId:'', fileName:'', source:'', loading:false, error:'' },  // side A
  b: { sessionId:'', fileName:'', source:'', loading:false, error:'' },  // side B
  manifest: null,            // { files, counts }
  comparing: false,
  compareError: '',
  categoryFilter: 'all',     // all | config | logs | json | other
  showIdentical: false,
  pathFilter: '',
  selectedPath: '',
  selected: {                // currently open file diff
    loading:false, error:'', status:'',
    aText:'', bText:'', aTruncated:false, bTruncated:false,
    rows:[], tooLarge:false, addedCount:0, removedCount:0
  }
};
```

- `renderCompareView(workspace)` builds three regions:
  1. **Pickers** — side A and side B, each with `Import` and `Saved` buttons +
     the loaded file name. `Import` → `importSupportFile`; `Saved` → reuse the
     existing saved-files library list UI to pick one, then `openSavedSupportFile`.
     Also `Swap A↔B` and `Re-compare`.
  2. **Differing-files list** — category chips with counts
     (`All / Config / Logs / JSON / Other`), `Show identical` toggle, path filter
     input, then the filtered rows with a status badge (`~` changed, `+` only-b,
     `−` only-a, `bin` binary).
  3. **Diff viewer** — two columns A | B from `state.selected.rows`. Highlight:
     removed/A-only red, added/B-only green, changed rows both sides. Header shows
     path, status badges, and `+added / −removed` counts.
- Loading flow: when both `a.sessionId` and `b.sessionId` are set, call
  `compareSupportArchives` (sets `comparing`), store `manifest`. Selecting a row
  fetches both sides via `getSupportFileEntryContent` (skipping the absent side for
  `only-*`), runs `diffLines`, stores `selected`.

### CSS

Add `.compare-*` classes to all four themes (`styles.css`, `styles_aqua.css`,
`styles_dark.css`, `styles_grey.css`) and the structural layer
`styles_modern.css`. Diff line colors (add/remove/change) must be defined per
theme. Keeping the four sheets in sync is a project rule (CLAUDE.md, and the
`modern-ui-layer` memory).

## Edge cases / error handling

- **Session expired** (pruned): `compare-support-archives` or
  `get-support-file-entry-content` returns `invalid-file` → show
  "session expired — re-import this side" and let the user reload just that side.
- **A and B are the same saved file** (same `savedFileId`): allowed; everything is
  `identical`. Show a soft notice "A and B are the same file."
- **File too large for line diff** (> 2 MB or > 20000 lines): `diffLines` returns
  `tooLarge` → viewer shows "too large for line diff" with a button to open each
  side's content plainly (no LCS).
- **Binary / unreadable entry** (no `contentById`): compared by size only
  (`approxComparison`); viewer shows "binary file — A: N bytes, B: M bytes, no
  line diff."
- **Truncated content** (`truncated:true`): mark the diff "partial comparison
  (truncated)"; equality decided on the loaded prefix + size.
- **Only one side loaded**: the list area prompts "load the second archive to
  compare"; no compare call is made.
- **Empty file vs non-empty**: handled by `diffLines` (all `add` or all `del`).

## Testing

No test runner exists today. Add Node's built-in runner (zero dependencies):
- `package.json` script: `"test": "node --test"`.
- `test/support-diff.test.js`:
  - `diffLines`: identical input; pure add; pure delete; changed line; empty vs
    non-empty; CRLF vs LF normalization; `tooLarge` guard triggers.
  - `compareCategoryForTags`: config / logs / json / other mapping.
- `test/compare-manifest.test.js`:
  - `buildCompareManifest`: `changed`, `only-a`, `only-b`, `identical`, binary
    (`approxComparison`), and `counts` / `byCategory` totals.
- Manual smoke: in the app, compare `Radius-syslog.bin` against a copy of itself
  (expect all identical) and against a second archive (expect a populated list,
  category filters work, side-by-side diff renders).

## File-by-file change summary

| File | Change |
|------|--------|
| `support-diff.js` | **New.** `diffLines`, `compareCategoryForTags`, size guards. Pure. |
| `index.js` | **New** `buildCompareManifest` (pure) + `compare-support-archives` IPC; cache `contentHashById` on sessions. |
| `preload.js` | **New** `compareSupportArchives` on `window.appAPI`. |
| `renderer.js` | **New** `COMPARE_VIEW_ID`, `Compare` tab, `supportCompareState`, `renderCompareView` + helpers; reuse import/open/saved/entry-content. |
| `styles*.css` (4 themes) + `styles_modern.css` | **New** `.compare-*` styles incl. diff line colors. |
| `package.json` | **New** `"test": "node --test"` script. |
| `test/support-diff.test.js`, `test/compare-manifest.test.js` | **New.** Unit tests. |
