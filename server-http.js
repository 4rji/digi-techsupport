/**
 * Lightweight HTTP server that serves the UI bundle so Electron can load it via http://localhost:600.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { generateSupportTemplate } = require('./template-generator');
const digiRemoteService = require('./digi-remote-service');

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

function sendJson(res, status, payload) {
  sendResponse(res, status, 'application/json', JSON.stringify(payload));
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

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        req.destroy();
        reject(new Error('Request body is too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

async function handleTemplateGenerationRequest(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const payload = await readJsonBody(req);
    const result = await generateSupportTemplate(payload);
    sendJson(res, result.success ? 200 : 400, result);
  } catch (error) {
    sendJson(res, 400, { success: false, error: error.message });
  }
}

function resolveDigiCredentials() {
  const envKeyId = String(process.env.DIGI_API_KEY_ID || '').trim();
  const envKeySecret = String(process.env.DIGI_API_KEY_SECRET || '').trim();
  if (envKeyId && envKeySecret) {
    return { keyId: envKeyId, keySecret: envKeySecret };
  }
  const dataDir = process.env.DIGI_TECHSUPPORT_DATA_DIR || __dirname;
  return digiRemoteService.readCredentials(dataDir);
}

async function handleDigiDevicesRequest(req, res) {
  if (req.method !== 'GET') {
    sendJson(res, 405, { success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const requestUrl = new URL(req.url, 'http://localhost');
    const { keyId, keySecret } = resolveDigiCredentials();
    const result = await digiRemoteService.getDevices({
      keyId,
      keySecret,
      size: requestUrl.searchParams.get('size') || undefined,
      cursor: requestUrl.searchParams.get('cursor') || undefined
    });
    sendJson(res, 200, result.devices);
  } catch (error) {
    if (error instanceof digiRemoteService.ConfigurationError) {
      sendJson(res, 400, { error: error.message });
      return;
    }
    if (error instanceof digiRemoteService.AuthError) {
      sendJson(res, 401, { error: error.message });
      return;
    }
    sendJson(res, 500, { error: error.message });
  }
}

async function handleRequest(req, res) {
  try {
    const requestUrl = new URL(req.url, `http://localhost`);
    if (requestUrl.pathname === '/api/generate-template') {
      await handleTemplateGenerationRequest(req, res);
      return;
    }
    if (requestUrl.pathname === '/api/digi/devices') {
      await handleDigiDevicesRequest(req, res);
      return;
    }

    const requestedPath = decodeURIComponent(requestUrl.pathname);
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
