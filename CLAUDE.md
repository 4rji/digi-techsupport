# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # Install dependencies
npm start            # Run in development (Electron)
npm run build        # Build distributable (output: dist/)
npm run serve-http   # Start static HTTP server on port 3000
```

Platform-specific builds:
```bash
npm run build -- --mac --arm64   # Apple Silicon
npm run build -- --mac --x64     # Intel Mac
npm run build -- --win --x64     # Windows
npm run build -- --linux         # Linux
```

HTTP server env vars:
- `DIGI_TECHSUPPORT_HTTP_PORT` — change port (default 3000)
- `DIGI_TECHSUPPORT_HTTP_HOST` — change bind address (default `127.0.0.1`; the server exposes DRM data, so only widen this deliberately)
- `DIGI_TECHSUPPORT_STATIC_ROOT` — change served folder (defaults to `dist/` if it exists, else project root)

AI model env vars:
- `OPENAI_TEMPLATE_MODEL` — default `gpt-4.1-mini`
- `CLAUDE_TEMPLATE_MODEL` — default `claude-sonnet-4-5`

## Architecture

This is an **Electron desktop app** for Digi device technical support workflows. There is no build step for JS/CSS — files are loaded directly. The app is single-window and does not use a frontend framework.

### Process split

| File | Process | Role |
|------|---------|------|
| `index.js` | Main (Node) | Electron entry point (`package.json` `"main"`). IPC handlers for TCP tests, ping, SSH sessions, support archive parsing, template generation, and file I/O. Creates the `BrowserWindow` and loads `index.html` directly via `loadFile`. |
| `main.js` | Main (legacy) | Earlier version of the main process, fully superseded by `index.js`. Not referenced anywhere; kept for reference only. |
| `preload.js` | Main → Renderer bridge | Exposes `window.appAPI` to the renderer via `contextBridge`. Every call is wrapped with a `logWrapper` that redacts sensitive fields before console logging. |
| `renderer.js` | Renderer | All UI logic — product line/card management, TCP/ping polling, SSH terminal (xterm.js), templates workspace, file support viewer, settings modal. Loaded as an ES module (`import`). |
| `server-http.js` | Standalone Node | Optional static file server. Also exposes `POST /api/generate-template` for headless template generation. |
| `template-generator.js` | Main + HTTP server | Shared AI generation logic. Calls OpenAI Responses API or Anthropic Messages API depending on `provider`. Shared constants cap output tokens and context size. |
| `digi-remote-service.js` | Main + HTTP server | Digi Remote Manager (DRM) integration. `getDevices()` fetches `/ws/v1/devices/inventory` and maps to `{ id, name, status }`. `getDeviceDetail`/`getDeviceEvents`/`getDeviceAlerts` fetch per-device data (v1 REST); `queryDeviceState`/`rebootDevice` use SCI (`POST /ws/sci`, XML, reuses the same API key); `getDeviceLogs` returns log text for the Support Archive Viewer. All share a `drmRequest` helper. Credential read/write helpers store `digi-remote-credentials.json` (mode 0o600) in userData. Throws `ConfigurationError` (no key) / `AuthError` (401) / `NotFoundError` (404). Never logs or returns the secret. |


### IPC surface (preload.js → index.js)

The renderer communicates with the main process only through `window.appAPI`. Key channels:
- `ping-host`, `test-tcp-port` — connectivity checks
- `ssh-connect`, `ssh-write`, `ssh-resize`, `ssh-disconnect` — SSH session lifecycle
- `generate-support-template`, `analyze-support-file` — AI calls
- `digi-get-credentials`, `digi-save-credentials`, `digi-get-devices` — Digi Remote Manager (secret stays in main; only `keyId`/`hasCredentials` returned). HTTP server mirrors `GET /api/digi/devices`.
- `digi-get-device-detail`, `digi-get-device-events`, `digi-get-device-alerts` — per-device DRM data, lazily fetched when a device row/card is opened. HTTP server mirrors `GET /api/digi/devices/:id`, `/:id/events`, `/:id/alerts`.
- `digi-query-device-state` (live CPU/mem/uptime via SCI), `digi-reboot-device` (SCI reboot — renderer confirms first; destructive, not exposed over HTTP).
- `digi-get-device-logs` — fetches DRM device logs and builds a Support Archive Viewer session (reuses the plain-text `buildTextArchive` path), so logs open in the File Support view like an imported archive.
- `import-support-file`, `get-support-file-entry-content` — support archive (.bin/.gz/.tgz/.tar) and text-file parsing
- `list/open/update/delete-saved-support-files` — support library CRUD
- `save-text-file` — native save dialog
- Push events back to renderer: `ssh-data`, `ssh-close`, `ssh-error`

### Renderer structure (renderer.js)

`renderer.js` is a large single-file ES module (~200 KB). Key areas:
- **Product lines/cards** — stored in `localStorage` under `product_lines`. Built-in lines (IX, TX, EX) have locked items with preset images and default IPs. Cards poll TCP ports and ping on `PORT_POLL_INTERVAL` (2 s).
- **Templates workspace** (`__templates__` view) — CRUD for support templates stored in `localStorage`. AI generation posts to main via `generateSupportTemplate`. Drafts are kept separately in `support_template_drafts`.
- **File support** (`__file_support__` view) — imports Digi support archives (gzip/tar) and readable text files, displays a file tree, and can call AI analysis on selected entries.
- **SSH terminal** — xterm.js with `FitAddon`, backed by the `ssh2` npm package in the main process.
- **Settings modal** — theme switching, config import/export (JSON), API key storage, agent skill file loading.

### Persistence

- **`localStorage`** (renderer) — product lines, templates, drafts, theme, API keys, agent skill, preferred AI provider.
- **`electron-store` / userData files** — SSH admin password (`ssh-admin-password.json`), support library index and files (`support-library/`).
- **Config JSON** — exported/imported manually by the user via Settings.

### Themes

Four CSS files: `styles.css` (Digi), `styles_aqua.css`, `styles_dark.css`, `styles_grey.css`. The active sheet is swapped at runtime by replacing the `<link>` href. All four must stay in sync for new UI components.

### Security notes

- `contextIsolation: true` and `nodeIntegration: false` are set on the BrowserWindow — the renderer only reaches main-process functionality through `window.appAPI` (contextBridge in `preload.js`). Do not load untrusted remote content.
- `isPrivateOrLocalHost()` in `index.js` gates router web-console windows and self-signed certificate trust to private/local hosts. SSH connections themselves are not host-restricted.
- Support archive extraction caps: 512 MB per file, 1 GB uncompressed total, path traversal blocked via `normalizeSupportEntryPath()`.
