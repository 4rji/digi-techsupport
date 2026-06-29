'use strict';

// Pure, dependency-free helpers for comparing two Digi support archives.
// Kept isolated from the Electron main process so it can be unit-tested
// (same pattern as support-search.js).
//
// UMD wrapper: usable as a CommonJS module (index.js + node --test) and as a
// classic <script> in the ESM renderer, where it publishes window.SupportDiff.
(function () {

const DEFAULT_MAX_BYTES = 2 * 1024 * 1024; // 2 MB per side
const DEFAULT_MAX_LINES = 20000; // per side
const DEFAULT_MAX_CELLS = 4000000; // LCS table cap for the differing middle block

function tooLargeResult() {
  return { rows: [], tooLarge: true, addedCount: 0, removedCount: 0 };
}

function splitLines(text) {
  return text === '' ? [] : text.split(/\r?\n/);
}

// Longest-common-subsequence backtrack over two arrays of lines.
// Returns a flat op list: { type: 'equal' | 'del' | 'add', aText?, bText? }.
function lcsOps(a, b) {
  const n = a.length;
  const m = b.length;
  // dp[i][j] = LCS length of a[i..] and b[j..]
  const dp = new Array(n + 1);
  for (let i = 0; i <= n; i++) dp[i] = new Uint32Array(m + 1);
  for (let i = n - 1; i >= 0; i--) {
    const dpi = dp[i];
    const dpi1 = dp[i + 1];
    const ai = a[i];
    for (let j = m - 1; j >= 0; j--) {
      dpi[j] = ai === b[j] ? dpi1[j + 1] + 1 : Math.max(dpi1[j], dpi[j + 1]);
    }
  }

  const ops = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      ops.push({ type: 'equal', aText: a[i], bText: b[j] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ type: 'del', aText: a[i] });
      i++;
    } else {
      ops.push({ type: 'add', bText: b[j] });
      j++;
    }
  }
  while (i < n) ops.push({ type: 'del', aText: a[i++] });
  while (j < m) ops.push({ type: 'add', bText: b[j++] });
  return ops;
}

// Turn the op list into aligned side-by-side rows. Adjacent del/add ops are
// paired into 'change' rows so a modified line lines up on one row.
function coalesceRows(ops, startA, startB) {
  const rows = [];
  let aNo = startA;
  let bNo = startB;
  let pendingDel = [];
  let pendingAdd = [];

  const flush = () => {
    const paired = Math.min(pendingDel.length, pendingAdd.length);
    for (let k = 0; k < paired; k++) {
      rows.push({ type: 'change', aNo: aNo++, bNo: bNo++, aText: pendingDel[k], bText: pendingAdd[k] });
    }
    for (let k = paired; k < pendingDel.length; k++) {
      rows.push({ type: 'del', aNo: aNo++, bNo: null, aText: pendingDel[k], bText: '' });
    }
    for (let k = paired; k < pendingAdd.length; k++) {
      rows.push({ type: 'add', aNo: null, bNo: bNo++, aText: '', bText: pendingAdd[k] });
    }
    pendingDel = [];
    pendingAdd = [];
  };

  for (const op of ops) {
    if (op.type === 'equal') {
      flush();
      rows.push({ type: 'equal', aNo: aNo++, bNo: bNo++, aText: op.aText, bText: op.bText });
    } else if (op.type === 'del') {
      pendingDel.push(op.aText);
    } else {
      pendingAdd.push(op.bText);
    }
  }
  flush();
  return rows;
}

// diffLines(aText, bText, opts?) -> { rows, tooLarge, addedCount, removedCount }
//   rows: [{ type, aNo, bNo, aText, bText }]
//     equal  -> aNo & bNo set, aText === bText
//     change -> aNo & bNo set, aText (old) and bText (new) differ
//     del    -> aNo set, bNo null (line only in A)
//     add    -> bNo set, aNo null (line only in B)
function diffLines(aText, bText, opts = {}) {
  const maxBytes = opts.maxBytes != null ? opts.maxBytes : DEFAULT_MAX_BYTES;
  const maxLines = opts.maxLines != null ? opts.maxLines : DEFAULT_MAX_LINES;
  const maxCells = opts.maxCells != null ? opts.maxCells : DEFAULT_MAX_CELLS;

  const left = String(aText == null ? '' : aText);
  const right = String(bText == null ? '' : bText);
  if (left.length > maxBytes || right.length > maxBytes) return tooLargeResult();

  const a = splitLines(left);
  const b = splitLines(right);
  if (a.length > maxLines || b.length > maxLines) return tooLargeResult();

  // Trim the common prefix and suffix so the LCS only runs on the part that
  // actually differs — keeps large-but-similar files cheap.
  let prefix = 0;
  while (prefix < a.length && prefix < b.length && a[prefix] === b[prefix]) prefix++;
  let aEnd = a.length - 1;
  let bEnd = b.length - 1;
  while (aEnd >= prefix && bEnd >= prefix && a[aEnd] === b[bEnd]) {
    aEnd--;
    bEnd--;
  }

  const midA = a.slice(prefix, aEnd + 1);
  const midB = b.slice(prefix, bEnd + 1);
  if (midA.length * midB.length > maxCells) return tooLargeResult();

  const rows = [];
  for (let i = 0; i < prefix; i++) {
    rows.push({ type: 'equal', aNo: i + 1, bNo: i + 1, aText: a[i], bText: b[i] });
  }
  const middleRows = coalesceRows(lcsOps(midA, midB), prefix + 1, prefix + 1);
  for (const row of middleRows) rows.push(row);
  const suffixLen = a.length - 1 - aEnd;
  for (let k = 0; k < suffixLen; k++) {
    const ai = aEnd + 1 + k;
    const bi = bEnd + 1 + k;
    rows.push({ type: 'equal', aNo: ai + 1, bNo: bi + 1, aText: a[ai], bText: b[bi] });
  }

  let addedCount = 0;
  let removedCount = 0;
  for (const row of rows) {
    if (row.type === 'add' || row.type === 'change') addedCount++;
    if (row.type === 'del' || row.type === 'change') removedCount++;
  }
  return { rows, tooLarge: false, addedCount, removedCount };
}

// Reduce the tags from classifySupportEntry() to a single display category.
// Precedence: config > logs > json > other (config is the most useful for support).
function compareCategoryForTags(tags) {
  const list = Array.isArray(tags) ? tags : [];
  if (list.includes('config')) return 'config';
  if (list.includes('logs')) return 'logs';
  if (list.includes('json')) return 'json';
  return 'other';
}

const CATEGORY_KEYS = ['config', 'logs', 'json', 'other'];

// buildCompareManifest(indexA, indexB) -> { files, counts }
//   indexA / indexB: Map<path, { entryId, size, hash, binary, category }>
//     hash:   stable content hash, or null when content is unavailable (binary)
//   Files present on both sides are 'identical' when hashes match (or, when no
//   hash is available, when sizes match — flagged approxComparison); otherwise
//   'changed'. Files on a single side are 'only-a' / 'only-b'.
//   counts.byCategory only tallies differing files (identical ones are hidden by default).
function buildCompareManifest(indexA, indexB) {
  const paths = new Set([...indexA.keys(), ...indexB.keys()]);
  const files = [];
  const counts = {
    changed: 0,
    onlyA: 0,
    onlyB: 0,
    identical: 0,
    byCategory: { config: 0, logs: 0, json: 0, other: 0 }
  };

  for (const path of paths) {
    const a = indexA.get(path);
    const b = indexB.get(path);
    let status;
    let category;
    let binary = false;
    let approxComparison = false;

    if (a && b) {
      category = a.category || b.category || 'other';
      binary = Boolean(a.binary || b.binary);
      if (a.hash != null && b.hash != null) {
        // Content text can be a truncated preview, so require size parity too:
        // two files with the same prefix hash but different sizes really differ.
        status = a.hash === b.hash && a.size === b.size ? 'identical' : 'changed';
      } else {
        approxComparison = true;
        status = a.size === b.size ? 'identical' : 'changed';
      }
    } else if (a) {
      status = 'only-a';
      category = a.category || 'other';
      binary = Boolean(a.binary);
    } else {
      status = 'only-b';
      category = b.category || 'other';
      binary = Boolean(b.binary);
    }

    files.push({
      path,
      category,
      status,
      entryIdA: a ? a.entryId : '',
      entryIdB: b ? b.entryId : '',
      sizeA: a ? a.size : null,
      sizeB: b ? b.size : null,
      binary,
      approxComparison
    });

    if (status === 'changed') counts.changed++;
    else if (status === 'only-a') counts.onlyA++;
    else if (status === 'only-b') counts.onlyB++;
    else counts.identical++;

    if (status !== 'identical') {
      const key = CATEGORY_KEYS.includes(category) ? category : 'other';
      counts.byCategory[key]++;
    }
  }

  files.sort((x, y) => x.path.localeCompare(y.path));
  return { files, counts };
}

const api = { diffLines, compareCategoryForTags, buildCompareManifest, CATEGORY_KEYS };

if (typeof module === 'object' && module.exports) {
  module.exports = api;
}
if (typeof window !== 'undefined') {
  window.SupportDiff = api;
}

})();
