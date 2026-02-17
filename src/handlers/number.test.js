import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { toOrdinal, toRoman, fromRoman, toWords, formatBytes, formatNumber, clamp, percentage } from './number.js';

describe('toOrdinal', () => {
  it('handles 1st, 2nd, 3rd', () => {
    assert.equal(toOrdinal(1), '1st');
    assert.equal(toOrdinal(2), '2nd');
    assert.equal(toOrdinal(3), '3rd');
  });

  it('handles teens', () => {
    assert.equal(toOrdinal(11), '11th');
    assert.equal(toOrdinal(12), '12th');
    assert.equal(toOrdinal(13), '13th');
  });

  it('handles 21st, 22nd, 23rd', () => {
    assert.equal(toOrdinal(21), '21st');
    assert.equal(toOrdinal(22), '22nd');
    assert.equal(toOrdinal(23), '23rd');
  });

  it('handles 100th', () => {
    assert.equal(toOrdinal(100), '100th');
  });
});

describe('toRoman', () => {
  it('converts basic numbers', () => {
    assert.equal(toRoman(1), 'I');
    assert.equal(toRoman(4), 'IV');
    assert.equal(toRoman(9), 'IX');
    assert.equal(toRoman(14), 'XIV');
    assert.equal(toRoman(42), 'XLII');
  });

  it('converts large numbers', () => {
    assert.equal(toRoman(1994), 'MCMXCIV');
    assert.equal(toRoman(3999), 'MMMCMXCIX');
  });

  it('rejects out of range', () => {
    assert.throws(() => toRoman(0));
    assert.throws(() => toRoman(4000));
  });
});

describe('fromRoman', () => {
  it('converts basic numerals', () => {
    assert.equal(fromRoman('XIV'), 14);
    assert.equal(fromRoman('XLII'), 42);
    assert.equal(fromRoman('MCMXCIV'), 1994);
  });

  it('is case insensitive', () => {
    assert.equal(fromRoman('xiv'), 14);
  });
});

describe('toWords', () => {
  it('converts zero', () => {
    assert.equal(toWords(0), 'zero');
  });

  it('converts small numbers', () => {
    assert.equal(toWords(5), 'five');
    assert.equal(toWords(12), 'twelve');
    assert.equal(toWords(42), 'forty-two');
  });

  it('converts hundreds', () => {
    assert.equal(toWords(100), 'one hundred');
    assert.equal(toWords(256), 'two hundred fifty-six');
  });

  it('converts thousands', () => {
    assert.equal(toWords(1000), 'one thousand');
    assert.equal(toWords(1001), 'one thousand one');
  });

  it('converts millions', () => {
    assert.equal(toWords(1000000), 'one million');
  });

  it('handles negatives', () => {
    assert.equal(toWords(-5), 'negative five');
  });
});

describe('formatBytes', () => {
  it('formats zero', () => {
    assert.equal(formatBytes(0), '0 Bytes');
  });

  it('formats bytes', () => {
    assert.equal(formatBytes(500), '500 Bytes');
  });

  it('formats KB', () => {
    assert.equal(formatBytes(1024), '1 KB');
  });

  it('formats MB', () => {
    assert.equal(formatBytes(1048576), '1 MB');
  });

  it('formats GB with decimals', () => {
    assert.equal(formatBytes(1500000000), '1.4 GB');
  });
});

describe('formatNumber', () => {
  it('formats with locale', () => {
    const result = formatNumber(1234567.89);
    assert.ok(result.includes('1'));
  });
});

describe('clamp', () => {
  it('clamps below min', () => {
    assert.equal(clamp(-5, 0, 100), 0);
  });

  it('clamps above max', () => {
    assert.equal(clamp(150, 0, 100), 100);
  });

  it('passes through in range', () => {
    assert.equal(clamp(50, 0, 100), 50);
  });
});

describe('percentage', () => {
  it('calculates percentage', () => {
    assert.equal(percentage(25, 100), 25);
    assert.equal(percentage(1, 3), 33.3333);
  });

  it('rejects zero total', () => {
    assert.throws(() => percentage(5, 0));
  });
});
