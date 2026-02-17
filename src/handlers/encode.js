// Extended encoding/decoding utilities

export function urlEncode(text) {
  if (typeof text !== 'string') throw new Error('text must be a string');
  return encodeURIComponent(text);
}

export function urlDecode(text) {
  if (typeof text !== 'string') throw new Error('text must be a string');
  try {
    return decodeURIComponent(text);
  } catch {
    throw new Error('Invalid URL-encoded input');
  }
}

const HTML_ENTITIES = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
};
const HTML_ENTITIES_REV = Object.fromEntries(
  Object.entries(HTML_ENTITIES).map(([k, v]) => [v, k])
);

export function htmlEncode(text) {
  if (typeof text !== 'string') throw new Error('text must be a string');
  return text.replace(/[&<>"']/g, ch => HTML_ENTITIES[ch]);
}

export function htmlDecode(text) {
  if (typeof text !== 'string') throw new Error('text must be a string');
  return text.replace(/&(?:amp|lt|gt|quot|#39|#x27|#(\d+)|#x([0-9a-fA-F]+));/g, (match, dec, hex) => {
    if (HTML_ENTITIES_REV[match]) return HTML_ENTITIES_REV[match];
    if (dec) return String.fromCharCode(parseInt(dec, 10));
    if (hex) return String.fromCharCode(parseInt(hex, 16));
    return match;
  });
}

export function rot13(text) {
  if (typeof text !== 'string') throw new Error('text must be a string');
  return text.replace(/[a-zA-Z]/g, ch => {
    const base = ch <= 'Z' ? 65 : 97;
    return String.fromCharCode(((ch.charCodeAt(0) - base + 13) % 26) + base);
  });
}

export function toBase(number, base) {
  const n = typeof number === 'string' ? parseInt(number, 10) : number;
  if (!Number.isFinite(n)) throw new Error('Invalid number');
  if (base < 2 || base > 36) throw new Error('Base must be between 2 and 36');
  const isNeg = n < 0;
  const result = Math.abs(n).toString(base);
  return isNeg ? '-' + result : result;
}

export function fromBase(text, base) {
  if (typeof text !== 'string') throw new Error('text must be a string');
  if (base < 2 || base > 36) throw new Error('Base must be between 2 and 36');
  const result = parseInt(text, base);
  if (isNaN(result)) throw new Error('Invalid number for given base');
  return result;
}

export function baseConvert(value, from, to) {
  const decimal = fromBase(value, from);
  return { result: toBase(decimal, to), decimal };
}

export function textToBinary(text) {
  if (typeof text !== 'string') throw new Error('text must be a string');
  return [...new TextEncoder().encode(text)]
    .map(b => b.toString(2).padStart(8, '0'))
    .join(' ');
}

export function binaryToText(binary) {
  if (typeof binary !== 'string') throw new Error('binary must be a string');
  const bytes = binary.trim().split(/\s+/).map(b => {
    const n = parseInt(b, 2);
    if (isNaN(n) || n < 0 || n > 255) throw new Error(`Invalid binary byte: ${b}`);
    return n;
  });
  return new TextDecoder().decode(new Uint8Array(bytes));
}

export function textToHex(text) {
  if (typeof text !== 'string') throw new Error('text must be a string');
  return [...new TextEncoder().encode(text)]
    .map(b => b.toString(16).padStart(2, '0'))
    .join(' ');
}

export function hexToText(hex) {
  if (typeof hex !== 'string') throw new Error('hex must be a string');
  const bytes = hex.trim().split(/\s+/).map(h => {
    const n = parseInt(h, 16);
    if (isNaN(n) || n < 0 || n > 255) throw new Error(`Invalid hex byte: ${h}`);
    return n;
  });
  return new TextDecoder().decode(new Uint8Array(bytes));
}

export function morseEncode(text) {
  if (typeof text !== 'string') throw new Error('text must be a string');
  const MORSE = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
    'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
    'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
    'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
    'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
    '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
    '8': '---..', '9': '----.', '.': '.-.-.-', ',': '--..--', '?': '..--..',
    '!': '-.-.--', ' ': '/'
  };
  return text.toUpperCase().split('').map(ch => MORSE[ch] || ch).join(' ');
}

export function morseDecode(morse) {
  if (typeof morse !== 'string') throw new Error('morse must be a string');
  const MORSE_REV = {
    '.-': 'A', '-...': 'B', '-.-.': 'C', '-..': 'D', '.': 'E', '..-.': 'F',
    '--.': 'G', '....': 'H', '..': 'I', '.---': 'J', '-.-': 'K', '.-..': 'L',
    '--': 'M', '-.': 'N', '---': 'O', '.--.': 'P', '--.-': 'Q', '.-.': 'R',
    '...': 'S', '-': 'T', '..-': 'U', '...-': 'V', '.--': 'W', '-..-': 'X',
    '-.--': 'Y', '--..': 'Z', '-----': '0', '.----': '1', '..---': '2',
    '...--': '3', '....-': '4', '.....': '5', '-....': '6', '--...': '7',
    '---..': '8', '----.': '9', '.-.-.-': '.', '--..--': ',', '..--..': '?',
    '-.-.--': '!', '/': ' '
  };
  return morse.trim().split(' ').map(code => MORSE_REV[code] || code).join('');
}
