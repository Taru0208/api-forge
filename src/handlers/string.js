// String case conversion & manipulation utilities

export function toCamelCase(text) {
  return text
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase())
    .replace(/^[A-Z]/, c => c.toLowerCase());
}

export function toSnakeCase(text) {
  return text
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase();
}

export function toKebabCase(text) {
  return text
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

export function toPascalCase(text) {
  return text
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase())
    .replace(/^[a-z]/, c => c.toUpperCase());
}

export function toTitleCase(text) {
  return text.replace(/\b\w/g, c => c.toUpperCase());
}

export function toConstantCase(text) {
  return toSnakeCase(text).toUpperCase();
}

export function toDotCase(text) {
  return text
    .replace(/([a-z])([A-Z])/g, '$1.$2')
    .replace(/[^a-zA-Z0-9]+/g, '.')
    .replace(/^\.|\.$/g, '')
    .toLowerCase();
}

export function reverse(text) {
  return [...text].reverse().join('');
}

export function countOccurrences(text, substring, caseSensitive = true) {
  if (!substring) return 0;
  const hay = caseSensitive ? text : text.toLowerCase();
  const needle = caseSensitive ? substring : substring.toLowerCase();
  let count = 0;
  let pos = 0;
  while ((pos = hay.indexOf(needle, pos)) !== -1) {
    count++;
    pos += needle.length;
  }
  return count;
}

export function similarity(a, b) {
  // Levenshtein distance based similarity
  if (a === b) return 1;
  if (!a.length || !b.length) return 0;

  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => {
    const row = new Array(n + 1);
    row[0] = i;
    return row;
  });
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  const distance = dp[m][n];
  return parseFloat((1 - distance / Math.max(m, n)).toFixed(4));
}

export function pad(text, length, char = ' ', side = 'right') {
  if (text.length >= length) return text;
  const padding = char.repeat(Math.ceil((length - text.length) / char.length)).slice(0, length - text.length);
  switch (side) {
    case 'left': return padding + text;
    case 'both': {
      const half = Math.floor(padding.length / 2);
      return padding.slice(0, half) + text + padding.slice(half);
    }
    default: return text + padding;
  }
}

export function wrap(text, width = 80) {
  if (text.length <= width) return text;
  const lines = [];
  let remaining = text;
  while (remaining.length > width) {
    let breakAt = remaining.lastIndexOf(' ', width);
    if (breakAt <= 0) breakAt = width;
    lines.push(remaining.slice(0, breakAt));
    remaining = remaining.slice(breakAt).trimStart();
  }
  if (remaining) lines.push(remaining);
  return lines.join('\n');
}
