// Data generation utilities

export function randomString(length = 16, charset = 'alphanumeric') {
  const charsets = {
    alpha: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
    numeric: '0123456789',
    alphanumeric: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    hex: '0123456789abcdef',
    base64: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
  };
  const chars = charsets[charset] || charsets.alphanumeric;
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function randomNumber(min = 0, max = 100, decimals = 0) {
  const num = Math.random() * (max - min) + min;
  return decimals > 0 ? parseFloat(num.toFixed(decimals)) : Math.floor(num);
}

export function randomColor(format = 'hex') {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  switch (format) {
    case 'rgb': return { r, g, b, string: `rgb(${r}, ${g}, ${b})` };
    case 'hsl': {
      const rr = r / 255, gg = g / 255, bb = b / 255;
      const mx = Math.max(rr, gg, bb), mn = Math.min(rr, gg, bb);
      const l = (mx + mn) / 2;
      let h = 0, s = 0;
      if (mx !== mn) {
        const d = mx - mn;
        s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
        if (mx === rr) h = ((gg - bb) / d + (gg < bb ? 6 : 0)) / 6;
        else if (mx === gg) h = ((bb - rr) / d + 2) / 6;
        else h = ((rr - gg) / d + 4) / 6;
      }
      return {
        h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100),
        string: `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`
      };
    }
    default: return { hex: `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}` };
  }
}

const LOREM_WORDS = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum'.split(' ');

export function loremIpsum(count = 1, unit = 'paragraphs') {
  function sentence() {
    const len = 8 + Math.floor(Math.random() * 12);
    const words = [];
    for (let i = 0; i < len; i++) {
      words.push(LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)]);
    }
    words[0] = words[0][0].toUpperCase() + words[0].slice(1);
    return words.join(' ') + '.';
  }
  function paragraph() {
    const sentences = 3 + Math.floor(Math.random() * 5);
    return Array.from({ length: sentences }, sentence).join(' ');
  }
  switch (unit) {
    case 'words': {
      const words = [];
      for (let i = 0; i < count; i++) {
        words.push(LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)]);
      }
      return words.join(' ');
    }
    case 'sentences': return Array.from({ length: count }, sentence).join(' ');
    default: return Array.from({ length: count }, paragraph).join('\n\n');
  }
}

export function randomPassword(length = 16, options = {}) {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const symbols = '!@#$%^&*()-_=+[]{}|;:,.<>?';

  let chars = '';
  const required = [];

  if (options.uppercase !== false) { chars += upper; required.push(upper); }
  if (options.lowercase !== false) { chars += lower; required.push(lower); }
  if (options.digits !== false) { chars += digits; required.push(digits); }
  if (options.symbols !== false) { chars += symbols; required.push(symbols); }

  if (!chars) chars = lower + digits;

  let result = '';
  // Ensure at least one from each required set
  for (const set of required) {
    result += set[Math.floor(Math.random() * set.length)];
  }
  // Fill remaining
  for (let i = result.length; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  // Shuffle
  return result.split('').sort(() => Math.random() - 0.5).join('');
}

export function randomIPv4() {
  return `${randomNumber(1, 254)}.${randomNumber(0, 255)}.${randomNumber(0, 255)}.${randomNumber(1, 254)}`;
}

export function randomIPv6() {
  const segments = [];
  for (let i = 0; i < 8; i++) {
    segments.push(Math.floor(Math.random() * 65536).toString(16).padStart(4, '0'));
  }
  return segments.join(':');
}

export function randomUserAgent() {
  const browsers = [
    { name: 'Chrome', versions: ['120.0.6099.130', '121.0.6167.85', '122.0.6261.94'] },
    { name: 'Firefox', versions: ['121.0', '122.0', '123.0'] },
    { name: 'Safari', versions: ['17.2.1', '17.3', '17.4'] },
    { name: 'Edge', versions: ['120.0.2210.91', '121.0.2277.83', '122.0.2365.52'] },
  ];
  const os = [
    'Windows NT 10.0; Win64; x64',
    'Macintosh; Intel Mac OS X 10_15_7',
    'X11; Linux x86_64',
    'X11; Ubuntu; Linux x86_64',
  ];
  const browser = browsers[Math.floor(Math.random() * browsers.length)];
  const version = browser.versions[Math.floor(Math.random() * browser.versions.length)];
  const platform = os[Math.floor(Math.random() * os.length)];

  switch (browser.name) {
    case 'Chrome': return `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version} Safari/537.36`;
    case 'Firefox': return `Mozilla/5.0 (${platform}; rv:${version}) Gecko/20100101 Firefox/${version}`;
    case 'Safari': return `Mozilla/5.0 (${platform}) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${version} Safari/605.1.15`;
    case 'Edge': return `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version} Safari/537.36 Edg/${version}`;
    default: return `Mozilla/5.0 (${platform})`;
  }
}
