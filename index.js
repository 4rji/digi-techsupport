const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const net = require('net');

function setupIPCHandlers() {
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
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, 'preload.js')
    },
    autoHideMenuBar: true
  });

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  setupIPCHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
