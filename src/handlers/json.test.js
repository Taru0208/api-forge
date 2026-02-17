import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatJSON, minifyJSON, sortKeys, queryJSON, diffJSON, statsJSON } from './json.js';

describe('formatJSON', () => {
  it('formats with default indent', () => {
    const result = formatJSON('{"b":1,"a":2}');
    assert.equal(result, '{\n  "b": 1,\n  "a": 2\n}');
  });

  it('accepts object input', () => {
    const result = formatJSON({ x: 1 }, 4);
    assert.equal(result, '{\n    "x": 1\n}');
  });
});

describe('minifyJSON', () => {
  it('minifies string input', () => {
    assert.equal(minifyJSON('{ "a" : 1 , "b" : 2 }'), '{"a":1,"b":2}');
  });

  it('minifies object input', () => {
    assert.equal(minifyJSON({ a: 1, b: [2, 3] }), '{"a":1,"b":[2,3]}');
  });
});

describe('sortKeys', () => {
  it('sorts keys alphabetically', () => {
    const result = sortKeys({ c: 3, a: 1, b: 2 });
    assert.deepEqual(Object.keys(result), ['a', 'b', 'c']);
  });

  it('sorts recursively by default', () => {
    const result = sortKeys({ z: { b: 2, a: 1 }, a: 1 });
    assert.deepEqual(Object.keys(result), ['a', 'z']);
    assert.deepEqual(Object.keys(result.z), ['a', 'b']);
  });

  it('handles arrays', () => {
    const result = sortKeys({ b: [{ z: 1, a: 2 }], a: 1 });
    assert.deepEqual(Object.keys(result.b[0]), ['a', 'z']);
  });

  it('accepts string input', () => {
    const result = sortKeys('{"b":1,"a":2}');
    assert.deepEqual(Object.keys(result), ['a', 'b']);
  });
});

describe('queryJSON', () => {
  const data = { user: { name: 'Alice', scores: [10, 20, 30] } };

  it('queries nested keys', () => {
    assert.equal(queryJSON(data, 'user.name'), 'Alice');
  });

  it('queries array indices', () => {
    assert.equal(queryJSON(data, 'user.scores[1]'), 20);
  });

  it('returns undefined for missing paths', () => {
    assert.equal(queryJSON(data, 'user.email'), undefined);
  });

  it('accepts string input', () => {
    assert.equal(queryJSON('{"a":{"b":1}}', 'a.b'), 1);
  });
});

describe('diffJSON', () => {
  it('detects additions', () => {
    const changes = diffJSON({ a: 1 }, { a: 1, b: 2 });
    assert.equal(changes.length, 1);
    assert.equal(changes[0].type, 'added');
    assert.equal(changes[0].path, 'b');
  });

  it('detects removals', () => {
    const changes = diffJSON({ a: 1, b: 2 }, { a: 1 });
    assert.equal(changes.length, 1);
    assert.equal(changes[0].type, 'removed');
  });

  it('detects changes', () => {
    const changes = diffJSON({ a: 1 }, { a: 2 });
    assert.equal(changes[0].type, 'changed');
    assert.equal(changes[0].from, 1);
    assert.equal(changes[0].to, 2);
  });

  it('detects nested changes', () => {
    const changes = diffJSON({ a: { b: 1 } }, { a: { b: 2 } });
    assert.equal(changes[0].path, 'a.b');
  });

  it('returns empty for identical objects', () => {
    assert.deepEqual(diffJSON({ a: 1 }, { a: 1 }), []);
  });
});

describe('statsJSON', () => {
  it('counts basic stats', () => {
    const stats = statsJSON({ a: 'hello', b: 42, c: true, d: null, e: [1, 2] });
    assert.equal(stats.keys, 5);
    assert.equal(stats.strings, 1);
    assert.equal(stats.numbers, 3); // 42, 1, 2
    assert.equal(stats.booleans, 1);
    assert.equal(stats.nulls, 1);
    assert.equal(stats.arrays, 1);
    assert.equal(stats.objects, 1);
  });

  it('measures depth', () => {
    const stats = statsJSON({ a: { b: { c: 1 } } });
    assert.equal(stats.depth, 3);
  });

  it('calculates size', () => {
    const obj = { x: 1 };
    const stats = statsJSON(obj);
    assert.equal(stats.size, JSON.stringify(obj).length);
  });
});
