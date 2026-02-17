import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { regexTest, regexExtract, regexReplace, regexSplit, regexEscape } from './regex.js';

describe('regexTest()', () => {
  it('returns true for matching pattern', () => {
    const result = regexTest('hello world', 'hello');
    assert.equal(result.matches, true);
  });

  it('returns false for non-matching pattern', () => {
    const result = regexTest('hello world', 'goodbye');
    assert.equal(result.matches, false);
  });

  it('supports flags', () => {
    assert.equal(regexTest('Hello', 'hello', 'i').matches, true);
    assert.equal(regexTest('Hello', 'hello').matches, false);
  });

  it('throws on missing text', () => {
    assert.throws(() => regexTest(undefined, 'test'), /required/);
  });

  it('throws on missing pattern', () => {
    assert.throws(() => regexTest('text'), /required/);
  });

  it('throws on invalid regex', () => {
    assert.throws(() => regexTest('text', '[invalid'), /Invalid regex/);
  });
});

describe('regexExtract()', () => {
  it('extracts all matches', () => {
    const result = regexExtract('cat bat hat', '[a-z]at');
    assert.equal(result.count, 3);
    assert.equal(result.matches[0].match, 'cat');
    assert.equal(result.matches[1].match, 'bat');
  });

  it('includes capture groups', () => {
    const result = regexExtract('2024-01-15', '(\\d{4})-(\\d{2})-(\\d{2})');
    assert.equal(result.count, 1);
    assert.deepEqual(result.matches[0].groups, ['2024', '01', '15']);
  });

  it('returns index of match', () => {
    const result = regexExtract('hello world', 'world');
    assert.equal(result.matches[0].index, 6);
  });

  it('handles no matches', () => {
    const result = regexExtract('hello', '\\d+');
    assert.equal(result.count, 0);
    assert.deepEqual(result.matches, []);
  });

  it('extracts emails', () => {
    const result = regexExtract('Contact us at info@example.com or admin@test.org', '[\\w.+-]+@[\\w-]+\\.[\\w.]+');
    assert.equal(result.count, 2);
  });
});

describe('regexReplace()', () => {
  it('replaces matches', () => {
    const result = regexReplace('hello world', 'world', 'earth');
    assert.equal(result.result, 'hello earth');
    assert.equal(result.replacements, 1);
  });

  it('replaces all occurrences with g flag', () => {
    const result = regexReplace('aaa bbb aaa', 'aaa', 'ccc', 'g');
    assert.equal(result.result, 'ccc bbb ccc');
    assert.equal(result.replacements, 2);
  });

  it('supports capture group references', () => {
    const result = regexReplace('John Smith', '(\\w+) (\\w+)', '$2, $1');
    assert.equal(result.result, 'Smith, John');
  });

  it('throws on missing params', () => {
    assert.throws(() => regexReplace('text', 'x'), /required/);
  });
});

describe('regexSplit()', () => {
  it('splits by pattern', () => {
    const result = regexSplit('one,two,,three', ',+');
    assert.equal(result.count, 3);
    assert.deepEqual(result.parts, ['one', 'two', 'three']);
  });

  it('supports limit', () => {
    const result = regexSplit('a-b-c-d', '-', 2);
    assert.equal(result.count, 2);
    assert.deepEqual(result.parts, ['a', 'b']);
  });

  it('splits by whitespace', () => {
    const result = regexSplit('hello   world  test', '\\s+');
    assert.equal(result.count, 3);
  });
});

describe('regexEscape()', () => {
  it('escapes special characters', () => {
    const result = regexEscape('price is $9.99 (USD)');
    assert.equal(result.escaped, 'price is \\$9\\.99 \\(USD\\)');
  });

  it('handles string with no special chars', () => {
    const result = regexEscape('hello');
    assert.equal(result.escaped, 'hello');
  });

  it('throws on missing text', () => {
    assert.throws(() => regexEscape(), /required/);
  });
});
