/**
 * MIME type detection from magic bytes + extension mapping.
 * No native dependencies — works on Cloudflare Workers.
 */

// Magic byte signatures — check longest patterns first for accuracy
const MAGIC_SIGNATURES = [
  // Images
  { mime: 'image/png', ext: 'png', bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },
  { mime: 'image/jpeg', ext: 'jpg', bytes: [0xFF, 0xD8, 0xFF] },
  { mime: 'image/gif', ext: 'gif', bytes: [0x47, 0x49, 0x46, 0x38] }, // GIF8
  { mime: 'image/webp', ext: 'webp', bytes: [0x52, 0x49, 0x46, 0x46], offset: 0, extra: { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] } },
  { mime: 'image/bmp', ext: 'bmp', bytes: [0x42, 0x4D] }, // BM
  { mime: 'image/tiff', ext: 'tiff', bytes: [0x49, 0x49, 0x2A, 0x00] }, // little-endian
  { mime: 'image/tiff', ext: 'tiff', bytes: [0x4D, 0x4D, 0x00, 0x2A] }, // big-endian
  { mime: 'image/x-icon', ext: 'ico', bytes: [0x00, 0x00, 0x01, 0x00] },
  { mime: 'image/avif', ext: 'avif', bytes: [0x00, 0x00, 0x00], offset: 0, extra: { offset: 4, bytes: [0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66] } }, // ftyp avif

  // Audio
  { mime: 'audio/mpeg', ext: 'mp3', bytes: [0x49, 0x44, 0x33] }, // ID3
  { mime: 'audio/mpeg', ext: 'mp3', bytes: [0xFF, 0xFB] },
  { mime: 'audio/wav', ext: 'wav', bytes: [0x52, 0x49, 0x46, 0x46], offset: 0, extra: { offset: 8, bytes: [0x57, 0x41, 0x56, 0x45] } },
  { mime: 'audio/flac', ext: 'flac', bytes: [0x66, 0x4C, 0x61, 0x43] }, // fLaC
  { mime: 'audio/ogg', ext: 'ogg', bytes: [0x4F, 0x67, 0x67, 0x53] }, // OggS

  // Video
  { mime: 'video/mp4', ext: 'mp4', bytes: [0x00, 0x00, 0x00], offset: 0, extra: { offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] } }, // ftyp
  { mime: 'video/webm', ext: 'webm', bytes: [0x1A, 0x45, 0xDF, 0xA3] },
  { mime: 'video/avi', ext: 'avi', bytes: [0x52, 0x49, 0x46, 0x46], offset: 0, extra: { offset: 8, bytes: [0x41, 0x56, 0x49, 0x20] } },

  // Documents
  { mime: 'application/pdf', ext: 'pdf', bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  { mime: 'application/zip', ext: 'zip', bytes: [0x50, 0x4B, 0x03, 0x04] }, // PK
  { mime: 'application/gzip', ext: 'gz', bytes: [0x1F, 0x8B] },
  { mime: 'application/x-rar-compressed', ext: 'rar', bytes: [0x52, 0x61, 0x72, 0x21, 0x1A, 0x07] }, // Rar!
  { mime: 'application/x-7z-compressed', ext: '7z', bytes: [0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C] },
  { mime: 'application/x-tar', ext: 'tar', bytes: [0x75, 0x73, 0x74, 0x61, 0x72], offset: 257 }, // "ustar" at offset 257
  { mime: 'application/wasm', ext: 'wasm', bytes: [0x00, 0x61, 0x73, 0x6D] }, // \0asm

  // Fonts
  { mime: 'font/woff', ext: 'woff', bytes: [0x77, 0x4F, 0x46, 0x46] }, // wOFF
  { mime: 'font/woff2', ext: 'woff2', bytes: [0x77, 0x4F, 0x46, 0x32] }, // wOF2
  { mime: 'font/otf', ext: 'otf', bytes: [0x4F, 0x54, 0x54, 0x4F] }, // OTTO
  { mime: 'font/ttf', ext: 'ttf', bytes: [0x00, 0x01, 0x00, 0x00] },

  // Data
  { mime: 'application/x-sqlite3', ext: 'sqlite', bytes: [0x53, 0x51, 0x4C, 0x69, 0x74, 0x65, 0x20, 0x66, 0x6F, 0x72, 0x6D, 0x61, 0x74] }, // SQLite format
];

// Extension to MIME mapping (for when magic bytes aren't available)
const EXT_MAP = {
  // Text
  html: 'text/html', htm: 'text/html', css: 'text/css', csv: 'text/csv',
  txt: 'text/plain', xml: 'text/xml', svg: 'image/svg+xml',
  // Scripts
  js: 'text/javascript', mjs: 'text/javascript', ts: 'text/typescript',
  json: 'application/json', jsonld: 'application/ld+json',
  // Images
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
  webp: 'image/webp', bmp: 'image/bmp', ico: 'image/x-icon',
  tiff: 'image/tiff', tif: 'image/tiff', avif: 'image/avif', heic: 'image/heic',
  // Audio
  mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', flac: 'audio/flac',
  aac: 'audio/aac', m4a: 'audio/mp4', wma: 'audio/x-ms-wma',
  // Video
  mp4: 'video/mp4', webm: 'video/webm', avi: 'video/x-msvideo',
  mov: 'video/quicktime', mkv: 'video/x-matroska', flv: 'video/x-flv',
  wmv: 'video/x-ms-wmv', m4v: 'video/mp4',
  // Documents
  pdf: 'application/pdf', doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Archives
  zip: 'application/zip', gz: 'application/gzip', tar: 'application/x-tar',
  rar: 'application/x-rar-compressed', '7z': 'application/x-7z-compressed',
  bz2: 'application/x-bzip2',
  // Fonts
  woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf', otf: 'font/otf',
  eot: 'application/vnd.ms-fontobject',
  // Code
  py: 'text/x-python', rb: 'text/x-ruby', java: 'text/x-java-source',
  c: 'text/x-c', cpp: 'text/x-c++', h: 'text/x-c', rs: 'text/x-rust',
  go: 'text/x-go', php: 'text/x-php', sh: 'text/x-shellscript',
  // Data
  yaml: 'application/x-yaml', yml: 'application/x-yaml',
  toml: 'application/toml', ini: 'text/plain',
  sql: 'application/sql', graphql: 'application/graphql',
  // Web
  wasm: 'application/wasm', map: 'application/json',
  // Other
  md: 'text/markdown', markdown: 'text/markdown',
  ics: 'text/calendar', vcf: 'text/vcard',
};

/**
 * Detect MIME type from base64-encoded file header (first 512+ bytes).
 */
export function detectFromBytes(base64Data) {
  if (!base64Data || typeof base64Data !== 'string') {
    throw new Error('base64 data is required');
  }

  const bytes = base64ToBytes(base64Data);

  for (const sig of MAGIC_SIGNATURES) {
    const offset = sig.offset || 0;
    if (bytes.length < offset + sig.bytes.length) continue;

    let match = true;
    for (let i = 0; i < sig.bytes.length; i++) {
      if (bytes[offset + i] !== sig.bytes[i]) {
        match = false;
        break;
      }
    }

    if (match && sig.extra) {
      const ex = sig.extra;
      if (bytes.length < ex.offset + ex.bytes.length) continue;
      for (let i = 0; i < ex.bytes.length; i++) {
        if (bytes[ex.offset + i] !== ex.bytes[i]) {
          match = false;
          break;
        }
      }
    }

    if (match) {
      return {
        mime: sig.mime,
        extension: sig.ext,
        confidence: 'high',
        method: 'magic-bytes',
      };
    }
  }

  return {
    mime: 'application/octet-stream',
    extension: null,
    confidence: 'none',
    method: 'magic-bytes',
  };
}

function base64ToBytes(b64) {
  const binStr = atob(b64);
  const bytes = new Uint8Array(binStr.length);
  for (let i = 0; i < binStr.length; i++) {
    bytes[i] = binStr.charCodeAt(i);
  }
  return bytes;
}

/**
 * Get MIME type from file extension.
 */
export function detectFromExtension(filename) {
  if (!filename || typeof filename !== 'string') {
    throw new Error('filename is required');
  }

  const ext = filename.split('.').pop().toLowerCase();
  const mime = EXT_MAP[ext];

  if (mime) {
    return {
      mime,
      extension: ext,
      confidence: 'medium',
      method: 'extension',
    };
  }

  return {
    mime: 'application/octet-stream',
    extension: ext,
    confidence: 'none',
    method: 'extension',
  };
}

/**
 * Get extension for a MIME type.
 */
export function mimeToExtension(mime) {
  if (!mime || typeof mime !== 'string') {
    throw new Error('mime type is required');
  }

  const lower = mime.toLowerCase();

  // Check extension map (reverse lookup)
  for (const [ext, m] of Object.entries(EXT_MAP)) {
    if (m === lower) return { mime: lower, extension: ext };
  }

  // Check magic signatures
  for (const sig of MAGIC_SIGNATURES) {
    if (sig.mime === lower) return { mime: lower, extension: sig.ext };
  }

  return { mime: lower, extension: null };
}

/**
 * Validate that file bytes match claimed MIME type.
 */
export function validateType(base64Data, claimedMime) {
  if (!base64Data) throw new Error('base64 data is required');
  if (!claimedMime) throw new Error('claimedMime is required');

  const detected = detectFromBytes(base64Data);
  const claimed = claimedMime.toLowerCase();

  // Exact match
  if (detected.mime === claimed) {
    return { valid: true, claimed, detected: detected.mime, confidence: detected.confidence };
  }

  // Check if detection failed (unknown type) — can't invalidate
  if (detected.confidence === 'none') {
    return { valid: null, claimed, detected: detected.mime, confidence: 'unknown', note: 'Could not detect file type from bytes' };
  }

  // Mismatch
  return { valid: false, claimed, detected: detected.mime, confidence: detected.confidence };
}

/**
 * List all known MIME types.
 */
export function listMimeTypes(category) {
  const categories = {};

  for (const [ext, mime] of Object.entries(EXT_MAP)) {
    const cat = mime.split('/')[0];
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push({ extension: ext, mime });
  }

  if (category) {
    const lower = category.toLowerCase();
    return { category: lower, types: categories[lower] || [] };
  }

  return {
    categories: Object.keys(categories).sort(),
    count: Object.keys(EXT_MAP).length,
    types: categories,
  };
}
