'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  diffLines,
  compareCategoryForTags,
  buildCompareManifest,
  filterDiffRows,
  mergeCompareSearchResults
} = require('../support-diff');

// ---------------------------------------------------------------------------
// diffLines
// ---------------------------------------------------------------------------

test('diffLines: identical input produces only equal rows', () => {
  const result = diffLines('a\nb\nc', 'a\nb\nc');
  assert.equal(result.tooLarge, false);
  assert.equal(result.addedCount, 0);
  assert.equal(result.removedCount, 0);
  assert.deepEqual(result.rows.map(r => r.type), ['equal', 'equal', 'equal']);
  assert.deepEqual(result.rows.map(r => r.aNo), [1, 2, 3]);
  assert.deepEqual(result.rows.map(r => r.bNo), [1, 2, 3]);
});

test('diffLines: a pure insertion shows an add row only on side B', () => {
  const result = diffLines('a\nc', 'a\nb\nc');
  assert.deepEqual(result.rows.map(r => r.type), ['equal', 'add', 'equal']);
  const added = result.rows[1];
  assert.equal(added.aNo, null);
  assert.equal(added.bNo, 2);
  assert.equal(added.aText, '');
  assert.equal(added.bText, 'b');
  assert.equal(result.addedCount, 1);
  assert.equal(result.removedCount, 0);
});

test('diffLines: a pure deletion shows a del row only on side A', () => {
  const result = diffLines('a\nb\nc', 'a\nc');
  assert.deepEqual(result.rows.map(r => r.type), ['equal', 'del', 'equal']);
  const removed = result.rows[1];
  assert.equal(removed.aNo, 2);
  assert.equal(removed.bNo, null);
  assert.equal(removed.aText, 'b');
  assert.equal(removed.bText, '');
  assert.equal(result.removedCount, 1);
  assert.equal(result.addedCount, 0);
});

test('diffLines: a modified line becomes a single change row with both texts', () => {
  const result = diffLines('a\nX\nc', 'a\nY\nc');
  assert.deepEqual(result.rows.map(r => r.type), ['equal', 'change', 'equal']);
  const changed = result.rows[1];
  assert.equal(changed.aNo, 2);
  assert.equal(changed.bNo, 2);
  assert.equal(changed.aText, 'X');
  assert.equal(changed.bText, 'Y');
  assert.equal(result.addedCount, 1);
  assert.equal(result.removedCount, 1);
});

test('diffLines: empty A versus non-empty B is all additions', () => {
  const result = diffLines('', 'x\ny');
  assert.deepEqual(result.rows.map(r => r.type), ['add', 'add']);
  assert.deepEqual(result.rows.map(r => r.bNo), [1, 2]);
  assert.equal(result.addedCount, 2);
  assert.equal(result.removedCount, 0);
});

test('diffLines: CRLF and LF line endings compare as equal', () => {
  const result = diffLines('a\r\nb', 'a\nb');
  assert.deepEqual(result.rows.map(r => r.type), ['equal', 'equal']);
  assert.equal(result.addedCount, 0);
  assert.equal(result.removedCount, 0);
});

test('diffLines: input over the byte guard returns tooLarge with no rows', () => {
  const result = diffLines('aaaa', 'bbbb', { maxBytes: 2 });
  assert.equal(result.tooLarge, true);
  assert.deepEqual(result.rows, []);
});

test('diffLines: input over the line guard returns tooLarge', () => {
  const big = Array.from({ length: 50 }, (_, i) => `line${i}`).join('\n');
  const result = diffLines(big, big, { maxLines: 10 });
  assert.equal(result.tooLarge, true);
});

// ---------------------------------------------------------------------------
// compareCategoryForTags
// ---------------------------------------------------------------------------

test('compareCategoryForTags: maps each tag to its category', () => {
  assert.equal(compareCategoryForTags(['config']), 'config');
  assert.equal(compareCategoryForTags(['logs']), 'logs');
  assert.equal(compareCategoryForTags(['json']), 'json');
  assert.equal(compareCategoryForTags([]), 'other');
  assert.equal(compareCategoryForTags(undefined), 'other');
});

test('compareCategoryForTags: config wins when multiple tags are present', () => {
  assert.equal(compareCategoryForTags(['json', 'config']), 'config');
  assert.equal(compareCategoryForTags(['logs', 'json']), 'logs');
});

// ---------------------------------------------------------------------------
// buildCompareManifest
// ---------------------------------------------------------------------------

function entry(overrides) {
  return {
    entryId: 'id',
    size: 0,
    hash: null,
    binary: false,
    category: 'other',
    ...overrides
  };
}

test('buildCompareManifest: equal hashes are identical', () => {
  const a = new Map([['etc/config', entry({ entryId: 'a1', size: 10, hash: 'H', category: 'config' })]]);
  const b = new Map([['etc/config', entry({ entryId: 'b1', size: 10, hash: 'H', category: 'config' })]]);
  const manifest = buildCompareManifest(a, b);
  const file = manifest.files.find(f => f.path === 'etc/config');
  assert.ok(file, 'expected etc/config in manifest');
  assert.equal(file.status, 'identical');
  assert.equal(file.entryIdA, 'a1');
  assert.equal(file.entryIdB, 'b1');
  assert.equal(manifest.counts.identical, 1);
  assert.equal(manifest.counts.changed, 0);
  assert.equal(manifest.counts.byCategory.config, 0);
});

test('buildCompareManifest: differing hashes are changed and counted by category', () => {
  const a = new Map([['etc/config', entry({ hash: 'H1', category: 'config' })]]);
  const b = new Map([['etc/config', entry({ hash: 'H2', category: 'config' })]]);
  const manifest = buildCompareManifest(a, b);
  const file = manifest.files.find(f => f.path === 'etc/config');
  assert.ok(file);
  assert.equal(file.status, 'changed');
  assert.equal(manifest.counts.changed, 1);
  assert.equal(manifest.counts.byCategory.config, 1);
});

test('buildCompareManifest: equal hash but different size is changed (truncated preview guard)', () => {
  const a = new Map([['big.log', entry({ hash: 'PREFIX', size: 100 })]]);
  const b = new Map([['big.log', entry({ hash: 'PREFIX', size: 200 })]]);
  const manifest = buildCompareManifest(a, b);
  const file = manifest.files.find(f => f.path === 'big.log');
  assert.ok(file);
  assert.equal(file.status, 'changed');
});

test('buildCompareManifest: unmatched paths become only-a and only-b', () => {
  const a = new Map([['only/a.txt', entry({ entryId: 'a1', hash: 'A' })]]);
  const b = new Map([['only/b.txt', entry({ entryId: 'b1', hash: 'B' })]]);
  const manifest = buildCompareManifest(a, b);
  const fileA = manifest.files.find(f => f.path === 'only/a.txt');
  const fileB = manifest.files.find(f => f.path === 'only/b.txt');
  assert.ok(fileA);
  assert.ok(fileB);
  assert.equal(fileA.status, 'only-a');
  assert.equal(fileA.sizeB, null);
  assert.equal(fileB.status, 'only-b');
  assert.equal(fileB.sizeA, null);
  assert.equal(manifest.counts.onlyA, 1);
  assert.equal(manifest.counts.onlyB, 1);
});

test('buildCompareManifest: entries without a hash fall back to size comparison', () => {
  const changed = buildCompareManifest(
    new Map([['bin/blob', entry({ binary: true, hash: null, size: 100 })]]),
    new Map([['bin/blob', entry({ binary: true, hash: null, size: 200 })]])
  );
  const changedFile = changed.files.find(f => f.path === 'bin/blob');
  assert.ok(changedFile);
  assert.equal(changedFile.status, 'changed');
  assert.equal(changedFile.binary, true);
  assert.equal(changedFile.approxComparison, true);

  const same = buildCompareManifest(
    new Map([['bin/blob', entry({ binary: true, hash: null, size: 100 })]]),
    new Map([['bin/blob', entry({ binary: true, hash: null, size: 100 })]])
  );
  const sameFile = same.files.find(f => f.path === 'bin/blob');
  assert.ok(sameFile);
  assert.equal(sameFile.status, 'identical');
  assert.equal(sameFile.approxComparison, true);
});

test('buildCompareManifest: totals and byCategory only count differing files', () => {
  const a = new Map([
    ['etc/config', entry({ hash: 'c1', category: 'config' })],
    ['var/log/messages', entry({ hash: 'l1', category: 'logs' })],
    ['runt_json', entry({ hash: 'j1', category: 'json' })],
    ['same.txt', entry({ hash: 'S', category: 'other' })]
  ]);
  const b = new Map([
    ['etc/config', entry({ hash: 'c2', category: 'config' })],
    ['var/log/messages', entry({ hash: 'l2', category: 'logs' })],
    ['runt_json', entry({ hash: 'j1', category: 'json' })],
    ['same.txt', entry({ hash: 'S', category: 'other' })]
  ]);
  const manifest = buildCompareManifest(a, b);
  assert.equal(manifest.counts.changed, 2);
  assert.equal(manifest.counts.identical, 2);
  assert.equal(manifest.counts.byCategory.config, 1);
  assert.equal(manifest.counts.byCategory.logs, 1);
  assert.equal(manifest.counts.byCategory.json, 0);
  assert.equal(manifest.counts.byCategory.other, 0);
});

// ---------------------------------------------------------------------------
// filterDiffRows — grep / -i / cut applied to the open side-by-side diff
// ---------------------------------------------------------------------------

const diffSampleRows = () => ([
  { type: 'equal', aText: 'wan mtu 1500', bText: 'wan mtu 1500' },
  { type: 'change', aText: 'mode dhcp', bText: 'mode static' },
  { type: 'add', aText: '', bText: 'ip 10.0.0.5' },
  { type: 'equal', aText: 'hostname router', bText: 'hostname router' }
]);

test('filterDiffRows: empty query returns every row, unfiltered', () => {
  const result = filterDiffRows(diffSampleRows(), { query: '' });
  assert.equal(result.filtered, false);
  assert.equal(result.rows.length, 4);
});

test('filterDiffRows: a term keeps rows matching on either side', () => {
  const result = filterDiffRows(diffSampleRows(), { query: 'mtu' });
  assert.equal(result.filtered, true);
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].aText, 'wan mtu 1500');

  const onlyB = filterDiffRows(diffSampleRows(), { query: 'ip' });
  assert.equal(onlyB.rows.length, 1);
  assert.equal(onlyB.rows[0].bText, 'ip 10.0.0.5');
});

test('filterDiffRows: ignoreCase widens the match', () => {
  const rows = [{ type: 'equal', aText: 'RADIUS auth', bText: 'RADIUS auth' }];
  assert.equal(filterDiffRows(rows, { query: 'radius' }).rows.length, 0);
  assert.equal(filterDiffRows(rows, { query: 'radius', ignoreCase: true }).rows.length, 1);
});

test('filterDiffRows: cut inverts the match', () => {
  const result = filterDiffRows(diffSampleRows(), { query: 'mtu', cut: true });
  assert.equal(result.filtered, true);
  assert.equal(result.rows.length, 3);
  assert.ok(result.rows.every(r => !r.aText.includes('mtu') && !r.bText.includes('mtu')));
});

test('filterDiffRows: grep treats the query as a regular expression', () => {
  const result = filterDiffRows(diffSampleRows(), { query: 'mode|ip', grep: true });
  assert.equal(result.rows.length, 2);
});

test('filterDiffRows: an invalid grep pattern reports an error and keeps all rows', () => {
  const result = filterDiffRows(diffSampleRows(), { query: '(', grep: true });
  assert.ok(result.error);
  assert.equal(result.filtered, false);
  assert.equal(result.rows.length, 4);
});

test('filterDiffRows: an exclusion term (-foo) hides rows that contain it', () => {
  const result = filterDiffRows(diffSampleRows(), { query: '-mtu' });
  assert.equal(result.filtered, true);
  assert.equal(result.rows.length, 3);
  assert.ok(result.rows.every(r => !r.aText.includes('mtu') && !r.bText.includes('mtu')));
});
