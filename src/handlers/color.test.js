import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  hexToRgb, rgbToHex, rgbToHsl, hslToRgb, hslToHex,
  contrastRatio, lighten, darken, complementary, palette, parseColor
} from './color.js';

describe('hexToRgb', () => {
  it('converts 6-digit hex', () => assert.deepEqual(hexToRgb('#ff0000'), { r: 255, g: 0, b: 0 }));
  it('converts 3-digit hex', () => assert.deepEqual(hexToRgb('#f00'), { r: 255, g: 0, b: 0 }));
  it('works without #', () => assert.deepEqual(hexToRgb('00ff00'), { r: 0, g: 255, b: 0 }));
  it('throws on invalid', () => assert.throws(() => hexToRgb('xyz')));
});

describe('rgbToHex', () => {
  it('converts rgb to hex', () => assert.equal(rgbToHex(255, 0, 0), '#ff0000'));
  it('handles zero', () => assert.equal(rgbToHex(0, 0, 0), '#000000'));
  it('handles white', () => assert.equal(rgbToHex(255, 255, 255), '#ffffff'));
  it('clamps out of range', () => assert.equal(rgbToHex(300, -10, 128), '#ff0080'));
});

describe('rgbToHsl', () => {
  it('red', () => assert.deepEqual(rgbToHsl(255, 0, 0), { h: 0, s: 100, l: 50 }));
  it('white', () => assert.deepEqual(rgbToHsl(255, 255, 255), { h: 0, s: 0, l: 100 }));
  it('black', () => assert.deepEqual(rgbToHsl(0, 0, 0), { h: 0, s: 0, l: 0 }));
});

describe('hslToRgb', () => {
  it('red', () => assert.deepEqual(hslToRgb(0, 100, 50), { r: 255, g: 0, b: 0 }));
  it('green', () => assert.deepEqual(hslToRgb(120, 100, 50), { r: 0, g: 255, b: 0 }));
  it('gray', () => assert.deepEqual(hslToRgb(0, 0, 50), { r: 128, g: 128, b: 128 }));
});

describe('hslToHex', () => {
  it('converts hsl to hex', () => assert.equal(hslToHex(0, 100, 50), '#ff0000'));
});

describe('contrastRatio', () => {
  it('black vs white = 21', () => {
    const result = contrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 });
    assert.equal(result.ratio, 21);
    assert.equal(result.aa.normal, true);
    assert.equal(result.aaa.normal, true);
  });
  it('same color = 1', () => {
    const result = contrastRatio({ r: 128, g: 128, b: 128 }, { r: 128, g: 128, b: 128 });
    assert.equal(result.ratio, 1);
    assert.equal(result.aa.normal, false);
  });
});

describe('lighten / darken', () => {
  it('lighten increases lightness', () => {
    const result = lighten(128, 0, 0, 20);
    assert.ok(result.r > 128);
  });
  it('darken decreases lightness', () => {
    const result = darken(128, 128, 128, 20);
    assert.ok(result.r < 128);
  });
});

describe('complementary', () => {
  it('red complement is cyan', () => {
    const result = complementary(255, 0, 0);
    assert.equal(result.r, 0);
    assert.equal(result.g, 255);
    assert.equal(result.b, 255);
  });
});

describe('palette', () => {
  it('analogous returns 3 colors', () => {
    const result = palette(255, 0, 0, 'analogous');
    assert.equal(result.length, 3);
    assert.ok(result[0].hex);
  });
  it('triadic returns 3 colors', () => {
    assert.equal(palette(255, 0, 0, 'triadic').length, 3);
  });
  it('tetradic returns 4 colors', () => {
    assert.equal(palette(255, 0, 0, 'tetradic').length, 4);
  });
});

describe('parseColor', () => {
  it('parses hex', () => {
    const result = parseColor('#ff0000');
    assert.deepEqual(result.rgb, { r: 255, g: 0, b: 0 });
    assert.equal(result.hsl.h, 0);
  });
  it('parses rgb()', () => {
    const result = parseColor('rgb(0, 255, 0)');
    assert.deepEqual(result.rgb, { r: 0, g: 255, b: 0 });
    assert.equal(result.hex, '#00ff00');
  });
  it('parses hsl()', () => {
    const result = parseColor('hsl(240, 100%, 50%)');
    assert.deepEqual(result.rgb, { r: 0, g: 0, b: 255 });
  });
  it('throws on invalid', () => {
    assert.throws(() => parseColor('not a color'));
  });
});
