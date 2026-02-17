// Data transformation utilities

export function jsonToCSV(data, opts = {}) {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Input must be a non-empty array of objects');
  }
  const delimiter = opts.delimiter || ',';
  const includeHeader = opts.header !== false;

  const headers = [...new Set(data.flatMap(obj => Object.keys(obj)))];
  const rows = [];

  if (includeHeader) rows.push(headers.map(h => escapeCSV(h, delimiter)).join(delimiter));

  for (const obj of data) {
    const row = headers.map(h => {
      const val = obj[h];
      if (val === null || val === undefined) return '';
      return escapeCSV(String(val), delimiter);
    });
    rows.push(row.join(delimiter));
  }

  return rows.join('\n');
}

function escapeCSV(val, delimiter) {
  if (val.includes(delimiter) || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

export function csvToJSON(csv, opts = {}) {
  const delimiter = opts.delimiter || ',';
  const lines = csv.trim().split('\n');
  if (lines.length < 2) throw new Error('CSV must have at least a header and one data row');

  const headers = parseCSVLine(lines[0], delimiter);
  const result = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseCSVLine(lines[i], delimiter);
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = values[idx] || ''; });
    result.push(obj);
  }
  return result;
}

function parseCSVLine(line, delimiter) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else current += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === delimiter) { result.push(current); current = ''; }
      else current += ch;
    }
  }
  result.push(current);
  return result;
}

export function flattenJSON(obj, prefix = '', separator = '.') {
  const result = {};
  for (const [key, val] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}${separator}${key}` : key;
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      Object.assign(result, flattenJSON(val, newKey, separator));
    } else {
      result[newKey] = val;
    }
  }
  return result;
}

export function unflattenJSON(obj, separator = '.') {
  const result = {};
  for (const [key, val] of Object.entries(obj)) {
    const parts = key.split(separator);
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!(parts[i] in current)) current[parts[i]] = {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = val;
  }
  return result;
}

export function markdownToHTML(md) {
  let html = md;
  // Headers
  html = html.replace(/^#{6}\s+(.+)$/gm, '<h6>$1</h6>');
  html = html.replace(/^#{5}\s+(.+)$/gm, '<h5>$1</h5>');
  html = html.replace(/^#{4}\s+(.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^#{3}\s+(.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^#{2}\s+(.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#{1}\s+(.+)$/gm, '<h1>$1</h1>');
  // Bold/italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Code
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="$1">$2</code></pre>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Links/images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  // Lists
  html = html.replace(/^\s*[-*]\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
  // Horizontal rule
  html = html.replace(/^---+$/gm, '<hr>');
  // Blockquote
  html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');
  // Paragraphs (lines not already wrapped)
  html = html.replace(/^(?!<[a-z])((?!^\s*$).+)$/gm, '<p>$1</p>');
  return html.trim();
}
