# Release 2.0

**Fecha:** 2026-06-17

Resumen de todos los cambios incluidos en esta versión. Agrupados por área funcional.

---

## 🔍 Web Console: barra de búsqueda (Ctrl/Cmd+F)

Al abrir el portal HTTPS de configuración del equipo (botón **Web Console**) ahora se
puede buscar texto dentro de la página.

- Se inyecta una barra de búsqueda flotante que aparece con **Ctrl+F** (o **Cmd+F** en Mac).
- Navegación entre coincidencias con **Enter / Shift+Enter** y botones ↑ / ↓.
- Contador de resultados (`actual/total`) y aviso de "Sin resultados".
- Cierre con **Escape** o el botón ✕, limpiando el resaltado.
- Implementada sobre la búsqueda **nativa de Electron** (`findInPage` + evento
  `found-in-page`), comunicada con el proceso principal mediante un puente por
  `console-message` (la ventana del portal no tiene preload/IPC). Esto evita el
  problema de pérdida de foco que tenía el enfoque con `window.find()`.

El botón que abre el portal se renombró de **"Web"** a **"Web Console"** para dejar
claro que abre la configuración del equipo.

*(commit `search-bar-fixed-bug` + ajuste de etiqueta)*

---

## 🖥️ Terminal SSH: mejoras de usabilidad

*(commits `ssh-fixed-after-protocol-changed` y `new-features`)*

- **Tamaño de fuente ajustable** en la terminal (rango 9–22) con botones +/−.
- **Modo maximizado** de la ventana de terminal con re-ajuste automático del tamaño.
- **Barra compacta** con información de la sesión y desconexión rápida.
- **Scripts rápidos** (`SSH_QUICK_SCRIPTS`): barra de comandos predefinidos.
- **Copiar selección** de la terminal al portapapeles:
  - Botón dedicado "Copy selection".
  - Atajo **Ctrl+Shift+C**.
  - Mantiene el foco en la terminal al usar el botón.
- Correcciones de conexión SSH tras el cambio de protocolo.

---

## 📝 Plantillas / Notas

*(commit `fix.notes-template`)*

- Nueva plantilla por defecto **"Case Note"**, sembrada automáticamente en instalaciones
  nuevas y existentes (control con `support_templates_default_seeded`).
- **Autoguardado**: los borradores (`drafts`) quedan obsoletos — todo se guarda
  automáticamente. Los borradores de sesión existentes se promueven a notas permanentes
  y se limpia el almacén de borradores.
- Ajustes de estilos en los cuatro temas (`styles.css`, `styles_aqua.css`,
  `styles_dark.css`, `styles_grey.css`) para los componentes de notas.

---

## 🔢 Información del dispositivo / Serial / DRM

*(commit `serial`)*

- **Scratchpad de información** del dispositivo con `ResizeObserver`.
- **Copiar valores del dispositivo** al portapapeles (número de serie, etc.) con botones
  de copia individuales.
- **Búsqueda de dispositivo en Digi Remote Manager** por ID: abre DRM filtrado
  (`openDrmDeviceSearch`).
- **Celdas de detalle del dispositivo** (`createDeviceDetailValueCell`) con botón de copia.
- Nuevo `styles_modern.css`: capa de estilo estructural sobre los cuatro temas.
- `error.png` añadido para estados de error.

---

## Resumen de commits

| Commit | Hora | Descripción |
|--------|------|-------------|
| `4de7291` | 09:48 | serial — info del dispositivo, copia de valores, DRM, estilos modern |
| `ffc394e` | 10:20 | fix.notes-template — plantilla Case Note + autoguardado |
| `90e66d4` | 10:42 | ssh-fixed-after-protocol-changed — mejoras de terminal SSH |
| `3d3240b` | 13:01 | new-features — copiar selección de terminal SSH |
| `fcbb9ca` | 13:13 | search-bar-fixed-bug — barra de búsqueda en Web Console |
