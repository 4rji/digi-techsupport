const { app, BrowserWindow, ipcMain, safeStorage } = require('electron');
const path = require('path');
const net = require('net');
const fs = require('fs');
const { execFile } = require('child_process');
const crypto = require('crypto');
const { Client } = require('ssh2');
const { generateSupportTemplate } = require('./template-generator');

const APP_ICON_PATH = path.join(__dirname, 'build', process.platform === 'win32' ? 'icon.ico' : 'icon.png');
const sshSessions = new Map();
const SSH_ADMIN_PASSWORD_FILE = 'ssh-admin-password.json';
let mainWindow = null;

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

function configureRouterWebWindow(webContents) {
  if (!webContents) return;

  webContents.on('did-finish-load', () => {
    autofillRouterWebLogin(webContents);
  });

  webContents.on('did-navigate', () => {
    autofillRouterWebLogin(webContents);
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
    if (!safeStorage.isEncryptionAvailable()) {
      return { success: false, error: 'Saved SSH password cannot be decrypted on this device' };
    }
    const password = safeStorage.decryptString(Buffer.from(value, 'base64'));
    return { success: true, password, hasPassword: Boolean(password) };
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

  const payload = safeStorage.isEncryptionAvailable()
    ? {
        encoding: 'safeStorage',
        value: safeStorage.encryptString(sanitizedPassword).toString('base64')
      }
    : {
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

function setupIPCHandlers() {
  ipcMain.handle('ping-host', async (_event, host, timeout = 3000) => {
    return pingHost(host, timeout);
  });

  ipcMain.handle('generate-support-template', async (_event, options) => {
    return generateSupportTemplate(options);
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
          readyTimeout: 15000,
          keepaliveInterval: 10000
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

  mainWindow.webContents.on('did-create-window', (childWindow, details) => {
    if (!details || !isRouterCertificateURL(details.url)) return;
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
