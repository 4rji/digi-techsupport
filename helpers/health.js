import https from 'https';
import axios from 'axios';

const httpsAgent = new https.Agent({ rejectUnauthorized: false }); // cert self-signed

export async function testNodeConnection(nodeId, ip, token, secret) {
  const url = `https://${ip}:8006/api2/json/nodes/${nodeId}/status`;
  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `PVEAPIToken=${token}=${secret}`
      },
      httpsAgent,
      timeout: 3000
    });
    return response.data.data;
  } catch (e) {
    if (e.code === 'ENETUNREACH') return null;
    throw e;
  }
}

export async function checkNode(nodeId, ip, token, secret) {
  const url = `https://${ip}:8006/api2/json/nodes/${nodeId}/status`;
  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `PVEAPIToken=${token}=${secret}`
      },
      httpsAgent,
      timeout: 3000
    });
    return response.data.data;
  } catch (e) {
    if (e.code === 'ENETUNREACH') return null;
    throw e;
  }
}

export async function checkVMStatus(nodeId, ip, token, secret, vmid) {
  const url = `https://${ip}:8006/api2/json/nodes/${nodeId}/qemu/${vmid}/status/current`;
  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `PVEAPIToken=${token}=${secret}`
      },
      httpsAgent,
      timeout: 3000
    });
    
    // Always return a CPU value, even if it's 0
    const data = response.data.data;
    return {
      ...data,
      cpu: data.cpu || 0
    };
  } catch (e) {
    if (e.code === 'ENETUNREACH') return { cpu: 0 };
    throw e;
  }
}

export async function checkNodeHealth(nodeId, ip, token, secret) {
  try {
    const status = await checkNode(nodeId, ip, token, secret);
    if (!status) return { online: false };
    
    return {
      online: true,
      cpu: status.cpu * 100 || 0,
      memory: {
        total: status.memory.total,
        used: status.memory.used,
        free: status.memory.free
      },
      loadavg: status.loadavg
    };
  } catch (e) {
    console.error(`Error checking node health for ${nodeId}:`, e);
    return { online: false, error: e.message };
  }
} 