import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { jsonToCSV, csvToJSON, flattenJSON, unflattenJSON, markdownToHTML } from './transform.js';

describe('jsonToCSV', () => {
  it('converts array of objects', () => {
    const csv = jsonToCSV([{ name: 'Alice', age: 30 }, { name: 'Bob', age: 25 }]);
    assert.equal(csv, 'name,age\nAlice,30\nBob,25');
  });
  it('handles missing fields', () => {
    const csv = jsonToCSV([{ a: 1, b: 2 }, { a: 3, c: 4 }]);
    assert.ok(csv.includes('a,b,c'));
  });
  it('escapes commas', () => {
    const csv = jsonToCSV([{ text: 'hello, world' }]);
    assert.ok(csv.includes('"hello, world"'));
  });
  it('rejects non-array input', () => {
    assert.throws(() => jsonToCSV({ not: 'array' }));
  });
});

describe('csvToJSON', () => {
  it('parses CSV', () => {
    const r = csvToJSON('name,age\nAlice,30\nBob,25');
    assert.equal(r.length, 2);
    assert.equal(r[0].name, 'Alice');
    assert.equal(r[1].age, '25');
  });
  it('handles quoted fields', () => {
    const r = csvToJSON('text\n"hello, world"');
    assert.equal(r[0].text, 'hello, world');
  });
});

describe('flattenJSON', () => {
  it('flattens nested object', () => {
    const r = flattenJSON({ a: { b: { c: 1 } }, d: 2 });
    assert.deepEqual(r, { 'a.b.c': 1, d: 2 });
  });
  it('handles arrays as values', () => {
    const r = flattenJSON({ a: [1, 2, 3] });
    assert.deepEqual(r, { a: [1, 2, 3] });
  });
});

describe('unflattenJSON', () => {
  it('unflattens dot notation', () => {
    const r = unflattenJSON({ 'a.b.c': 1, d: 2 });
    assert.deepEqual(r, { a: { b: { c: 1 } }, d: 2 });
  });
});

describe('markdownToHTML', () => {
  it('converts headers', () => {
    assert.ok(markdownToHTML('# Hello').includes('<h1>Hello</h1>'));
    assert.ok(markdownToHTML('## Sub').includes('<h2>Sub</h2>'));
  });
  it('converts bold/italic', () => {
    assert.ok(markdownToHTML('**bold**').includes('<strong>bold</strong>'));
    assert.ok(markdownToHTML('*italic*').includes('<em>italic</em>'));
  });
  it('converts links', () => {
    assert.ok(markdownToHTML('[text](http://example.com)').includes('<a href="http://example.com">text</a>'));
  });
  it('converts code', () => {
    assert.ok(markdownToHTML('`code`').includes('<code>code</code>'));
  });
});
