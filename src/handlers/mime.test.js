import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { detectFromBytes, detectFromExtension, mimeToExtension, validateType, listMimeTypes } from './mime.js';

// Helper: encode bytes array to base64
function bytesToBase64(bytes) {
  return Buffer.from(bytes).toString('base64');
}

describe('detectFromBytes', () => {
  it('detects PNG', () => {
    const b64 = bytesToBase64([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00]);
    const r = detectFromBytes(b64);
    assert.equal(r.mime, 'image/png');
    assert.equal(r.extension, 'png');
    assert.equal(r.confidence, 'high');
  });

  it('detects JPEG', () => {
    const b64 = bytesToBase64([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]);
    const r = detectFromBytes(b64);
    assert.equal(r.mime, 'image/jpeg');
    assert.equal(r.extension, 'jpg');
  });

  it('detects GIF', () => {
    const b64 = bytesToBase64([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
    const r = detectFromBytes(b64);
    assert.equal(r.mime, 'image/gif');
    assert.equal(r.extension, 'gif');
  });

  it('detects PDF', () => {
    const b64 = bytesToBase64([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E]);
    const r = detectFromBytes(b64);
    assert.equal(r.mime, 'application/pdf');
    assert.equal(r.extension, 'pdf');
  });

  it('detects ZIP', () => {
    const b64 = bytesToBase64([0x50, 0x4B, 0x03, 0x04, 0x14, 0x00]);
    const r = detectFromBytes(b64);
    assert.equal(r.mime, 'application/zip');
    assert.equal(r.extension, 'zip');
  });

  it('detects GZIP', () => {
    const b64 = bytesToBase64([0x1F, 0x8B, 0x08, 0x00]);
    const r = detectFromBytes(b64);
    assert.equal(r.mime, 'application/gzip');
    assert.equal(r.extension, 'gz');
  });

  it('detects MP3 (ID3)', () => {
    const b64 = bytesToBase64([0x49, 0x44, 0x33, 0x04, 0x00]);
    const r = detectFromBytes(b64);
    assert.equal(r.mime, 'audio/mpeg');
    assert.equal(r.extension, 'mp3');
  });

  it('detects WASM', () => {
    const b64 = bytesToBase64([0x00, 0x61, 0x73, 0x6D, 0x01, 0x00]);
    const r = detectFromBytes(b64);
    assert.equal(r.mime, 'application/wasm');
    assert.equal(r.extension, 'wasm');
  });

  it('detects FLAC', () => {
    const b64 = bytesToBase64([0x66, 0x4C, 0x61, 0x43, 0x00, 0x00]);
    const r = detectFromBytes(b64);
    assert.equal(r.mime, 'audio/flac');
    assert.equal(r.extension, 'flac');
  });

  it('detects BMP', () => {
    const b64 = bytesToBase64([0x42, 0x4D, 0x00, 0x00]);
    const r = detectFromBytes(b64);
    assert.equal(r.mime, 'image/bmp');
    assert.equal(r.extension, 'bmp');
  });

  it('detects RAR', () => {
    const b64 = bytesToBase64([0x52, 0x61, 0x72, 0x21, 0x1A, 0x07, 0x00]);
    const r = detectFromBytes(b64);
    assert.equal(r.mime, 'application/x-rar-compressed');
    assert.equal(r.extension, 'rar');
  });

  it('detects 7z', () => {
    const b64 = bytesToBase64([0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C, 0x00]);
    const r = detectFromBytes(b64);
    assert.equal(r.mime, 'application/x-7z-compressed');
    assert.equal(r.extension, '7z');
  });

  it('detects WOFF', () => {
    const b64 = bytesToBase64([0x77, 0x4F, 0x46, 0x46, 0x00]);
    const r = detectFromBytes(b64);
    assert.equal(r.mime, 'font/woff');
    assert.equal(r.extension, 'woff');
  });

  it('detects WOFF2', () => {
    const b64 = bytesToBase64([0x77, 0x4F, 0x46, 0x32, 0x00]);
    const r = detectFromBytes(b64);
    assert.equal(r.mime, 'font/woff2');
    assert.equal(r.extension, 'woff2');
  });

  it('returns unknown for unrecognized bytes', () => {
    const b64 = bytesToBase64([0x01, 0x02, 0x03, 0x04]);
    const r = detectFromBytes(b64);
    assert.equal(r.mime, 'application/octet-stream');
    assert.equal(r.confidence, 'none');
  });

  it('throws on missing data', () => {
    assert.throws(() => detectFromBytes(''), /required/);
    assert.throws(() => detectFromBytes(null), /required/);
  });
});

describe('detectFromExtension', () => {
  it('detects common extensions', () => {
    assert.equal(detectFromExtension('photo.png').mime, 'image/png');
    assert.equal(detectFromExtension('doc.pdf').mime, 'application/pdf');
    assert.equal(detectFromExtension('style.css').mime, 'text/css');
    assert.equal(detectFromExtension('app.js').mime, 'text/javascript');
    assert.equal(detectFromExtension('data.json').mime, 'application/json');
  });

  it('handles case insensitivity', () => {
    assert.equal(detectFromExtension('image.PNG').mime, 'image/png');
    assert.equal(detectFromExtension('DOC.PDF').mime, 'application/pdf');
  });

  it('handles paths with multiple dots', () => {
    assert.equal(detectFromExtension('archive.tar.gz').mime, 'application/gzip');
    assert.equal(detectFromExtension('my.file.txt').mime, 'text/plain');
  });

  it('returns unknown for unrecognized extension', () => {
    const r = detectFromExtension('file.xyz123');
    assert.equal(r.mime, 'application/octet-stream');
    assert.equal(r.confidence, 'none');
  });

  it('detects code file types', () => {
    assert.equal(detectFromExtension('main.py').mime, 'text/x-python');
    assert.equal(detectFromExtension('main.go').mime, 'text/x-go');
    assert.equal(detectFromExtension('main.rs').mime, 'text/x-rust');
  });

  it('detects font types', () => {
    assert.equal(detectFromExtension('font.woff2').mime, 'font/woff2');
    assert.equal(detectFromExtension('font.ttf').mime, 'font/ttf');
  });

  it('throws on missing filename', () => {
    assert.throws(() => detectFromExtension(''), /required/);
  });
});

describe('mimeToExtension', () => {
  it('finds extension for common MIME types', () => {
    assert.equal(mimeToExtension('image/png').extension, 'png');
    assert.equal(mimeToExtension('application/pdf').extension, 'pdf');
    assert.equal(mimeToExtension('text/html').extension, 'html');
    assert.equal(mimeToExtension('application/json').extension, 'json');
  });

  it('returns null for unknown MIME', () => {
    assert.equal(mimeToExtension('application/x-unknown-thing').extension, null);
  });

  it('handles case insensitivity', () => {
    assert.equal(mimeToExtension('Image/PNG').extension, 'png');
  });

  it('throws on missing mime', () => {
    assert.throws(() => mimeToExtension(''), /required/);
  });
});

describe('validateType', () => {
  it('validates matching type', () => {
    const pngBytes = bytesToBase64([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const r = validateType(pngBytes, 'image/png');
    assert.equal(r.valid, true);
  });

  it('rejects mismatched type', () => {
    const pngBytes = bytesToBase64([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const r = validateType(pngBytes, 'image/jpeg');
    assert.equal(r.valid, false);
    assert.equal(r.detected, 'image/png');
  });

  it('returns null for unknown bytes', () => {
    const unknownBytes = bytesToBase64([0x01, 0x02, 0x03, 0x04]);
    const r = validateType(unknownBytes, 'image/png');
    assert.equal(r.valid, null);
  });

  it('throws on missing inputs', () => {
    assert.throws(() => validateType(null, 'image/png'), /required/);
    assert.throws(() => validateType('data', null), /required/);
  });
});

describe('listMimeTypes', () => {
  it('returns all types with categories', () => {
    const r = listMimeTypes();
    assert.ok(r.categories.length > 0);
    assert.ok(r.count > 50);
    assert.ok(r.types.text);
    assert.ok(r.types.image);
    assert.ok(r.types.application);
  });

  it('filters by category', () => {
    const r = listMimeTypes('image');
    assert.equal(r.category, 'image');
    assert.ok(r.types.length > 0);
    assert.ok(r.types.every(t => t.mime.startsWith('image/')));
  });

  it('returns empty for unknown category', () => {
    const r = listMimeTypes('nonexistent');
    assert.equal(r.types.length, 0);
  });
});
