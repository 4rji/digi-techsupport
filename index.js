const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron');
const path = require('path');
const net = require('net');
const fs = require('fs');
const zlib = require('zlib');
const { promisify } = require('util');
const { execFile } = require('child_process');
const crypto = require('crypto');
const { Client } = require('ssh2');
const tar = require('tar-stream');
const { generateSupportTemplate, analyzeSupportFiles } = require('./template-generator');
const digiRemoteService = require('./digi-remote-service');
const { searchSupportArchiveSession, classifySupportEntry } = require('./support-search');
const { buildCompareManifest, compareCategoryForTags, normalizeCompareEntryPath } = require('./support-diff');

const APP_ICON_NAME = process.platform === 'win32' ? 'icon.ico' : 'icon.png';
const APP_ICON_PATH = app.isPackaged
  ? path.join(process.resourcesPath, APP_ICON_NAME)
  : path.join(__dirname, 'build', APP_ICON_NAME);
const sshSessions = new Map();
const supportArchiveSessions = new Map();
const SSH_ADMIN_PASSWORD_FILE = 'ssh-admin-password.json';
const SUPPORT_LIBRARY_DIR = 'support-library';
const SUPPORT_LIBRARY_FILES_DIR = 'files';
const SUPPORT_LIBRARY_INDEX_FILE = 'index.json';
const SUPPORT_LIBRARY_VERSION = 1;
const MAX_SUPPORT_FILE_BYTES = 512 * 1024 * 1024;
const MAX_UNCOMPRESSED_ARCHIVE_BYTES = 1024 * 1024 * 1024;
const MAX_TEXT_PREVIEW_BYTES = 5 * 1024 * 1024;
const MAX_SUPPORT_ARCHIVE_SESSIONS = 3;
const MAX_SUPPORT_AI_FILES = 10;
const MAX_SUPPORT_AI_FILE_CHARS = 9000;
const gunzipBuffer = promisify(zlib.gunzip);
let mainWindow = null;

if (process.platform === 'darwin') {
  app.commandLine.appendSwitch('use-mock-keychain');
}

function isPrivateOrLocalHost(hostname) {
  const host = String(hostname || '').trim().toLowerCase().replace(/^\[|\]$/g, '');
  if (!host) return false;
  if (host === 'localhost' || host.endsWith('.local')) return true;

  if (net.isIPv4(host)) {
    const parts = host.split('.').map(part => Number(part));
    const [first, second] = parts;
    return first === 10
      || first === 127
      || first === 169 && second === 254
      || first === 172 && second >= 16 && second <= 31
      || first === 192 && second === 168
      || first === 100 && second >= 64 && second <= 127;
  }

  if (net.isIPv6(host)) {
    return host === '::1'
      || host.startsWith('fe80:')
      || host.startsWith('fc')
      || host.startsWith('fd');
  }

  return false;
}

function isRouterCertificateURL(url) {
  try {
    const parsedURL = new URL(url);
    return parsedURL.protocol === 'https:' && isPrivateOrLocalHost(parsedURL.hostname);
  } catch (_error) {
    return false;
  }
}

function openInDefaultBrowser(rawURL) {
  try {
    const parsedURL = new URL(rawURL);
    if (!['http:', 'https:'].includes(parsedURL.protocol)) return false;
    shell.openExternal(parsedURL.toString()).catch(error => {
      console.error('Could not open URL in the default browser:', error);
    });
    return true;
  } catch (_error) {
    return false;
  }
}

function getSavedAdminPassword() {
  try {
    const result = readSSHAdminPassword();
    if (!result || !result.success || !result.hasPassword) return '';
    return result.password || '';
  } catch (error) {
    console.error('Could not read saved admin password:', error);
    return '';
  }
}

function getRouterWebLoginAutofillScript() {
  return `
    (() => {
      const defaultUsername = 'admin';
      const savedPassword = ${JSON.stringify(getSavedAdminPassword())};

      const isVisible = (element) => {
        if (!element || element.disabled || element.readOnly) return false;
        const style = window.getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden') return false;
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      };

      const notifyChange = (element) => {
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      };

      const setValue = (element, value) => {
        if (!element || element.value) return;
        element.focus();
        element.value = value;
        notifyChange(element);
      };

      const scoreUsernameInput = (input) => {
        const type = (input.getAttribute('type') || 'text').toLowerCase();
        if (type === 'password' || type === 'hidden' || type === 'submit' || type === 'button') return -1;

        const text = [
          input.name,
          input.id,
          input.autocomplete,
          input.placeholder,
          input.getAttribute('aria-label')
        ].filter(Boolean).join(' ').toLowerCase();

        let score = type === 'text' || type === 'email' || type === 'search' || !type ? 1 : 0;
        if (/user|username|login|admin|account|name|email/.test(text)) score += 5;
        if (/pass|token|search|filter/.test(text)) score -= 5;
        return score;
      };

      const inputs = Array.from(document.querySelectorAll('input')).filter(isVisible);
      const passwordInput = inputs.find(input => (input.getAttribute('type') || '').toLowerCase() === 'password');
      const usernameInput = inputs
        .map(input => ({ input, score: scoreUsernameInput(input) }))
        .filter(entry => entry.score >= 0)
        .sort((a, b) => b.score - a.score)[0]?.input;

      setValue(usernameInput, defaultUsername);
      if (savedPassword) {
        setValue(passwordInput, savedPassword);
      }
    })();
  `;
}

function autofillRouterWebLogin(webContents) {
  if (!webContents || webContents.isDestroyed()) return;
  const url = webContents.getURL();
  if (!isRouterCertificateURL(url)) return;

  webContents.executeJavaScript(getRouterWebLoginAutofillScript(), true).catch(error => {
    console.error('Could not autofill router web login:', error);
  });
}

function injectFindBar(webContents) {
  if (!webContents || webContents.isDestroyed()) return;
  const script = `
(function() {
  if (document.getElementById('__digi_findbar__')) return;
  const bar = document.createElement('div');
  bar.id = '__digi_findbar__';
  bar.style.cssText = 'position:fixed;top:0;right:0;z-index:2147483647;display:none;background:#2b2b2b;border-bottom-left-radius:6px;padding:6px 10px;box-shadow:0 2px 8px rgba(0,0,0,0.5);align-items:center;gap:6px;font-family:sans-serif;font-size:13px;';
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Buscar en página…';
  input.style.cssText = 'background:#3c3c3c;color:#fff;border:1px solid #555;border-radius:3px;padding:3px 7px;font-size:13px;outline:none;width:200px;';
  const info = document.createElement('span');
  info.style.cssText = 'color:#aaa;font-size:12px;min-width:40px;';
  const btnPrev = document.createElement('button');
  btnPrev.textContent = '↑';
  btnPrev.title = 'Anterior';
  btnPrev.style.cssText = 'background:#555;color:#fff;border:none;border-radius:3px;padding:2px 7px;cursor:pointer;font-size:13px;';
  const btnNext = document.createElement('button');
  btnNext.textContent = '↓';
  btnNext.title = 'Siguiente';
  btnNext.style.cssText = 'background:#555;color:#fff;border:none;border-radius:3px;padding:2px 7px;cursor:pointer;font-size:13px;';
  const btnClose = document.createElement('button');
  btnClose.textContent = '✕';
  btnClose.style.cssText = 'background:none;color:#aaa;border:none;cursor:pointer;font-size:14px;padding:2px 4px;';
  bar.appendChild(input);
  bar.appendChild(btnPrev);
  bar.appendChild(btnNext);
  bar.appendChild(info);
  bar.appendChild(btnClose);
  document.body.appendChild(bar);

  // Bridge to the main process (no preload/IPC in this window): main listens
  // to console messages prefixed with __DIGI_FIND__ and drives native findInPage,
  // which highlights matches WITHOUT stealing focus from this input.
  function send(payload) { console.info('__DIGI_FIND__' + JSON.stringify(payload)); }

  let lastText = '';
  function doFind(backward) {
    const text = input.value;
    if (!text) { lastText = ''; info.textContent = ''; send({ action: 'stop' }); return; }
    // findNext=false starts a fresh search; true navigates between matches.
    const findNext = text === lastText;
    lastText = text;
    send({ action: 'find', text: text, forward: !backward, findNext: findNext });
  }

  function show() { bar.style.display = 'flex'; input.focus(); input.select(); if (input.value) doFind(false); }
  function hide() { bar.style.display = 'none'; lastText = ''; send({ action: 'stop' }); }

  // Main pushes match counts back by calling __digiFindResult__.
  window.__digiFindResult__ = function(active, total) {
    info.textContent = total > 0 ? (active + '/' + total) : 'Sin resultados';
  };

  input.addEventListener('input', () => doFind(false));
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { doFind(e.shiftKey); e.preventDefault(); }
    else if (e.key === 'Escape') { hide(); e.preventDefault(); }
  });
  btnNext.addEventListener('click', () => { doFind(false); input.focus(); });
  btnPrev.addEventListener('click', () => { doFind(true); input.focus(); });
  btnClose.addEventListener('click', hide);

  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) { e.preventDefault(); show(); }
    else if (e.key === 'Escape' && bar.style.display !== 'none') { hide(); }
  });
})();
  `;
  webContents.executeJavaScript(script, true).catch(() => {});
}

function configureRouterWebWindow(webContents) {
  if (!webContents) return;

  webContents.on('did-finish-load', () => {
    autofillRouterWebLogin(webContents);
    injectFindBar(webContents);
  });

  webContents.on('did-navigate', () => {
    autofillRouterWebLogin(webContents);
    injectFindBar(webContents);
  });

  // Receive search requests from the injected find bar (console-message bridge).
  webContents.on('console-message', (event) => {
    const message = (event && typeof event.message === 'string') ? event.message : '';
    if (!message.startsWith('__DIGI_FIND__')) return;
    let payload;
    try {
      payload = JSON.parse(message.slice('__DIGI_FIND__'.length));
    } catch (_e) {
      return;
    }
    if (webContents.isDestroyed()) return;
    if (payload.action === 'stop') {
      webContents.stopFindInPage('clearSelection');
    } else if (payload.action === 'find' && payload.text) {
      webContents.findInPage(payload.text, {
        forward: payload.forward !== false,
        findNext: !!payload.findNext
      });
    }
  });

  // Native search results -> push match counts back into the find bar.
  webContents.on('found-in-page', (_event, result) => {
    if (webContents.isDestroyed() || !result || result.finalUpdate === false) return;
    const active = Number(result.activeMatchOrdinal) || 0;
    const total = Number(result.matches) || 0;
    webContents.executeJavaScript(
      `window.__digiFindResult__ && window.__digiFindResult__(${active}, ${total});`,
      true
    ).catch(() => {});
  });
}

function getSSHAdminPasswordPath() {
  return path.join(app.getPath('userData'), SSH_ADMIN_PASSWORD_FILE);
}

function readSSHAdminPassword() {
  const filePath = getSSHAdminPasswordPath();
  if (!fs.existsSync(filePath)) {
    return { success: true, password: '', hasPassword: false };
  }

  const saved = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const value = typeof saved.value === 'string' ? saved.value : '';
  if (!value) {
    return { success: true, password: '', hasPassword: false };
  }

  if (saved.encoding === 'safeStorage') {
    return {
      success: false,
      error: 'Saved SSH password uses macOS Keychain encryption. Re-enter and save it to migrate.'
    };
  }

  return { success: true, password: value, hasPassword: Boolean(value) };
}

function writeSSHAdminPassword(password) {
  const sanitizedPassword = typeof password === 'string' ? password : '';
  const filePath = getSSHAdminPasswordPath();

  if (!sanitizedPassword) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return { success: true, hasPassword: false };
  }

  const payload = {
    encoding: 'plain',
    value: sanitizedPassword
  };

  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), { mode: 0o600 });
  return { success: true, hasPassword: true };
}

function readSSHConfigDefaults(host) {
  const targetHost = String(host || '').trim();
  if (!targetHost) {
    return { success: false, error: 'Host is required' };
  }

  const configPath = path.join(__dirname, 'config');
  if (!fs.existsSync(configPath)) {
    return { success: true, defaults: null };
  }

  const content = fs.readFileSync(configPath, 'utf8');
  const entries = [];
  let current = null;

  content.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const [rawKey, ...rest] = trimmed.split(/\s+/);
    const key = rawKey.toLowerCase();
    const value = rest.join(' ');

    if (key === 'host') {
      current = { alias: value };
      entries.push(current);
      return;
    }

    if (!current) return;
    if (key === 'hostname') current.hostName = value;
    if (key === 'user') current.username = value;
    if (key === 'port') current.port = Number(value) || 22;
  });

  const match = entries.find(entry => entry.hostName === targetHost || entry.alias === targetHost);
  return {
    success: true,
    defaults: match ? {
      alias: match.alias,
      host: match.hostName || targetHost,
      username: match.username || '',
      port: match.port || 22
    } : null
  };
}

function pingHost(host, timeout = 3000) {
  if (!host) {
    return Promise.resolve({ success: false, online: false, error: 'Host is required' });
  }

  const sanitizedTimeout = Math.max(500, Math.min(Number(timeout) || 3000, 10000));
  const pingCommand = process.platform === 'darwin' ? '/sbin/ping' : 'ping';
  const args = process.platform === 'win32'
    ? ['-n', '1', '-w', String(sanitizedTimeout), host]
    : process.platform === 'darwin'
      ? ['-c', '1', '-W', String(sanitizedTimeout), host]
      : ['-c', '1', '-W', String(Math.ceil(sanitizedTimeout / 1000)), host];

  return new Promise(resolve => {
    execFile(pingCommand, args, { timeout: sanitizedTimeout + 1000 }, (error) => {
      resolve({
        success: !error,
        online: !error,
        error: error ? error.message : null
      });
    });
  });
}

const TEXT_FILE_EXTENSIONS = new Set([
  '.cfg',
  '.conf',
  '.config',
  '.csv',
  '.env',
  '.html',
  '.ini',
  '.js',
  '.json',
  '.log',
  '.md',
  '.properties',
  '.rc',
  '.service',
  '.sh',
  '.status',
  '.txt',
  '.xml',
  '.yaml',
  '.yml'
]);

const TEXT_FILE_NAMES = new Set([
  'config',
  'dmesg',
  'hostname',
  'hosts',
  'interfaces',
  'messages',
  'profile',
  'resolv.conf',
  'syslog',
  'version'
]);

function createSupportFileFailure(errorType, error) {
  return {
    success: false,
    errorType,
    error: error instanceof Error ? error.message : String(error || 'Unknown error')
  };
}

function getSupportLibraryRootPath() {
  return path.join(app.getPath('userData'), SUPPORT_LIBRARY_DIR);
}

function getSupportLibraryFilesPath() {
  return path.join(getSupportLibraryRootPath(), SUPPORT_LIBRARY_FILES_DIR);
}

function getSupportLibraryIndexPath() {
  return path.join(getSupportLibraryRootPath(), SUPPORT_LIBRARY_INDEX_FILE);
}

async function ensureSupportLibraryDirectories() {
  await fs.promises.mkdir(getSupportLibraryFilesPath(), { recursive: true });
}

function normalizeSupportLibraryText(value, maxLength = 4000) {
  return String(value || '').replace(/\0/g, '').trim().slice(0, maxLength);
}

function getSupportFileDisplayName(fileName) {
  return String(fileName || 'Support file').replace(/\.(bin|gz|tgz|tar|txt|md|markdown|log)$/i, '') || 'Support file';
}

function getSupportLibrarySavedFileName(id, originalFileName) {
  const extension = path.extname(String(originalFileName || '')).toLowerCase();
  const safeExtension = /^[.][a-z0-9]{1,12}$/i.test(extension) ? extension : '.bin';
  return `${id}${safeExtension}`;
}

function getSupportLibraryItemPath(item) {
  const safeFileName = path.basename(String(item?.savedFileName || ''));
  return safeFileName ? path.join(getSupportLibraryFilesPath(), safeFileName) : '';
}

function normalizeSupportLibraryItem(item) {
  if (!item || typeof item !== 'object') return null;
  const id = String(item.id || '').trim();
  const savedFileName = path.basename(String(item.savedFileName || ''));
  const originalFileName = path.basename(String(item.originalFileName || 'support-file.bin'));
  if (!id || !savedFileName) return null;
  const displayName = getSupportFileDisplayName(originalFileName);

  return {
    id,
    alias: normalizeSupportLibraryText(item.alias || displayName, 96),
    title: normalizeSupportLibraryText(item.title || item.alias || displayName, 160),
    notes: normalizeSupportLibraryText(item.notes || '', 8000),
    originalFileName,
    savedFileName,
    hash: String(item.hash || '').trim(),
    size: Math.max(0, Number(item.size) || 0),
    importedAt: String(item.importedAt || new Date().toISOString()),
    lastOpenedAt: String(item.lastOpenedAt || item.importedAt || new Date().toISOString())
  };
}

function serializeSupportLibraryItem(item) {
  const normalizedItem = normalizeSupportLibraryItem(item);
  if (!normalizedItem) return null;
  return {
    id: normalizedItem.id,
    alias: normalizedItem.alias,
    title: normalizedItem.title,
    notes: normalizedItem.notes,
    originalFileName: normalizedItem.originalFileName,
    hash: normalizedItem.hash,
    size: normalizedItem.size,
    importedAt: normalizedItem.importedAt,
    lastOpenedAt: normalizedItem.lastOpenedAt
  };
}

async function readSupportLibraryIndex() {
  try {
    const content = await fs.promises.readFile(getSupportLibraryIndexPath(), 'utf8');
    const parsed = JSON.parse(content);
    const files = Array.isArray(parsed.files) ? parsed.files : [];
    return files
      .map(normalizeSupportLibraryItem)
      .filter(Boolean)
      .sort((a, b) => new Date(b.lastOpenedAt).getTime() - new Date(a.lastOpenedAt).getTime());
  } catch (error) {
    if (error && error.code === 'ENOENT') return [];
    console.error('Could not read support library index:', error);
    return [];
  }
}

async function writeSupportLibraryIndex(files) {
  await ensureSupportLibraryDirectories();
  const normalizedFiles = files
    .map(normalizeSupportLibraryItem)
    .filter(Boolean)
    .sort((a, b) => new Date(b.lastOpenedAt).getTime() - new Date(a.lastOpenedAt).getTime());
  const payload = {
    version: SUPPORT_LIBRARY_VERSION,
    updatedAt: new Date().toISOString(),
    files: normalizedFiles
  };
  await fs.promises.writeFile(getSupportLibraryIndexPath(), JSON.stringify(payload, null, 2), 'utf8');
  return normalizedFiles;
}

async function listSavedSupportFiles() {
  const files = await readSupportLibraryIndex();
  return {
    success: true,
    files: files.map(serializeSupportLibraryItem).filter(Boolean)
  };
}

async function saveSupportFileToLibrary(sourceFilePath, compressedFile, stats) {
  await ensureSupportLibraryDirectories();
  const originalFileName = path.basename(sourceFilePath);
  const hash = crypto.createHash('sha256').update(compressedFile).digest('hex');
  const files = await readSupportLibraryIndex();
  const now = new Date().toISOString();
  let item = files.find(candidate => candidate.hash && candidate.hash === hash);

  if (item) {
    item.originalFileName = item.originalFileName || originalFileName;
    item.size = Math.max(0, Number(stats?.size) || compressedFile.length);
    item.lastOpenedAt = now;
    const existingPath = getSupportLibraryItemPath(item);
    if (existingPath) {
      try {
        await fs.promises.access(existingPath, fs.constants.R_OK);
      } catch (_error) {
        await fs.promises.writeFile(existingPath, compressedFile);
      }
    }
  } else {
    const id = crypto.randomUUID();
    const alias = getSupportFileDisplayName(originalFileName);
    item = {
      id,
      alias,
      title: alias,
      notes: '',
      originalFileName,
      savedFileName: getSupportLibrarySavedFileName(id, originalFileName),
      hash,
      size: Math.max(0, Number(stats?.size) || compressedFile.length),
      importedAt: now,
      lastOpenedAt: now
    };
    await fs.promises.writeFile(getSupportLibraryItemPath(item), compressedFile);
    files.push(item);
  }

  await writeSupportLibraryIndex(files);
  return serializeSupportLibraryItem(item);
}

async function updateSavedSupportFile(fileId, updates = {}) {
  const files = await readSupportLibraryIndex();
  const item = files.find(candidate => candidate.id === fileId);
  if (!item) {
    return createSupportFileFailure('invalid-file', 'Saved file was not found.');
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'alias')) {
    item.alias = normalizeSupportLibraryText(updates.alias, 96) || item.alias || item.originalFileName;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'title')) {
    item.title = normalizeSupportLibraryText(updates.title, 160) || item.title || item.alias || item.originalFileName;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'notes')) {
    item.notes = normalizeSupportLibraryText(updates.notes, 8000);
  }

  await writeSupportLibraryIndex(files);
  return {
    success: true,
    file: serializeSupportLibraryItem(item)
  };
}

async function deleteSavedSupportFile(fileId) {
  const files = await readSupportLibraryIndex();
  const item = files.find(candidate => candidate.id === fileId);
  if (!item) {
    return createSupportFileFailure('invalid-file', 'Saved file was not found.');
  }

  const nextFiles = files.filter(candidate => candidate.id !== fileId);
  const filePath = getSupportLibraryItemPath(item);
  if (filePath) {
    try {
      await fs.promises.unlink(filePath);
    } catch (error) {
      if (!error || error.code !== 'ENOENT') {
        throw error;
      }
    }
  }
  await writeSupportLibraryIndex(nextFiles);
  return { success: true };
}

function normalizeSupportEntryPath(entryName) {
  let normalizedPath = String(entryName || '')
    .replace(/\0/g, '')
    .replace(/\\/g, '/')
    .replace(/^\/+/, '');

  while (normalizedPath.startsWith('./')) {
    normalizedPath = normalizedPath.slice(2);
  }

  const parts = normalizedPath
    .split('/')
    .filter(part => part && part !== '.');

  if (parts.some(part => part === '..')) {
    return '';
  }

  return parts.join('/');
}

function isKnownTextPath(entryPath) {
  const fileName = path.posix.basename(entryPath).toLowerCase();
  return TEXT_FILE_NAMES.has(fileName) || TEXT_FILE_EXTENSIONS.has(path.posix.extname(fileName));
}

function bufferLooksLikeText(buffer, entryPath) {
  if (!buffer || buffer.length === 0) return true;

  const knownTextPath = isKnownTextPath(entryPath);
  const sample = buffer.subarray(0, Math.min(buffer.length, 4096));
  let controlBytes = 0;

  for (const byte of sample) {
    if (byte === 0) return false;
    const isAllowedControl = byte === 7 || byte === 8 || byte === 9 || byte === 10 || byte === 12 || byte === 13 || byte === 27;
    if (byte < 32 && !isAllowedControl) {
      controlBytes++;
    }
  }

  const decodedSample = sample.toString('utf8');
  if (!knownTextPath && decodedSample.includes('\uFFFD')) {
    return false;
  }

  return knownTextPath || controlBytes / sample.length < 0.08;
}

function formatSupportFileSize(bytes) {
  if (!Number.isFinite(bytes)) return 'unknown size';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function compareSupportNodes(a, b) {
  if (a.type !== b.type) {
    return a.type === 'directory' ? -1 : 1;
  }
  return a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true });
}

function buildSupportArchiveTree(entries) {
  const root = {
    id: 'support-root',
    name: '/',
    path: '',
    type: 'directory',
    children: []
  };
  const directoriesByPath = new Map([['', root]]);

  const getOrCreateDirectory = (directoryPath) => {
    const normalizedDirectoryPath = normalizeSupportEntryPath(directoryPath);
    if (directoriesByPath.has(normalizedDirectoryPath)) {
      return directoriesByPath.get(normalizedDirectoryPath);
    }

    const parentPath = normalizedDirectoryPath.split('/').slice(0, -1).join('/');
    const parent = getOrCreateDirectory(parentPath);
    const directory = {
      id: `support-dir-${normalizedDirectoryPath}`,
      name: path.posix.basename(normalizedDirectoryPath),
      path: normalizedDirectoryPath,
      type: 'directory',
      implicit: true,
      children: []
    };

    directoriesByPath.set(normalizedDirectoryPath, directory);
    parent.children.push(directory);
    return directory;
  };

  [...entries]
    .sort((a, b) => a.path.localeCompare(b.path, undefined, { sensitivity: 'base', numeric: true }))
    .forEach(entry => {
      if (entry.type === 'directory') {
        const directory = getOrCreateDirectory(entry.path);
        Object.assign(directory, entry, { children: directory.children });
        return;
      }

      const parentPath = entry.path.split('/').slice(0, -1).join('/');
      const parent = getOrCreateDirectory(parentPath);
      parent.children.push({ ...entry });
    });

  const sortChildren = (node) => {
    if (!Array.isArray(node.children)) return;
    node.children.sort(compareSupportNodes);
    node.children.forEach(sortChildren);
  };
  sortChildren(root);

  return root.children;
}

function countSupportTreeNodes(nodes, type) {
  return nodes.reduce((total, node) => {
    const current = node.type === type ? 1 : 0;
    return total + current + (Array.isArray(node.children) ? countSupportTreeNodes(node.children, type) : 0);
  }, 0);
}

function getSupportEntryText(entry, contentById, maxLength = 200000) {
  if (!entry || entry.type !== 'file') return '';
  const content = contentById.get(entry.id);
  if (!content || typeof content.text !== 'string') return '';
  return content.text.slice(0, maxLength);
}

function findSupportEntry(entries, pattern) {
  return entries.find(entry => entry.type === 'file' && pattern.test(entry.path));
}

function findSupportEntries(entries, pattern, limit = 8) {
  return entries
    .filter(entry => entry.type === 'file' && pattern.test(entry.path))
    .slice(0, limit);
}

function addSupportKeyFile(keyFiles, entry, title, reason, priority) {
  if (!entry || keyFiles.some(file => file.entryId === entry.id)) return;
  keyFiles.push({
    entryId: entry.id,
    path: entry.path,
    title,
    reason,
    priority
  });
}

function parseVersionSummary(text) {
  const product = /NETWORK_PRODUCT=([^\n]+)/.exec(text)?.[1]?.trim();
  const version = /PRODUCT_VERSION=([^\n]+)/.exec(text)?.[1]?.trim();
  const build = /PRODUCT_BUILDSTRING=([^\n]+)/.exec(text)?.[1]?.trim();
  if (!product && !version && !build) return '';
  return [
    product ? `Product: ${product}` : '',
    version ? `Firmware: ${version}` : '',
    build ? `Build: ${build}` : ''
  ].filter(Boolean).join(' | ');
}

function parseInterfaceSummary(text) {
  const interfaces = [];
  const blocks = String(text || '').split(/\n(?=\d+:\s+\S+:)/);
  blocks.forEach(block => {
    const header = /^(\d+):\s+([^:]+):\s+<([^>]*)>/.exec(block);
    if (!header) return;
    const name = header[2].replace(/@.*$/, '');
    if (name === 'lo') return;
    const flags = header[3].split(',');
    const ipv4 = [...block.matchAll(/\binet\s+([0-9.]+\/\d+)/g)].map(match => match[1]);
    interfaces.push(`${name} ${flags.includes('UP') ? 'UP' : 'DOWN'}${ipv4.length ? ` (${ipv4.join(', ')})` : ''}`);
  });
  return interfaces.slice(0, 5).join('; ');
}

function parseDefaultRoute(text) {
  const route = String(text || '').split('\n').find(line => /^default\s+/.test(line.trim()));
  return route ? route.trim().replace(/\s+/g, ' ') : '';
}

function parseNetstatIssue(text) {
  const lines = String(text || '').split('\n');
  const issues = [];
  lines.forEach(line => {
    const columns = line.trim().split(/\s+/);
    if (columns.length < 9 || columns[0] === 'Iface' || columns[0] === 'Kernel') return;
    const [iface, , , rxErr, rxDrp, , , txErr, txDrp] = columns;
    const rxErrors = Number(rxErr) || 0;
    const rxDrops = Number(rxDrp) || 0;
    const txErrors = Number(txErr) || 0;
    const txDrops = Number(txDrp) || 0;
    if (rxErrors || rxDrops || txErrors || txDrops) {
      issues.push(`${iface}: RX errors ${rxErrors}, RX drops ${rxDrops}, TX errors ${txErrors}, TX drops ${txDrops}`);
    }
  });
  return issues.slice(0, 4).join('; ');
}

function summarizeLogIssues(text) {
  const issueLines = String(text || '')
    .split('\n')
    .filter(line => /\b(error|failed|failure|unable|refused|timeout|terminated|critical|fatal|warn)\b/i.test(line));
  const counts = {
    dns: issueLines.filter(line => /resolve|dns|lookup/i.test(line)).length,
    cloud: issueLines.filter(line => /cloud|edp|telemetry|metrics/i.test(line)).length,
    service: issueLines.filter(line => /refused|terminated|failed to connect/i.test(line)).length,
    interface: issueLines.filter(line => /link|interface|carrier|disconnect/i.test(line)).length
  };
  const sample = issueLines.slice(0, 3).map(line => line.trim().replace(/\s+/g, ' '));
  return {
    total: issueLines.length,
    counts,
    sample
  };
}

function parseSupportJSON(text) {
  const source = String(text || '').trim();
  if (!source) return null;
  try {
    return JSON.parse(source);
  } catch (_error) {
    try {
      return JSON.parse(source.replace(/\t/g, ' '));
    } catch (_fallbackError) {
      return null;
    }
  }
}

function parseConfigDumpValues(text) {
  const values = new Map();
  String(text || '').split(/\r?\n/).forEach(line => {
    const match = /^([^=\s]+)=(.*)$/.exec(line.trim());
    if (!match) return;
    values.set(match[1], match[2]);
  });
  return values;
}

function normalizeSupportValue(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function formatSupportValueWithUnits(value, units) {
  const normalizedValue = normalizeSupportValue(value);
  const normalizedUnits = normalizeSupportValue(units);
  if (!normalizedValue) return '';
  if (!normalizedUnits) return normalizedValue;
  return normalizedValue.toLowerCase().endsWith(normalizedUnits.toLowerCase())
    ? normalizedValue
    : `${normalizedValue} ${normalizedUnits}`;
}

function getRuntimeValue(runtime, paths) {
  if (!runtime || typeof runtime !== 'object') return '';
  for (const runtimePath of paths) {
    const record = runtime[runtimePath];
    if (!record || typeof record !== 'object') continue;
    const displayValue = normalizeSupportValue(record.display_value);
    const rawValue = normalizeSupportValue(record.value);
    const value = displayValue || rawValue;
    if (!value) continue;
    return formatSupportValueWithUnits(value, record.units);
  }
  return '';
}

function getRuntimeNumericValue(runtime, paths) {
  if (!runtime || typeof runtime !== 'object') return null;
  for (const runtimePath of paths) {
    const record = runtime[runtimePath];
    if (!record || typeof record !== 'object') continue;
    const rawValue = normalizeSupportValue(record.value || record.display_value);
    if (!rawValue) continue;
    const numericValue = Number(rawValue);
    if (Number.isFinite(numericValue)) {
      return numericValue;
    }
  }
  return null;
}

function findRuntimeRecord(runtime, options = {}) {
  if (!runtime || typeof runtime !== 'object') return null;
  const contextRegex = options.contextRegex || /./;
  const fieldRegex = options.fieldRegex || /./;
  const excludeRegex = options.excludeRegex || null;

  for (const [pathKey, record] of Object.entries(runtime)) {
    if (!record || typeof record !== 'object') continue;
    const contextText = [
      pathKey,
      record.path,
      record.title
    ].filter(Boolean).join(' ');
    const fieldText = [
      String(record.path || pathKey).split('.').pop(),
      record.title
    ].filter(Boolean).join(' ');
    if (!contextRegex.test(contextText) || !fieldRegex.test(fieldText)) continue;
    if (excludeRegex && excludeRegex.test(contextText)) continue;

    const value = formatSupportValueWithUnits(record.display_value || record.value, record.units);
    if (!value) continue;
    return {
      path: record.path || pathKey,
      title: record.title || pathKey,
      value
    };
  }
  return null;
}

function addDashboardItem(items, label, value, options = {}) {
  const normalizedValue = normalizeSupportValue(value);
  if (!normalizedValue) return;
  items.push({
    label,
    value: normalizedValue,
    tone: options.tone || '',
    entryId: options.entryId || '',
    path: options.path || ''
  });
}

function createDashboardSection(id, title, items, options = {}) {
  const rows = Array.isArray(options.rows) ? options.rows.filter(row => row && Object.keys(row).length > 0) : [];
  if ((!Array.isArray(items) || items.length === 0) && rows.length === 0 && !options.summary) {
    return null;
  }
  return {
    id,
    title,
    summary: options.summary || '',
    entryId: options.entryId || '',
    path: options.path || '',
    columns: Array.isArray(options.columns) ? options.columns : [],
    rows,
    items: Array.isArray(items) ? items : []
  };
}

function formatSupportDurationFromSeconds(seconds) {
  const totalSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  if (!totalSeconds) return '';

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  const parts = [];
  if (days) parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
  if (hours) parts.push(`${hours} ${hours === 1 ? 'hr' : 'hrs'}`);
  if (minutes) parts.push(`${minutes} ${minutes === 1 ? 'min' : 'mins'}`);
  if (secs || parts.length === 0) parts.push(`${secs} ${secs === 1 ? 'sec' : 'secs'}`);
  return parts.join(', ');
}

function formatRuntimeUptime(runtime) {
  return getRuntimeValue(runtime, [
    'system.uptime'
  ]) || formatSupportDurationFromSeconds(getRuntimeNumericValue(runtime, [
    'system.uptime.seconds_total',
    'query_state.system.uptime'
  ]));
}

function formatMegabytes(value) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return '';
  return `${numberValue.toFixed(3)} MB`;
}

function formatRuntimeRamUsage(runtime) {
  const usedMb = getRuntimeNumericValue(runtime, ['system.ram.used']);
  const sizeMb = getRuntimeNumericValue(runtime, ['system.ram.size']);
  if (Number.isFinite(usedMb) && Number.isFinite(sizeMb)) {
    return `${formatMegabytes(usedMb)} / ${formatMegabytes(sizeMb)}`;
  }

  const usedBytes = getRuntimeNumericValue(runtime, ['query_state.system.ram.usage']);
  const sizeBytes = getRuntimeNumericValue(runtime, ['query_state.system.ram.size']);
  if (Number.isFinite(usedBytes) && Number.isFinite(sizeBytes)) {
    return `${formatMegabytes(usedBytes / 1024 / 1024)} / ${formatMegabytes(sizeBytes / 1024 / 1024)}`;
  }

  return getRuntimeValue(runtime, ['system.ram.per', 'query_state.system.ram.percentage']);
}

function inferSummaryTone(value) {
  const normalizedValue = String(value || '').toLowerCase();
  if (/\b(warn|error|fail|failed|down|inactive|not connected|unavailable|missing|untested)\b/.test(normalizedValue)) return 'warning';
  if (/\b(up|connected|active|passing|present|enabled|true|ok|ready)\b/.test(normalizedValue)) return 'good';
  return 'neutral';
}

function parseVersionDetails(text) {
  const source = String(text || '');
  return {
    product: /NETWORK_PRODUCT=([^\n]+)/.exec(source)?.[1]?.trim() || '',
    version: /PRODUCT_VERSION=([^\n]+)/.exec(source)?.[1]?.trim() || '',
    build: /PRODUCT_BUILDSTRING=([^\n]+)/.exec(source)?.[1]?.trim() || ''
  };
}

function collectRuntimeInterfaceRows(runtime) {
  if (!runtime || typeof runtime !== 'object') return [];
  const groups = new Map();
  const ensureGroup = (name) => {
    if (!groups.has(name)) groups.set(name, { Interface: name });
    return groups.get(name);
  };

  Object.keys(runtime).forEach(runtimePath => {
    const match = /^query_state\.interface\.([^.]+)\.ipv4\.(address|status|gateway|subnet|mtu|surelink)$/.exec(runtimePath);
    if (!match) return;
    const [, name, field] = match;
    if (name === 'loopback') return;
    const record = runtime[runtimePath];
    const value = normalizeSupportValue(record?.display_value || record?.value);
    if (!value) return;

    const row = ensureGroup(name);
    if (field === 'address') row.Address = value;
    if (field === 'subnet' && row.Address && !row.Address.includes('/')) row.Address = `${row.Address}/${value}`;
    if (field === 'status') row.Status = value;
    if (field === 'gateway') row.Gateway = value;
    if (field === 'mtu') row.MTU = value;
    if (field === 'surelink') row.SureLink = value;
  });

  return [...groups.values()]
    .filter(row => row.Address || row.Status || row.Gateway)
    .sort((a, b) => {
      const priority = (name) => /wwan|cell|modem/i.test(name) ? 0 : /eth|wan/i.test(name) ? 1 : 2;
      return priority(a.Interface) - priority(b.Interface) || a.Interface.localeCompare(b.Interface);
    })
    .slice(0, 8);
}

function buildDeviceDashboardSection(runtime, versionDetails, runtimeEntry, versionEntry) {
  const items = [];
  const runtimeSource = runtimeEntry ? { entryId: runtimeEntry.id, path: runtimeEntry.path } : {};
  const versionSource = versionEntry ? { entryId: versionEntry.id, path: versionEntry.path } : {};

  const deviceType = getRuntimeValue(runtime, ['system.device_type'])
    || [
      getRuntimeValue(runtime, ['system.manufacturer', 'query_state.system.manufacturer']),
      getRuntimeValue(runtime, ['system.model', 'query_state.system.model'])
    ].filter(Boolean).join(' ');

  addDashboardItem(items, 'Device Type', deviceType, runtimeSource);
  addDashboardItem(items, 'Firmware Version', getRuntimeValue(runtime, ['firmware.version']) || versionDetails.version, runtimeSource.entryId ? runtimeSource : versionSource);
  addDashboardItem(items, 'Part Number', getRuntimeValue(runtime, ['system.sku', 'query_state.system.sku']), runtimeSource);
  addDashboardItem(items, 'Serial Number', getRuntimeValue(runtime, ['system.serial', 'system.oem_serial', 'manufacture.serial_number', 'query_state.system.serial_number']), runtimeSource);
  addDashboardItem(items, 'MAC Address', getRuntimeValue(runtime, ['query_state.system.mac', 'manufacture.ethaddr', 'system.mac']), runtimeSource);
  addDashboardItem(items, 'Device ID', getRuntimeValue(runtime, ['drm.device_id']), runtimeSource);
  addDashboardItem(items, 'Product', getRuntimeValue(runtime, ['system.model']) || versionDetails.product, runtimeSource.entryId ? runtimeSource : versionSource);
  addDashboardItem(items, 'Build', getRuntimeValue(runtime, ['firmware.build_date']) || versionDetails.build, runtimeSource.entryId ? runtimeSource : versionSource);

  return createDashboardSection('device', 'Device Identity', items, runtimeSource);
}

function buildSystemDashboardSection(runtime, dateText, runtimeEntry, dateEntry) {
  const items = [];
  const runtimeSource = runtimeEntry ? { entryId: runtimeEntry.id, path: runtimeEntry.path } : {};
  const dateSource = dateEntry ? { entryId: dateEntry.id, path: dateEntry.path } : {};

  addDashboardItem(items, 'Uptime', formatRuntimeUptime(runtime), runtimeSource);
  addDashboardItem(items, 'Local Time', getRuntimeValue(runtime, ['system.local_time', 'query_state.system.current_time']) || dateText.trim(), runtimeSource.entryId ? runtimeSource : dateSource);
  addDashboardItem(items, 'CPU Usage', getRuntimeValue(runtime, ['system.cpu_usage', 'query_state.system.cpu.usage']), runtimeSource);
  addDashboardItem(items, 'RAM Usage', formatRuntimeRamUsage(runtime), runtimeSource);
  addDashboardItem(items, 'CPU Temperature', getRuntimeValue(runtime, ['query_state.system.cpu.temperature', 'system.cpu_temperature', 'system.cpu_temp']), runtimeSource);
  addDashboardItem(items, 'System Temperature', getRuntimeValue(runtime, ['system.system_temp', 'query_state.system.system_temperature']), runtimeSource);
  addDashboardItem(items, 'Supply Voltage', getRuntimeValue(runtime, ['query_state.system.power.0.input_voltage', 'system.power.0.input_voltage']), runtimeSource);
  addDashboardItem(items, 'Supply Current', getRuntimeValue(runtime, ['query_state.system.power.0.input_current', 'system.power.0.input_current']), runtimeSource);
  addDashboardItem(items, 'Supply Power', getRuntimeValue(runtime, ['query_state.system.power.0.input_power', 'system.power.0.input_power']), runtimeSource);
  addDashboardItem(items, 'Reboot Reason', getRuntimeValue(runtime, ['query_state.system.reboot_reason', 'system.reboot_reason']), runtimeSource);

  return createDashboardSection('system', 'System Health', items, runtimeSource);
}

function buildWanDashboardSection(runtime, routeText, netstatText, runtimeEntry, routeEntry, netstatEntry) {
  const items = [];
  const runtimeSource = runtimeEntry ? { entryId: runtimeEntry.id, path: runtimeEntry.path } : {};
  const routeSource = routeEntry ? { entryId: routeEntry.id, path: routeEntry.path } : {};
  const netstatSource = netstatEntry ? { entryId: netstatEntry.id, path: netstatEntry.path } : {};

  const defaultRoute = parseDefaultRoute(routeText)
    || [
      getRuntimeValue(runtime, ['query_state.routing.ipv4.0.gateway']),
      getRuntimeValue(runtime, ['query_state.routing.ipv4.0.interface'])
    ].filter(Boolean).join(' via ');
  const netstatIssue = parseNetstatIssue(netstatText);

  addDashboardItem(items, 'Default Route', defaultRoute, routeSource);
  addDashboardItem(items, 'DRM Status', getRuntimeValue(runtime, ['drm.connected']), { ...runtimeSource, tone: inferSummaryTone(getRuntimeValue(runtime, ['drm.connected'])) });
  addDashboardItem(items, 'DRM Interface', getRuntimeValue(runtime, ['drm.connection.ifname', 'drm.connection.type']), runtimeSource);
  addDashboardItem(items, 'Interface Drops/Errors', netstatIssue || 'No RX/TX errors reported', { ...netstatSource, tone: netstatIssue ? 'warning' : 'good' });

  const rows = collectRuntimeInterfaceRows(runtime);
  return createDashboardSection('wan', 'WAN & Routing', items, {
    entryId: runtimeEntry?.id || routeEntry?.id || '',
    path: runtimeEntry?.path || routeEntry?.path || '',
    columns: ['Interface', 'Status', 'Address', 'Gateway', 'MTU', 'SureLink'],
    rows
  });
}

function buildWanBondingDashboardSection(runtime, configValues, bondingText, runtimeEntry, configEntry, bondingEntry) {
  const items = [];
  const runtimeSource = runtimeEntry ? { entryId: runtimeEntry.id, path: runtimeEntry.path } : {};
  const configSource = configEntry ? { entryId: configEntry.id, path: configEntry.path } : {};
  const bondingSource = bondingEntry ? { entryId: bondingEntry.id, path: bondingEntry.path } : {};
  const routePath = getRuntimeValue(runtime, ['network.route.default.ipv4.interface_eth.path']);
  const configReferencesBonding = [...configValues.keys()].some(key => /wan[_-]?bond/i.test(key))
    || [...configValues.values()].some(value => /wan[_-]?bond/i.test(value));
  const bondingUnavailable = /not found|No such file|command not/i.test(bondingText);

  if (routePath && /wan[_-]?bond/i.test(routePath)) {
    addDashboardItem(items, 'Default Path', routePath, runtimeSource);
  }
  if (configReferencesBonding) {
    addDashboardItem(items, 'Config', 'WAN bonding references found', configSource);
  }
  if (normalizeSupportValue(bondingText)) {
    addDashboardItem(items, 'Bonding Tool', bondingUnavailable ? 'Unavailable in support report' : bondingText.trim().split(/\r?\n/)[0], { ...bondingSource, tone: bondingUnavailable ? 'warning' : 'neutral' });
  }

  return createDashboardSection('wan-bonding', 'WAN Bonding', items, {
    entryId: bondingEntry?.id || runtimeEntry?.id || configEntry?.id || '',
    path: bondingEntry?.path || runtimeEntry?.path || configEntry?.path || ''
  });
}

function buildTunnelDashboardSection(configValues, ipsecText, wireguardText, configEntry, ipsecEntry, wireguardEntry) {
  const items = [];
  const enabledVpn = [];

  configValues.forEach((value, key) => {
    if (!/^true$/i.test(value)) return;
    const tunnelMatch = /^vpn\.([^.]+)(?:\.(?:tunnel|client|server)\.([^.]+))?.*\.enable$/.exec(key)
      || /^vpn\.([^.]+)\.enable$/.exec(key);
    if (!tunnelMatch) return;
    const type = tunnelMatch[1].toUpperCase();
    const name = tunnelMatch[2] ? ` ${tunnelMatch[2]}` : '';
    enabledVpn.push(`${type}${name}`);
  });

  const source = configEntry ? { entryId: configEntry.id, path: configEntry.path } : {};
  addDashboardItem(items, 'Enabled VPN Config', [...new Set(enabledVpn)].slice(0, 8).join(', ') || 'No enabled VPN tunnel config found', source);

  if (ipsecEntry) {
    const ipsecStatus = normalizeSupportValue(ipsecText)
      ? (/\bESTABLISHED|INSTALLED|up\b/i.test(ipsecText) ? 'IPsec SAs present' : 'No active IPsec SAs detected')
      : 'No IPsec status output';
    addDashboardItem(items, 'IPsec Runtime', ipsecStatus, {
      entryId: ipsecEntry.id,
      path: ipsecEntry.path,
      tone: /present|active/i.test(ipsecStatus) ? 'good' : 'neutral'
    });
  }

  if (wireguardEntry) {
    const wireguardStatus = normalizeSupportValue(wireguardText)
      ? `${wireguardText.split(/\r?\n/).filter(Boolean).length} WireGuard status lines`
      : 'No WireGuard peers reported';
    addDashboardItem(items, 'WireGuard Runtime', wireguardStatus, {
      entryId: wireguardEntry.id,
      path: wireguardEntry.path
    });
  }

  const l2tpPort = configValues.get('vpn.l2tp.port');
  const l2tpProtocols = [...configValues.entries()]
    .filter(([key]) => /^vpn\.l2tp\.protocol\.\d+$/.test(key))
    .map(([, value]) => value)
    .filter(Boolean)
    .join(', ');
  addDashboardItem(items, 'L2TP', [l2tpPort ? `port ${l2tpPort}` : '', l2tpProtocols || ''].filter(Boolean).join(' | '), source);

  return createDashboardSection('tunnels', 'Tunnels & VPN', items, {
    entryId: configEntry?.id || ipsecEntry?.id || wireguardEntry?.id || '',
    path: configEntry?.path || ipsecEntry?.path || wireguardEntry?.path || ''
  });
}

function buildCellularDashboardSection(runtime, mmcliText, runtimeEntry, mmcliEntry) {
  const items = [];
  const runtimeSource = runtimeEntry ? { entryId: runtimeEntry.id, path: runtimeEntry.path } : {};
  const mmcliSource = mmcliEntry ? { entryId: mmcliEntry.id, path: mmcliEntry.path } : {};
  const cellularContext = /(^|\.|\b)(modem|cellular|wwan|mobile)(\.|\b)/i;
  const excludeNonCellular = /(watchdog|location|system\.modem_fw_update)/i;
  const addRuntimeMatch = (label, fieldRegex) => {
    const match = findRuntimeRecord(runtime, {
      contextRegex: cellularContext,
      fieldRegex,
      excludeRegex: excludeNonCellular
    });
    if (match) {
      addDashboardItem(items, label, match.value, runtimeSource);
    }
  };

  addRuntimeMatch('Status', /(status|connected|connection)/i);
  addRuntimeMatch('Registration', /(registration|registered|network_registration)/i);
  addRuntimeMatch('Interface', /(interface|ifname|device)/i);
  addRuntimeMatch('Carrier', /(carrier|operator|provider|network_name)/i);
  addRuntimeMatch('Technology', /(access_tech|technology|radio|rat)/i);
  addRuntimeMatch('Signal', /(signal|rssi|rsrp|rsrq|sinr|ecio)/i);
  addRuntimeMatch('SIM / ICCID', /(sim|iccid|imsi)/i);
  addRuntimeMatch('IMEI / MEID', /(imei|meid)/i);
  addRuntimeMatch('APN', /\bapn\b/i);
  addRuntimeMatch('IP Address', /(ip_address|ipv4\.address|address)/i);
  addRuntimeMatch('Uptime', /(uptime|up_time)/i);
  addRuntimeMatch('Firmware', /(firmware|revision|version)/i);

  const mmcliUnavailable = /not found|No such file|command not/i.test(mmcliText);
  if (items.length === 0 && mmcliEntry) {
    addDashboardItem(items, 'Cellular Data', mmcliUnavailable ? 'No modem dump available' : 'No cellular runtime values found', {
      ...mmcliSource,
      tone: mmcliUnavailable ? 'warning' : 'neutral'
    });
  } else if (mmcliUnavailable) {
    addDashboardItem(items, 'Modem Dump', 'mmcli dump unavailable', { ...mmcliSource, tone: 'warning' });
  }

  return createDashboardSection('cellular', 'Cellular Status', items, {
    entryId: runtimeEntry?.id || mmcliEntry?.id || '',
    path: runtimeEntry?.path || mmcliEntry?.path || ''
  });
}

function buildSummaryMetrics(sections, findings) {
  const findValue = (sectionId, label) => {
    const section = sections.find(candidate => candidate && candidate.id === sectionId);
    return section?.items?.find(item => item.label === label)?.value || '';
  };
  const warningCount = findings.filter(finding => finding.severity === 'warning').length;

  return [
    { label: 'Status', value: findValue('wan', 'DRM Status') || 'Support file imported', tone: inferSummaryTone(findValue('wan', 'DRM Status')) },
    { label: 'Uptime', value: findValue('system', 'Uptime') || 'Unknown', tone: 'neutral' },
    { label: 'Firmware', value: findValue('device', 'Firmware Version') || 'Unknown', tone: 'neutral' },
    { label: 'Warnings', value: String(warningCount), tone: warningCount > 0 ? 'warning' : 'good' }
  ];
}

function createSupportTroubleshootingSummary(entries, contentById) {
  const keyFiles = [];
  const findings = [];
  const recommendedChecks = [
    'Start with firmware/version, uptime, and recent logs to establish context and timing.',
    'Confirm IP addresses, default route, DNS behavior, and interface errors before changing configuration.',
    'For cellular or cloud cases, inspect modem output, SureLink state, and log entries around registration or DNS failures.',
    'Compare running configuration with the intended customer setup, especially WAN, firewall, VPN, and remote management settings.'
  ];

  const versionEntry = findSupportEntry(entries, /(^|\/)etc\/version\.info$/);
  const uptimeEntry = findSupportEntry(entries, /(^|\/)tmp\/\d+\/uptime$/);
  const configEntry = findSupportEntry(entries, /(^|\/)tmp\/\d+\/config_json$/);
  const publicConfigEntry = findSupportEntry(entries, /(^|\/)tmp\/\d+\/config_dump-public$/);
  const ipAddrEntry = findSupportEntry(entries, /(^|\/)tmp\/\d+\/ip_addr_list$/);
  const routeEntry = findSupportEntry(entries, /(^|\/)tmp\/\d+\/ip_route_show_table_all$/);
  const netstatEntry = findSupportEntry(entries, /(^|\/)tmp\/\d+\/netstat_-i$/);
  const mmcliEntry = findSupportEntry(entries, /(^|\/)tmp\/\d+\/mmcli-dump$/);
  const surelinkEntry = findSupportEntry(entries, /(^|\/)tmp\/\d+\/surelink_dump$/);
  const iptablesEntry = findSupportEntry(entries, /(^|\/)tmp\/\d+\/iptables_-nv_-L$/);
  const eventEntry = findSupportEntry(entries, /(^|\/)tmp\/\d+\/event_list$/);
  const messagesEntry = findSupportEntry(entries, /(^|\/)var\/log\/messages$/);
  const runtimeEntry = findSupportEntry(entries, /(^|\/)tmp\/\d+\/runt_json$/);
  const dateEntry = findSupportEntry(entries, /(^|\/)tmp\/\d+\/date$/);
  const bondingEntry = findSupportEntry(entries, /(^|\/)tmp\/\d+\/usrbinwan_bonding\.dbndutil_status$/);
  const ipsecEntry = findSupportEntry(entries, /(^|\/)tmp\/\d+\/ipsec_statusall$/);
  const wireguardEntry = findSupportEntry(entries, /(^|\/)tmp\/\d+\/wg_show$/);

  addSupportKeyFile(keyFiles, messagesEntry, 'Recent system log', 'Best first stop for errors, cloud/DNS failures, interface changes, and service restarts.', 1);
  addSupportKeyFile(keyFiles, runtimeEntry, 'Runtime dashboard state', 'Structured live state for device identity, CPU/RAM, WAN, cellular, power, and service status.', 2);
  addSupportKeyFile(keyFiles, versionEntry, 'Firmware and product version', 'Identifies product family, firmware release, and build date.', 2);
  addSupportKeyFile(keyFiles, configEntry || publicConfigEntry, 'Running configuration', 'Shows the active service, network, WAN, VPN, firewall, and management settings.', 3);
  addSupportKeyFile(keyFiles, ipAddrEntry, 'Interface addresses', 'Shows which interfaces are up and what IPv4/IPv6 addresses are assigned.', 4);
  addSupportKeyFile(keyFiles, routeEntry, 'Routing table', 'Confirms default gateway, source networks, and policy tables.', 5);
  addSupportKeyFile(keyFiles, netstatEntry, 'Interface counters', 'Highlights RX/TX errors or drops that point to link or congestion problems.', 6);
  addSupportKeyFile(keyFiles, mmcliEntry, 'Modem manager dump', 'Critical for cellular troubleshooting: modem presence, SIM, registration, signal, and bearer state.', 7);
  addSupportKeyFile(keyFiles, surelinkEntry, 'SureLink state', 'Useful for WAN health checks and recovery behavior.', 8);
  addSupportKeyFile(keyFiles, bondingEntry, 'WAN bonding status', 'Shows bonding runtime state or reports when bonding tooling is unavailable in the support file.', 9);
  addSupportKeyFile(keyFiles, ipsecEntry, 'IPsec status', 'Shows active IPsec security associations and tunnel state.', 10);
  addSupportKeyFile(keyFiles, wireguardEntry, 'WireGuard status', 'Shows WireGuard interfaces, peers, and handshake state when configured.', 11);
  addSupportKeyFile(keyFiles, iptablesEntry, 'Firewall rules', 'Checks packet filtering, NAT, and traffic counters.', 9);
  addSupportKeyFile(keyFiles, eventEntry, 'Event list', 'Condensed event history for alarms, configuration changes, and service transitions.', 10);

  findSupportEntries(entries, /(^|\/)var\/log\/messages\.\d+(\.gz)?$/).forEach((entry, index) => {
    addSupportKeyFile(keyFiles, entry, `Rotated log ${index + 1}`, 'Older log history for recurring or intermittent failures.', 20 + index);
  });

  const runtime = parseSupportJSON(getSupportEntryText(runtimeEntry, contentById));
  const configValues = parseConfigDumpValues(getSupportEntryText(publicConfigEntry || configEntry, contentById, 500000));
  const versionText = getSupportEntryText(versionEntry, contentById);
  const versionDetails = parseVersionDetails(versionText);
  const routeText = getSupportEntryText(routeEntry, contentById);
  const netstatText = getSupportEntryText(netstatEntry, contentById);
  const mmcliText = getSupportEntryText(mmcliEntry, contentById, 4000);
  const sections = [
    buildDeviceDashboardSection(runtime, versionDetails, runtimeEntry, versionEntry),
    buildSystemDashboardSection(runtime, getSupportEntryText(dateEntry, contentById, 1000), runtimeEntry, dateEntry),
    buildWanDashboardSection(runtime, routeText, netstatText, runtimeEntry, routeEntry, netstatEntry),
    buildWanBondingDashboardSection(runtime, configValues, getSupportEntryText(bondingEntry, contentById, 4000), runtimeEntry, publicConfigEntry || configEntry, bondingEntry),
    buildTunnelDashboardSection(configValues, getSupportEntryText(ipsecEntry, contentById, 200000), getSupportEntryText(wireguardEntry, contentById, 200000), publicConfigEntry || configEntry, ipsecEntry, wireguardEntry),
    buildCellularDashboardSection(runtime, mmcliText, runtimeEntry, mmcliEntry)
  ].filter(Boolean);

  const versionSummary = parseVersionSummary(versionText);
  if (versionSummary) findings.push({ severity: 'info', title: 'Device identity', detail: versionSummary, entryId: versionEntry.id, path: versionEntry.path });

  const uptime = getSupportEntryText(uptimeEntry, contentById, 1000).trim().replace(/\s+/g, ' ');
  if (uptime) findings.push({ severity: 'info', title: 'Uptime and load', detail: uptime, entryId: uptimeEntry.id, path: uptimeEntry.path });

  const interfaceSummary = parseInterfaceSummary(getSupportEntryText(ipAddrEntry, contentById));
  if (interfaceSummary) findings.push({ severity: 'info', title: 'Active interfaces', detail: interfaceSummary, entryId: ipAddrEntry.id, path: ipAddrEntry.path });

  const defaultRoute = parseDefaultRoute(getSupportEntryText(routeEntry, contentById));
  if (defaultRoute) findings.push({ severity: 'info', title: 'Default route', detail: defaultRoute, entryId: routeEntry.id, path: routeEntry.path });

  const netstatIssue = parseNetstatIssue(getSupportEntryText(netstatEntry, contentById));
  if (netstatIssue) findings.push({ severity: 'warning', title: 'Interface drops/errors detected', detail: netstatIssue, entryId: netstatEntry.id, path: netstatEntry.path });

  if (/not found|No such file|command not/i.test(mmcliText)) {
    findings.push({ severity: 'warning', title: 'Modem dump unavailable', detail: 'The mmcli dump command failed or is missing, so cellular state may need to be verified from logs, config, or live CLI.', entryId: mmcliEntry.id, path: mmcliEntry.path });
  }

  const logSummary = summarizeLogIssues(getSupportEntryText(messagesEntry, contentById));
  if (logSummary.total > 0) {
    const parts = [
      `${logSummary.total} warning/error-like log lines`,
      logSummary.counts.dns ? `${logSummary.counts.dns} DNS/lookup related` : '',
      logSummary.counts.cloud ? `${logSummary.counts.cloud} cloud/telemetry related` : '',
      logSummary.counts.service ? `${logSummary.counts.service} service connection related` : ''
    ].filter(Boolean);
    findings.push({
      severity: 'warning',
      title: 'Recent log issues',
      detail: parts.join('; '),
      samples: logSummary.sample,
      entryId: messagesEntry?.id || '',
      path: messagesEntry?.path || ''
    });
  }

  return {
    title: 'Digi Support Troubleshooting Summary',
    generatedAt: new Date().toISOString(),
    overview: 'Dashboard extracted from runtime, configuration, routing, VPN, modem, and log files for first-pass troubleshooting.',
    metrics: buildSummaryMetrics(sections, findings),
    sections,
    keyFiles: keyFiles.sort((a, b) => a.priority - b.priority).slice(0, 14),
    findings,
    recommendedChecks
  };
}

function parseSupportTarArchive(tarBuffer) {
  return new Promise((resolve, reject) => {
    const extract = tar.extract();
    const entries = [];
    const filesById = new Map();
    const contentById = new Map();
    let entryIndex = 0;
    let failed = false;

    const fail = (error) => {
      if (failed) return;
      failed = true;
      reject(error);
    };

    extract.on('entry', (header, stream, next) => {
      const entryPath = normalizeSupportEntryPath(header.name);
      const rawType = String(header.type || 'file');

      if (!entryPath || rawType === 'pax-header' || rawType === 'global-pax-header') {
        stream.resume();
        stream.once('end', next);
        stream.once('error', fail);
        return;
      }

      const isDirectory = rawType === 'directory' || String(header.name || '').endsWith('/');
      const isRegularFile = rawType === 'file' || rawType === 'contiguous-file' || rawType === 'old-file';
      const id = `support-entry-${entryIndex++}`;
      const metadata = {
        id,
        name: path.posix.basename(entryPath),
        path: entryPath,
        type: isDirectory ? 'directory' : 'file',
        kind: isDirectory ? 'directory' : rawType,
        size: Math.max(0, Number(header.size) || 0),
        mode: typeof header.mode === 'number' ? header.mode : null,
        mtime: header.mtime instanceof Date ? header.mtime.toISOString() : null
      };

      if (isDirectory) {
        stream.resume();
        stream.once('end', () => {
          entries.push(metadata);
          next();
        });
        stream.once('error', fail);
        return;
      }

      if (!isRegularFile) {
        metadata.isText = false;
        metadata.textAvailable = false;
        metadata.previewMessage = `${rawType} entries cannot be previewed as text.`;
        stream.resume();
        stream.once('end', () => {
          entries.push(metadata);
          filesById.set(id, metadata);
          next();
        });
        stream.once('error', fail);
        return;
      }

      const chunks = [];
      let collectedBytes = 0;
      let streamedBytes = 0;

      stream.on('data', chunk => {
        streamedBytes += chunk.length;

        if (collectedBytes >= MAX_TEXT_PREVIEW_BYTES) {
          return;
        }

        const remainingBytes = MAX_TEXT_PREVIEW_BYTES - collectedBytes;
        const chunkToStore = chunk.length > remainingBytes ? chunk.subarray(0, remainingBytes) : chunk;
        chunks.push(chunkToStore);
        collectedBytes += chunkToStore.length;
      });

      stream.once('end', () => {
        const previewBuffer = Buffer.concat(chunks, collectedBytes);
        const isText = bufferLooksLikeText(previewBuffer, entryPath);
        const actualSize = metadata.size || streamedBytes;
        const truncated = actualSize > collectedBytes;

        metadata.size = actualSize;
        metadata.isText = isText;
        metadata.textAvailable = isText;
        metadata.truncated = isText && truncated;

        if (isText) {
          const text = previewBuffer.toString('utf8').replace(/^\uFEFF/, '');
          contentById.set(id, {
            text,
            truncated: metadata.truncated
          });
        } else {
          metadata.previewMessage = 'Binary file preview is not available.';
        }

        entries.push(metadata);
        filesById.set(id, metadata);
        next();
      });
      stream.once('error', fail);
    });

    extract.once('finish', () => {
      if (failed) return;
      const tree = buildSupportArchiveTree(entries);
      const summary = createSupportTroubleshootingSummary(entries, contentById);
      resolve({
        entries,
        tree,
        filesById,
        contentById,
        summary,
        stats: {
          entryCount: entries.length,
          fileCount: countSupportTreeNodes(tree, 'file'),
          directoryCount: countSupportTreeNodes(tree, 'directory'),
          textFileCount: entries.filter(entry => entry.type === 'file' && entry.textAvailable).length
        }
      });
    });
    extract.once('error', fail);

    try {
      extract.end(tarBuffer);
    } catch (error) {
      fail(error);
    }
  });
}

function createPlainTextSupportArchive(filePath, fileBuffer, stats) {
  const fileName = path.basename(filePath);
  const entryPath = normalizeSupportEntryPath(fileName) || 'text-file.txt';
  const previewBuffer = fileBuffer.subarray(0, Math.min(fileBuffer.length, MAX_TEXT_PREVIEW_BYTES));
  const isText = bufferLooksLikeText(previewBuffer, entryPath);

  if (!isText) {
    return null;
  }

  const id = 'support-entry-0';
  const truncated = fileBuffer.length > previewBuffer.length;
  const metadata = {
    id,
    name: path.posix.basename(entryPath),
    path: entryPath,
    type: 'file',
    kind: 'text-file',
    size: Math.max(0, Number(stats?.size) || fileBuffer.length),
    mode: typeof stats?.mode === 'number' ? stats.mode : null,
    mtime: stats?.mtime instanceof Date ? stats.mtime.toISOString() : null,
    isText: true,
    textAvailable: true,
    truncated
  };
  const entries = [metadata];
  const filesById = new Map([[id, metadata]]);
  const text = previewBuffer.toString('utf8').replace(/^\uFEFF/, '');
  const contentById = new Map([[id, { text, truncated }]]);
  const tree = buildSupportArchiveTree(entries);

  return {
    entries,
    tree,
    filesById,
    contentById,
    summary: null,
    stats: {
      entryCount: 1,
      fileCount: 1,
      directoryCount: 0,
      textFileCount: 1
    }
  };
}

function pruneSupportArchiveSessions() {
  const sessions = [...supportArchiveSessions.entries()]
    .sort((a, b) => b[1].createdAt - a[1].createdAt);

  sessions.slice(MAX_SUPPORT_ARCHIVE_SESSIONS).forEach(([sessionId]) => {
    supportArchiveSessions.delete(sessionId);
  });
}

function tokenizeSupportAnalysisQuery(query) {
  return String(query || '')
    .toLowerCase()
    .split(/[^a-z0-9_.:-]+/)
    .map(term => term.trim())
    .filter(term => term.length >= 3)
    .slice(0, 12);
}

function buildSupportAnalysisExcerpt(text, query, maxChars = MAX_SUPPORT_AI_FILE_CHARS) {
  const source = String(text || '').trim();
  if (source.length <= maxChars) return source;

  const terms = tokenizeSupportAnalysisQuery(query);
  const normalizedSource = source.toLowerCase();
  const firstHit = terms
    .map(term => normalizedSource.indexOf(term))
    .filter(index => index >= 0)
    .sort((a, b) => a - b)[0];

  if (!Number.isFinite(firstHit)) {
    return `${source.slice(0, maxChars).trim()}\n\n[truncated]`;
  }

  const start = Math.max(0, firstHit - Math.floor(maxChars * 0.35));
  const end = Math.min(source.length, start + maxChars);
  const prefix = start > 0 ? '[excerpt starts after omitted content]\n' : '';
  const suffix = end < source.length ? '\n[excerpt truncated]' : '';
  return `${prefix}${source.slice(start, end).trim()}${suffix}`;
}

function scoreSupportAnalysisFile(entry, content, options = {}) {
  const query = options.query || '';
  const selectedFileId = options.selectedFileId || '';
  const keyFilePriority = options.keyFilePriority || new Map();
  const terms = tokenizeSupportAnalysisQuery(query);
  const pathText = String(entry.path || '').toLowerCase();
  const contentText = String(content?.text || '').toLowerCase();
  let score = 0;

  if (selectedFileId && entry.id === selectedFileId) score += 120;
  if (keyFilePriority.has(entry.id)) score += Math.max(30, 95 - keyFilePriority.get(entry.id) * 4);
  if (/runt_json|version\.info|config_dump-public|config_json|ip_addr_list|ip_route|netstat_-i|messages|mmcli|surelink|ipsec|wg_show|wan_bonding/i.test(entry.path)) {
    score += 20;
  }

  terms.forEach(term => {
    if (pathText.includes(term)) score += 25;
    if (contentText.includes(term)) score += 8;
  });

  return score;
}

function getSupportAnalysisFiles(session, options = {}) {
  const keyFilePriority = new Map();
  (session.summary?.keyFiles || []).forEach((file, index) => {
    if (file?.entryId) keyFilePriority.set(file.entryId, index);
  });

  const scoredFiles = [...session.filesById.values()]
    .map(entry => {
      const content = session.contentById.get(entry.id);
      if (!content || typeof content.text !== 'string') return null;
      if (!content.text.trim()) return null;
      const score = scoreSupportAnalysisFile(entry, content, {
        query: options.query,
        selectedFileId: options.selectedFileId,
        keyFilePriority
      });
      return {
        entry,
        content,
        score
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.entry.path.localeCompare(b.entry.path));

  const selected = scoredFiles
    .filter(file => file.score > 0)
    .slice(0, MAX_SUPPORT_AI_FILES);

  if (selected.length < Math.min(6, MAX_SUPPORT_AI_FILES)) {
    for (const file of scoredFiles) {
      if (selected.some(candidate => candidate.entry.id === file.entry.id)) continue;
      selected.push(file);
      if (selected.length >= Math.min(6, MAX_SUPPORT_AI_FILES)) break;
    }
  }

  return selected.slice(0, MAX_SUPPORT_AI_FILES).map(file => ({
    entryId: file.entry.id,
    path: file.entry.path,
    text: buildSupportAnalysisExcerpt(file.content.text, options.query),
    truncated: Boolean(file.content.truncated || file.content.text.length > MAX_SUPPORT_AI_FILE_CHARS),
    reason: file.entry.id === options.selectedFileId
      ? 'Currently selected file'
      : keyFilePriority.has(file.entry.id)
        ? 'High-priority troubleshooting file'
        : file.score > 0
          ? 'Matched the smart scan query'
          : 'Additional support context'
  }));
}

async function readSupportArchiveFromFilePath(filePath) {
  let stats;
  try {
    stats = await fs.promises.stat(filePath);
  } catch (error) {
    return createSupportFileFailure('unreadable-file', error);
  }

  if (!stats.isFile()) {
    return createSupportFileFailure('invalid-file', 'Selected path is not a file.');
  }
  if (stats.size > MAX_SUPPORT_FILE_BYTES) {
    return createSupportFileFailure('invalid-file', `Support file is too large (${formatSupportFileSize(stats.size)}).`);
  }

  let compressedFile;
  try {
    compressedFile = await fs.promises.readFile(filePath);
  } catch (error) {
    return createSupportFileFailure('unreadable-file', error);
  }

  let archiveError = null;
  try {
    const tarBuffer = await gunzipBuffer(compressedFile, {
      maxOutputLength: MAX_UNCOMPRESSED_ARCHIVE_BYTES
    });
    const archive = await parseSupportTarArchive(tarBuffer);
    if (!archive.entries.length) {
      archiveError = new Error('The tar archive did not contain any readable entries.');
    } else {
      return {
        success: true,
        fileName: path.basename(filePath),
        compressedFile,
        stats,
        archive
      };
    }
  } catch (error) {
    archiveError = error;
  }

  if (path.extname(filePath).toLowerCase() === '.tar') {
    try {
      const archive = await parseSupportTarArchive(compressedFile);
      if (!archive.entries.length) {
        archiveError = new Error('The tar archive did not contain any readable entries.');
      } else {
        return {
          success: true,
          fileName: path.basename(filePath),
          compressedFile,
          stats,
          archive
        };
      }
    } catch (error) {
      archiveError = error;
    }
  }

  const textArchive = createPlainTextSupportArchive(filePath, compressedFile, stats);
  if (textArchive) {
    return {
      success: true,
      fileName: path.basename(filePath),
      compressedFile,
      stats,
      archive: textArchive
    };
  }

  const fileTypeHint = path.extname(filePath).toLowerCase() === '.bin' ? archiveError : null;
  return createSupportFileFailure(
    'invalid-file',
    fileTypeHint || 'Select a Digi support archive or a readable text file.'
  );
}

function createSupportArchiveSession(webContents, parsedArchive, savedFile = null) {
  const sessionId = crypto.randomUUID();
  supportArchiveSessions.set(sessionId, {
    ownerId: webContents.id,
    fileName: parsedArchive.fileName,
    tree: parsedArchive.archive.tree,
    filesById: parsedArchive.archive.filesById,
    contentById: parsedArchive.archive.contentById,
    summary: parsedArchive.archive.summary,
    savedFileId: savedFile?.id || '',
    createdAt: Date.now()
  });
  pruneSupportArchiveSessions();

  return {
    success: true,
    sessionId,
    fileName: parsedArchive.fileName,
    tree: parsedArchive.archive.tree,
    stats: parsedArchive.archive.stats,
    summary: parsedArchive.archive.summary,
    savedFile: savedFile || null
  };
}

function getCompareIndexPath(index, comparePath, entryPath) {
  const basePath = comparePath || entryPath;
  if (!index.has(basePath)) return basePath;

  const existing = index.get(basePath);
  if (!existing || existing.path === entryPath) return basePath;

  if (!index.has(entryPath)) return entryPath;

  let suffix = 2;
  let candidate = `${entryPath}#${suffix}`;
  while (index.has(candidate)) {
    suffix++;
    candidate = `${entryPath}#${suffix}`;
  }
  return candidate;
}

// Build a comparePath -> { entryId, path, size, hash, binary, category } index
// for one session. The compare path strips volatile tmp/<pid>/ prefixes so
// equivalent files from two support archives line up even when their capture
// process IDs differ. Per-entry content hashes are cached on the session so
// re-compare / swap A<->B does not re-hash.
function buildCompareIndex(session) {
  if (!session.contentHashById) session.contentHashById = new Map();
  const index = new Map();
  for (const entry of session.filesById.values()) {
    if (entry.type === 'directory') continue;
    const content = session.contentById.get(entry.id);
    let hash = null;
    if (content && typeof content.text === 'string') {
      if (session.contentHashById.has(entry.id)) {
        hash = session.contentHashById.get(entry.id);
      } else {
        hash = crypto.createHash('sha1').update(content.text).digest('hex');
        session.contentHashById.set(entry.id, hash);
      }
    }
    const comparePath = getCompareIndexPath(index, normalizeCompareEntryPath(entry.path), entry.path);
    index.set(comparePath, {
      entryId: entry.id,
      path: entry.path,
      size: Number(entry.size) || 0,
      hash,
      binary: !entry.isText,
      category: compareCategoryForTags(classifySupportEntry(entry))
    });
  }
  return index;
}

async function importSupportFileFromDialog(webContents) {
  const browserWindow = BrowserWindow.fromWebContents(webContents);
  const dialogResult = await dialog.showOpenDialog(browserWindow || undefined, {
    title: 'Import Support or Text File',
    buttonLabel: 'Import Support File',
    properties: ['openFile']
  });

  if (dialogResult.canceled || !dialogResult.filePaths.length) {
    return { success: false, canceled: true };
  }

  const filePath = dialogResult.filePaths[0];
  const parsedArchive = await readSupportArchiveFromFilePath(filePath);
  if (!parsedArchive.success) {
    return parsedArchive;
  }

  let savedFile = null;
  let savedFileError = '';
  try {
    savedFile = await saveSupportFileToLibrary(filePath, parsedArchive.compressedFile, parsedArchive.stats);
  } catch (error) {
    savedFileError = error.message || 'Could not save support file to Saved Files.';
    console.error('Could not save support file to library:', error);
  }

  return {
    ...createSupportArchiveSession(webContents, parsedArchive, savedFile),
    savedFileError
  };
}

async function openSavedSupportFile(webContents, fileId) {
  const files = await readSupportLibraryIndex();
  const item = files.find(candidate => candidate.id === fileId);
  if (!item) {
    return createSupportFileFailure('invalid-file', 'Saved file was not found.');
  }

  const filePath = getSupportLibraryItemPath(item);
  if (!filePath) {
    return createSupportFileFailure('invalid-file', 'Saved file path is not available.');
  }

  const parsedArchive = await readSupportArchiveFromFilePath(filePath);
  if (!parsedArchive.success) {
    return parsedArchive;
  }

  item.lastOpenedAt = new Date().toISOString();
  await writeSupportLibraryIndex(files);

  return createSupportArchiveSession(webContents, {
    ...parsedArchive,
    fileName: item.originalFileName || parsedArchive.fileName
  }, serializeSupportLibraryItem(item));
}

function sanitizeSaveDialogFileName(fileName, fallback = 'file.txt') {
  const baseName = String(fileName || fallback).split(/[\\/]/).pop();
  const safeName = baseName
    .replace(/[<>:"/\\|?*\x00-\x1f]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
  return safeName || fallback;
}

function normalizeSaveDialogFilters(filters) {
  const fallbackFilters = [
    { name: 'Text files', extensions: ['txt'] },
    { name: 'All files', extensions: ['*'] }
  ];
  if (!Array.isArray(filters)) return fallbackFilters;

  const normalizedFilters = filters
    .map(filter => {
      const name = String(filter?.name || 'File').trim() || 'File';
      const extensions = Array.isArray(filter?.extensions)
        ? filter.extensions
          .map(extension => String(extension || '').replace(/^\./, '').trim())
          .filter(extension => /^[a-z0-9*]+$/i.test(extension))
        : [];
      return extensions.length ? { name, extensions } : null;
    })
    .filter(Boolean);

  return normalizedFilters.length ? normalizedFilters : fallbackFilters;
}

async function saveTextFileFromDialog(webContents, options = {}) {
  const browserWindow = BrowserWindow.fromWebContents(webContents);
  const defaultPath = sanitizeSaveDialogFileName(options.defaultPath, 'ai-scan-report.md');
  const dialogResult = await dialog.showSaveDialog(browserWindow || undefined, {
    title: String(options.title || 'Save File'),
    buttonLabel: String(options.buttonLabel || 'Save'),
    defaultPath,
    filters: normalizeSaveDialogFilters(options.filters)
  });

  if (dialogResult.canceled || !dialogResult.filePath) {
    return { success: false, canceled: true };
  }

  const content = typeof options.content === 'string' ? options.content : String(options.content || '');
  await fs.promises.writeFile(dialogResult.filePath, content, 'utf8');
  return {
    success: true,
    filePath: dialogResult.filePath
  };
}

function setupIPCHandlers() {
  ipcMain.handle('change-app-zoom', async (event, direction) => {
    const zoomDirection = Number(direction) < 0 ? -1 : 1;
    const currentZoomLevel = event.sender.getZoomLevel();
    const nextZoomLevel = Math.max(-4, Math.min(5, currentZoomLevel + zoomDirection));
    event.sender.setZoomLevel(nextZoomLevel);
    return {
      success: true,
      zoomPercent: Math.round(event.sender.getZoomFactor() * 100)
    };
  });

  ipcMain.handle('ping-host', async (_event, host, timeout = 3000) => {
    return pingHost(host, timeout);
  });

  ipcMain.handle('generate-support-template', async (_event, options) => {
    return generateSupportTemplate(options);
  });

  ipcMain.handle('analyze-support-file', async (event, sessionId, options = {}) => {
    const session = supportArchiveSessions.get(sessionId);
    if (!session || session.ownerId !== event.sender.id) {
      return createSupportFileFailure('invalid-file', 'Support file session is no longer available.');
    }

    const files = getSupportAnalysisFiles(session, {
      query: options.query,
      selectedFileId: options.selectedFileId
    });
    const result = await analyzeSupportFiles({
      provider: options.provider,
      apiKey: options.apiKey,
      skill: options.skill,
      query: options.query,
      files,
      summary: session.summary
    });

    if (!result || !result.success) {
      return result;
    }

    return {
      ...result,
      sources: files.map(file => ({
        entryId: file.entryId,
        path: file.path,
        reason: file.reason
      }))
    };
  });

  ipcMain.handle('import-support-file', async (event) => {
    try {
      return await importSupportFileFromDialog(event.sender);
    } catch (error) {
      return createSupportFileFailure('invalid-file', error);
    }
  });

  ipcMain.handle('get-support-file-entry-content', async (event, sessionId, entryId) => {
    const session = supportArchiveSessions.get(sessionId);
    if (!session || session.ownerId !== event.sender.id) {
      return createSupportFileFailure('invalid-file', 'Support file session is no longer available.');
    }

    const fileEntry = session.filesById.get(entryId);
    if (!fileEntry) {
      return createSupportFileFailure('invalid-file', 'File entry was not found.');
    }

    const content = session.contentById.get(entryId);
    if (!content) {
      return createSupportFileFailure('unreadable-file', fileEntry.previewMessage || 'File content is not available.');
    }

    return {
      success: true,
      path: fileEntry.path,
      size: fileEntry.size,
      text: content.text,
      truncated: content.truncated
    };
  });

  ipcMain.handle('compare-support-archives', async (event, sessionIdA, sessionIdB) => {
    const sessionA = supportArchiveSessions.get(sessionIdA);
    const sessionB = supportArchiveSessions.get(sessionIdB);
    if (!sessionA || sessionA.ownerId !== event.sender.id) {
      return createSupportFileFailure('invalid-file', 'Support file session A is no longer available.');
    }
    if (!sessionB || sessionB.ownerId !== event.sender.id) {
      return createSupportFileFailure('invalid-file', 'Support file session B is no longer available.');
    }
    try {
      const { files, counts } = buildCompareManifest(buildCompareIndex(sessionA), buildCompareIndex(sessionB));
      return {
        success: true,
        sameFile: Boolean(sessionA.savedFileId && sessionA.savedFileId === sessionB.savedFileId),
        files,
        counts
      };
    } catch (error) {
      return createSupportFileFailure('invalid-file', error);
    }
  });

  ipcMain.handle('search-support-archive', async (event, sessionId, options = {}) => {
    const session = supportArchiveSessions.get(sessionId);
    if (!session || session.ownerId !== event.sender.id) {
      return { success: false, error: 'Support file session is no longer available.' };
    }
    try {
      return searchSupportArchiveSession(session, options);
    } catch (error) {
      return { success: false, error: error.message || 'Search failed' };
    }
  });

  ipcMain.handle('list-saved-support-files', async () => {
    try {
      return await listSavedSupportFiles();
    } catch (error) {
      return { success: false, error: error.message || 'Could not load saved files' };
    }
  });

  ipcMain.handle('open-saved-support-file', async (event, fileId) => {
    try {
      return await openSavedSupportFile(event.sender, String(fileId || ''));
    } catch (error) {
      return createSupportFileFailure('invalid-file', error);
    }
  });

  ipcMain.handle('update-saved-support-file', async (_event, fileId, updates = {}) => {
    try {
      return await updateSavedSupportFile(String(fileId || ''), updates);
    } catch (error) {
      return { success: false, error: error.message || 'Could not save file details' };
    }
  });

  ipcMain.handle('delete-saved-support-file', async (_event, fileId) => {
    try {
      return await deleteSavedSupportFile(String(fileId || ''));
    } catch (error) {
      return { success: false, error: error.message || 'Could not delete saved file' };
    }
  });

  ipcMain.handle('save-text-file', async (event, options = {}) => {
    try {
      return await saveTextFileFromDialog(event.sender, options);
    } catch (error) {
      return { success: false, error: error.message || 'Could not save file' };
    }
  });

  ipcMain.handle('test-tcp-port', async (_event, host, port, timeout = 3000) => {
    if (!host || !port) {
      return { success: false, open: false, error: 'Host and port are required' };
    }

    const sanitizedTimeout = Math.max(500, Math.min(Number(timeout) || 3000, 10000));

    return new Promise(resolve => {
      const socket = new net.Socket();
      let settled = false;

      const finish = (open, error = null) => {
        if (settled) return;
        settled = true;
        socket.destroy();
        resolve({ success: open, open, error });
      };

      socket.setTimeout(sanitizedTimeout);
      socket.once('connect', () => finish(true));
      socket.once('timeout', () => finish(false, 'timeout'));
      socket.once('error', (err) => finish(false, err ? err.message : 'error'));

      try {
        socket.connect(port, host);
      } catch (error) {
        finish(false, error.message);
      }
    });
  });

  ipcMain.handle('ssh-defaults', async (_event, host) => {
    try {
      return readSSHConfigDefaults(host);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('ssh-admin-password', async () => {
    try {
      return readSSHAdminPassword();
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('ssh-save-admin-password', async (_event, password) => {
    try {
      return writeSSHAdminPassword(password);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('digi-get-credentials', async () => {
    try {
      const { keyId, keySecret } = digiRemoteService.readCredentials(app.getPath('userData'));
      return {
        success: true,
        keyId,
        hasCredentials: Boolean(keyId && keySecret)
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('digi-save-credentials', async (_event, credentials = {}) => {
    try {
      const dir = app.getPath('userData');
      const keyId = typeof credentials.keyId === 'string' ? credentials.keyId.trim() : '';
      let keySecret = typeof credentials.keySecret === 'string' ? credentials.keySecret : '';
      // Preserve the stored secret when the user leaves the field blank but keeps a key id.
      if (!keySecret && keyId) {
        const existing = digiRemoteService.readCredentials(dir);
        if (existing.keySecret) {
          keySecret = existing.keySecret;
        }
      }
      const result = digiRemoteService.writeCredentials(dir, { keyId, keySecret });
      return { success: true, ...result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('digi-get-devices', async (_event, options = {}) => {
    try {
      const { keyId, keySecret } = digiRemoteService.readCredentials(app.getPath('userData'));
      const result = await digiRemoteService.getDevices({
        keyId,
        keySecret,
        size: options.size,
        cursor: options.cursor
      });
      return { success: true, ...result };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: error.code || 'DIGI_ERROR'
      };
    }
  });

  ipcMain.handle('ssh-connect', async (event, options = {}) => {
    const host = String(options.host || '').trim();
    const username = String(options.username || '').trim();
    const password = typeof options.password === 'string' ? options.password : '';
    const port = Math.max(1, Math.min(Number(options.port) || 22, 65535));
    const cols = Math.max(20, Math.min(Number(options.cols) || 80, 240));
    const rows = Math.max(10, Math.min(Number(options.rows) || 24, 80));
    const directShell = Boolean(options.directShell);

    if (!host || !username) {
      return { success: false, error: 'Host and username are required' };
    }

    const sessionId = crypto.randomUUID();
    const conn = new Client();
    let settled = false;

    return new Promise(resolve => {
      const finish = (payload) => {
        if (settled) return;
        settled = true;
        resolve(payload);
      };

      conn.on('ready', () => {
        const ptyOptions = {
          term: 'xterm-256color',
          cols,
          rows
        };
        const openStream = directShell
          ? callback => conn.exec('/bin/sh', { pty: ptyOptions }, callback)
          : callback => conn.shell(ptyOptions, callback);

        openStream((error, stream) => {
          if (error) {
            conn.end();
            finish({ success: false, error: error.message });
            return;
          }

          sshSessions.set(sessionId, {
            conn,
            stream,
            webContents: event.sender
          });

          stream.on('data', data => {
            if (!event.sender.isDestroyed()) {
              event.sender.send('ssh-data', { sessionId, data: data.toString('utf8') });
            }
          });

          if (stream.stderr) {
            stream.stderr.on('data', data => {
              if (!event.sender.isDestroyed()) {
                event.sender.send('ssh-data', { sessionId, data: data.toString('utf8') });
              }
            });
          }

          stream.on('close', () => {
            sshSessions.delete(sessionId);
            conn.end();
            if (!event.sender.isDestroyed()) {
              event.sender.send('ssh-close', { sessionId });
            }
          });

          event.sender.once('destroyed', () => {
            const session = sshSessions.get(sessionId);
            if (session) {
              session.stream.end();
              session.conn.end();
              sshSessions.delete(sessionId);
            }
          });

          finish({ success: true, sessionId });
        });
      });

      conn.on('error', error => {
        sshSessions.delete(sessionId);
        if (settled && !event.sender.isDestroyed()) {
          event.sender.send('ssh-error', { sessionId, error: error.message });
        }
        finish({ success: false, error: error.message });
      });

      conn.on('keyboard-interactive', (_name, _instructions, _instructionsLang, prompts, finishPrompts) => {
        finishPrompts(prompts.map(() => password));
      });

      conn.on('close', () => {
        sshSessions.delete(sessionId);
      });

      try {
        conn.connect({
          host,
          port,
          username,
          password,
          tryKeyboard: true,
          readyTimeout: 20000,
          keepaliveInterval: 10000,
          // Old Digi/embedded routers only speak legacy SSH algorithms.
          // Append them to the modern defaults so handshakes don't fail with
          // ECONNRESET / "Timed out while waiting for handshake".
          algorithms: {
            kex: {
              append: [
                'diffie-hellman-group14-sha1',
                'diffie-hellman-group1-sha1',
                'diffie-hellman-group-exchange-sha1'
              ]
            },
            serverHostKey: {
              append: ['ssh-rsa', 'ssh-dss']
            },
            cipher: {
              append: ['aes128-cbc', 'aes192-cbc', 'aes256-cbc', '3des-cbc']
            },
            hmac: {
              append: ['hmac-sha1', 'hmac-sha1-96']
            }
          }
        });
      } catch (error) {
        finish({ success: false, error: error.message });
      }
    });
  });

  ipcMain.handle('ssh-write', async (_event, sessionId, data) => {
    const session = sshSessions.get(sessionId);
    if (!session || !session.stream) {
      return { success: false, error: 'SSH session is not active' };
    }
    session.stream.write(String(data || ''));
    return { success: true };
  });

  ipcMain.handle('ssh-resize', async (_event, sessionId, cols, rows) => {
    const session = sshSessions.get(sessionId);
    if (!session || !session.stream || typeof session.stream.setWindow !== 'function') {
      return { success: false, error: 'SSH session is not active' };
    }
    session.stream.setWindow(
      Math.max(10, Number(rows) || 24),
      Math.max(20, Number(cols) || 80),
      0,
      0
    );
    return { success: true };
  });

  ipcMain.handle('ssh-disconnect', async (_event, sessionId) => {
    const session = sshSessions.get(sessionId);
    if (!session) {
      return { success: true };
    }
    session.stream.end();
    session.conn.end();
    sshSessions.delete(sessionId);
    return { success: true };
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    icon: APP_ICON_PATH,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, 'preload.js')
    },
    autoHideMenuBar: true
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    const frameName = String(details?.frameName || '');
    const isWebConsole = frameName.startsWith('digi-web-console-')
      || isRouterCertificateURL(details?.url);

    if (isWebConsole) {
      return { action: 'allow' };
    }

    openInDefaultBrowser(details?.url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!openInDefaultBrowser(url)) return;
    event.preventDefault();
  });

  mainWindow.webContents.on('did-create-window', (childWindow, details) => {
    const frameName = String(details?.frameName || '');
    if (!details || (!frameName.startsWith('digi-web-console-') && !isRouterCertificateURL(details.url))) return;
    configureRouterWebWindow(childWindow.webContents);
  });

  mainWindow.loadFile('index.html').then(() => {
    if (!mainWindow) return;
    mainWindow.show();
    mainWindow.focus();
  }).catch(error => {
    console.error('Failed to load index.html:', error);
  });
}

app.whenReady().then(() => {
  app.on('certificate-error', (event, _webContents, url, error, _certificate, callback) => {
    if (error === 'net::ERR_CERT_AUTHORITY_INVALID' && isRouterCertificateURL(url)) {
      event.preventDefault();
      callback(true);
      return;
    }

    callback(false);
  });

  setupIPCHandlers();
  if (process.platform === 'darwin' && app.dock) {
    app.dock.setIcon(APP_ICON_PATH);
  }
  createWindow();

  app.on('activate', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    } else {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
