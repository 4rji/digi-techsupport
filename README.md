Product Lines App
=================

Desarrollo
----------
1. `npm install`
2. `npm start`

Servidor HTTP opcional
---------------------
- `npm run serve-http` arranca el servidor estático en `http://localhost:3000`.
- Por defecto sirve `dist/` cuando existe o el directorio raíz del proyecto.
- Cambia el puerto con `PROXNEX_HTTP_PORT=XXXX npm run serve-http` o la carpeta servida con `PROXNEX_STATIC_ROOT=./dist npm run serve-http`.

Compilación general
-------------------
- `npm run build`
- Artefactos: `dist/mac/`, `dist/win/`, `dist/linux/`

Compilaciones por plataforma
----------------------------
- macOS universal: `npm run build --mac`
- Windows: `npm run build --win`
- Linux: `npm run build --linux`

Arquitecturas macOS específicas
-------------------------------
- Apple Silicon (M1/M2/M3): `npm run build --mac --arm64`
- Intel: `npm run build --mac --x64`

Chequeos TCP
------------
La pantalla principal organiza productos por líneas como `IX`, `TX` y `EX`. Cada línea puede tener más productos, y también se pueden crear líneas nuevas.

Cada tarjeta guarda nombre, IP, dominio DNS, puertos TCP, intervalo de chequeo e imagen propia. La imagen puede ser una URL o un archivo local cargado desde el modal de configuración de la tarjeta.
