# Digi TechSupport

## Requirements

- Linux (tested on Ubuntu/Debian)
- Git

### Install Node.js and npm

```bash
sudo apt update
sudo apt install -y nodejs npm
```

## Install Project Dependencies

```bash
npm install
```

---

## Run in Development Mode

```bash
npm start
```

---

## Generate Installer (Build)

```bash
npm run build
```

The files are generated in `dist/`:

- `.AppImage`
- `.deb`

---

## Run Installed App

```bash
# AppImage
chmod +x dist/digi-techsupport-*.AppImage
./dist/digi-techsupport-*.AppImage

# or install the .deb
sudo dpkg -i dist/digi-techsupport-*.deb
```

---
