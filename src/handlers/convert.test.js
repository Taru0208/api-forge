import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { convert, listUnits } from './convert.js';

describe('convert - temperature', () => {
  it('converts C to F', () => {
    assert.equal(convert(100, 'C', 'F'), 212);
    assert.equal(convert(0, 'C', 'F'), 32);
  });

  it('converts F to C', () => {
    assert.equal(convert(212, 'F', 'C'), 100);
    assert.equal(convert(32, 'F', 'C'), 0);
  });

  it('converts C to K', () => {
    assert.equal(convert(0, 'C', 'K'), 273.15);
  });

  it('converts K to C', () => {
    assert.equal(convert(273.15, 'K', 'C'), 0);
  });
});

describe('convert - length', () => {
  it('converts km to mi', () => {
    const result = convert(1, 'km', 'mi');
    assert.ok(Math.abs(result - 0.62137119) < 0.001);
  });

  it('converts m to ft', () => {
    const result = convert(1, 'm', 'ft');
    assert.ok(Math.abs(result - 3.28084) < 0.001);
  });

  it('converts in to cm', () => {
    const result = convert(1, 'in', 'cm');
    assert.ok(Math.abs(result - 2.54) < 0.001);
  });
});

describe('convert - weight', () => {
  it('converts kg to lb', () => {
    const result = convert(1, 'kg', 'lb');
    assert.ok(Math.abs(result - 2.20462) < 0.001);
  });

  it('converts lb to kg', () => {
    const result = convert(1, 'lb', 'kg');
    assert.ok(Math.abs(result - 0.453592) < 0.001);
  });

  it('converts g to oz', () => {
    const result = convert(100, 'g', 'oz');
    assert.ok(Math.abs(result - 3.5274) < 0.01);
  });
});

describe('convert - speed', () => {
  it('converts km/h to mph', () => {
    const result = convert(100, 'km/h', 'mph');
    assert.ok(Math.abs(result - 62.137) < 0.1);
  });
});

describe('convert - data', () => {
  it('converts GB to MB', () => {
    assert.equal(convert(1, 'GB', 'MB'), 1024);
  });

  it('converts MB to KB', () => {
    assert.equal(convert(1, 'MB', 'KB'), 1024);
  });
});

describe('convert - time', () => {
  it('converts hours to minutes', () => {
    assert.equal(convert(1, 'h', 'min'), 60);
  });

  it('converts days to hours', () => {
    assert.equal(convert(1, 'd', 'h'), 24);
  });
});

describe('convert - area', () => {
  it('converts km² to acres', () => {
    const result = convert(1, 'km²', 'acre');
    assert.ok(Math.abs(result - 247.105) < 0.1);
  });
});

describe('convert - errors', () => {
  it('rejects unknown units', () => {
    assert.throws(() => convert(1, 'foo', 'bar'));
  });

  it('rejects mismatched categories', () => {
    assert.throws(() => convert(1, 'km', 'kg', 'length'));
  });
});

describe('listUnits', () => {
  it('lists all categories', () => {
    const result = listUnits();
    assert.ok('length' in result);
    assert.ok('weight' in result);
    assert.ok('temperature' in result);
  });

  it('lists units for a category', () => {
    const result = listUnits('length');
    assert.ok(result.includes('km'));
    assert.ok(result.includes('mi'));
  });
});
