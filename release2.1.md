Digi TechSupport — Release 2.1
==============================

Release date: 2026-07-02

This release extends the **File Support** importer to Digi **AnywhereUSB** support bundles, and improves the **Notes** workflow with a Markdown preview (copy as Markdown *or* plain text) and a new preset-free "blank" note.

Highlights
----------
- **AnywhereUSB support files** — `.bin` bundles from AnywhereUSB Manager now import directly.
- **Markdown + plain-text export** — notes render as Markdown and copy either as raw Markdown or as plain (rendered) text.
- **Blank notes** — create a free-form note with no Case fields / presets.

AnywhereUSB File Support
------------------------
Digi AnywhereUSB support bundles (`awusbmanager_support.bin`) are **ZIP** archives, which the importer previously did not recognize (it only tried gzip/tar and plain text). The importer now detects and reads them.

- **ZIP detection** — files are recognized by signature (`PK\x03\x04`) and parsed before falling through to the gzip/tar and plain-text paths.
- **No new dependencies** — a small ZIP reader built on Node's built-in `zlib` (`inflateRawSync`) walks the central directory and decompresses each entry (stored and deflate methods).
- **Same experience as tar bundles** — entries appear in the tree view, are previewable as text, searchable via Advanced Search, and available to AI analysis, exactly like existing `.gz`/`.tar` support archives.
- **Safety limits preserved** — respects the 1 GB uncompressed cap and blocks path traversal on entry names.

Example bundle contents now readable in-app: `awusbmanager_log.txt`, `awusb.ini`, `versions.txt`, `list_full.txt`, `full_state.txt`, `memory_info.txt`, `systeminfo.txt`, `ipconfig.txt`.

Notes: Markdown Preview & Export
--------------------------------
Notes now have a **Preview / Edit** toggle, so the same note can be exported in two forms:

- **Markdown (raw)** — in Edit mode, the copy action yields the raw Markdown source (`# … / ## …`, links, etc.), ready to paste into a ticket or Markdown-aware field.
- **Plain / normal text** — in Preview mode, the note renders to HTML and the copy action yields the clean rendered text with the Markdown syntax stripped.
- **Dependency-free renderer** — a minimal Markdown→HTML converter drives the preview (headings, links); no external libraries added.

Blank Notes (no presets)
------------------------
- New **"New blank"** button creates a free-form note with **no Case fields panel** — just an editable body.
- Complements the existing structured **Case Note** template (Case Number, SN, Product, Firmware, ID, Main Error, Notes) for quick, unstructured jotting.

Files Touched
-------------
- `index.js` — ZIP archive parser (`parseSupportZipArchive`), shared text-entry finalizer (`finalizeSupportTextEntry`), ZIP detection in `readSupportArchiveFromFilePath`.
- `renderer.js` — blank note creation (`createManualPlainNote` / `openBlankPlainNote`), Markdown preview (`renderNoteMarkdownHtml`) and Preview/Edit copy behavior.
- `styles.css`, `styles_aqua.css`, `styles_dark.css`, `styles_grey.css` — UI for the new note controls and preview.

Upgrade Notes
-------------
- No migration required. Existing notes and saved support files are unaffected.
- Previously imported `.gz` / `.tar` support archives continue to work unchanged.

How to publish the tag
----------------------
Same pattern as 1.0 / 1.1 / 1.2 / 2.0:

```bash
# bump package.json version to 2.1.0 (optional)
git tag -a 2.1 -m "Release 2.1"
git push origin 2.1
```
