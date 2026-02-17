// Hashing and encoding utilities
// Uses Web Crypto API (available in both Node 18+ and Cloudflare Workers)

export async function hashText(text, algorithm = 'SHA-256') {
  const validAlgorithms = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];
  if (!validAlgorithms.includes(algorithm)) {
    throw new Error(`Unsupported algorithm: ${algorithm}. Use: ${validAlgorithms.join(', ')}`);
  }
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  return bufferToHex(hashBuffer);
}

function bufferToHex(buffer) {
  return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export function base64Encode(text) {
  if (typeof btoa === 'function') return btoa(unescape(encodeURIComponent(text)));
  return Buffer.from(text, 'utf-8').toString('base64');
}

export function base64Decode(encoded) {
  try {
    if (typeof atob === 'function') return decodeURIComponent(escape(atob(encoded)));
    return Buffer.from(encoded, 'base64').toString('utf-8');
  } catch {
    throw new Error('Invalid base64 input');
  }
}

export function generateUUID() {
  return crypto.randomUUID();
}

export function jwtDecode(token) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT format');
  const decodeSegment = (seg) => {
    const padded = seg.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = base64Decode(padded);
    return JSON.parse(decoded);
  };
  const header = decodeSegment(parts[0]);
  const payload = decodeSegment(parts[1]);
  const isExpired = payload.exp ? payload.exp < Math.floor(Date.now() / 1000) : null;
  return { header, payload, isExpired };
}
