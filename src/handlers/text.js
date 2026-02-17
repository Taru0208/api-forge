// Text processing utilities

export function slugify(text, opts = {}) {
  const separator = opts.separator || '-';
  const lower = opts.lowercase !== false;
  let slug = text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, separator)
    .replace(new RegExp(`[${separator}]+`, 'g'), separator);
  if (lower) slug = slug.toLowerCase();
  return slug;
}

export function wordCount(text) {
  if (!text || !text.trim()) return { characters: 0, words: 0, sentences: 0, paragraphs: 0, readingTimeSeconds: 0 };
  const chars = text.length;
  const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
  const readingTimeSeconds = Math.ceil((words / 238) * 60); // 238 wpm average
  return { characters: chars, words, sentences, paragraphs, readingTimeSeconds };
}

export function extractEmails(text) {
  const pattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(pattern) || [];
  return [...new Set(matches)];
}

export function extractUrls(text) {
  const pattern = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
  const matches = text.match(pattern) || [];
  return [...new Set(matches)];
}

export function truncate(text, maxLength, opts = {}) {
  const suffix = opts.suffix !== undefined ? opts.suffix : '...';
  const wordBoundary = opts.wordBoundary !== false;
  if (text.length <= maxLength) return text;
  let truncated = text.slice(0, maxLength - suffix.length);
  if (wordBoundary) {
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.5) truncated = truncated.slice(0, lastSpace);
  }
  return truncated + suffix;
}

export function removeHtmlTags(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function textDiff(oldText, newText) {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const changes = [];

  // Simple LCS-based diff
  const m = oldLines.length;
  const n = newLines.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = oldLines[i - 1] === newLines[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  let i = m, j = n;
  const ops = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      ops.push({ type: 'equal', value: oldLines[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.push({ type: 'added', value: newLines[j - 1], line: j });
      j--;
    } else {
      ops.push({ type: 'removed', value: oldLines[i - 1], line: i });
      i--;
    }
  }
  ops.reverse();

  let added = 0, removed = 0, unchanged = 0;
  for (const op of ops) {
    if (op.type === 'added') { added++; changes.push(op); }
    else if (op.type === 'removed') { removed++; changes.push(op); }
    else unchanged++;
  }

  return { changes, stats: { added, removed, unchanged, total: m + added } };
}
