import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  toCamelCase, toSnakeCase, toKebabCase, toPascalCase, toTitleCase,
  toConstantCase, toDotCase, reverse, countOccurrences, similarity,
  pad, wrap
} from './string.js';

describe('toCamelCase', () => {
  it('converts space-separated', () => assert.equal(toCamelCase('hello world'), 'helloWorld'));
  it('converts kebab-case', () => assert.equal(toCamelCase('my-component-name'), 'myComponentName'));
  it('converts snake_case', () => assert.equal(toCamelCase('user_first_name'), 'userFirstName'));
  it('converts PascalCase', () => assert.equal(toCamelCase('HelloWorld'), 'helloWorld'));
});

describe('toSnakeCase', () => {
  it('converts camelCase', () => assert.equal(toSnakeCase('myVariableName'), 'my_variable_name'));
  it('converts spaces', () => assert.equal(toSnakeCase('Hello World'), 'hello_world'));
  it('converts kebab', () => assert.equal(toSnakeCase('my-component'), 'my_component'));
});

describe('toKebabCase', () => {
  it('converts camelCase', () => assert.equal(toKebabCase('myComponentName'), 'my-component-name'));
  it('converts spaces', () => assert.equal(toKebabCase('Hello World'), 'hello-world'));
  it('converts snake', () => assert.equal(toKebabCase('user_name'), 'user-name'));
});

describe('toPascalCase', () => {
  it('converts space-separated', () => assert.equal(toPascalCase('hello world'), 'HelloWorld'));
  it('converts kebab', () => assert.equal(toPascalCase('my-component'), 'MyComponent'));
});

describe('toTitleCase', () => {
  it('capitalizes first letter of each word', () => assert.equal(toTitleCase('hello world foo'), 'Hello World Foo'));
});

describe('toConstantCase', () => {
  it('converts to UPPER_SNAKE', () => assert.equal(toConstantCase('myVariableName'), 'MY_VARIABLE_NAME'));
});

describe('toDotCase', () => {
  it('converts camelCase', () => assert.equal(toDotCase('myPropertyName'), 'my.property.name'));
  it('converts spaces', () => assert.equal(toDotCase('Hello World'), 'hello.world'));
});

describe('reverse', () => {
  it('reverses a string', () => assert.equal(reverse('hello'), 'olleh'));
  it('handles empty', () => assert.equal(reverse(''), ''));
});

describe('countOccurrences', () => {
  it('counts matches', () => assert.equal(countOccurrences('banana', 'an'), 2));
  it('returns 0 for empty', () => assert.equal(countOccurrences('hello', ''), 0));
  it('case insensitive', () => assert.equal(countOccurrences('Hello HELLO', 'hello', false), 2));
});

describe('similarity', () => {
  it('identical = 1', () => assert.equal(similarity('hello', 'hello'), 1));
  it('completely different', () => assert.equal(similarity('abc', 'xyz'), 0));
  it('partial match', () => {
    const s = similarity('kitten', 'sitting');
    assert.ok(s > 0.4 && s < 0.7);
  });
  it('empty vs non-empty = 0', () => assert.equal(similarity('', 'abc'), 0));
});

describe('pad', () => {
  it('pads right', () => assert.equal(pad('hi', 5), 'hi   '));
  it('pads left', () => assert.equal(pad('hi', 5, ' ', 'left'), '   hi'));
  it('pads both', () => assert.equal(pad('hi', 6, ' ', 'both'), '  hi  '));
  it('custom char', () => assert.equal(pad('5', 3, '0', 'left'), '005'));
  it('no-op if already long', () => assert.equal(pad('hello', 3), 'hello'));
});

describe('wrap', () => {
  it('wraps long text', () => {
    const result = wrap('the quick brown fox jumps over the lazy dog', 20);
    const lines = result.split('\n');
    assert.ok(lines.length > 1);
    for (const line of lines) assert.ok(line.length <= 20);
  });
  it('no-op if short', () => assert.equal(wrap('hi', 80), 'hi'));
});
