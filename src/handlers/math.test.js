import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  descriptiveStats, percentile, percentiles, correlation, linearRegression,
  zScore, normalize, histogram, outliers, evaluateExpression,
} from './math.js';

describe('descriptiveStats', () => {
  it('computes basic statistics', () => {
    const r = descriptiveStats([1, 2, 3, 4, 5]);
    assert.equal(r.count, 5);
    assert.equal(r.sum, 15);
    assert.equal(r.mean, 3);
    assert.equal(r.median, 3);
    assert.equal(r.min, 1);
    assert.equal(r.max, 5);
    assert.equal(r.range, 4);
  });

  it('computes median for even count', () => {
    const r = descriptiveStats([1, 2, 3, 4]);
    assert.equal(r.median, 2.5);
  });

  it('computes standard deviation', () => {
    const r = descriptiveStats([2, 4, 4, 4, 5, 5, 7, 9]);
    assert.ok(Math.abs(r.stdDev - 2) < 0.01);
  });

  it('finds mode', () => {
    const r = descriptiveStats([1, 2, 2, 3, 3, 3, 4]);
    assert.deepEqual(r.mode, [3]);
  });

  it('returns empty mode when no repeats', () => {
    const r = descriptiveStats([1, 2, 3, 4, 5]);
    assert.deepEqual(r.mode, []);
  });

  it('throws on empty array', () => {
    assert.throws(() => descriptiveStats([]), /non-empty/);
  });
});

describe('percentile', () => {
  it('computes 50th percentile (median)', () => {
    assert.equal(percentile([1, 2, 3, 4, 5], 50), 3);
  });

  it('computes 25th and 75th percentiles', () => {
    const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    assert.equal(percentile(data, 25), 3.25);
    assert.equal(percentile(data, 75), 7.75);
  });

  it('handles 0th and 100th', () => {
    assert.equal(percentile([10, 20, 30], 0), 10);
    assert.equal(percentile([10, 20, 30], 100), 30);
  });

  it('throws on invalid percentile', () => {
    assert.throws(() => percentile([1, 2], -1));
    assert.throws(() => percentile([1, 2], 101));
  });
});

describe('percentiles', () => {
  it('computes multiple percentiles', () => {
    const r = percentiles([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [25, 50, 75]);
    assert.ok('p25' in r);
    assert.ok('p50' in r);
    assert.ok('p75' in r);
    assert.equal(r.p50, 5.5);
  });
});

describe('correlation', () => {
  it('detects perfect positive correlation', () => {
    const r = correlation([1, 2, 3, 4, 5], [2, 4, 6, 8, 10]);
    assert.equal(r.r, 1);
    assert.equal(r.rSquared, 1);
  });

  it('detects perfect negative correlation', () => {
    const r = correlation([1, 2, 3, 4, 5], [10, 8, 6, 4, 2]);
    assert.equal(r.r, -1);
  });

  it('detects weak correlation', () => {
    const r = correlation([1, 2, 3, 4, 5], [5, 1, 3, 5, 1]);
    assert.ok(Math.abs(r.r) < 0.7, `Expected weak, got r=${r.r}`);
  });

  it('provides interpretation', () => {
    const r = correlation([1, 2, 3], [1, 2, 3]);
    assert.ok(r.interpretation.includes('positive'));
  });

  it('throws on mismatched lengths', () => {
    assert.throws(() => correlation([1, 2], [1, 2, 3]));
  });
});

describe('linearRegression', () => {
  it('fits perfect line', () => {
    const r = linearRegression([1, 2, 3, 4], [2, 4, 6, 8]);
    assert.equal(r.slope, 2);
    assert.equal(r.intercept, 0);
    assert.equal(r.rSquared, 1);
  });

  it('fits line with intercept', () => {
    const r = linearRegression([0, 1, 2, 3], [1, 3, 5, 7]);
    assert.equal(r.slope, 2);
    assert.equal(r.intercept, 1);
  });

  it('provides equation string', () => {
    const r = linearRegression([1, 2, 3], [2, 4, 6]);
    assert.ok(r.equation.startsWith('y = '));
  });
});

describe('zScore', () => {
  it('computes z-score', () => {
    assert.equal(zScore(100, 80, 10), 2);
    assert.equal(zScore(60, 80, 10), -2);
  });

  it('throws on zero std dev', () => {
    assert.throws(() => zScore(5, 5, 0));
  });
});

describe('normalize', () => {
  it('normalizes to 0-1', () => {
    const r = normalize([10, 20, 30, 40, 50]);
    assert.equal(r[0], 0);
    assert.equal(r[4], 1);
    assert.equal(r[2], 0.5);
  });

  it('normalizes to custom range', () => {
    const r = normalize([0, 50, 100], { min: -1, max: 1 });
    assert.equal(r[0], -1);
    assert.equal(r[1], 0);
    assert.equal(r[2], 1);
  });

  it('handles uniform data', () => {
    const r = normalize([5, 5, 5]);
    assert.deepEqual(r, [0, 0, 0]);
  });
});

describe('histogram', () => {
  it('creates histogram bins', () => {
    const r = histogram([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5);
    assert.equal(r.bins.length, 5);
    assert.equal(r.total, 10);
    const totalCount = r.bins.reduce((a, b) => a + b.count, 0);
    assert.equal(totalCount, 10);
  });

  it('each bin has range and percentage', () => {
    const r = histogram([1, 2, 3, 4, 5], 2);
    assert.ok(r.bins[0].range.length === 2);
    assert.ok(typeof r.bins[0].percentage === 'number');
  });
});

describe('outliers', () => {
  it('detects IQR outliers', () => {
    const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 100];
    const r = outliers(data, 'iqr');
    assert.ok(r.outliers.includes(100));
    assert.ok(r.count >= 1);
  });

  it('detects z-score outliers', () => {
    const data = [10, 10, 10, 10, 10, 10, 10, 100];
    const r = outliers(data, 'zscore');
    assert.ok(r.outliers.includes(100));
  });

  it('returns IQR bounds', () => {
    const r = outliers([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    assert.ok('q1' in r);
    assert.ok('q3' in r);
    assert.ok('iqr' in r);
  });
});

describe('evaluateExpression', () => {
  it('evaluates basic arithmetic', () => {
    assert.equal(evaluateExpression('2 + 3'), 5);
    assert.equal(evaluateExpression('10 - 4'), 6);
    assert.equal(evaluateExpression('3 * 7'), 21);
    assert.equal(evaluateExpression('15 / 3'), 5);
  });

  it('respects operator precedence', () => {
    assert.equal(evaluateExpression('2 + 3 * 4'), 14);
    assert.equal(evaluateExpression('(2 + 3) * 4'), 20);
  });

  it('handles exponentiation', () => {
    assert.equal(evaluateExpression('2 ^ 10'), 1024);
  });

  it('handles math functions', () => {
    assert.equal(evaluateExpression('sqrt(16)'), 4);
    assert.equal(evaluateExpression('abs(-5)'), 5);
  });

  it('handles constants', () => {
    assert.ok(Math.abs(evaluateExpression('pi') - Math.PI) < 1e-8);
    assert.ok(Math.abs(evaluateExpression('e') - Math.E) < 1e-8);
  });

  it('handles negative numbers', () => {
    assert.equal(evaluateExpression('-5 + 3'), -2);
    assert.equal(evaluateExpression('-(2 + 3)'), -5);
  });

  it('handles modulo', () => {
    assert.equal(evaluateExpression('10 % 3'), 1);
  });

  it('throws on division by zero', () => {
    assert.throws(() => evaluateExpression('1 / 0'));
  });

  it('throws on invalid expression', () => {
    assert.throws(() => evaluateExpression('2 +'));
  });
});
