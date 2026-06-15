/**
 * Digi Remote Manager (DRM) integration service.
 *
 * Shared by the Electron main process (index.js) and the standalone HTTP
 * server (server-http.js). Credentials are stored on disk by the caller and
 * passed in here; this module never logs or returns the API secret.
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const DIGI_API_BASE = process.env.DIGI_REMOTE_API_BASE || 'https://remotemanager.digi.com';
const DEVICES_INVENTORY_PATH = '/ws/v1/devices/inventory';
const CREDENTIALS_FILE = 'digi-remote-credentials.json';
const DEFAULT_REQUEST_TIMEOUT_MS = 20000;

/** Thrown when the DRM API key id/secret are missing. Maps to HTTP 400. */
class ConfigurationError extends Error {
  constructor(message) {
    super(message || 'Digi Remote Manager API key is not configured');
    this.name = 'ConfigurationError';
    this.code = 'DIGI_CONFIG_MISSING';
  }
}

/** Thrown when DRM rejects the credentials (401). Maps to HTTP 401. */
class AuthError extends Error {
  constructor(message) {
    super(message || 'Invalid Digi API credentials');
    this.name = 'AuthError';
    this.code = 'DIGI_AUTH_FAILED';
  }
}

function getCredentialsPath(dir) {
  return path.join(dir, CREDENTIALS_FILE);
}

/**
 * Read stored DRM credentials from `dir`. Returns empty strings when nothing
 * has been saved yet. Never throws on a missing/corrupt file.
 */
function readCredentials(dir) {
  const filePath = getCredentialsPath(dir);
  if (!fs.existsSync(filePath)) {
    return { keyId: '', keySecret: '' };
  }
  try {
    const saved = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return {
      keyId: typeof saved.keyId === 'string' ? saved.keyId : '',
      keySecret: typeof saved.keySecret === 'string' ? saved.keySecret : ''
    };
  } catch {
    return { keyId: '', keySecret: '' };
  }
}

/**
 * Persist DRM credentials to `dir` with owner-only permissions. Clearing both
 * fields removes the file. Returns `{ hasCredentials, keyId }` (no secret).
 */
function writeCredentials(dir, credentials = {}) {
  const filePath = getCredentialsPath(dir);
  const keyId = typeof credentials.keyId === 'string' ? credentials.keyId.trim() : '';
  const keySecret = typeof credentials.keySecret === 'string' ? credentials.keySecret : '';

  if (!keyId && !keySecret) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return { hasCredentials: false, keyId: '' };
  }

  const payload = { encoding: 'plain', keyId, keySecret };
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), { mode: 0o600 });
  return { hasCredentials: Boolean(keyId && keySecret), keyId };
}

/** Return the first non-empty value among the candidate keys. */
function pickField(entry, keys) {
  for (const key of keys) {
    const value = entry[key];
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return '';
}

/**
 * Best-effort extraction of extended device + modem detail fields. DRM exposes
 * these under varying key names depending on device type and firmware, so each
 * field tries a list of candidates and falls back to an empty string.
 */
function mapDeviceDetails(entry) {
  return {
    // Device
    ip: String(pickField(entry, ['ip', 'ip_address', 'last_known_ip'])),
    publicIp: String(pickField(entry, ['public_ip', 'wan_ip', 'external_ip'])),
    privateIp: String(pickField(entry, ['private_ip', 'lan_ip', 'local_ip', 'internal_ip'])),
    connectionType: String(pickField(entry, ['connection_type', 'access_type', 'wan_type'])),
    firmwareVersion: String(pickField(entry, ['firmware_version', 'firmware', 'fw_version'])),
    uptime: String(pickField(entry, ['uptime', 'device_uptime', 'system_uptime'])),
    lastConnect: String(pickField(entry, ['last_connect', 'last_connected', 'last_update'])),
    model: String(pickField(entry, ['type', 'model', 'device_type', 'product'])),
    // Modem / cellular
    modemState: String(pickField(entry, ['modem_state', 'cellular_state', 'wan_state', 'modem_status'])),
    signalBars: String(pickField(entry, ['signal_bars', 'bars', 'signal_percent', 'signal_quality'])),
    signalStrength: String(pickField(entry, ['signal_strength', 'rssi', 'rsrp', 'cellular_rsrp'])),
    network: String(pickField(entry, ['network_technology', 'network', 'rat', 'cellular_technology'])),
    carrier: String(pickField(entry, ['carrier', 'operator', 'network_provider', 'cellular_carrier'])),
    modemModel: String(pickField(entry, ['modem_model', 'modem', 'cellular_modem'])),
    simStatus: String(pickField(entry, ['sim_status', 'sim_state'])),
    simIccid: String(pickField(entry, ['iccid', 'sim_iccid', 'sim'])),
    imei: String(pickField(entry, ['imei', 'modem_imei', 'cellular_imei']))
  };
}

/** Map a raw DRM inventory entry into the app's internal Device shape. */
function mapDevice(raw) {
  const entry = raw && typeof raw === 'object' ? raw : {};
  const id = String(entry.id ?? entry.devConnectwareId ?? entry.device_id ?? '');
  const name = String(
    entry.name
    || entry.deviceName
    || entry.description
    || entry.type
    || id
    || 'Unknown device'
  );
  const status = String(
    entry.connection_status
    || entry.connectionStatus
    || 'unknown'
  ).toLowerCase();

  return { id, name, status, details: mapDeviceDetails(entry) };
}

async function fetchDeviceInventory({ keyId, keySecret, size, cursor }) {
  if (!keyId || !keySecret) {
    throw new ConfigurationError();
  }

  const url = new URL(DIGI_API_BASE + DEVICES_INVENTORY_PATH);
  if (size) {
    url.searchParams.set('size', String(size));
  }
  if (cursor) {
    url.searchParams.set('cursor', String(cursor));
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-API-KEY-ID': keyId,
        'X-API-KEY-SECRET': keySecret,
        Accept: 'application/json'
      },
      signal: controller.signal
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Digi Remote Manager request timed out');
    }
    throw new Error(`Could not reach Digi Remote Manager: ${error.message}`);
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 401) {
    throw new AuthError();
  }
  if (!response.ok) {
    throw new Error(`Digi Remote Manager request failed (HTTP ${response.status})`);
  }

  return response.json();
}

/**
 * Fetch and normalize the device inventory.
 *
 * @param {{ keyId: string, keySecret: string, size?: number, cursor?: string }} options
 * @returns {Promise<{ devices: Array<{id,name,status}>, cursor: string|null, count: number }>}
 */
async function getDevices(options = {}) {
  const data = await fetchDeviceInventory(options);
  const list = Array.isArray(data?.list)
    ? data.list
    : Array.isArray(data)
      ? data
      : [];

  return {
    devices: list.map(mapDevice),
    cursor: data && typeof data.cursor === 'string' ? data.cursor : null,
    count: typeof data?.count === 'number' ? data.count : list.length
  };
}

module.exports = {
  ConfigurationError,
  AuthError,
  CREDENTIALS_FILE,
  getCredentialsPath,
  readCredentials,
  writeCredentials,
  mapDevice,
  getDevices
};
