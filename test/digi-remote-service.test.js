'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  mapDevice,
  mapEvent,
  mapAlert,
  alertIsActive,
  parseDeviceStats,
  assertNoSciError,
  buildQueryStateSci,
  buildRebootSci,
  formatDeviceLogEntry
} = require('../digi-remote-service');

// ---------------------------------------------------------------------------
// mapDevice
// ---------------------------------------------------------------------------

test('mapDevice: normalizes id, name, and lowercased status', () => {
  // Arrange
  const raw = { id: 'DEV-1', name: 'Router A', connection_status: 'Connected' };

  // Act
  const device = mapDevice(raw);

  // Assert
  assert.equal(device.id, 'DEV-1');
  assert.equal(device.name, 'Router A');
  assert.equal(device.status, 'connected');
  assert.equal(typeof device.details, 'object');
});

test('mapDevice: falls back to unknown status and a generated name', () => {
  const device = mapDevice({ id: 'x' });
  assert.equal(device.status, 'unknown');
  assert.equal(device.name, 'x');
});

// ---------------------------------------------------------------------------
// mapEvent
// ---------------------------------------------------------------------------

test('mapEvent: picks the first present field for each column', () => {
  const event = mapEvent({ time: '2026-07-10T10:00:00Z', event_type: 'reboot', description: 'Device rebooted' });
  assert.equal(event.timestamp, '2026-07-10T10:00:00Z');
  assert.equal(event.type, 'reboot');
  assert.equal(event.summary, 'Device rebooted');
});

test('mapEvent: returns empty strings when nothing matches', () => {
  const event = mapEvent({});
  assert.deepEqual(event, { timestamp: '', type: '', summary: '' });
});

// ---------------------------------------------------------------------------
// mapAlert / alertIsActive
// ---------------------------------------------------------------------------

test('mapAlert: normalizes severity to lowercase', () => {
  const alert = mapAlert({ id: 'a1', severity: 'CRITICAL', message: 'Down', timestamp: 't' });
  assert.deepEqual(alert, { id: 'a1', severity: 'critical', message: 'Down', timestamp: 't' });
});

test('alertIsActive: treats reset/cleared/acknowledged as inactive', () => {
  assert.equal(alertIsActive({ status: 'fired' }), true);
  assert.equal(alertIsActive({ status: 'reset' }), false);
  assert.equal(alertIsActive({ status: 'ACKNOWLEDGED' }), false);
  assert.equal(alertIsActive({}), true); // no status → assume active
});

// ---------------------------------------------------------------------------
// parseDeviceStats (SCI device_stats XML)
// ---------------------------------------------------------------------------

test('parseDeviceStats: extracts cpu/uptime/memory tags', () => {
  const xml = `<device_stats>
    <cpu>12</cpu>
    <uptime>3600</uptime>
    <totalmem>512000</totalmem>
    <usedmem>128000</usedmem>
    <freemem>384000</freemem>
  </device_stats>`;

  const stats = parseDeviceStats(xml);

  assert.deepEqual(stats, {
    cpu: '12',
    uptime: '3600',
    totalMemory: '512000',
    usedMemory: '128000',
    freeMemory: '384000'
  });
});

test('parseDeviceStats: missing tags become empty strings', () => {
  const stats = parseDeviceStats('<device_stats><cpu>5</cpu></device_stats>');
  assert.equal(stats.cpu, '5');
  assert.equal(stats.uptime, '');
  assert.equal(stats.freeMemory, '');
});

// ---------------------------------------------------------------------------
// assertNoSciError
// ---------------------------------------------------------------------------

test('assertNoSciError: throws with the <desc> text when SCI reports an error', () => {
  const xml = `<sci_reply><error id="1"><desc>Device is offline</desc></error></sci_reply>`;
  assert.throws(() => assertNoSciError(xml), /Device is offline/);
});

test('assertNoSciError: does not throw on a clean reply', () => {
  const xml = `<sci_reply><do_command target="reboot"/></sci_reply>`;
  assert.doesNotThrow(() => assertNoSciError(xml));
});

// ---------------------------------------------------------------------------
// SCI request builders
// ---------------------------------------------------------------------------

test('buildQueryStateSci: includes the device id and query_state/device_stats', () => {
  const xml = buildQueryStateSci('00000000-00000000-0000FFFF-AABBCCDD');
  assert.match(xml, /<send_message>/);
  assert.match(xml, /<device id="00000000-00000000-0000FFFF-AABBCCDD"\/>/);
  assert.match(xml, /<query_state><device_stats\/><\/query_state>/);
});

test('buildRebootSci: uses do_command target="reboot" with the device id', () => {
  const xml = buildRebootSci('DEV-9');
  assert.match(xml, /<do_command target="reboot">/);
  assert.match(xml, /<device id="DEV-9"\/>/);
});

test('SCI builders: escape XML-significant characters in the device id', () => {
  const xml = buildRebootSci('a&b"<c>');
  assert.match(xml, /id="a&amp;b&quot;&lt;c&gt;"/);
  assert.doesNotMatch(xml, /id="a&b"<c>"/);
});

// ---------------------------------------------------------------------------
// formatDeviceLogEntry
// ---------------------------------------------------------------------------

test('formatDeviceLogEntry: joins timestamp, level, and message', () => {
  const line = formatDeviceLogEntry({ timestamp: '2026-07-10T10:00:00Z', level: 'INFO', message: 'Booted' });
  assert.equal(line, '2026-07-10T10:00:00Z  INFO  Booted');
});

test('formatDeviceLogEntry: omits missing parts without leaving separators', () => {
  const line = formatDeviceLogEntry({ message: 'Only a message' });
  assert.equal(line, 'Only a message');
});
