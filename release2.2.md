Digi TechSupport — Release 2.2
==============================

Release date: 2026-07-16

This release adds an embedded **AI chatbot (Digibot)** into the File Support viewer, a live **SSH log tail** viewer, a **copy selected file** button in File Support, and several bug fixes.

Highlights
----------
- **Digibot in File Support** — ask questions about the open support file without leaving the app.
- **SSH quick log viewer** — tail any log file live over SSH with a single click.
- **Copy selected file** — copy the currently selected file's content to clipboard in one click.
- **DRM device enrichment** — device detail, events, and alerts now load lazily when a DRM device card is opened.

AI Chatbot (Digibot) in File Support
--------------------------------------
The File Support viewer now has an embedded **Digibot** panel. When a file is open, a chat button lets you send the selected file content or a typed question directly to Digibot without switching windows.

- **Embedded overlay** — opens as an in-app `<webview>` panel so you can reference the file tree and the chat side by side.
- **Auto-ask** — the selected file name or a typed search term is automatically pre-filled as the question when the overlay opens.
- **Fallback** — if the embedded webview is unavailable, the chatbot opens in a standalone app window, and as a last resort in the system browser.
- **Product-aware queries** — for cards tied to a specific Digi product (e.g. IX40), the model name is appended to the query for more relevant answers.
- **Unique session per open** — each overlay gets its own in-memory session so a new conversation always starts fresh.

SSH Quick Log Viewer
--------------------
A new **View Logs** panel in the SSH terminal lets you tail any log file live over an existing SSH connection.

- Enter a log path (e.g. `/var/log/messages`) and click **View Logs** to start a `tail -f` stream in a dedicated terminal pane.
- The stream label shows the path and connection host for quick identification.
- Reuses the existing SSH session — no second connection needed.
- Backed by `ssh-log-command.mjs` (covered by unit tests in `test/ssh-log-command.test.mjs`).

Copy Selected File
------------------
A **Copy** button now appears in the File Support toolbar when a file is selected.

- Copies the full plain-text content of the currently selected file to the clipboard.
- Disabled automatically when nothing is selected, the file is still loading, or an error occurred.

DRM Device Detail (lazy enrichment)
------------------------------------
Opening a DRM device card now lazily fetches full device detail, events, and alerts in parallel.

- Detail, events, and alerts are fetched once per device session and cached.
- The detail panel shows enriched data (firmware, serial, uptime) as soon as it arrives.
- Errors on individual sub-requests are surfaced per-section without blocking the others.

Bug Fixes
---------
- Fixed chatbot overlay positioning and close-button behavior across all themes.
- Fixed Escape key not closing the chatbot overlay when the webview had focus.
- Corrected chatbot auto-ask timing so the question is sent only after the greeting bubble appears.

Files Touched
-------------
- `index.js` — SSH log tail IPC, Digibot app-window IPC, DRM enrichment calls, Escape forwarding for webview.
- `preload.js` — exposed `openAiChatbot`, `sshTailLog` APIs.
- `renderer.js` — chatbot overlay, SSH log viewer UI, copy-selected-file button, DRM lazy enrichment.
- `ssh-log-command.mjs` — new standalone SSH tail helper module.
- `styles.css`, `styles_aqua.css`, `styles_dark.css`, `styles_grey.css` — chatbot overlay styles, SSH log panel, copy button.

Upgrade Notes
-------------
- No migration required. Existing notes, templates, and saved support files are unaffected.
- No new external dependencies.

How to publish the tag
----------------------
```bash
git tag -a 2.2 -m "Release 2.2"
git push origin 2.2
```
