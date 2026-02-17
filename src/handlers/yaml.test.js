import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { yamlToJSON, jsonToYAML, validateYAML } from './yaml.js';

// --- yamlToJSON ---

describe('yamlToJSON — simple key-value', () => {
  it('parses string values', () => {
    const result = yamlToJSON('name: Alice');
    assert.deepEqual(result, { name: 'Alice' });
  });

  it('parses integer values', () => {
    const result = yamlToJSON('port: 8080');
    assert.deepEqual(result, { port: 8080 });
  });

  it('parses float values', () => {
    const result = yamlToJSON('pi: 3.14');
    assert.deepEqual(result, { pi: 3.14 });
  });

  it('parses multiple key-value pairs', () => {
    const yaml = 'name: Bob\nage: 30\ncity: Seoul';
    const result = yamlToJSON(yaml);
    assert.deepEqual(result, { name: 'Bob', age: 30, city: 'Seoul' });
  });
});

describe('yamlToJSON — booleans and null', () => {
  it('parses true/false', () => {
    const yaml = 'a: true\nb: false';
    const result = yamlToJSON(yaml);
    assert.deepEqual(result, { a: true, b: false });
  });

  it('parses yes/no as booleans', () => {
    const yaml = 'enabled: yes\nverbose: no';
    const result = yamlToJSON(yaml);
    assert.deepEqual(result, { enabled: true, verbose: false });
  });

  it('parses Yes/No and True/False variants', () => {
    const yaml = 'a: Yes\nb: No\nc: True\nd: False';
    const result = yamlToJSON(yaml);
    assert.deepEqual(result, { a: true, b: false, c: true, d: false });
  });

  it('parses null variants', () => {
    const yaml = 'a: null\nb: ~\nc: Null';
    const result = yamlToJSON(yaml);
    assert.deepEqual(result, { a: null, b: null, c: null });
  });

  it('parses empty value as null', () => {
    // key with colon and nothing after — but no nested block
    const yaml = 'empty:';
    const result = yamlToJSON(yaml);
    assert.deepEqual(result, { empty: null });
  });
});

describe('yamlToJSON — nested objects', () => {
  it('parses one level of nesting', () => {
    const yaml = 'server:\n  host: localhost\n  port: 3000';
    const result = yamlToJSON(yaml);
    assert.deepEqual(result, { server: { host: 'localhost', port: 3000 } });
  });

  it('parses deep nesting', () => {
    const yaml = 'a:\n  b:\n    c:\n      d: deep';
    const result = yamlToJSON(yaml);
    assert.deepEqual(result, { a: { b: { c: { d: 'deep' } } } });
  });
});

describe('yamlToJSON — arrays', () => {
  it('parses simple arrays', () => {
    const yaml = 'fruits:\n  - apple\n  - banana\n  - cherry';
    const result = yamlToJSON(yaml);
    assert.deepEqual(result, { fruits: ['apple', 'banana', 'cherry'] });
  });

  it('parses arrays of numbers', () => {
    const yaml = 'scores:\n  - 100\n  - 85\n  - 92';
    const result = yamlToJSON(yaml);
    assert.deepEqual(result, { scores: [100, 85, 92] });
  });

  it('parses arrays with mixed types', () => {
    const yaml = 'mix:\n  - hello\n  - 42\n  - true\n  - null';
    const result = yamlToJSON(yaml);
    assert.deepEqual(result, { mix: ['hello', 42, true, null] });
  });

  it('parses top-level array', () => {
    const yaml = '- one\n- two\n- three';
    const result = yamlToJSON(yaml);
    assert.deepEqual(result, ['one', 'two', 'three']);
  });

  it('parses array of objects', () => {
    const yaml = 'users:\n  - name: Alice\n    age: 30\n  - name: Bob\n    age: 25';
    const result = yamlToJSON(yaml);
    assert.deepEqual(result, {
      users: [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
      ],
    });
  });
});

describe('yamlToJSON — quoted strings', () => {
  it('parses double-quoted strings', () => {
    const yaml = 'msg: "hello world"';
    const result = yamlToJSON(yaml);
    assert.deepEqual(result, { msg: 'hello world' });
  });

  it('parses single-quoted strings', () => {
    const yaml = "msg: 'hello world'";
    const result = yamlToJSON(yaml);
    assert.deepEqual(result, { msg: 'hello world' });
  });

  it('preserves quoted booleans as strings', () => {
    const yaml = 'val: "true"';
    const result = yamlToJSON(yaml);
    assert.deepEqual(result, { val: 'true' });
  });

  it('preserves quoted numbers as strings', () => {
    const yaml = "zip: '00123'";
    const result = yamlToJSON(yaml);
    assert.deepEqual(result, { zip: '00123' });
  });
});

describe('yamlToJSON — comments', () => {
  it('ignores full-line comments', () => {
    const yaml = '# This is a comment\nname: Alice';
    const result = yamlToJSON(yaml);
    assert.deepEqual(result, { name: 'Alice' });
  });

  it('ignores inline comments', () => {
    const yaml = 'port: 8080 # default port';
    const result = yamlToJSON(yaml);
    assert.deepEqual(result, { port: 8080 });
  });
});

describe('yamlToJSON — block scalars', () => {
  it('parses literal block scalar (|)', () => {
    const yaml = 'bio: |\n  Line one\n  Line two\n  Line three';
    const result = yamlToJSON(yaml);
    assert.equal(result.bio, 'Line one\nLine two\nLine three\n');
  });

  it('parses folded block scalar (>)', () => {
    const yaml = 'desc: >\n  This is a\n  long paragraph\n  folded into one';
    const result = yamlToJSON(yaml);
    assert.equal(result.desc, 'This is a long paragraph folded into one\n');
  });

  it('parses block scalar with strip chomping (|-)', () => {
    const yaml = 'text: |-\n  no trailing newline';
    const result = yamlToJSON(yaml);
    assert.equal(result.text, 'no trailing newline');
  });
});

describe('yamlToJSON — inline collections', () => {
  it('parses inline object', () => {
    const yaml = 'point: {x: 1, y: 2}';
    const result = yamlToJSON(yaml);
    assert.deepEqual(result, { point: { x: 1, y: 2 } });
  });

  it('parses inline array', () => {
    const yaml = 'colors: [red, green, blue]';
    const result = yamlToJSON(yaml);
    assert.deepEqual(result, { colors: ['red', 'green', 'blue'] });
  });

  it('parses nested inline structures', () => {
    const yaml = 'data: {list: [1, 2], flag: true}';
    const result = yamlToJSON(yaml);
    assert.deepEqual(result, { data: { list: [1, 2], flag: true } });
  });
});

describe('yamlToJSON — empty/null input', () => {
  it('returns null for empty string', () => {
    assert.equal(yamlToJSON(''), null);
  });

  it('returns null for whitespace only', () => {
    assert.equal(yamlToJSON('   \n\n  '), null);
  });

  it('returns null for null input', () => {
    assert.equal(yamlToJSON(null), null);
  });

  it('returns null for undefined input', () => {
    assert.equal(yamlToJSON(undefined), null);
  });
});

// --- jsonToYAML ---

describe('jsonToYAML', () => {
  it('serializes simple object', () => {
    const yaml = jsonToYAML({ name: 'Alice', age: 30 });
    assert.ok(yaml.includes('name: Alice'));
    assert.ok(yaml.includes('age: 30'));
  });

  it('serializes nested objects', () => {
    const yaml = jsonToYAML({ server: { host: 'localhost', port: 3000 } });
    assert.ok(yaml.includes('server:'));
    assert.ok(yaml.includes('  host: localhost'));
    assert.ok(yaml.includes('  port: 3000'));
  });

  it('serializes arrays', () => {
    const yaml = jsonToYAML({ items: ['a', 'b', 'c'] });
    assert.ok(yaml.includes('items:'));
    assert.ok(yaml.includes('  - a'));
    assert.ok(yaml.includes('  - b'));
  });

  it('serializes null and booleans', () => {
    const yaml = jsonToYAML({ a: null, b: true, c: false });
    assert.ok(yaml.includes('a: null'));
    assert.ok(yaml.includes('b: true'));
    assert.ok(yaml.includes('c: false'));
  });

  it('quotes strings that look like booleans', () => {
    const yaml = jsonToYAML({ val: 'true' });
    assert.ok(yaml.includes('"true"'));
  });

  it('quotes strings that look like numbers', () => {
    const yaml = jsonToYAML({ zip: '00123' });
    assert.ok(yaml.includes('"00123"'));
  });

  it('serializes empty object and array', () => {
    const yaml = jsonToYAML({ obj: {}, arr: [] });
    assert.ok(yaml.includes('obj: {}'));
    assert.ok(yaml.includes('arr: []'));
  });

  it('respects custom indent', () => {
    const yaml = jsonToYAML({ a: { b: 1 } }, { indent: 4 });
    assert.ok(yaml.includes('    b: 1'));
  });

  it('serializes top-level null', () => {
    assert.equal(jsonToYAML(null), 'null\n');
  });

  it('serializes top-level string', () => {
    assert.equal(jsonToYAML('hello'), 'hello\n');
  });
});

// --- validateYAML ---

describe('validateYAML', () => {
  it('returns valid for correct YAML', () => {
    const result = validateYAML('name: Alice\nage: 30');
    assert.equal(result.valid, true);
    assert.equal(result.error, undefined);
  });

  it('returns valid for empty input', () => {
    const result = validateYAML('');
    assert.equal(result.valid, true);
  });

  it('returns invalid for malformed inline object', () => {
    const result = validateYAML('data: {key: val');
    assert.equal(result.valid, false);
    assert.ok(typeof result.error === 'string');
  });
});

// --- Round-trip ---

describe('round-trip yamlToJSON → jsonToYAML → yamlToJSON', () => {
  it('preserves simple structures', () => {
    const original = { name: 'Taru', version: 1, enabled: true, tags: ['a', 'b'] };
    const yaml = jsonToYAML(original);
    const parsed = yamlToJSON(yaml);
    assert.deepEqual(parsed, original);
  });

  it('preserves nested structures', () => {
    const original = {
      database: { host: 'localhost', port: 5432 },
      features: ['auth', 'logging'],
    };
    const yaml = jsonToYAML(original);
    const parsed = yamlToJSON(yaml);
    assert.deepEqual(parsed, original);
  });
});
