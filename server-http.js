/**
 * Lightweight HTTP server that serves the UI bundle so Electron can load it via http://localhost:600.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.DIGI_TECHSUPPORT_HTTP_PORT) || 3000;
const DEFAULT_FILE = 'index.html';

function resolveStaticRoot() {
  if (process.env.DIGI_TECHSUPPORT_STATIC_ROOT) {
    return path.resolve(process.env.DIGI_TECHSUPPORT_STATIC_ROOT);
  }

  const distRoot = path.join(__dirname, 'dist');
  if (fs.existsSync(path.join(distRoot, DEFAULT_FILE))) {
    return distRoot;
  }

  return __dirname;
}

const STATIC_ROOT = path.normalize(resolveStaticRoot());

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

function sendResponse(res, status, contentType, payload) {
  res.writeHead(status, {
    'Content-Type': contentType,
    'Cache-Control': 'no-cache'
  });
  res.end(payload);
}

function sendNotFound(res) {
  sendResponse(res, 404, 'text/plain', '404 Not Found');
}

function sendInternalError(res, error) {
  console.error('Static server error:', error);
  sendResponse(res, 500, 'text/plain', '500 Internal Server Error');
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

async function handleRequest(req, res) {
  try {
    const requestedPath = decodeURIComponent(new URL(req.url, `http://localhost`).pathname);
    const safePath = requestedPath.replace(/\0/g, '');
    let filePath = path.join(STATIC_ROOT, safePath);
    filePath = path.normalize(filePath);

    if (!filePath.startsWith(STATIC_ROOT)) {
      sendNotFound(res);
      return;
    }

    let stats;
    try {
      stats = await fs.promises.stat(filePath);
    } catch {
      sendNotFound(res);
      return;
    }

    if (stats.isDirectory()) {
      filePath = path.join(filePath, DEFAULT_FILE);
      try {
        stats = await fs.promises.stat(filePath);
      } catch {
        sendNotFound(res);
        return;
      }
    }

    const stream = fs.createReadStream(filePath);
    stream.on('error', (err) => sendInternalError(res, err));
    res.writeHead(200, {
      'Content-Type': getContentType(filePath),
      'Cache-Control': 'no-cache'
    });
    stream.pipe(res);
  } catch (error) {
    sendInternalError(res, error);
  }
}

const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`HTTP server serving ${STATIC_ROOT} on http://localhost:${PORT}`);
});
