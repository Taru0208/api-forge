import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { jsonToXML, xmlToJSON, validateXML, formatXML } from './xml.js';

describe('jsonToXML', () => {
  it('converts simple object', () => {
    const xml = jsonToXML({ name: 'Alice', age: 30 });
    assert.ok(xml.includes('<?xml version="1.0" encoding="UTF-8"?>'));
    assert.ok(xml.includes('<name>Alice</name>'));
    assert.ok(xml.includes('<age>30</age>'));
    assert.ok(xml.includes('<root>'));
  });

  it('converts nested objects', () => {
    const xml = jsonToXML({ user: { name: 'Bob', address: { city: 'Seoul' } } });
    assert.ok(xml.includes('<user>'));
    assert.ok(xml.includes('<address>'));
    assert.ok(xml.includes('<city>Seoul</city>'));
  });

  it('converts arrays', () => {
    const xml = jsonToXML({ items: [1, 2, 3] });
    assert.ok(xml.includes('<items>'));
    assert.ok(xml.includes('<item>1</item>'));
    assert.ok(xml.includes('<item>2</item>'));
    assert.ok(xml.includes('<item>3</item>'));
  });

  it('handles null values as self-closing tags', () => {
    const xml = jsonToXML({ value: null });
    assert.ok(xml.includes('<value/>'));
  });

  it('handles empty arrays', () => {
    const xml = jsonToXML({ items: [] });
    assert.ok(xml.includes('<items/>'));
  });

  it('custom root name', () => {
    const xml = jsonToXML({ a: 1 }, { rootName: 'data' });
    assert.ok(xml.includes('<data>'));
    assert.ok(xml.includes('</data>'));
  });

  it('no declaration', () => {
    const xml = jsonToXML({ a: 1 }, { declaration: false });
    assert.ok(!xml.includes('<?xml'));
  });

  it('custom item name', () => {
    const xml = jsonToXML({ items: [1, 2] }, { itemName: 'entry' });
    assert.ok(xml.includes('<entry>1</entry>'));
  });

  it('escapes special characters in text', () => {
    const xml = jsonToXML({ text: 'a < b & c > d "e" \'f\'' });
    assert.ok(xml.includes('&lt;'));
    assert.ok(xml.includes('&amp;'));
    assert.ok(xml.includes('&gt;'));
  });

  it('handles boolean values', () => {
    const xml = jsonToXML({ active: true, deleted: false });
    assert.ok(xml.includes('<active>true</active>'));
    assert.ok(xml.includes('<deleted>false</deleted>'));
  });

  it('handles deeply nested structure', () => {
    const xml = jsonToXML({ a: { b: { c: { d: 'deep' } } } });
    assert.ok(xml.includes('<d>deep</d>'));
  });

  it('no indent option', () => {
    const xml = jsonToXML({ a: 1 }, { indent: false });
    assert.ok(!xml.includes('  '));
  });
});

describe('xmlToJSON', () => {
  it('parses simple XML', () => {
    const json = xmlToJSON('<root><name>Alice</name><age>30</age></root>');
    assert.deepEqual(json, { root: { name: 'Alice', age: 30 } });
  });

  it('parses nested XML', () => {
    const json = xmlToJSON('<root><user><name>Bob</name></user></root>');
    assert.deepEqual(json, { root: { user: { name: 'Bob' } } });
  });

  it('parses duplicate children as arrays', () => {
    const json = xmlToJSON('<root><item>1</item><item>2</item><item>3</item></root>');
    assert.deepEqual(json, { root: { item: [1, 2, 3] } });
  });

  it('parses self-closing tags', () => {
    const json = xmlToJSON('<root><empty/></root>');
    assert.deepEqual(json, { root: { empty: '' } });
  });

  it('parses attributes', () => {
    const json = xmlToJSON('<root><item id="1">hello</item></root>');
    assert.deepEqual(json, { root: { item: { '@id': '1', '#text': 'hello' } } });
  });

  it('strips XML declaration', () => {
    const json = xmlToJSON('<?xml version="1.0" encoding="UTF-8"?><root><a>1</a></root>');
    assert.deepEqual(json, { root: { a: 1 } });
  });

  it('parses boolean values', () => {
    const json = xmlToJSON('<root><active>true</active><deleted>false</deleted></root>');
    assert.deepEqual(json, { root: { active: true, deleted: false } });
  });

  it('parses null value', () => {
    const json = xmlToJSON('<root><value>null</value></root>');
    assert.deepEqual(json, { root: { value: null } });
  });

  it('handles mixed content', () => {
    const json = xmlToJSON('<root><a>1</a><b><c>2</c></b></root>');
    assert.deepEqual(json, { root: { a: 1, b: { c: 2 } } });
  });

  it('throws on invalid XML', () => {
    assert.throws(() => xmlToJSON('not xml'), /Invalid XML/);
  });

  it('alwaysArray option', () => {
    const json = xmlToJSON('<root><item>single</item></root>', { alwaysArray: ['item'] });
    assert.deepEqual(json, { root: { item: ['single'] } });
  });

  it('handles XML comments', () => {
    const json = xmlToJSON('<root><!-- comment --><a>1</a></root>');
    assert.deepEqual(json, { root: { a: 1 } });
  });

  it('handles CDATA', () => {
    const json = xmlToJSON('<root><text><![CDATA[Hello <World>]]></text></root>');
    assert.deepEqual(json, { root: { text: 'Hello <World>' } });
  });
});

describe('validateXML', () => {
  it('valid XML returns true', () => {
    const result = validateXML('<root><a>1</a></root>');
    assert.equal(result.valid, true);
  });

  it('invalid XML returns false with error', () => {
    const result = validateXML('not xml at all');
    assert.equal(result.valid, false);
    assert.ok(result.error);
  });
});

describe('formatXML', () => {
  it('formats compressed XML', () => {
    const formatted = formatXML('<root><a>1</a><b><c>2</c></b></root>');
    assert.ok(formatted.includes('\n'));
    const lines = formatted.split('\n');
    assert.ok(lines.length >= 3);
  });

  it('preserves declaration', () => {
    const formatted = formatXML('<?xml version="1.0"?><root><a>1</a></root>');
    assert.ok(formatted.startsWith('<?xml'));
  });

  it('custom indent size', () => {
    const formatted = formatXML('<root><a>1</a></root>', 4);
    assert.ok(formatted.includes('    <a>'));
  });
});

describe('roundtrip', () => {
  it('JSON -> XML -> JSON preserves structure', () => {
    const original = { name: 'test', count: 42, active: true };
    const xml = jsonToXML(original);
    const parsed = xmlToJSON(xml);
    assert.deepEqual(parsed.root, original);
  });

  it('handles nested roundtrip', () => {
    const original = { user: { name: 'Alice', settings: { theme: 'dark', lang: 'en' } } };
    const xml = jsonToXML(original);
    const parsed = xmlToJSON(xml);
    assert.deepEqual(parsed.root, original);
  });
});
