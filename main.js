const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const axios = require('axios');
const net = require('net');
const { execFile } = require('child_process');
const { checkNode, checkVMStatus, checkNodeHealth, testNodeConnection } = require('./helpers/health');

function pingHost(host, timeout = 3000) {
  if (!host) {
    return Promise.resolve({ success: false, online: false, error: 'Host is required' });
  }

  const sanitizedTimeout = Math.max(500, Math.min(Number(timeout) || 3000, 10000));
  const args = process.platform === 'win32'
    ? ['-n', '1', '-w', String(sanitizedTimeout), host]
    : process.platform === 'darwin'
      ? ['-c', '1', '-W', String(sanitizedTimeout), host]
      : ['-c', '1', '-W', String(Math.ceil(sanitizedTimeout / 1000)), host];

  return new Promise(resolve => {
    execFile('ping', args, { timeout: sanitizedTimeout + 1000 }, (error) => {
      resolve({
        success: !error,
        online: !error,
        error: error ? error.message : null
      });
    });
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadURL('http://localhost:600');
}

// Handle VM status request
ipcMain.handle('get-vm-status', async (event, vmid, serverId) => {
  try {
    const credentials = JSON.parse(localStorage.getItem(`credentials_${serverId}`));
    if (!credentials) return { error: 'No credentials found' };

    console.log(`Getting VM status for ${vmid} on server ${serverId}`);
    const status = await checkVMStatus(
      credentials.node,
      credentials.host,
      credentials.token,
      credentials.secret,
      vmid
    );
    
    if (!status) {
      console.log(`VM ${vmid} not reachable`);
      return { error: 'VM not reachable' };
    }

    const cpuUsage = status.cpu * 100 || 0;
    console.log(`CPU usage for VM ${vmid}: ${cpuUsage}%`);
    return { cpu_usage: cpuUsage };
  } catch (error) {
    console.error('Error getting VM status:', error);
    return { error: error.message };
  }
});

// Handle system info request
ipcMain.handle('get-system-info', async (event, serverId) => {
  try {
    const credentials = JSON.parse(localStorage.getItem(`credentials_${serverId}`));
    if (!credentials) return { error: 'No credentials found' };

    console.log(`Getting system info for server ${serverId}`);
    const health = await checkNodeHealth(
      credentials.node,
      credentials.host,
      credentials.token,
      credentials.secret
    );
    
    console.log(`System health for ${serverId}:`, health);
    return health;
  } catch (error) {
    console.error('Error getting system info:', error);
    return { error: error.message };
  }
});

// Handle VM list request
ipcMain.handle('get-vms', async (event, serverId) => {
  try {
    const credentials = JSON.parse(localStorage.getItem(`credentials_${serverId}`));
    if (!credentials) return { error: 'No credentials found' };

    console.log(`Testing connection to Proxmox for ${serverId}...`);
    const nodeStatus = await testNodeConnection(
      credentials.node,
      credentials.host,
      credentials.token,
      credentials.secret
    );

    if (!nodeStatus) {
      console.log(`Could not connect to Proxmox for ${serverId}`);
      return { error: 'Could not connect to Proxmox' };
    }

    console.log(`Getting VM list for server ${serverId}`);
    const response = await axios.get(`${credentials.url}/api2/json/nodes/${credentials.node}/qemu`, {
      headers: {
        'Authorization': `PVEAPIToken=${credentials.token}=${credentials.secret}`
      }
    });

    const vms = response.data.data;
    console.log(`Found ${vms.length} VMs for server ${serverId}`);

    const vmsWithCPU = await Promise.all(vms.map(async vm => {
      console.log(`Getting CPU usage for VM ${vm.vmid}`);
      const status = await checkVMStatus(
        credentials.node,
        credentials.host,
        credentials.token,
        credentials.secret,
        vm.vmid
      );
      
      const cpuUsage = status ? status.cpu * 100 || 0 : 0;
      console.log(`CPU usage for VM ${vm.vmid}: ${cpuUsage}%`);
      
      return { 
        ...vm, 
        cpu_usage: cpuUsage 
      };
    }));

    return { vms: vmsWithCPU };
  } catch (error) {
    console.error('Error fetching VMs:', error);
    return { error: error.message };
  }
});

ipcMain.handle('test-tcp-port', async (event, host, port, timeout = 3000) => {
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

ipcMain.handle('ping-host', async (event, host, timeout = 3000) => {
  return pingHost(host, timeout);
});

app.whenReady().then(createWindow);
