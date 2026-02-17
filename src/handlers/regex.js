// Regex utility functions

/**
 * Test if a string matches a regex pattern.
 * @param {string} text — input text
 * @param {string} pattern — regex pattern
 * @param {string} [flags] — regex flags (default: '')
 */
export function regexTest(text, pattern, flags) {
  if (text === undefined) throw new Error('"text" is required');
  if (!pattern) throw new Error('"pattern" is required');
  validatePattern(pattern, flags);
  const re = new RegExp(pattern, flags || '');
  return { matches: re.test(text), pattern, flags: flags || '' };
}

/**
 * Extract all matches from text using a regex pattern.
 * @param {string} text — input text
 * @param {string} pattern — regex pattern
 * @param {string} [flags] — regex flags (default: 'g')
 */
export function regexExtract(text, pattern, flags) {
  if (text === undefined) throw new Error('"text" is required');
  if (!pattern) throw new Error('"pattern" is required');
  const f = flags || 'g';
  validatePattern(pattern, f);
  const re = new RegExp(pattern, f);
  const results = [];
  let match;

  if (f.includes('g')) {
    while ((match = re.exec(text)) !== null) {
      results.push({
        match: match[0],
        index: match.index,
        groups: match.slice(1),
      });
      if (results.length >= 1000) break; // safety limit
    }
  } else {
    match = re.exec(text);
    if (match) {
      results.push({
        match: match[0],
        index: match.index,
        groups: match.slice(1),
      });
    }
  }

  return { count: results.length, matches: results };
}

/**
 * Replace matches in text using a regex pattern.
 * @param {string} text — input text
 * @param {string} pattern — regex pattern
 * @param {string} replacement — replacement string (supports $1, $2, etc.)
 * @param {string} [flags] — regex flags (default: 'g')
 */
export function regexReplace(text, pattern, replacement, flags) {
  if (text === undefined) throw new Error('"text" is required');
  if (!pattern) throw new Error('"pattern" is required');
  if (replacement === undefined) throw new Error('"replacement" is required');
  const f = flags || 'g';
  validatePattern(pattern, f);
  const re = new RegExp(pattern, f);
  const result = text.replace(re, replacement);
  return { result, replacements: (text.match(re) || []).length };
}

/**
 * Split text by a regex pattern.
 * @param {string} text — input text
 * @param {string} pattern — regex pattern for the delimiter
 * @param {number} [limit] — max number of splits
 */
export function regexSplit(text, pattern, limit) {
  if (text === undefined) throw new Error('"text" is required');
  if (!pattern) throw new Error('"pattern" is required');
  validatePattern(pattern);
  const re = new RegExp(pattern);
  const parts = limit ? text.split(re, limit) : text.split(re);
  return { count: parts.length, parts };
}

/**
 * Validate a regex pattern (check for errors without executing).
 */
function validatePattern(pattern, flags) {
  try {
    new RegExp(pattern, flags || '');
  } catch (e) {
    throw new Error(`Invalid regex: ${e.message}`);
  }
}

/**
 * Escape special regex characters in a string.
 * @param {string} text — string to escape
 */
export function regexEscape(text) {
  if (text === undefined) throw new Error('"text" is required');
  return { escaped: text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') };
}
