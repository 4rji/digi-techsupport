# Proxnex

## Requisitos

- Linux (probado en Ubuntu/Debian)
- Git

### Instalar Node.js y npm

```bash
sudo apt update
sudo apt install -y nodejs npm
```

## Instalación de dependencias del proyecto

```bash
npm install
```

---

## Ejecutar en modo desarrollo

```bash
npm start
```

---

## Generar instalador (build)

```bash
npm run build
```

Los archivos se generan en `dist/`:

- `.AppImage`
- `.deb`

---

## Ejecutar app instalada

```bash
# AppImage
chmod +x dist/Proxnex-*.AppImage
./dist/Proxnex-*.AppImage

# o instalar el .deb
sudo dpkg -i dist/proxnex_*.deb
```

---
