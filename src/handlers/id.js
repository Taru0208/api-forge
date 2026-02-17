// ID generation utilities — additional formats beyond UUID v4
// Zero dependencies, uses Web Crypto API (Cloudflare Workers + Node 18+ compatible)

const CROCKFORD_BASE32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const BASE62 = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const DEFAULT_NANOID_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';

function getRandomBytes(n) {
  const buf = new Uint8Array(n);
  crypto.getRandomValues(buf);
  return buf;
}

/**
 * Generate a nanoid-style ID.
 * @param {number} size - Length of the ID (default 21)
 * @param {string} alphabet - Characters to use
 * @returns {string}
 */
export function nanoid(size = 21, alphabet = DEFAULT_NANOID_ALPHABET) {
  if (size < 1 || size > 256) throw new Error('Size must be between 1 and 256');
  if (alphabet.length < 2) throw new Error('Alphabet must have at least 2 characters');

  const mask = (2 << (31 - Math.clz32((alphabet.length - 1) | 1))) - 1;
  const step = Math.ceil((1.6 * mask * size) / alphabet.length);
  let id = '';

  while (id.length < size) {
    const bytes = getRandomBytes(step);
    for (let i = 0; i < bytes.length && id.length < size; i++) {
      const idx = bytes[i] & mask;
      if (idx < alphabet.length) {
        id += alphabet[idx];
      }
    }
  }
  return id;
}

/**
 * Generate a ULID (Universally Unique Lexicographically Sortable Identifier).
 * 10 chars timestamp (Crockford base32) + 16 chars random (Crockford base32).
 * @returns {string} 26-character ULID
 */
export function ulid() {
  let now = Date.now();
  let ts = '';
  for (let i = 0; i < 10; i++) {
    ts = CROCKFORD_BASE32[now % 32] + ts;
    now = Math.floor(now / 32);
  }

  const bytes = getRandomBytes(16);
  let rand = '';
  for (let i = 0; i < 16; i++) {
    rand += CROCKFORD_BASE32[bytes[i] % 32];
  }

  return ts + rand;
}

// Module-level counter for CUID — increments per call, wraps at 36^4
let cuidCounter = Math.floor(Math.random() * 1679616); // random start up to 36^4

/**
 * Generate a CUID-like ID.
 * Format: 'c' + timestamp(base36) + counter(base36, 4 chars) + random(base36, 8 chars)
 * @returns {string}
 */
export function cuid() {
  const prefix = 'c';
  const ts = Date.now().toString(36);
  cuidCounter = (cuidCounter + 1) % 1679616; // 36^4
  const count = cuidCounter.toString(36).padStart(4, '0');

  const bytes = getRandomBytes(8);
  let rand = '';
  for (let i = 0; i < 8; i++) {
    rand += (bytes[i] % 36).toString(36);
  }

  return prefix + ts + count + rand;
}

/**
 * Generate a Snowflake-style ID (Twitter-like).
 * 64-bit: 42 bits timestamp (ms since epoch) + 10 bits worker + 12 bits sequence.
 * @param {object} opts
 * @param {number} opts.epoch - Custom epoch in ms (default: 2020-01-01T00:00:00Z)
 * @param {number} opts.workerId - Worker ID 0-1023 (default: 1)
 * @param {number} opts.sequence - Sequence number 0-4095 (default: random)
 * @returns {string} Snowflake ID as string
 */
let snowflakeSeq = 0;
let snowflakeLastTs = -1;

export function snowflakeId(opts = {}) {
  const epoch = opts.epoch ?? 1577836800000; // 2020-01-01T00:00:00Z
  const workerId = opts.workerId ?? 1;
  const now = Date.now();

  if (workerId < 0 || workerId > 1023) throw new Error('Worker ID must be between 0 and 1023');

  if (opts.sequence !== undefined) {
    if (opts.sequence < 0 || opts.sequence > 4095) throw new Error('Sequence must be between 0 and 4095');
    snowflakeSeq = opts.sequence;
  } else {
    if (now === snowflakeLastTs) {
      snowflakeSeq = (snowflakeSeq + 1) & 0xFFF;
    } else {
      snowflakeSeq = 0;
    }
  }
  snowflakeLastTs = now;

  const ts = BigInt(now - epoch);
  const id = (ts << 22n) | (BigInt(workerId) << 12n) | BigInt(snowflakeSeq);
  return id.toString();
}

/**
 * Parse a snowflake ID to extract its components.
 * @param {string} id - Snowflake ID string
 * @param {number} epoch - Custom epoch in ms (default: 2020-01-01T00:00:00Z)
 * @returns {object} { timestamp, workerId, sequence, date }
 */
export function parseSnowflake(id, epoch = 1577836800000) {
  const big = BigInt(id);
  const timestamp = Number(big >> 22n) + epoch;
  const workerId = Number((big >> 12n) & 0x3FFn);
  const sequence = Number(big & 0xFFFn);
  return { timestamp, workerId, sequence, date: new Date(timestamp).toISOString() };
}

// Module-level counter for ObjectId
let objectIdCounter = Math.floor(Math.random() * 16777216); // random start, 3 bytes max

/**
 * Generate a MongoDB-style ObjectId.
 * 12 bytes: 4 bytes timestamp + 5 bytes random + 3 bytes counter.
 * @returns {string} 24-character hex string
 */
export function objectId() {
  const now = Math.floor(Date.now() / 1000);
  const ts = now.toString(16).padStart(8, '0');

  const randBytes = getRandomBytes(5);
  let rand = '';
  for (let i = 0; i < 5; i++) {
    rand += randBytes[i].toString(16).padStart(2, '0');
  }

  objectIdCounter = (objectIdCounter + 1) % 16777216; // 3 bytes = 16,777,216
  const counter = objectIdCounter.toString(16).padStart(6, '0');

  return ts + rand + counter;
}

/**
 * Parse an ObjectId to extract its timestamp.
 * @param {string} id - 24-character hex ObjectId
 * @returns {object} { timestamp, date }
 */
export function parseObjectId(id) {
  if (!/^[0-9a-f]{24}$/.test(id)) throw new Error('Invalid ObjectId format');
  const timestamp = parseInt(id.substring(0, 8), 16);
  return { timestamp, date: new Date(timestamp * 1000).toISOString() };
}

/**
 * Generate a URL-safe short ID using base62.
 * @param {number} length - Length of the ID (default 8)
 * @returns {string}
 */
export function shortId(length = 8) {
  if (length < 1 || length > 128) throw new Error('Length must be between 1 and 128');
  const bytes = getRandomBytes(length);
  let id = '';
  for (let i = 0; i < length; i++) {
    id += BASE62[bytes[i] % 62];
  }
  return id;
}

/**
 * Generate a prefixed ID (e.g., "sk_abc123", "cus_xyz789").
 * @param {string} prefix - Prefix string (required)
 * @param {number} length - Total length including prefix and underscore (default 24)
 * @returns {string}
 */
export function prefixedId(prefix, length = 24) {
  if (!prefix || typeof prefix !== 'string') throw new Error('Prefix is required');
  if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(prefix)) throw new Error('Prefix must start with a letter and contain only alphanumeric characters');
  const separatorLen = prefix.length + 1; // prefix + underscore
  if (length <= separatorLen) throw new Error(`Length must be greater than ${separatorLen} (prefix + underscore)`);
  const randomLen = length - separatorLen;
  const rand = shortId(randomLen);
  return prefix + '_' + rand;
}

/**
 * Generate multiple IDs at once.
 * @param {string} type - One of: uuid, nanoid, ulid, cuid, snowflake, objectid, short
 * @param {number} count - Number of IDs to generate (default 10, max 100)
 * @param {object} options - Options passed to the generator
 * @returns {string[]}
 */
export function batchIds(type, count = 10, options = {}) {
  if (count < 1 || count > 100) throw new Error('Count must be between 1 and 100');

  const generators = {
    uuid: () => crypto.randomUUID(),
    nanoid: () => nanoid(options.size, options.alphabet),
    ulid: () => ulid(),
    cuid: () => cuid(),
    snowflake: () => snowflakeId(options),
    objectid: () => objectId(),
    short: () => shortId(options.length),
    prefixed: () => prefixedId(options.prefix, options.length),
  };

  const gen = generators[type];
  if (!gen) throw new Error(`Unknown type: ${type}. Use: ${Object.keys(generators).join(', ')}`);

  const ids = [];
  for (let i = 0; i < count; i++) {
    ids.push(gen());
  }
  return ids;
}
