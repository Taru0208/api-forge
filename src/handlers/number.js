// Number formatting and conversion utilities

export function toOrdinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function toRoman(n) {
  if (n < 1 || n > 3999) throw new Error('Number must be between 1 and 3999');
  const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const syms = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
  let result = '';
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]) {
      result += syms[i];
      n -= vals[i];
    }
  }
  return result;
}

export function fromRoman(s) {
  const map = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  s = s.toUpperCase();
  let total = 0;
  for (let i = 0; i < s.length; i++) {
    const curr = map[s[i]];
    if (!curr) throw new Error(`Invalid Roman numeral character: ${s[i]}`);
    const next = map[s[i + 1]] || 0;
    total += curr < next ? -curr : curr;
  }
  return total;
}

const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const scales = ['', 'thousand', 'million', 'billion', 'trillion'];

export function toWords(n) {
  if (n === 0) return 'zero';
  if (n < 0) return 'negative ' + toWords(-n);
  n = Math.floor(n);
  if (n > 999999999999999) throw new Error('Number too large (max: 999 trillion)');

  const chunks = [];
  while (n > 0) {
    chunks.push(n % 1000);
    n = Math.floor(n / 1000);
  }

  const parts = [];
  for (let i = chunks.length - 1; i >= 0; i--) {
    if (chunks[i] === 0) continue;
    parts.push(chunkToWords(chunks[i]) + (scales[i] ? ' ' + scales[i] : ''));
  }
  return parts.join(' ');
}

function chunkToWords(n) {
  if (n === 0) return '';
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? '-' + ones[n % 10] : '');
  return ones[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' ' + chunkToWords(n % 100) : '');
}

export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  const idx = Math.min(i, sizes.length - 1);
  return parseFloat((bytes / Math.pow(k, idx)).toFixed(decimals)) + ' ' + sizes[idx];
}

export function formatNumber(n, options = {}) {
  const { locale = 'en-US', style = 'decimal', currency, minimumFractionDigits, maximumFractionDigits } = options;
  const opts = { style };
  if (style === 'currency' && currency) opts.currency = currency;
  if (minimumFractionDigits !== undefined) opts.minimumFractionDigits = minimumFractionDigits;
  if (maximumFractionDigits !== undefined) opts.maximumFractionDigits = maximumFractionDigits;
  return new Intl.NumberFormat(locale, opts).format(n);
}

export function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max);
}

export function percentage(value, total) {
  if (total === 0) throw new Error('Total cannot be zero');
  return parseFloat(((value / total) * 100).toFixed(4));
}
