# Design — Interactive DRM console (streaming CLI over the API)

**Date:** 2026-07-10
**Status:** Proposed / not started — decide later whether to build.
**Author:** captured from a working session with Claude Code.

## TL;DR

Today the DRM device-detail panel has a **single-command console**
(`runDeviceCli` → SCI `<cli><execute>` → parsed output; request/response). This
doc scopes the **next step up**: a truly *interactive* console (persistent
session, live output, keystroke input) driven **through the Remote Manager
API**, so it works even when the device is behind NAT/cellular.

It is feasible but it is a **multi-session feature with real integration risk**,
not a small extension. Recommendation: **do a validation spike against a real
device first**, then build.

## What already exists (don't rebuild)

- `digi-remote-service.js`: `runDeviceCli`, `buildCliSci`, `parseCliOutput`
  (SCI single command). Reuses the existing API key (`keyId`/`keySecret`).
- `index.js`: IPC `digi-run-device-cli` (not exposed over HTTP).
- `preload.js`: `appAPI.digiRunDeviceCli`.
- `renderer.js`: `createDeviceConsole` / `runDeviceCliCommand` + the "Console"
  action button in `renderDeviceEnrichment`. In-memory history, capped.
- **xterm.js terminal + the multi-session SSH modal already exist** — the
  interactive console should render into that infrastructure, not a new one.

## Why interactive is a different animal

The single command is synchronous: send XML, read XML back. Interactive output
is **asynchronous streaming** — the device pushes data over time. That requires
a persistent receive channel and session state.

### The three moving parts (per python-devicecloud + DRM Monitors)

1. **Session lifecycle (SCI):** `initialize_cli_session` → `start_cli_session`
   → `send_cli_data` (keystrokes) → `stop_cli_session`.
2. **Output stream (Monitors):** device output arrives as events from a
   **Monitor** (`ws/v1/monitors` / `ws/Monitor`), not in the SCI reply.
   Monitor transports: **tcp**, **http push**, or **polling**.
3. **Input:** `send_cli_data` pushes what the tech types back to the session.

### Transport choice for a desktop Electron app

| Transport | Fit for this app | Notes |
|-----------|------------------|-------|
| **TCP monitor** | Possible | DRM pushes over a TCP socket → needs a `net`/`tls` client in the **main** process (same neighborhood as how `ssh2` is used). Lowest latency. |
| **HTTP push** | ❌ Not viable | DRM POSTs to a public callback URL — impossible behind NAT on a desktop. |
| **Polling monitor** | ✅ Pragmatic | Repeated `GET` of pending monitor events. No inbound connectivity needed. Higher latency, simplest to ship. **Start here.** |

## Prerequisites & risks (validate before committing)

- **Shell access must be enabled on each device** (Remote Manager 3.0 console
  requirement — see Digi's Console Access guide). Devices without it can only
  use the single-command console.
- **Operator staleness risk:** the `*_cli_session` operators come from the older
  `device cloud` era. **Must confirm they still work against modern DRM + DAL
  devices (TX/EX/IX)** before building the full UI.
- **Session/keep-alive semantics** (timeouts, one session per device) are
  undocumented publicly — expect to reverse-engineer from the web console's
  network traffic or python-devicecloud source.
- **Security:** interactive shell = arbitrary remote command execution. Keep it
  **out of the HTTP server surface** (same rule as reboot / single-command CLI).
  Never log session data or the API secret.

## Phase 0 — validation spike (do this first, timeboxed)

Goal: prove the API path works on **one real device** before any UI work.

1. Small Node script (outside the app) using the existing API key:
   - `start_cli_session` on a known-good, shell-enabled device.
   - Create a **polling monitor** for that session's data topic.
   - Poll and print device output; `send_cli_data("show system\n")`; confirm
     output comes back through the monitor.
   - `stop_cli_session` cleanly.
2. **Exit criteria:** live output round-trips via polling. If yes → proceed.
   If no → stop; the single-command console stays the answer.

## Phase 1 — build (only if Phase 0 passes)

Same four-layer pattern as the rest of the DRM work.

- **`digi-remote-service.js`** (pure, no Electron): `startCliSession`,
  `sendCliData`, `pollCliSession`, `stopCliSession`. Build/parse the SCI +
  monitor payloads. Unit-test the builders/parsers like `buildCliSci`.
- **`index.js`**: session-scoped IPC — `digi-cli-open`, `digi-cli-input`,
  `digi-cli-close`, plus a push channel (`digi-cli-data`) mirroring the
  `ssh-data` pattern. Keep a per-session poll loop in the main process; **not**
  exposed over HTTP.
- **`preload.js`**: `digiCliOpen/Input/Close` + an `onDigiCliData` listener,
  wrapped in `logWrapper` (redact session data).
- **`renderer.js`**: **reuse the xterm.js terminal + SSH multi-session dock**.
  Add a device-detail action "Interactive console" that opens a terminal pill
  bound to a DRM CLI session instead of an SSH connection. Reuse fit/resize,
  copy/paste, the dock, and the transcript-export work already built for SSH.

## Non-goals

- No HTTP-server exposure of interactive sessions.
- No persistence across app restarts (match the SSH dock's YAGNI list).
- Not a replacement for the single-command console — that stays for the common
  `show ...` cases and for devices without shell access.

## Decision checklist (for when you pick this up)

- [ ] Do target devices have **shell access** enabled?
- [ ] Phase 0 spike: does `start_cli_session` + **polling monitor** round-trip
      live output on a real TX/EX/IX?
- [ ] If yes: build Phase 1 in a **fresh session** (this feature will eat
      context — don't start it at the tail end of another task).

## Sources

- [python-devicecloud — CLI sessions + monitors](https://github.com/digidotcom/python-devicecloud)
- [Remote Manager `v1/monitors` — push/streaming (tcp/http/polling)](https://doc-remotemanager.digi.com/api/v1-monitors)
- [Tutorial: Experimenting with Monitors](https://doc-remotemanager.digi.com/pages/experimenting-with-monitors/)
- [Console Access via DRM (requires shell access)](https://www.digi.com/resources/examples-guides/console-access-via-digi-remote-manager-for-devices)
- [SCI (Server Command Interface)](https://doc-remotemanager.digi.com/sci/)
