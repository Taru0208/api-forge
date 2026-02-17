import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  randomString, randomNumber, randomColor, loremIpsum,
  randomPassword, randomIPv4, randomIPv6, randomUserAgent
} from './generate.js';

describe('randomString', () => {
  it('generates string of given length', () => {
    assert.equal(randomString(32).length, 32);
  });
  it('uses alphanumeric by default', () => {
    assert.match(randomString(100), /^[a-zA-Z0-9]+$/);
  });
  it('supports hex charset', () => {
    assert.match(randomString(20, 'hex'), /^[0-9a-f]+$/);
  });
  it('supports alpha charset', () => {
    assert.match(randomString(20, 'alpha'), /^[a-zA-Z]+$/);
  });
  it('supports numeric charset', () => {
    assert.match(randomString(20, 'numeric'), /^[0-9]+$/);
  });
});

describe('randomNumber', () => {
  it('generates number in range', () => {
    for (let i = 0; i < 100; i++) {
      const n = randomNumber(10, 20);
      assert.ok(n >= 10 && n <= 20);
    }
  });
  it('supports decimals', () => {
    const n = randomNumber(0, 1, 4);
    const parts = n.toString().split('.');
    assert.ok(!parts[1] || parts[1].length <= 4);
  });
  it('returns integer by default', () => {
    const n = randomNumber(0, 100);
    assert.equal(n, Math.floor(n));
  });
});

describe('randomColor', () => {
  it('generates hex color', () => {
    const c = randomColor('hex');
    assert.match(c.hex, /^#[0-9a-f]{6}$/);
  });
  it('generates rgb color', () => {
    const c = randomColor('rgb');
    assert.ok(c.r >= 0 && c.r <= 255);
    assert.ok(c.g >= 0 && c.g <= 255);
    assert.ok(c.b >= 0 && c.b <= 255);
    assert.ok(c.string.startsWith('rgb('));
  });
  it('generates hsl color', () => {
    const c = randomColor('hsl');
    assert.ok(c.h >= 0 && c.h <= 360);
    assert.ok(c.s >= 0 && c.s <= 100);
    assert.ok(c.l >= 0 && c.l <= 100);
  });
});

describe('loremIpsum', () => {
  it('generates paragraphs', () => {
    const text = loremIpsum(3, 'paragraphs');
    const paragraphs = text.split('\n\n');
    assert.equal(paragraphs.length, 3);
  });
  it('generates sentences', () => {
    const text = loremIpsum(5, 'sentences');
    const sentences = text.split('. ');
    assert.ok(sentences.length >= 4); // last sentence ends with period
  });
  it('generates words', () => {
    const text = loremIpsum(10, 'words');
    const words = text.split(' ');
    assert.equal(words.length, 10);
  });
});

describe('randomPassword', () => {
  it('generates password of given length', () => {
    assert.equal(randomPassword(24).length, 24);
  });
  it('includes all character types by default', () => {
    // Run multiple times to reduce flakiness
    let hasUpper = false, hasLower = false, hasDigit = false, hasSymbol = false;
    for (let i = 0; i < 20; i++) {
      const p = randomPassword(32);
      if (/[A-Z]/.test(p)) hasUpper = true;
      if (/[a-z]/.test(p)) hasLower = true;
      if (/[0-9]/.test(p)) hasDigit = true;
      if (/[^a-zA-Z0-9]/.test(p)) hasSymbol = true;
    }
    assert.ok(hasUpper && hasLower && hasDigit && hasSymbol);
  });
  it('respects options', () => {
    const p = randomPassword(20, { symbols: false, uppercase: false });
    assert.match(p, /^[a-z0-9]+$/);
  });
});

describe('randomIPv4', () => {
  it('generates valid IPv4', () => {
    const ip = randomIPv4();
    const parts = ip.split('.');
    assert.equal(parts.length, 4);
    parts.forEach(p => {
      const n = parseInt(p);
      assert.ok(n >= 0 && n <= 255);
    });
  });
});

describe('randomIPv6', () => {
  it('generates valid IPv6', () => {
    const ip = randomIPv6();
    const parts = ip.split(':');
    assert.equal(parts.length, 8);
    parts.forEach(p => {
      assert.match(p, /^[0-9a-f]{4}$/);
    });
  });
});

describe('randomUserAgent', () => {
  it('generates valid user agent string', () => {
    const ua = randomUserAgent();
    assert.ok(ua.startsWith('Mozilla/5.0'));
    assert.ok(ua.length > 50);
  });
});
