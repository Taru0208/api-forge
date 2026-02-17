// JWT (JSON Web Token) encode, decode, verify utilities
// Implements HS256, HS384, HS512 signing algorithms

function base64UrlEncode(str) {
  const bytes = typeof str === 'string' ? new TextEncoder().encode(str) : str;
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function base64UrlDecodeToString(str) {
  return new TextDecoder().decode(base64UrlDecode(str));
}

async function hmacSign(algorithm, key, data) {
  const algMap = { HS256: 'SHA-256', HS384: 'SHA-384', HS512: 'SHA-512' };
  const hashName = algMap[algorithm];
  if (!hashName) throw new Error(`Unsupported algorithm: ${algorithm}`);

  const keyData = new TextEncoder().encode(key);
  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: hashName }, false, ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data));
  return base64UrlEncode(new Uint8Array(signature));
}

async function hmacVerify(algorithm, key, data, signature) {
  const expected = await hmacSign(algorithm, key, data);
  // Constant-time comparison
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Encode a JWT token.
 * @param {object} payload - JWT payload claims
 * @param {string} secret - Signing secret
 * @param {object} options - { algorithm: 'HS256'|'HS384'|'HS512', expiresIn?: number (seconds) }
 * @returns {string} JWT token
 */
export async function jwtEncode(payload, secret, options = {}) {
  if (!payload || typeof payload !== 'object') throw new Error('Payload must be an object');
  if (!secret || typeof secret !== 'string') throw new Error('Secret is required');

  const algorithm = options.algorithm || 'HS256';
  if (!['HS256', 'HS384', 'HS512'].includes(algorithm)) {
    throw new Error('Algorithm must be HS256, HS384, or HS512');
  }

  const header = { alg: algorithm, typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);

  const claims = { ...payload };
  if (!claims.iat) claims.iat = now;
  if (options.expiresIn && !claims.exp) {
    claims.exp = now + options.expiresIn;
  }

  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(JSON.stringify(claims));
  const signingInput = `${headerEncoded}.${payloadEncoded}`;
  const signature = await hmacSign(algorithm, secret, signingInput);

  return `${signingInput}.${signature}`;
}

/**
 * Decode a JWT token WITHOUT verifying the signature.
 * @param {string} token - JWT token string
 * @returns {{ header, payload, signature }} Decoded parts
 */
export function jwtDecode(token) {
  if (!token || typeof token !== 'string') throw new Error('Token is required');

  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT format: expected 3 parts separated by dots');

  try {
    const header = JSON.parse(base64UrlDecodeToString(parts[0]));
    const payload = JSON.parse(base64UrlDecodeToString(parts[1]));
    return { header, payload, signature: parts[2] };
  } catch (e) {
    throw new Error(`Failed to decode JWT: ${e.message}`);
  }
}

/**
 * Verify a JWT token's signature and optionally check expiration.
 * @param {string} token - JWT token string
 * @param {string} secret - Signing secret
 * @param {object} options - { algorithms?: string[], clockTolerance?: number }
 * @returns {{ valid, header, payload, expired?, error? }}
 */
export async function jwtVerify(token, secret, options = {}) {
  if (!token || typeof token !== 'string') return { valid: false, error: 'Token is required' };
  if (!secret || typeof secret !== 'string') return { valid: false, error: 'Secret is required' };

  const parts = token.split('.');
  if (parts.length !== 3) return { valid: false, error: 'Invalid JWT format' };

  let header, payload;
  try {
    header = JSON.parse(base64UrlDecodeToString(parts[0]));
    payload = JSON.parse(base64UrlDecodeToString(parts[1]));
  } catch (e) {
    return { valid: false, error: `Failed to decode: ${e.message}` };
  }

  const allowedAlgorithms = options.algorithms || ['HS256', 'HS384', 'HS512'];
  if (!allowedAlgorithms.includes(header.alg)) {
    return { valid: false, error: `Algorithm ${header.alg} not allowed`, header, payload };
  }

  const signingInput = `${parts[0]}.${parts[1]}`;
  const signatureValid = await hmacVerify(header.alg, secret, signingInput, parts[2]);
  if (!signatureValid) {
    return { valid: false, error: 'Invalid signature', header, payload };
  }

  const now = Math.floor(Date.now() / 1000);
  const tolerance = options.clockTolerance || 0;

  if (payload.exp && now > payload.exp + tolerance) {
    return { valid: false, expired: true, error: 'Token expired', header, payload };
  }

  if (payload.nbf && now < payload.nbf - tolerance) {
    return { valid: false, error: 'Token not yet valid (nbf)', header, payload };
  }

  return { valid: true, header, payload };
}
