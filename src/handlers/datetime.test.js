import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { now, dateDiff, parseDate, addTime, convertTimestamp } from './datetime.js';

describe('now()', () => {
  it('returns iso, unix, unix_ms, utc', () => {
    const result = now();
    assert.ok(result.iso);
    assert.ok(typeof result.unix === 'number');
    assert.ok(typeof result.unix_ms === 'number');
    assert.ok(result.utc);
  });

  it('includes timezone info when given', () => {
    const result = now('Asia/Seoul');
    assert.ok(result.local);
    assert.equal(result.timezone, 'Asia/Seoul');
  });

  it('throws on invalid timezone', () => {
    assert.throws(() => now('Invalid/Zone'), /Invalid timezone/);
  });
});

describe('dateDiff()', () => {
  it('calculates positive difference', () => {
    const result = dateDiff('2024-01-01T00:00:00Z', '2024-01-02T00:00:00Z');
    assert.equal(result.days, 1);
    assert.equal(result.hours, 24);
    assert.equal(result.seconds, 86400);
  });

  it('calculates negative difference', () => {
    const result = dateDiff('2024-01-02T00:00:00Z', '2024-01-01T00:00:00Z');
    assert.equal(result.days, -1);
  });

  it('includes human-readable duration', () => {
    const result = dateDiff('2024-01-01T00:00:00Z', '2024-01-01T01:30:45Z');
    assert.ok(result.human.includes('h'));
  });

  it('throws on missing dates', () => {
    assert.throws(() => dateDiff(), /required/);
    assert.throws(() => dateDiff('2024-01-01'), /required/);
  });

  it('throws on invalid dates', () => {
    assert.throws(() => dateDiff('not-a-date', '2024-01-01'), /Invalid date/);
  });

  it('calculates year-scale differences', () => {
    const result = dateDiff('2020-01-01T00:00:00Z', '2024-06-15T00:00:00Z');
    assert.equal(result.years, 4);
    assert.ok(result.human.includes('y'));
  });
});

describe('parseDate()', () => {
  it('parses ISO string', () => {
    const result = parseDate('2024-03-15T10:30:00Z');
    assert.equal(result.year, 2024);
    assert.equal(result.month, 3);
    assert.equal(result.day, 15);
    assert.equal(result.hour, 10);
    assert.equal(result.minute, 30);
    assert.equal(result.dayOfWeekName, 'Friday');
  });

  it('detects leap year', () => {
    assert.equal(parseDate('2024-01-01').isLeapYear, true);
    assert.equal(parseDate('2023-01-01').isLeapYear, false);
  });

  it('calculates day of year', () => {
    const result = parseDate('2024-02-01T00:00:00Z');
    assert.equal(result.dayOfYear, 32); // Jan has 31 days
  });

  it('includes week number', () => {
    const result = parseDate('2024-01-08T00:00:00Z');
    assert.ok(typeof result.weekNumber === 'number');
    assert.ok(result.weekNumber >= 1 && result.weekNumber <= 53);
  });

  it('throws on invalid date', () => {
    assert.throws(() => parseDate('garbage'), /Cannot parse/);
  });

  it('throws when empty', () => {
    assert.throws(() => parseDate(), /required/);
  });
});

describe('addTime()', () => {
  it('adds days', () => {
    const result = addTime('2024-01-01T00:00:00Z', 5, 'days');
    assert.ok(result.iso.startsWith('2024-01-06'));
  });

  it('subtracts hours', () => {
    const result = addTime('2024-01-01T12:00:00Z', -3, 'hours');
    assert.ok(result.iso.startsWith('2024-01-01T09'));
  });

  it('adds months', () => {
    const result = addTime('2024-01-15T00:00:00Z', 2, 'months');
    assert.ok(result.iso.startsWith('2024-03-15'));
  });

  it('adds years', () => {
    const result = addTime('2024-01-01T00:00:00Z', 1, 'years');
    assert.ok(result.iso.startsWith('2025-01-01'));
  });

  it('adds weeks', () => {
    const result = addTime('2024-01-01T00:00:00Z', 2, 'weeks');
    assert.ok(result.iso.startsWith('2024-01-15'));
  });

  it('throws on invalid unit', () => {
    assert.throws(() => addTime('2024-01-01', 1, 'fortnights'), /Invalid unit/);
  });

  it('throws on missing params', () => {
    assert.throws(() => addTime(), /required/);
    assert.throws(() => addTime('2024-01-01'), /required/);
    assert.throws(() => addTime('2024-01-01', 1), /required/);
  });
});

describe('convertTimestamp()', () => {
  it('converts unix to ISO', () => {
    const result = convertTimestamp(1704067200);
    assert.equal(result.iso, '2024-01-01T00:00:00.000Z');
    assert.equal(result.unix, 1704067200);
  });

  it('converts ISO to unix', () => {
    const result = convertTimestamp('2024-01-01T00:00:00Z');
    assert.equal(result.unix, 1704067200);
  });

  it('throws on missing input', () => {
    assert.throws(() => convertTimestamp(), /required/);
  });

  it('throws on invalid input', () => {
    assert.throws(() => convertTimestamp('not-a-date'), /Cannot parse/);
  });
});
