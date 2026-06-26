# AI Scan & Analysis — How It Works

This document explains how the "AI agent" works in this project: what it does, and
how it scans and reads support files for troubleshooting.

## The key thing to understand first

It is **not** an autonomous agent that crawls files on its own. **The model never
opens files.** The app does all file scanning and selection locally with
deterministic heuristics, assembles a small curated bundle, and makes **a single
call** to the API (OpenAI or Anthropic).

What we call the "agent skill" is simply a **prompt text** that you load in Settings
and that gets injected as the system instruction — it is not executable code.

There are two separate AI features:

1. **Template generation** (Templates view)
2. **Support file analysis** (File Support view) ← the troubleshooting one, covered in detail below.

## Troubleshooting flow (File Support)

### 1. Import the archive — `import-support-file` (`index.js:1989`)

When you open a Digi support archive (`.bin/.gz/.tgz/.tar`) or a `.txt` file:

- Decompresses (`gunzip`) and parses the tar. Limits: 512 MB per file, 1 GB
  uncompressed.
- Builds a file tree, a `filesById` map, and a `contentById` map (decoded text for
  each entry).
- Generates a **dashboard / summary** by parsing known Digi files: `version.info`,
  `ip_addr_list`, `ip_route`, `netstat`, `mmcli` (modem), `messages` (logs), etc.
  From these it extracts identity, firmware, default route, interface errors, modem
  state, log issues, findings, and a prioritized list of `keyFiles`
  (`index.js:1409-1418`).

### 2. When you press "Analyze" — `analyze-support-file` (`index.js:1956`)

The renderer sends: `provider`, `apiKey`, the `skill` (prompt), an optional `query`
(the problem you are investigating), and the `selectedFileId`.

**The actual "scan" lives in `getSupportAnalysisFiles` (`index.js:1667`)**, which
scores **every** text file with `scoreSupportAnalysisFile` (`index.js:1644`):

| Signal | Points |
|--------|--------|
| It is the file you currently have selected | +120 |
| It is a pre-identified "key file" | +30 to +95 (by priority) |
| The path matches Digi key files (`version.info`, `ip_route`, `netstat`, `messages`, `mmcli`, `ipsec`, `wg_show`, `wan_bonding`, …) | +20 |
| Each query term found in the **path** | +25 |
| Each query term found in the **content** | +8 |

It then sorts by score, keeps files with score > 0, and **caps at 10 files**
(`MAX_SUPPORT_AI_FILES`, `index.js:30`). If fewer than 6 are selected, it pads with
others to reach 6.

### 3. Extract excerpts — `buildSupportAnalysisExcerpt` (`index.js:1622`)

It does not send whole files. For each selected file:

- If it is ≤ 9000 characters → it sends the whole thing.
- If it is larger → it finds the **first occurrence of a query term** and clips a
  window around it (≈35% before the hit, the rest after), max 9000 characters,
  marking `[excerpt truncated]`.

This is key: the context the model sees is **centered on your question**.

### 4. Build the prompt and call the API — `analyzeSupportFiles` (`template-generator.js:372`)

- **System instruction**: a fixed "senior Digi support engineer" preamble
  (`template-generator.js:35-48`) + your skill text. It orders the model to: *use
  only the provided excerpts, cite the paths, and return markdown with Findings /
  Evidence / Recommended next checks.*
- **User message**: your problem + the dashboard `summary` JSON + the excerpts (each
  labeled with its path and the reason it was included).
- Context caps: 10 files, 52000 chars total, 7000 per file
  (`template-generator.js:9-12`).
- Makes **one** request: OpenAI Responses API (`gpt-4.1-mini`) or Anthropic Messages
  API (`claude-sonnet-4-5`, streamed to avoid timeouts).

It returns the analysis in markdown + the list of files used as sources.

## Template generation (Templates view)

Same pattern, different inputs — `generateSupportTemplate` (`template-generator.js:336`):

- **Inputs**: pasted text + your saved templates (used as style/structure reference)
  + the skill prompt.
- **System instruction**: `buildTemplateInstructions` (`template-generator.js:19`) —
  picks the closest loaded template, returns only the final markdown template.
- **One call** → OpenAI or Anthropic → a markdown template.
- Caps: `TEMPLATE_MAX_OUTPUT_TOKENS` 1800, up to 12 templates / 24000 chars of
  context, 3000 chars per template body (`template-generator.js:5-8`).

## Summary

- **Deterministic + one AI shot**: the intelligence about "what to read" is local
  heuristics (scoring by path, key files, and query terms); the LLM only reasons over
  the already-curated bundle.
- The model has **no tools** to request more files; it sees only what the scanner
  picked.
- The `apiKey` stays in the main process and is redacted in logs
  (`preload.js:52`).

## AI model configuration (env vars)

| Variable | Default |
|----------|---------|
| `OPENAI_TEMPLATE_MODEL` | `gpt-4.1-mini` |
| `CLAUDE_TEMPLATE_MODEL` | `claude-sonnet-4-5` |

## Relevant tuning knobs

| Constant | Value | Location |
|----------|-------|----------|
| `MAX_SUPPORT_AI_FILES` | 10 | `index.js:30` |
| `MAX_SUPPORT_AI_FILE_CHARS` | 9000 | `index.js:31` |
| `FILE_SUPPORT_CONTEXT_MAX_FILES` | 10 | `template-generator.js:10` |
| `FILE_SUPPORT_CONTEXT_MAX_CHARS` | 52000 | `template-generator.js:11` |
| `FILE_SUPPORT_CONTEXT_MAX_FILE_CHARS` | 7000 | `template-generator.js:12` |
| `FILE_SUPPORT_MAX_OUTPUT_TOKENS` | 2200 | `template-generator.js:9` |

To make the scanner prioritize different files, edit the high-value path regex and
weights in `scoreSupportAnalysisFile` (`index.js:1644`).
