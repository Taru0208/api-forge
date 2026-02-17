import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateQR, qrToSVG, qrToSVGOptimized, qrToASCII, qrToMatrix } from './qr.js';

describe('QR Code Generation', () => {
  it('generates QR for simple text', () => {
    const qr = generateQR('Hello');
    assert.ok(qr.version >= 1 && qr.version <= 10);
    assert.ok(qr.size > 0);
    assert.equal(qr.ecLevel, 'M');
    assert.ok(qr.mask >= 0 && qr.mask <= 7);
    assert.equal(qr.modules.length, qr.size);
    assert.equal(qr.modules[0].length, qr.size);
  });

  it('generates version 1 for short text', () => {
    const qr = generateQR('Hi', { ecLevel: 'L' });
    assert.equal(qr.version, 1);
    assert.equal(qr.size, 21); // 17 + 1*4 = 21
  });

  it('generates larger version for longer text', () => {
    const qr = generateQR('Hello, World! This is a QR code test with more text.', { ecLevel: 'L' });
    assert.ok(qr.version >= 3);
  });

  it('respects error correction levels', () => {
    for (const ec of ['L', 'M', 'Q', 'H']) {
      const qr = generateQR('Test', { ecLevel: ec });
      assert.equal(qr.ecLevel, ec);
    }
  });

  it('rejects invalid EC level', () => {
    assert.throws(() => generateQR('Test', { ecLevel: 'X' }), /Invalid EC level/);
  });

  it('rejects text too long', () => {
    const longText = 'a'.repeat(300);
    assert.throws(() => generateQR(longText, { ecLevel: 'H' }), /too long/);
  });

  it('handles empty-ish single char', () => {
    const qr = generateQR('A');
    assert.equal(qr.version, 1);
  });

  it('handles URLs', () => {
    const qr = generateQR('https://example.com');
    assert.ok(qr.version >= 1);
    assert.ok(qr.size > 0);
  });

  it('handles unicode text', () => {
    const qr = generateQR('안녕하세요');
    assert.ok(qr.version >= 1);
  });

  it('handles numeric text', () => {
    const qr = generateQR('1234567890');
    assert.ok(qr.version >= 1);
  });
});

describe('QR SVG output', () => {
  it('generates valid SVG', () => {
    const qr = generateQR('Test');
    const svg = qrToSVG(qr);
    assert.ok(svg.startsWith('<svg'));
    assert.ok(svg.includes('xmlns="http://www.w3.org/2000/svg"'));
    assert.ok(svg.endsWith('</svg>'));
    assert.ok(svg.includes('fill="#000000"'));
  });

  it('respects custom colors', () => {
    const qr = generateQR('Test');
    const svg = qrToSVG(qr, { darkColor: '#ff0000', lightColor: '#00ff00' });
    assert.ok(svg.includes('fill="#ff0000"'));
    assert.ok(svg.includes('fill="#00ff00"'));
  });

  it('generates optimized SVG with path', () => {
    const qr = generateQR('Test');
    const svg = qrToSVGOptimized(qr);
    assert.ok(svg.includes('<path'));
    assert.ok(svg.includes('</svg>'));
  });

  it('optimized SVG is smaller than regular', () => {
    const qr = generateQR('Hello World');
    const regular = qrToSVG(qr);
    const optimized = qrToSVGOptimized(qr);
    assert.ok(optimized.length < regular.length, 'Optimized should be smaller');
  });
});

describe('QR ASCII output', () => {
  it('generates ASCII representation', () => {
    const qr = generateQR('Hi', { ecLevel: 'L' });
    const ascii = qrToASCII(qr);
    assert.ok(ascii.length > 0);
    assert.ok(ascii.includes('██'));
    assert.ok(ascii.includes('  '));
    // Should have `size` lines
    const lines = ascii.trim().split('\n');
    assert.equal(lines.length, qr.size);
  });
});

describe('QR Matrix output', () => {
  it('generates binary matrix', () => {
    const qr = generateQR('Hi', { ecLevel: 'L' });
    const matrix = qrToMatrix(qr);
    assert.equal(matrix.length, qr.size);
    assert.equal(matrix[0].length, qr.size);
    // All values should be 0 or 1
    for (const row of matrix) {
      for (const val of row) {
        assert.ok(val === 0 || val === 1);
      }
    }
  });

  it('has finder patterns in corners', () => {
    const qr = generateQR('Test', { ecLevel: 'L' });
    const matrix = qrToMatrix(qr);
    const s = qr.size;

    // Top-left finder: 7x7, all border is black, inner 3x3 is black
    // Check top-left corner pattern
    assert.equal(matrix[0][0], 1, 'Top-left corner should be black');
    assert.equal(matrix[0][6], 1, 'Top-left row end');
    assert.equal(matrix[6][0], 1, 'Top-left col end');
    assert.equal(matrix[3][3], 1, 'Top-left center');
    assert.equal(matrix[1][1], 0, 'Top-left inner white');

    // Top-right corner
    assert.equal(matrix[0][s - 1], 1, 'Top-right corner');
    assert.equal(matrix[0][s - 7], 1, 'Top-right start');
    assert.equal(matrix[3][s - 4], 1, 'Top-right center');

    // Bottom-left corner
    assert.equal(matrix[s - 1][0], 1, 'Bottom-left corner');
    assert.equal(matrix[s - 7][0], 1, 'Bottom-left start');
    assert.equal(matrix[s - 4][3], 1, 'Bottom-left center');
  });
});

describe('QR determinism', () => {
  it('same input produces same output', () => {
    const qr1 = generateQR('deterministic');
    const qr2 = generateQR('deterministic');
    const m1 = qrToMatrix(qr1);
    const m2 = qrToMatrix(qr2);
    assert.deepStrictEqual(m1, m2);
  });

  it('different inputs produce different outputs', () => {
    const m1 = qrToMatrix(generateQR('Hello'));
    const m2 = qrToMatrix(generateQR('World'));
    // At least some modules should differ
    let diffs = 0;
    for (let r = 0; r < m1.length && r < m2.length; r++) {
      for (let c = 0; c < m1[r].length && c < m2[r].length; c++) {
        if (m1[r][c] !== m2[r][c]) diffs++;
      }
    }
    assert.ok(diffs > 0, 'Different texts should produce different QR codes');
  });
});

describe('QR version sizing', () => {
  it('version 1 is 21x21', () => {
    const qr = generateQR('A', { ecLevel: 'L' });
    assert.equal(qr.size, 21);
  });

  it('size follows formula 17 + 4*version', () => {
    // Force larger version with more text
    const qr = generateQR('A'.repeat(100), { ecLevel: 'L' });
    assert.equal(qr.size, 17 + 4 * qr.version);
  });
});
