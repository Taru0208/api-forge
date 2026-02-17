import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseCron, nextOccurrences, validateCron } from './cron.js';

describe('parseCron', () => {
  it('parses every-minute expression', () => {
    const r = parseCron('* * * * *');
    assert.deepStrictEqual(r.parsed.minutes.length, 60);
    assert.deepStrictEqual(r.parsed.hours.length, 24);
    assert.strictEqual(r.fields, 5);
    assert.strictEqual(r.hasSeconds, false);
  });

  it('parses specific values', () => {
    const r = parseCron('30 9 * * *');
    assert.deepStrictEqual(r.parsed.minutes, [30]);
    assert.deepStrictEqual(r.parsed.hours, [9]);
  });

  it('parses step expressions', () => {
    const r = parseCron('*/15 * * * *');
    assert.deepStrictEqual(r.parsed.minutes, [0, 15, 30, 45]);
  });

  it('parses ranges', () => {
    const r = parseCron('0 9-17 * * *');
    assert.deepStrictEqual(r.parsed.hours, [9, 10, 11, 12, 13, 14, 15, 16, 17]);
  });

  it('parses comma-separated values', () => {
    const r = parseCron('0 0 1,15 * *');
    assert.deepStrictEqual(r.parsed.days, [1, 15]);
  });

  it('parses month names', () => {
    const r = parseCron('0 0 1 jan,mar,dec *');
    assert.deepStrictEqual(r.parsed.months, [1, 3, 12]);
  });

  it('parses weekday names', () => {
    const r = parseCron('0 0 * * mon-fri');
    assert.deepStrictEqual(r.parsed.weekdays, [1, 2, 3, 4, 5]);
  });

  it('handles weekday 7 as Sunday (same as 0)', () => {
    const r = parseCron('0 0 * * 7');
    assert.deepStrictEqual(r.parsed.weekdays, [0]);
  });

  it('parses 6-field cron (with seconds)', () => {
    const r = parseCron('0 30 9 * * *');
    assert.strictEqual(r.hasSeconds, true);
    assert.strictEqual(r.fields, 6);
    assert.deepStrictEqual(r.parsed.seconds, [0]);
    assert.deepStrictEqual(r.parsed.minutes, [30]);
    assert.deepStrictEqual(r.parsed.hours, [9]);
  });

  it('parses range with step', () => {
    const r = parseCron('0-30/10 * * * *');
    assert.deepStrictEqual(r.parsed.minutes, [0, 10, 20, 30]);
  });

  it('throws on invalid expression', () => {
    assert.throws(() => parseCron('invalid'), /Expected 5 or 6 fields/);
  });

  it('throws on empty input', () => {
    assert.throws(() => parseCron(''), /expression is required/);
  });

  it('throws on out-of-range values', () => {
    assert.throws(() => parseCron('60 * * * *'), /out of range/);
  });
});

describe('describeCron', () => {
  it('describes every minute', () => {
    assert.ok(parseCron('* * * * *').description.toLowerCase().includes('every minute'));
  });

  it('describes daily at specific time', () => {
    const desc = parseCron('0 9 * * *').description;
    assert.ok(desc.includes('9:00 AM'), `Expected "9:00 AM" in "${desc}"`);
  });

  it('describes weekday schedule', () => {
    const desc = parseCron('0 9 * * 1-5').description;
    assert.ok(desc.includes('Monday'), `Expected "Monday" in "${desc}"`);
    assert.ok(desc.includes('Friday'), `Expected "Friday" in "${desc}"`);
  });

  it('describes monthly schedule', () => {
    const desc = parseCron('0 0 1 * *').description;
    assert.ok(desc.includes('day 1'), `Expected "day 1" in "${desc}"`);
  });

  it('describes specific month', () => {
    const desc = parseCron('0 0 1 6 *').description;
    assert.ok(desc.includes('June'), `Expected "June" in "${desc}"`);
  });

  it('describes step pattern', () => {
    const desc = parseCron('*/5 * * * *').description;
    assert.ok(desc.includes('5 minutes'), `Expected "5 minutes" in "${desc}"`);
  });
});

describe('nextOccurrences', () => {
  it('returns correct number of occurrences', () => {
    const results = nextOccurrences('* * * * *', 3, '2026-01-01T00:00:00Z');
    assert.strictEqual(results.length, 3);
  });

  it('returns ISO date strings', () => {
    const results = nextOccurrences('0 9 * * *', 2, '2026-01-01T00:00:00Z');
    assert.strictEqual(results.length, 2);
    assert.ok(results[0].endsWith('Z'));
    assert.ok(results[0].includes('09:00:00'));
  });

  it('respects weekday filter', () => {
    const results = nextOccurrences('0 9 * * 1', 3, '2026-02-01T00:00:00Z'); // Mondays only
    for (const r of results) {
      const d = new Date(r);
      assert.strictEqual(d.getUTCDay(), 1, `${r} should be Monday`);
    }
  });

  it('respects month filter', () => {
    const results = nextOccurrences('0 0 1 3 *', 2, '2026-01-01T00:00:00Z'); // March 1st only
    for (const r of results) {
      const d = new Date(r);
      assert.strictEqual(d.getUTCMonth(), 2); // March = 2 (0-indexed)
      assert.strictEqual(d.getUTCDate(), 1);
    }
  });

  it('limits to 25 max', () => {
    const results = nextOccurrences('* * * * *', 100, '2026-01-01T00:00:00Z');
    assert.strictEqual(results.length, 25);
  });

  it('handles from date string', () => {
    const results = nextOccurrences('0 12 * * *', 1, '2026-06-15T10:00:00Z');
    const d = new Date(results[0]);
    assert.strictEqual(d.getUTCHours(), 12);
    assert.ok(d >= new Date('2026-06-15T10:00:00Z'));
  });

  it('throws on invalid from date', () => {
    assert.throws(() => nextOccurrences('* * * * *', 1, 'not-a-date'), /Invalid "from" date/);
  });
});

describe('validateCron', () => {
  it('validates correct expression', () => {
    const r = validateCron('0 9 * * *');
    assert.strictEqual(r.valid, true);
    assert.ok(r.description);
  });

  it('rejects invalid expression', () => {
    const r = validateCron('bad');
    assert.strictEqual(r.valid, false);
    assert.ok(r.error);
  });

  it('rejects out-of-range values', () => {
    const r = validateCron('99 99 99 99 99');
    assert.strictEqual(r.valid, false);
  });
});
