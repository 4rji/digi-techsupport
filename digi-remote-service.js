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

/** Thrown when a requested device is not in the inventory (404). */
class NotFoundError extends Error {
  constructor(message) {
    super(message || 'Device not found in Remote Manager');
    this.name = 'NotFoundError';
    this.code = 'DIGI_NOT_FOUND';
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
    serialNumber: String(pickField(entry, ['serial_number', 'serial', 'device_serial', 'sn'])),
    ip: String(pickField(entry, ['ip', 'ip_address', 'last_known_ip'])),
    publicIp: String(pickField(entry, ['public_ip', 'wan_ip', 'external_ip'])),
    privateIp: String(pickField(entry, ['private_ip', 'lan_ip', 'local_ip', 'internal_ip'])),
    connectionType: String(pickField(entry, ['connection_type', 'access_type', 'wan_type'])),
    firmwareVersion: String(pickField(entry, ['firmware_version', 'firmware', 'fw_version'])),
    macAddress: String(pickField(entry, ['mac', 'mac_address', 'ethernet_mac', 'eth_mac'])),
    sku: String(pickField(entry, ['sku', 'part_number', 'device_sku', 'product_id'])),
    activationDate: String(pickField(entry, ['activation_date', 'provision_date', 'registration_date', 'date_activated', 'provisioned_at'])),
    uptime: String(pickField(entry, ['uptime', 'device_uptime', 'system_uptime'])),
    cloudUptime: String(pickField(entry, ['cloud_uptime', 'drm_uptime', 'connection_uptime', 'last_connected_duration'])),
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

/**
 * Shared DRM HTTP request. Applies the API-key headers, a timeout, and the
 * common status handling (401 → AuthError, 404 → NotFoundError). Returns the
 * raw `Response` so callers can pick `.json()` or `.text()` (SCI is XML).
 */
async function drmRequest(url, options = {}) {
  const { keyId, keySecret, method = 'GET', body = null, contentType = null, accept = 'application/json' } = options;
  if (!keyId || !keySecret) {
    throw new ConfigurationError();
  }

  const headers = {
    'X-API-KEY-ID': keyId,
    'X-API-KEY-SECRET': keySecret,
    Accept: accept
  };
  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body || undefined,
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
  if (response.status === 404) {
    throw new NotFoundError();
  }
  if (!response.ok) {
    throw new Error(`Digi Remote Manager request failed (HTTP ${response.status})`);
  }

  return response;
}

/** Normalize the several shapes DRM uses for list payloads into an array. */
function extractList(data) {
  if (Array.isArray(data?.list)) return data.list;
  if (Array.isArray(data)) return data;
  return [];
}

async function fetchDeviceInventory({ keyId, keySecret, size, cursor }) {
  const url = new URL(DIGI_API_BASE + DEVICES_INVENTORY_PATH);
  if (size) {
    url.searchParams.set('size', String(size));
  }
  if (cursor) {
    url.searchParams.set('cursor', String(cursor));
  }

  const response = await drmRequest(url.toString(), { keyId, keySecret });
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
  const list = extractList(data);

  return {
    devices: list.map(mapDevice),
    cursor: data && typeof data.cursor === 'string' ? data.cursor : null,
    count: typeof data?.count === 'number' ? data.count : list.length
  };
}

/**
 * Fetch the full inventory record for a single device.
 * @param {{ keyId: string, keySecret: string, deviceId: string }} options
 * @returns {Promise<{ device: object }>}
 */
async function getDeviceDetail({ keyId, keySecret, deviceId } = {}) {
  const id = String(deviceId || '').trim();
  if (!id) {
    throw new ConfigurationError('A device id is required');
  }

  const url = DIGI_API_BASE + DEVICES_INVENTORY_PATH + '/' + encodeURIComponent(id);
  const response = await drmRequest(url, { keyId, keySecret });
  const data = await response.json();
  // Single-device inventory may return the entry directly or wrapped in list.
  const list = extractList(data);
  const entry = list.length ? list[0] : (data && typeof data === 'object' ? data : null);
  if (!entry || (typeof entry === 'object' && Object.keys(entry).length === 0)) {
    throw new NotFoundError();
  }
  return { device: mapDevice(entry) };
}

/** Normalize a raw DRM event into `{ timestamp, type, summary }`. */
function mapEvent(raw) {
  const entry = raw && typeof raw === 'object' ? raw : {};
  return {
    timestamp: String(pickField(entry, ['timestamp', 'time', 'event_time', 'date', 'received_time', 'last_update'])),
    type: String(pickField(entry, ['type', 'event_type', 'category', 'name', 'group'])),
    summary: String(pickField(entry, ['description', 'summary', 'message', 'detail', 'text', 'status']))
  };
}

/**
 * Fetch recent events for a device, newest first.
 * @param {{ keyId: string, keySecret: string, deviceId: string, size?: number }} options
 * @returns {Promise<{ events: Array<{timestamp,type,summary}> }>}
 */
async function getDeviceEvents({ keyId, keySecret, deviceId, size = 50 } = {}) {
  const id = String(deviceId || '').trim();
  if (!id) {
    throw new ConfigurationError('A device id is required');
  }

  const url = new URL(DIGI_API_BASE + '/ws/v1/events');
  url.searchParams.set('query', `device_id='${id}'`);
  url.searchParams.set('orderby', 'timestamp desc');
  url.searchParams.set('size', String(size));

  const response = await drmRequest(url.toString(), { keyId, keySecret });
  const data = await response.json();
  const events = extractList(data).map(mapEvent);
  // Guarantee reverse-chronological order regardless of what the API honored.
  events.sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
  return { events };
}

/** Normalize a raw DRM alert into `{ id, severity, message, timestamp }`. */
function mapAlert(raw) {
  const entry = raw && typeof raw === 'object' ? raw : {};
  return {
    id: String(pickField(entry, ['id', 'alert_id', 'aid', 'name'])),
    severity: String(pickField(entry, ['severity', 'priority', 'level', 'status'])).toLowerCase(),
    message: String(pickField(entry, ['message', 'description', 'summary', 'name', 'type'])),
    timestamp: String(pickField(entry, ['timestamp', 'last_update', 'updated', 'time', 'source_timestamp']))
  };
}

/** True when an alert entry is still active (not reset/cleared/acknowledged). */
function alertIsActive(raw) {
  const status = String(pickField(raw || {}, ['status', 'state', 'alert_status'])).toLowerCase();
  if (!status) return true;
  return !['reset', 'cleared', 'acknowledged', 'ok', 'normal', 'resolved'].includes(status);
}

/**
 * Fetch active alerts for a device.
 *
 * DRM exposes active alerts at `/ws/v1/alerts/summary` (a per-source rollup).
 * Some accounts surface the same information under `/ws/v1/notifications`
 * instead; if this returns empty for a device that DRM's web UI shows as
 * alerting, switch the path below to `/ws/v1/notifications`.
 *
 * @param {{ keyId: string, keySecret: string, deviceId: string }} options
 * @returns {Promise<{ alerts: Array<{id,severity,message,timestamp}> }>}
 */
async function getDeviceAlerts({ keyId, keySecret, deviceId } = {}) {
  const id = String(deviceId || '').trim();
  if (!id) {
    throw new ConfigurationError('A device id is required');
  }

  const url = new URL(DIGI_API_BASE + '/ws/v1/alerts/summary');
  url.searchParams.set('query', `source='${id}'`);

  const response = await drmRequest(url.toString(), { keyId, keySecret });
  const data = await response.json();
  const alerts = extractList(data).filter(alertIsActive).map(mapAlert);
  return { alerts };
}

// --- SCI (Server Command Interface) — live state + reboot ------------------
// SCI reuses the same X-API-KEY-ID / X-API-KEY-SECRET credentials as the v1
// REST API (Phase 0 decision: reuse the existing key rather than add a
// separate SCI username/password field). If POST /ws/sci ever returns 401 with
// a valid v1 key, revisit this and add dedicated SCI credentials. SCI speaks
// XML, not JSON.

const SCI_PATH = '/ws/sci';

/** Escape a value for safe inclusion in an XML attribute. */
function escapeXmlAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildQueryStateSci(deviceId) {
  const id = escapeXmlAttr(deviceId);
  return `<sci_request version="1.0">`
    + `<send_message><targets><device id="${id}"/></targets>`
    + `<rci_request version="1.1"><query_state><device_stats/></query_state></rci_request>`
    + `</send_message></sci_request>`;
}

function buildRebootSci(deviceId) {
  const id = escapeXmlAttr(deviceId);
  return `<sci_request version="1.0">`
    + `<do_command target="reboot"><targets><device id="${id}"/></targets></do_command>`
    + `</sci_request>`;
}

/** Extract the inner text of the first `<tag>...</tag>` in an XML string. */
function extractXmlTagValue(xml, tag) {
  const match = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i').exec(String(xml || ''));
  return match ? match[1].trim() : '';
}

/**
 * Parse the handful of numeric device_stats fields out of an SCI reply.
 * A tiny hand-written extractor is used deliberately instead of adding an XML
 * parser dependency for four numbers.
 */
function parseDeviceStats(xml) {
  return {
    cpu: extractXmlTagValue(xml, 'cpu'),
    uptime: extractXmlTagValue(xml, 'uptime'),
    totalMemory: extractXmlTagValue(xml, 'totalmem'),
    usedMemory: extractXmlTagValue(xml, 'usedmem'),
    freeMemory: extractXmlTagValue(xml, 'freemem')
  };
}

/** SCI returns `<error ...><desc>...</desc></error>` when a command fails. */
function assertNoSciError(xml) {
  const text = String(xml || '');
  if (/<error\b/i.test(text)) {
    const desc = extractXmlTagValue(text, 'desc')
      || extractXmlTagValue(text, 'hint')
      || 'Remote Manager rejected the command';
    throw new Error(desc);
  }
}

async function sciRequest({ keyId, keySecret, xml }) {
  const response = await drmRequest(DIGI_API_BASE + SCI_PATH, {
    keyId,
    keySecret,
    method: 'POST',
    body: xml,
    contentType: 'application/xml',
    accept: 'application/xml, text/xml, */*'
  });
  return response.text();
}

/**
 * Query live CPU / memory / uptime for a connected device via SCI.
 * @returns {Promise<{ stats: {cpu,uptime,totalMemory,usedMemory,freeMemory} }>}
 */
async function queryDeviceState({ keyId, keySecret, deviceId } = {}) {
  const id = String(deviceId || '').trim();
  if (!id) {
    throw new ConfigurationError('A device id is required');
  }
  const reply = await sciRequest({ keyId, keySecret, xml: buildQueryStateSci(id) });
  assertNoSciError(reply);
  return { stats: parseDeviceStats(reply) };
}

/**
 * Reboot a device via SCI. Destructive — callers MUST confirm with the user
 * before invoking this.
 * @returns {Promise<{ requested: true }>}
 */
async function rebootDevice({ keyId, keySecret, deviceId } = {}) {
  const id = String(deviceId || '').trim();
  if (!id) {
    throw new ConfigurationError('A device id is required');
  }
  const reply = await sciRequest({ keyId, keySecret, xml: buildRebootSci(id) });
  assertNoSciError(reply);
  return { requested: true };
}

// --- Device logs ----------------------------------------------------------

/** Format one raw device_log entry into a single readable line. */
function formatDeviceLogEntry(raw) {
  const entry = raw && typeof raw === 'object' ? raw : {};
  const timestamp = String(pickField(entry, ['timestamp', 'time', 'date', 'received_time']));
  const level = String(pickField(entry, ['type', 'level', 'category', 'severity']));
  const message = String(pickField(entry, ['message', 'description', 'text', 'summary', 'detail', 'log']));
  return [timestamp, level, message].filter(Boolean).join('  ');
}

/**
 * Fetch device logs and return them as plain text ready to be fed into the
 * Support Archive Viewer's text-entry session model.
 * @returns {Promise<{ text: string, count: number }>}
 */
async function getDeviceLogs({ keyId, keySecret, deviceId, size = 500 } = {}) {
  const id = String(deviceId || '').trim();
  if (!id) {
    throw new ConfigurationError('A device id is required');
  }

  const url = new URL(DIGI_API_BASE + '/ws/v1/device_logs');
  url.searchParams.set('query', `device_id='${id}'`);
  url.searchParams.set('orderby', 'timestamp desc');
  url.searchParams.set('size', String(size));

  const response = await drmRequest(url.toString(), { keyId, keySecret });
  const data = await response.json();
  const list = extractList(data);
  const text = list.map(formatDeviceLogEntry).filter(Boolean).join('\n');
  return { text, count: list.length };
}

module.exports = {
  ConfigurationError,
  AuthError,
  NotFoundError,
  CREDENTIALS_FILE,
  getCredentialsPath,
  readCredentials,
  writeCredentials,
  mapDevice,
  mapEvent,
  mapAlert,
  alertIsActive,
  parseDeviceStats,
  assertNoSciError,
  buildQueryStateSci,
  buildRebootSci,
  formatDeviceLogEntry,
  getDevices,
  getDeviceDetail,
  getDeviceEvents,
  getDeviceAlerts,
  queryDeviceState,
  rebootDevice,
  getDeviceLogs
};
