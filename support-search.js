// Pure, dependency-free advanced cross-file search for support archives.
// Kept isolated from the Electron main process so it can be unit-tested.

const ADVANCED_SEARCH_LIMITS = {
  maxFiles: 80,
  maxLinesPerFile: 200,
  maxTotalLines: 5000,
  maxLineLength: 1000
};

function classifySupportEntry(entry) {
  const entryPath = String(entry?.path || '').toLowerCase();
  const name = String(entry?.name || '').toLowerCase();
  const tags = [];
  const isJson = /\.json$/.test(name) || /(^|\/)(config_json|runt_json)$/.test(entryPath) || /_json$/.test(name);
  const isLog = /(^|\/)var\/log\//.test(entryPath) || name.includes('messages') || /(^|\/)event_list$/.test(entryPath) || /\.log$/.test(name);
  const isConfig = /(^|\/)config_dump/.test(name) || /(^|\/)config_json$/.test(entryPath) || /(^|\/)etc\//.test(entryPath);
  if (isJson) tags.push('json');
  if (isLog) tags.push('logs');
  if (isConfig) tags.push('config');
  return tags;
}

function supportEntryMatchesFilters(entry, filters) {
  if (!Array.isArray(filters) || filters.length === 0) return true;
  const tags = classifySupportEntry(entry);
  return filters.some(filter => tags.includes(filter));
}

function parseSupportSearchGrepPattern(query, ignoreCase) {
  let pattern = String(query || '').trim();
  let resolvedIgnoreCase = Boolean(ignoreCase);
  pattern = pattern.replace(/^(?:rg|ripgrep|grep)\s+/i, '').trim();
  let flagMatch = pattern.match(/^(-[A-Za-z]+)\s+/);
  while (flagMatch) {
    if (flagMatch[1].includes('i')) resolvedIgnoreCase = true;
    pattern = pattern.slice(flagMatch[0].length).trim();
    flagMatch = pattern.match(/^(-[A-Za-z]+)\s+/);
  }
  return { pattern, ignoreCase: resolvedIgnoreCase };
}

function buildSupportSearchRegex(pattern, ignoreCase) {
  if (!pattern) return null;
  const flags = ignoreCase ? 'i' : '';
  try {
    return new RegExp(pattern, flags);
  } catch (_error) {
    try {
      return new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
    } catch (_literalError) {
      return null;
    }
  }
}

function matchSupportLineTerms(line, includes, excludes, ignoreCase) {
  const haystack = ignoreCase ? line.toLowerCase() : line;
  for (const term of includes) {
    if (!haystack.includes(ignoreCase ? term.toLowerCase() : term)) return false;
  }
  for (const term of excludes) {
    if (haystack.includes(ignoreCase ? term.toLowerCase() : term)) return false;
  }
  return true;
}

function searchSupportArchiveSession(session, options = {}) {
  const include = (Array.isArray(options.include) ? options.include : []).filter(Boolean);
  const exclude = (Array.isArray(options.exclude) ? options.exclude : []).filter(Boolean);
  const grepEnabled = Boolean(options.grep);
  const cut = Boolean(options.cut);
  const fileFilters = Array.isArray(options.fileFilters) ? options.fileFilters : [];
  const scope = options.scope === 'current' ? 'current' : 'all';
  const currentFileId = options.currentFileId || '';
  const { maxFiles, maxLinesPerFile, maxTotalLines, maxLineLength } = ADVANCED_SEARCH_LIMITS;

  let regex = null;
  let grepError = '';
  let ignoreCase = Boolean(options.ignoreCase);
  if (grepEnabled) {
    const parsed = parseSupportSearchGrepPattern(options.query, ignoreCase);
    ignoreCase = parsed.ignoreCase;
    if (parsed.pattern) {
      regex = buildSupportSearchRegex(parsed.pattern, ignoreCase);
      if (!regex) grepError = 'Invalid grep pattern';
    }
  }

  const hasTermQuery = include.length > 0 || exclude.length > 0;
  const canSearch = grepEnabled ? Boolean(regex) : hasTermQuery;
  if (!canSearch) {
    return { success: true, files: [], totalMatches: 0, totalFiles: 0, truncated: false, grepError };
  }

  let candidates = [...session.filesById.values()].filter(entry => entry.type === 'file' && entry.textAvailable);
  if (scope === 'current') {
    candidates = candidates.filter(entry => entry.id === currentFileId);
  }
  candidates = candidates.filter(entry => supportEntryMatchesFilters(entry, fileFilters));
  candidates.sort((a, b) => String(a.path).localeCompare(String(b.path)));

  const files = [];
  let totalMatches = 0;
  let totalLines = 0;
  let truncated = false;

  for (const entry of candidates) {
    if (files.length >= maxFiles || totalLines >= maxTotalLines) {
      truncated = true;
      break;
    }
    const content = session.contentById.get(entry.id);
    if (!content || typeof content.text !== 'string') continue;

    const lines = content.text.split('\n');
    const matchedLines = [];
    let fileTruncated = false;

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
      let matched;
      if (grepEnabled) {
        regex.lastIndex = 0;
        matched = regex.test(line);
      } else {
        matched = matchSupportLineTerms(line, include, exclude, ignoreCase);
      }
      const keep = cut ? !matched : matched;
      if (!keep) continue;

      if (matchedLines.length >= maxLinesPerFile || totalLines >= maxTotalLines) {
        fileTruncated = true;
        truncated = true;
        break;
      }
      matchedLines.push({
        n: index + 1,
        text: line.length > maxLineLength ? line.slice(0, maxLineLength) : line
      });
      totalLines++;
    }

    if (matchedLines.length > 0) {
      totalMatches += matchedLines.length;
      files.push({
        id: entry.id,
        path: entry.path,
        name: entry.name,
        tags: classifySupportEntry(entry),
        matchCount: matchedLines.length,
        lines: matchedLines,
        truncated: fileTruncated
      });
    }
  }

  return { success: true, files, totalMatches, totalFiles: files.length, truncated, grepError };
}

module.exports = {
  ADVANCED_SEARCH_LIMITS,
  classifySupportEntry,
  supportEntryMatchesFilters,
  parseSupportSearchGrepPattern,
  buildSupportSearchRegex,
  matchSupportLineTerms,
  searchSupportArchiveSession
};
