# SSH Quick Log Viewer — Design

**Date:** 2026-07-09
**Status:** Approved

## Purpose

Let the user watch a device log (default `/var/log/messages`) over SSH with one
click, without opening an interactive shell and typing the command. Equivalent
to `ssh host "tail -f /var/log/messages"`, with the log path editable. No sudo:
the command runs as whatever user logs in.

## User flow

1. Open the SSH modal from a device card (existing flow). Host, username, and
   the saved admin password are prefilled as today.
2. A new **Log file** input shows the default path (`/var/log/messages`, or the
   last path used). The user can edit it to watch any other file.
3. Click **View logs**. The app connects over SSH and runs
   `tail -n 200 -f '<path>'` remotely — last 200 lines plus follow.
4. Output streams into the same xterm terminal used for normal SSH sessions
   (dock, minimize, font size controls all work). `Ctrl+C` stops the tail;
   Disconnect or closing the stream ends the session like any other.

## Components

### index.html — SSH login form

- New row inside `#ssh-login-form`, below the "Access shell directly" option:
  - `<input id="ssh-log-path">` — log file path, default `/var/log/messages`.
  - `<button id="ssh-view-logs-btn" type="button">View logs</button>` placed in
    the existing button row next to Connect.
- Reuses existing `form-group` styling. Any new CSS must be added to all four
  theme files (`styles.css`, `styles_aqua.css`, `styles_dark.css`,
  `styles_grey.css`).

### renderer.js

- `buildTailCommand(path)` — pure helper. Trims the path, rejects empty paths
  and paths containing newlines or carriage returns, escapes single quotes
  (`'` → `'\''`), and returns `tail -n 200 -f '<escaped>'`. Returns `null` on
  invalid input so the caller can show a friendly error. `200` and the default
  path are named constants.
- **View logs** click handler: identical to `connectSSHFromForm` (same
  credential gathering, session creation, status handling) but passes the
  built `command` to `sshConnect`. Refactor the shared connect logic into one
  function taking an options object rather than duplicating it.
- Session labeling: terminal banner and `#ssh-compact-info` show the log path,
  e.g. `tail -f /var/log/messages — admin@10.0.0.1`, so a docked log session
  is distinguishable from a shell session.
- On successful connect, persist the path to `localStorage` key
  `ssh_log_path`; `openSSHTerminalModal` prefills the input from that key,
  falling back to `/var/log/messages`. Single global value (last used wins).

### preload.js

- `sshConnect` already forwards an options object; add `command` to the
  documented/allowed fields (no redaction needed — it is not sensitive).

### index.js — `ssh-connect` handler

- Accept optional `options.command`. Validation: must be a string; trimmed
  length 1–512 chars; otherwise ignored/rejected with a clear error.
- Stream opening becomes a three-way choice, in priority order:
  1. `command` present → `conn.exec(command, { pty: ptyOptions }, cb)`
  2. `directShell` → `conn.exec('/bin/sh', { pty: ptyOptions }, cb)` (existing)
  3. default → `conn.shell(ptyOptions, cb)` (existing)
- Everything else (session map, data/stderr piping, close handling, legacy
  algorithms) is unchanged. stderr is already piped to the terminal, so tail
  errors like "No such file or directory" or "Permission denied" are visible
  to the user with no extra handling.

## Security notes

- Not a privilege escalation: the renderer can already open full interactive
  shells through this channel; a fixed exec command is strictly narrower.
- The pty on exec means the remote side treats it like a terminal and `Ctrl+C`
  works to stop `tail`.
- Path is quoted with single-quote escaping in the renderer; main process
  additionally caps command length. No sudo anywhere.

## Error handling

- Invalid/empty path → inline status message in the modal, no connection made.
- Connection failures → same behavior as the existing SSH connect path.
- Remote tail errors → shown in the terminal via the existing stderr pipe.
- When the user stops `tail` (Ctrl+C) or disconnects, the stream `close`
  event tears the session down through the existing path.

## Testing

- Unit: `buildTailCommand` — valid path, path with spaces, path with single
  quotes, empty path, newline injection attempt. (The repo currently has no
  test harness; add these as a minimal standalone test if practical, otherwise
  verify by manual QA.)
- Manual QA in `npm start`: view logs with saved admin password (one click),
  edit path to a nonexistent file (see tail's error), Ctrl+C stops the tail,
  path persists across app restarts, normal SSH connect still works, all four
  themes render the new row correctly.

## Out of scope

- Per-device log paths, multiple preset paths, log parsing/filtering, a
  separate read-only viewer panel, sudo/root log access.
