Digi TechSupport
================

Development
-----------
1. `npm install`
2. `npm start`

Optional HTTP Server
--------------------
- `npm run serve-http` starts the static server at `http://localhost:3000`.
- By default it serves `dist/` when it exists, otherwise it serves the project root.
- Change the port with `DIGI_TECHSUPPORT_HTTP_PORT=XXXX npm run serve-http` or the served folder with `DIGI_TECHSUPPORT_STATIC_ROOT=./dist npm run serve-http`.

General Build
-------------
- `npm run build`
- Artifacts: `dist/mac/`, `dist/win/`, `dist/linux/`

Platform Builds
---------------
- macOS universal: `npm run build --mac`
- Windows: `npm run build --win`
- Linux: `npm run build --linux`

Specific macOS Architectures
----------------------------
- Apple Silicon (M1/M2/M3): `npm run build --mac --arm64`
- Intel: `npm run build --mac --x64`

TCP Checks
----------
The main screen organizes products by lines such as `IX`, `TX`, and `EX`. Each line can include more products, and new lines can also be created.

Each card stores a name, IP address, DNS domain, TCP ports, scan interval, and custom image. The image can be a URL or a local file loaded from the card settings modal.
