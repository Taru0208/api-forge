import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { encodeCode128, encodeEAN13, encodeCode39, barcodeToSVG, generateBarcode, listFormats } from './barcode.js';

describe('encodeCode128', () => {
  it('encodes simple text', () => {
    const pattern = encodeCode128('ABC');
    assert.ok(pattern.length > 0);
    assert.ok(/^[01]+$/.test(pattern));
    // Start B + 3 chars + checksum + stop
    // 11 + 11 + 11 + 11 + 11 + 13 = 68
    assert.equal(pattern.length, 68);
  });

  it('encodes digits', () => {
    const pattern = encodeCode128('12345');
    assert.ok(pattern.length > 0);
  });

  it('throws on empty text', () => {
    assert.throws(() => encodeCode128(''), /text is required/);
  });

  it('throws on too long text', () => {
    assert.throws(() => encodeCode128('A'.repeat(81)), /too long/);
  });

  it('throws on non-ASCII characters', () => {
    assert.throws(() => encodeCode128('한글'), /not supported/);
  });

  it('encodes special characters', () => {
    const pattern = encodeCode128('hello@world.com');
    assert.ok(pattern.length > 0);
  });
});

describe('encodeEAN13', () => {
  it('encodes 12 digits with check digit', () => {
    const result = encodeEAN13('590123412345');
    assert.equal(result.digits.length, 13);
    assert.ok(result.pattern.length > 0);
    // EAN-13 = 3 + 42 + 5 + 42 + 3 = 95 modules
    assert.equal(result.pattern.length, 95);
  });

  it('validates 13-digit input', () => {
    // Calculate check digit for 590123412345
    const result = encodeEAN13('590123412345');
    const full = result.digits;
    const result2 = encodeEAN13(full);
    assert.equal(result2.digits, full);
  });

  it('rejects invalid check digit', () => {
    assert.throws(() => encodeEAN13('5901234123451'), /Invalid check digit/);
  });

  it('rejects wrong length', () => {
    assert.throws(() => encodeEAN13('12345'), /Expected 12 or 13 digits/);
  });

  it('handles known ISBN', () => {
    // ISBN 978-0-13-468599-1 → EAN 9780134685991
    const result = encodeEAN13('978013468599');
    assert.equal(result.digits, '9780134685991');
  });
});

describe('encodeCode39', () => {
  it('encodes alphanumeric text', () => {
    const pattern = encodeCode39('HELLO');
    assert.ok(pattern.length > 0);
    assert.ok(/^[01]+$/.test(pattern));
  });

  it('converts to uppercase', () => {
    const p1 = encodeCode39('hello');
    const p2 = encodeCode39('HELLO');
    assert.equal(p1, p2);
  });

  it('throws on unsupported characters', () => {
    assert.throws(() => encodeCode39('hello@world'), /not supported/);
  });

  it('throws on too long text', () => {
    assert.throws(() => encodeCode39('A'.repeat(41)), /too long/);
  });
});

describe('barcodeToSVG', () => {
  it('generates valid SVG', () => {
    const svg = barcodeToSVG('101010101', { text: 'TEST' });
    assert.ok(svg.startsWith('<svg'));
    assert.ok(svg.includes('</svg>'));
    assert.ok(svg.includes('TEST'));
  });

  it('respects height option', () => {
    const svg = barcodeToSVG('101', { height: 200 });
    assert.ok(svg.includes('height="200"'));
  });

  it('handles no text', () => {
    const svg = barcodeToSVG('101', { showText: false });
    assert.ok(!svg.includes('<text'));
  });
});

describe('generateBarcode', () => {
  it('generates code128', () => {
    const result = generateBarcode('Hello123', 'code128');
    assert.equal(result.format, 'code128');
    assert.ok(result.svg.includes('<svg'));
    assert.ok(result.pattern.length > 0);
  });

  it('generates ean13', () => {
    const result = generateBarcode('590123412345', 'ean13');
    assert.equal(result.format, 'ean13');
    assert.equal(result.text.length, 13);
  });

  it('generates code39', () => {
    const result = generateBarcode('TEST', 'code39');
    assert.equal(result.format, 'code39');
    assert.ok(result.text.includes('*'));
  });

  it('throws on unsupported format', () => {
    assert.throws(() => generateBarcode('test', 'qr'), /Unsupported format/);
  });

  it('throws on empty text', () => {
    assert.throws(() => generateBarcode(''), /text is required/);
  });

  it('accepts options', () => {
    const result = generateBarcode('test', 'code128', { height: 150, barColor: '#ff0000' });
    assert.ok(result.svg.includes('#ff0000'));
  });
});

describe('listFormats', () => {
  it('returns all formats', () => {
    const result = listFormats();
    assert.equal(result.formats.length, 3);
    assert.ok(result.formats.find(f => f.id === 'code128'));
    assert.ok(result.formats.find(f => f.id === 'ean13'));
    assert.ok(result.formats.find(f => f.id === 'code39'));
  });
});
