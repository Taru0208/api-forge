// YAML utility functions — zero-dependency parser/serializer

/**
 * Parse a YAML string into a JavaScript object.
 * Supports: key-value pairs, nested objects, arrays, quoted strings,
 * block scalars (| and >), comments, inline objects/arrays.
 * Does NOT support: anchors/aliases, tags, multi-document, complex keys.
 */
export function yamlToJSON(yamlString) {
  if (yamlString === null || yamlString === undefined) return null;
  const str = String(yamlString);
  if (str.trim() === '') return null;

  const lines = str.split('\n');
  const result = parseBlock(lines, 0, -1);
  return result.value;
}

/**
 * Serialize a JavaScript object to a YAML string.
 * @param {*} obj - The value to serialize
 * @param {object} options - { indent: number (default 2) }
 */
export function jsonToYAML(obj, options = {}) {
  const indent = options.indent ?? 2;
  if (obj === null || obj === undefined) return 'null\n';
  if (typeof obj === 'string') return serializeScalar(obj) + '\n';
  if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj) + '\n';
  return serializeValue(obj, 0, indent);
}

/**
 * Validate a YAML string.
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateYAML(yamlString) {
  try {
    yamlToJSON(yamlString);
    return { valid: true };
  } catch (e) {
    return { valid: false, error: e.message };
  }
}

// ---------------------------------------------------------------------------
// Parser internals
// ---------------------------------------------------------------------------

function parseBlock(lines, startIdx, parentIndent) {
  let i = startIdx;
  let result = undefined;
  let isArray = false;
  let isObject = false;

  while (i < lines.length) {
    const raw = lines[i];
    const stripped = stripComment(raw);

    // Skip blank lines and comment-only lines
    if (stripped.trim() === '') { i++; continue; }

    const lineIndent = getIndent(stripped);

    // If we've dedented past our parent, stop
    if (lineIndent <= parentIndent && i > startIdx) break;

    // First content line establishes our block indent
    if (result === undefined) {
      const trimmed = stripped.trim();

      // Check if first line is an array item
      if (trimmed.startsWith('- ') || trimmed === '-') {
        isArray = true;
        result = [];
      } else {
        isObject = true;
        result = {};
      }
    }

    const trimmed = stripped.trim();

    if (isArray) {
      if (!trimmed.startsWith('- ') && trimmed !== '-') {
        // Non-array line at same indent — could be continuation or error
        break;
      }
      const itemContent = trimmed === '-' ? '' : trimmed.slice(2);
      const itemIndent = lineIndent;

      // Check if item value is a nested structure
      if (itemContent === '' || itemContent === '') {
        // Empty dash — look for nested block
        const nested = parseBlock(lines, i + 1, itemIndent);
        if (nested.value !== undefined) {
          result.push(nested.value);
          i = nested.nextIdx;
        } else {
          result.push(null);
          i++;
        }
      } else if (itemContent.includes(': ') || itemContent.endsWith(':')) {
        // Inline mapping on array item line: - key: value
        // Reconstruct as if it were indented lines
        const subLines = [' '.repeat(itemIndent + 2) + itemContent];
        // Collect continuation lines
        let j = i + 1;
        while (j < lines.length) {
          const nextStripped = stripComment(lines[j]);
          if (nextStripped.trim() === '') { j++; continue; }
          const nextIndent = getIndent(nextStripped);
          if (nextIndent > itemIndent + 1) {
            subLines.push(nextStripped);
            j++;
          } else {
            break;
          }
        }
        // Parse as a sub-block with combined lines
        const combined = [...subLines];
        const nested = parseBlock(combined, 0, itemIndent + 1);
        result.push(nested.value);
        i = i + 1;
        // Advance past continuation lines
        while (i < lines.length) {
          const ns = stripComment(lines[i]);
          if (ns.trim() === '') { i++; continue; }
          const ni = getIndent(ns);
          if (ni > itemIndent + 1) { i++; } else { break; }
        }
      } else {
        // Simple scalar value
        result.push(parseScalar(itemContent));
        i++;
      }
    } else if (isObject) {
      const colonIdx = findKeyColon(trimmed);
      if (colonIdx === -1) {
        // Not a valid key: value line
        break;
      }

      const key = parseKeyString(trimmed.slice(0, colonIdx));
      const afterColon = trimmed.slice(colonIdx + 1).trim();

      if (afterColon === '' || afterColon === '') {
        // Value is on subsequent indented lines — could be block scalar or nested
        const nextContentIdx = findNextContent(lines, i + 1);
        if (nextContentIdx < lines.length) {
          const nextLine = stripComment(lines[nextContentIdx]).trim();
          const nextIndent = getIndent(stripComment(lines[nextContentIdx]));

          if (nextIndent > lineIndent) {
            if (nextLine === '|' || nextLine === '>') {
              // Shouldn't happen — block scalars are on same line as colon
              result[key] = null;
              i++;
            } else {
              const nested = parseBlock(lines, nextContentIdx, lineIndent);
              result[key] = nested.value;
              i = nested.nextIdx;
            }
          } else {
            result[key] = null;
            i++;
          }
        } else {
          result[key] = null;
          i++;
        }
      } else if (afterColon === '|' || afterColon === '|+' || afterColon === '|-') {
        // Literal block scalar
        const block = parseBlockScalar(lines, i + 1, lineIndent, 'literal', afterColon);
        result[key] = block.value;
        i = block.nextIdx;
      } else if (afterColon === '>' || afterColon === '>+' || afterColon === '>-') {
        // Folded block scalar
        const block = parseBlockScalar(lines, i + 1, lineIndent, 'folded', afterColon);
        result[key] = block.value;
        i = block.nextIdx;
      } else if (afterColon.startsWith('{')) {
        // Inline object
        result[key] = parseInlineValue(afterColon);
        i++;
      } else if (afterColon.startsWith('[')) {
        // Inline array
        result[key] = parseInlineValue(afterColon);
        i++;
      } else {
        // Simple scalar
        result[key] = parseScalar(afterColon);
        i++;
      }
    }
  }

  if (result === undefined) result = null;
  return { value: result, nextIdx: i };
}

function findNextContent(lines, startIdx) {
  let i = startIdx;
  while (i < lines.length) {
    const stripped = stripComment(lines[i]);
    if (stripped.trim() !== '') return i;
    i++;
  }
  return i;
}

function parseBlockScalar(lines, startIdx, parentIndent, mode, indicator) {
  let i = startIdx;
  const contentLines = [];
  let blockIndent = -1;

  while (i < lines.length) {
    const raw = lines[i];
    // For block scalars, don't strip comments — content is literal
    if (raw.trim() === '') {
      contentLines.push('');
      i++;
      continue;
    }

    const lineIndent = getIndent(raw);
    if (lineIndent <= parentIndent) break;

    if (blockIndent === -1) blockIndent = lineIndent;
    contentLines.push(raw.slice(blockIndent));
    i++;
  }

  // Trim trailing empty lines for default/strip, keep for keep(+)
  let text;
  if (mode === 'literal') {
    text = contentLines.join('\n');
  } else {
    // Folded: replace single newlines with spaces, keep double newlines as single
    const parts = [];
    let current = [];
    for (const line of contentLines) {
      if (line === '') {
        if (current.length > 0) {
          parts.push(current.join(' '));
          current = [];
        }
        parts.push('');
      } else {
        current.push(line);
      }
    }
    if (current.length > 0) parts.push(current.join(' '));
    text = parts.join('\n');
  }

  // Handle chomping
  if (indicator.endsWith('+')) {
    // Keep: preserve trailing newlines
    text = text + '\n';
  } else if (indicator.endsWith('-')) {
    // Strip: remove all trailing newlines
    text = text.replace(/\n+$/, '');
  } else {
    // Default (clip): single trailing newline
    text = text.replace(/\n+$/, '') + '\n';
  }

  return { value: text, nextIdx: i };
}

function stripComment(line) {
  // Remove comments, but not inside quoted strings
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === "'" && !inDouble) inSingle = !inSingle;
    else if (ch === '"' && !inSingle) inDouble = !inDouble;
    else if (ch === '#' && !inSingle && !inDouble) {
      // Must be preceded by whitespace or at start
      if (i === 0 || line[i - 1] === ' ' || line[i - 1] === '\t') {
        return line.slice(0, i);
      }
    }
  }
  return line;
}

function getIndent(line) {
  let count = 0;
  for (const ch of line) {
    if (ch === ' ') count++;
    else if (ch === '\t') count += 2;
    else break;
  }
  return count;
}

function findKeyColon(trimmed) {
  // Find the colon that separates key from value
  // Handle quoted keys
  if (trimmed.startsWith('"')) {
    const endQuote = trimmed.indexOf('"', 1);
    if (endQuote === -1) return -1;
    const colonIdx = trimmed.indexOf(':', endQuote);
    return colonIdx;
  }
  if (trimmed.startsWith("'")) {
    const endQuote = trimmed.indexOf("'", 1);
    if (endQuote === -1) return -1;
    const colonIdx = trimmed.indexOf(':', endQuote);
    return colonIdx;
  }

  // Unquoted key — find first colon followed by space or end-of-string
  for (let i = 0; i < trimmed.length; i++) {
    if (trimmed[i] === ':') {
      if (i === trimmed.length - 1 || trimmed[i + 1] === ' ') {
        return i;
      }
    }
  }
  return -1;
}

function parseKeyString(raw) {
  const s = raw.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

function parseScalar(s) {
  const trimmed = s.trim();
  if (trimmed === '') return null;

  // Quoted strings
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }

  // Inline collections
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return parseInlineValue(trimmed);
  }

  // Null
  if (trimmed === 'null' || trimmed === '~' || trimmed === 'Null' || trimmed === 'NULL') return null;

  // Booleans
  if (trimmed === 'true' || trimmed === 'True' || trimmed === 'TRUE' || trimmed === 'yes' || trimmed === 'Yes' || trimmed === 'YES') return true;
  if (trimmed === 'false' || trimmed === 'False' || trimmed === 'FALSE' || trimmed === 'no' || trimmed === 'No' || trimmed === 'NO') return false;

  // Numbers
  if (/^-?\d+$/.test(trimmed)) return parseInt(trimmed, 10);
  if (/^-?\d+\.\d+$/.test(trimmed)) return parseFloat(trimmed);
  if (/^-?\d+(\.\d+)?[eE][+-]?\d+$/.test(trimmed)) return parseFloat(trimmed);
  if (trimmed === '.inf' || trimmed === '.Inf' || trimmed === '.INF') return Infinity;
  if (trimmed === '-.inf' || trimmed === '-.Inf' || trimmed === '-.INF') return -Infinity;
  if (trimmed === '.nan' || trimmed === '.NaN' || trimmed === '.NAN') return NaN;

  return trimmed;
}

function parseInlineValue(s) {
  const trimmed = s.trim();
  if (trimmed.startsWith('{')) return parseInlineObject(trimmed);
  if (trimmed.startsWith('[')) return parseInlineArray(trimmed);
  return parseScalar(trimmed);
}

function parseInlineObject(s) {
  if (!s.endsWith('}')) throw new Error('Unterminated inline object — missing closing }');
  const inner = s.slice(1, -1).trim();
  if (inner === '') return {};
  const result = {};
  const pairs = splitInline(inner);
  for (const pair of pairs) {
    const colonIdx = pair.indexOf(':');
    if (colonIdx === -1) throw new Error(`Invalid inline object pair: ${pair}`);
    const key = parseKeyString(pair.slice(0, colonIdx));
    const val = pair.slice(colonIdx + 1).trim();
    result[key] = parseInlineValue(val);
  }
  return result;
}

function parseInlineArray(s) {
  if (!s.endsWith(']')) throw new Error('Unterminated inline array — missing closing ]');
  const inner = s.slice(1, -1).trim();
  if (inner === '') return [];
  const items = splitInline(inner);
  return items.map(item => parseInlineValue(item.trim()));
}

function splitInline(s) {
  const parts = [];
  let depth = 0;
  let current = '';
  let inSingle = false;
  let inDouble = false;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === "'" && !inDouble) { inSingle = !inSingle; current += ch; }
    else if (ch === '"' && !inSingle) { inDouble = !inDouble; current += ch; }
    else if (!inSingle && !inDouble) {
      if (ch === '{' || ch === '[') { depth++; current += ch; }
      else if (ch === '}' || ch === ']') { depth--; current += ch; }
      else if (ch === ',' && depth === 0) {
        parts.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

// ---------------------------------------------------------------------------
// Serializer internals
// ---------------------------------------------------------------------------

function serializeValue(obj, depth, indentSize) {
  if (obj === null || obj === undefined) return 'null\n';
  if (typeof obj === 'boolean') return String(obj) + '\n';
  if (typeof obj === 'number') {
    if (obj !== obj) return '.nan\n'; // NaN
    if (obj === Infinity) return '.inf\n';
    if (obj === -Infinity) return '-.inf\n';
    return String(obj) + '\n';
  }
  if (typeof obj === 'string') return serializeScalar(obj) + '\n';

  const pad = ' '.repeat(depth * indentSize);
  const childPad = ' '.repeat((depth + 1) * indentSize);
  let out = '';

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]\n';
    for (const item of obj) {
      if (item !== null && typeof item === 'object') {
        if (Array.isArray(item)) {
          out += pad + '-\n' + serializeValue(item, depth + 1, indentSize).split('\n').map(l => l ? childPad + l : '').join('\n').trimEnd() + '\n';
        } else {
          // Object item — inline first key on dash line
          const keys = Object.keys(item);
          if (keys.length === 0) {
            out += pad + '- {}\n';
          } else {
            const firstKey = keys[0];
            const firstValStr = serializeSingleValue(item[firstKey], depth + 1, indentSize);
            out += pad + '- ' + serializeKey(firstKey) + ': ' + firstValStr;
            for (let k = 1; k < keys.length; k++) {
              const valStr = serializeSingleValue(item[keys[k]], depth + 1, indentSize);
              out += pad + '  ' + serializeKey(keys[k]) + ': ' + valStr;
            }
          }
        }
      } else {
        out += pad + '- ' + serializeSingleValue(item, depth + 1, indentSize);
      }
    }
    return out;
  }

  // Plain object
  const keys = Object.keys(obj);
  if (keys.length === 0) return '{}\n';

  for (const key of keys) {
    const val = obj[key];
    if (val !== null && typeof val === 'object') {
      if (Array.isArray(val)) {
        if (val.length === 0) {
          out += pad + serializeKey(key) + ': []\n';
        } else {
          out += pad + serializeKey(key) + ':\n';
          out += serializeValue(val, depth + 1, indentSize);
        }
      } else {
        if (Object.keys(val).length === 0) {
          out += pad + serializeKey(key) + ': {}\n';
        } else {
          out += pad + serializeKey(key) + ':\n';
          out += serializeValue(val, depth + 1, indentSize);
        }
      }
    } else {
      out += pad + serializeKey(key) + ': ' + serializeSingleValue(val, depth + 1, indentSize);
    }
  }
  return out;
}

function serializeSingleValue(val, depth, indentSize) {
  if (val === null || val === undefined) return 'null\n';
  if (typeof val === 'boolean') return String(val) + '\n';
  if (typeof val === 'number') {
    if (val !== val) return '.nan\n';
    if (val === Infinity) return '.inf\n';
    if (val === -Infinity) return '-.inf\n';
    return String(val) + '\n';
  }
  if (typeof val === 'string') return serializeScalar(val) + '\n';
  // Complex values — put on next line
  return '\n' + serializeValue(val, depth, indentSize);
}

function serializeScalar(s) {
  if (s === '') return "''";
  // Check if value might be misinterpreted
  const needsQuote =
    s === 'true' || s === 'false' || s === 'True' || s === 'False' ||
    s === 'TRUE' || s === 'FALSE' ||
    s === 'yes' || s === 'no' || s === 'Yes' || s === 'No' ||
    s === 'YES' || s === 'NO' ||
    s === 'null' || s === 'Null' || s === 'NULL' || s === '~' ||
    s === '.inf' || s === '-.inf' || s === '.nan' ||
    /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(s) ||
    s.includes(': ') || s.includes(' #') ||
    s.startsWith('{') || s.startsWith('[') ||
    s.startsWith('- ') || s.startsWith('? ') ||
    s.includes('\n');

  if (!needsQuote) return s;

  // Use double quotes with escape sequences
  if (s.includes('\n') || s.includes('"') || s.includes('\\')) {
    return '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"';
  }
  return '"' + s + '"';
}

function serializeKey(key) {
  if (key === '') return "''";
  // Keys with special chars need quoting
  if (/[:{}\[\],&*?|>!%@`#'"]/.test(key) || key.includes(' ') || /^-?\d/.test(key) ||
      key === 'true' || key === 'false' || key === 'null' || key === 'yes' || key === 'no') {
    if (key.includes('"')) return "'" + key + "'";
    return '"' + key + '"';
  }
  return key;
}
