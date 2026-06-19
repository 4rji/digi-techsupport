Digi TechSupport — Release 1.3
==============================

Release date: 2026-06-18

This release focuses on two areas: a redesigned **Case Notes** workflow and a new **Advanced (cross-file) Search** for support archives. It also bundles a tree-view file browser, broader file-type support, and assorted UI/bug fixes.

Highlights
----------
- **Case Notes** — structured, field-based notes for each support case.
- **Advanced Search** — search across *every* file inside a support archive at once, not just the open file.
- **Tree-view** file browser for imported archives.
- **Plain text files** (`.txt`, `.log`, `.md`) importable directly, without needing an archive.
- UI polish across all four themes plus the modern layer.

Case Notes
----------
The notes workflow was rebuilt around a structured **case note** template (`case-note` mode) instead of a single free-text blob.

- Dedicated fields per case, each persisted locally and copyable with one click:
  - **Case Number**
  - **SN** (serial number)
  - **Product** (device model)
  - **Firmware** version
  - **ID** (device ID)
  - **Main Error** (primary symptom)
  - **Notes** (free-form troubleshooting notes)
- Fields sync with the quick-reference scratchpad bar under the tabs (ID / SN / MAC / Case), so values entered once are reused.
- Notes are stored as Markdown (`# Support Notes` with a `## Notes` section) and can round-trip: existing Markdown notes are parsed back into the structured fields on load.
- New case notes start from a default template (`Untitled note`) ready to fill in.

Advanced Search
---------------
A new cross-file search engine (`support-search.js`) lets you query the entire contents of an imported support archive in one pass, isolated from the Electron main process so it stays fast and testable.

- **Cross-file matching** — searches across all entries in the archive instead of only the file currently open.
- **Grep / regex mode** — accepts raw patterns and tolerates pasted `rg`, `ripgrep`, or `grep` prefixes and flags (e.g. `-i`); falls back to a literal match if the regex is invalid.
- **Case-insensitive** toggle and include/exclude term matching per line.
- **File-type filters** — narrow results to `json`, `logs`, or `config` entries, auto-classified by path and name (e.g. `var/log/`, `config_dump`, `config_json`, `*_json`).
- **Quick searches** — one-click presets: `config_dump`, `config_json`, `mmcli`, `ip_route`, `ip_addr`, `runt_j`.
- **Cut mode** to trim surrounding blank lines in results.
- **Safety limits** to keep large archives responsive: up to 80 files, 200 lines/file, 5000 total lines, 1000 chars/line.
- Debounced input and result navigation so typing stays smooth; click a result to jump to that file.

Wired through `searchSupportArchive` in the preload bridge → `searchSupportArchiveSession` in the main process.

Other Changes
-------------
- **Tree-view file browser** — imported archives now render as a navigable file tree across all themes.
- **Plain text files importable directly** — `.txt`, `.log`, `.md`, and other readable files can now be opened in the support viewer without needing to be inside an archive.
- **View-screen bug fix** and general layout fixes applied consistently to `styles.css`, `styles_aqua.css`, `styles_dark.css`, `styles_grey.css`, and `styles_modern.css`.

Files Touched
-------------
- `support-search.js` (new) — advanced cross-file search engine.
- `renderer.js` — case notes UI, advanced search UI/state, tree view.
- `index.js`, `preload.js` — `searchSupportArchive` IPC channel.
- `index.html`, all theme stylesheets, `styles_modern.css` — UI for notes, search, and tree view.

Upgrade Notes
-------------
- No migration required. Existing free-text notes are parsed into the new structured fields automatically when opened.
