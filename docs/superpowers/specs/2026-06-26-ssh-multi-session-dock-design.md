# SSH multi-sesión con dock de minimizadas + pegar

Fecha: 2026-06-26

## Objetivo

Permitir que las sesiones SSH se minimicen para volver a ellas después, soportando
**varias máquinas conectadas a la vez**, y agregar **pegar** en la terminal
(`Ctrl+V` y clic derecho). Copiar ya existe (botón 📋 + `Ctrl+Shift+C`).

## Contexto actual

- `index.js` (main) ya soporta N sesiones SSH simultáneas: `sshSessions` es un
  `Map<sessionId, {conn, stream}>` y cada `ssh-connect` genera un `sessionId`
  único. Los eventos `ssh-data`/`ssh-close`/`ssh-error` ya incluyen `sessionId`.
  **No requiere cambios** (solo verificación).
- `renderer.js` es de sesión única: globales `sshTerminal`, `sshFitAddon`,
  `sshSessionId`, `sshCurrentItem`; un solo modal `#ssh-terminal-modal`; al cerrar
  el modal se desconecta. Existe `copySSHSelection()`, `toggleSshMaximize()`,
  `changeSshFontSize()`, `fitSSHTerminal()`.
- El backend SSH está restringido a IPs privadas/locales vía
  `isPrivateOrLocalHost()` — sin cambios.

El trabajo es un refactor contenido de la sección SSH de `renderer.js` más HTML/CSS.

## Modelo de estado (renderer.js)

Reemplazar los globales de sesión única por un registro:

```js
// Map<sessionId, Session>
const sshSessions = new Map();
// Session = {
//   sessionId, itemId, item, host, port, username,
//   terminal, fitAddon, containerEl, label,   // label = `${username}@${host}`
//   status, // 'connecting' | 'connected' | 'closed' | 'error'
//   minimized
// }
let activeSshSessionId = null; // sesión visible en el modal; null = formulario nuevo
let sshFontSize = 13;          // global, aplica a todas las terminales
```

Una sesión viva por equipo (`itemId`): reabrir el botón SSH de un equipo ya
conectado **enfoca/restaura** la sesión existente en vez de crear otra.

## DOM

- El modal `#ssh-terminal-modal` sigue siendo la "ventana activa".
- `#ssh-terminal-container` pasa a ser un **host**: contiene un `<div class="ssh-term-instance">`
  por sesión. Cada xterm se monta una sola vez en su propio div (`terminal.open(containerEl)`)
  y **nunca se mueve** entre contenedores. Solo el div de `activeSshSessionId` se muestra;
  los demás quedan ocultos (`display:none`).
- Header del modal: **dos botones distintos** — **Minimizar** (⎯) y **Cerrar** (×) — claramente
  separados, además del de Maximizar. Y botón **Pegar** (📥) junto a Copiar.
- Nuevo **dock** `#ssh-session-dock`: contenedor fijo a nivel de `<body>`, esquina inferior,
  visible solo cuando hay sesiones minimizadas. Cada sesión minimizada = una pastilla
  `.ssh-session-pill` con la etiqueta `username@host`, un indicador de estado, clic para
  restaurar y un botón × para desconectar.

## Comportamiento

### Abrir / restaurar
- Botón SSH de una card (`openSSHTerminalModal(itemId)`):
  - Si existe una `Session` viva para ese `itemId` → restaurarla (mostrar modal, activarla,
    `fit`, `focus`); si estaba minimizada, quitar su pastilla del dock.
  - Si no → abrir el modal en modo "conexión nueva": mostrar formulario, ocultar terminales,
    `activeSshSessionId = null`.

### Conectar
- `connectSSHFromForm()` crea la `Session`: genera `containerEl`, crea su `Terminal` + `FitAddon`,
  lo monta, registra el `onData` que escribe a **su** `sessionId`, llama a `sshConnect`,
  guarda el `sessionId` real devuelto, la marca activa y oculta el formulario.

### Minimizar
- Botón Minimizar (⎯): oculta el modal (`modal.style.display='none'`), marca
  `session.minimized = true`, renderiza/actualiza el dock. La conexión SSH **sigue viva**.
  No limpia ni desconecta.

### Restaurar
- Clic en pastilla: muestra el modal, `setActiveSshSession(sessionId)` (muestra su contenedor,
  oculta los demás, oculta el formulario, actualiza header/status/compact-bar), `fit`, `focus`,
  marca `minimized=false` y refresca el dock.

### Cerrar (×) del modal
- Si hay sesión activa conectada → **desconecta** esa sesión (`sshDisconnect`, `dispose()` del
  xterm, elimina contenedor, borra del registro y del dock) y oculta el modal. Es distinto de
  Minimizar.
- Si está en modo formulario sin sesión → solo oculta el modal.

### Desconectar
- Botón Disconnect / × de la pastilla / botón compacto: termina **esa** sesión
  (`sshDisconnect(sessionId)`), hace `dispose()` de su xterm, elimina su contenedor, la borra del
  registro y del dock. Si era la activa, vuelve a modo formulario o muestra otra sesión.

### Ruteo de eventos (push del main)
- `ssh-data`: buscar `sshSessions.get(payload.sessionId)`; escribir en `session.terminal`
  aunque esté minimizada.
- `ssh-close` / `ssh-error`: marcar `status`, escribir aviso en su terminal, actualizar pastilla
  (estado) y, si es la activa, el status del modal. No se auto-elimina; el usuario decide cerrar.

### Resize / fit
- Solo se hace `fit()` del terminal **activo/visible** (los ocultos no se pueden medir).
  En restaurar/maximizar: `fit()` y luego `sshResize(activeSessionId, cols, rows)`.
- `changeSshFontSize(delta)` actualiza el `fontSize` de **todas** las terminales del registro
  y hace `fit` de la activa.
- El `ResizeObserver` observa el host y hace fit solo de la activa.

## Copiar / Pegar

- Copiar: sin cambios funcionales; opera sobre la terminal activa
  (`getActiveSession().terminal.getSelection()`).
- Pegar (nuevo) — `pasteIntoSSH()`:
  - Lee texto con `navigator.clipboard.readText()` con fallback (textarea + `execCommand('paste')`
    no es fiable; el fallback real es informar si no hay permiso).
  - Escribe el texto al `activeSshSessionId` vía `sshWrite`.
  - Disparadores: botón 📥 de la barra, `Ctrl+V` (keydown con el modal visible), y `contextmenu`
    (clic derecho) sobre el host de la terminal → `preventDefault()` + pegar.
  - `Ctrl+Shift+C` sigue copiando; `Ctrl+C`/`Ctrl+V` "crudos" no se interceptan salvo el pegar
    explícito de `Ctrl+V` (se permite porque la terminal usa `Ctrl+C` para SIGINT, no `Ctrl+V`).

## CSS / temas

Agregar en `styles.css`, `styles_aqua.css`, `styles_dark.css`, `styles_grey.css` y
`styles_modern.css` (manteniéndolos sincronizados):
- `.ssh-session-dock` (barra fija inferior, flex, gap, z-index sobre contenido pero coherente
  con el modal), `.ssh-session-pill` (+ estados `[data-state]`), `.ssh-session-pill .pill-close`.
- `.ssh-term-instance` (ocupa el host; oculto cuando no activo).
- Botones nuevos reutilizando `.ssh-toolbar-btn`.

## Pruebas (manuales, app Electron)

App de escritorio sin suite automatizada de UI; verificación manual con `npm start`:
1. Conectar a equipo A → minimizar → aparece pastilla; el modal se oculta.
2. Conectar a equipo B → minimizar → dos pastillas.
3. Restaurar A → muestra su terminal con el scrollback intacto y la sesión sigue viva.
4. Reabrir botón SSH de A (ya conectado) → enfoca la sesión existente, no crea otra.
5. Desconectar B desde su pastilla → desaparece y se libera.
6. Copiar con selección + `Ctrl+Shift+C`; pegar con `Ctrl+V`, clic derecho y botón.
7. Cambiar tamaño de fuente afecta a las terminales; el `fit` reajusta filas/columnas.
8. Verificar el dock en los 5 stylesheets.

## Fuera de alcance (YAGNI)

- Múltiples sesiones simultáneas al **mismo** equipo.
- Persistir/reconectar sesiones tras reiniciar la app.
- Arrastrar/reordenar pastillas o vista en mosaico de varias terminales a la vez.
