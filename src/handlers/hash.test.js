import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { hashText, base64Encode, base64Decode, generateUUID, jwtDecode } from './hash.js';

describe('hashText', () => {
  it('generates SHA-256 hash', async () => {
    const hash = await hashText('hello');
    assert.equal(hash, '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
  });
  it('generates SHA-1 hash', async () => {
    const hash = await hashText('hello', 'SHA-1');
    assert.equal(hash, 'aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d');
  });
  it('rejects invalid algorithm', async () => {
    await assert.rejects(() => hashText('hello', 'MD5'));
  });
});

describe('base64', () => {
  it('encodes and decodes', () => {
    const encoded = base64Encode('Hello World');
    assert.equal(encoded, 'SGVsbG8gV29ybGQ=');
    assert.equal(base64Decode(encoded), 'Hello World');
  });
  it('handles unicode', () => {
    const text = '한글 테스트';
    assert.equal(base64Decode(base64Encode(text)), text);
  });
  it('rejects invalid base64', () => {
    assert.throws(() => base64Decode('!!!invalid!!!'));
  });
});

describe('generateUUID', () => {
  it('returns valid UUID v4', () => {
    const uuid = generateUUID();
    assert.match(uuid, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
  it('generates unique values', () => {
    const a = generateUUID();
    const b = generateUUID();
    assert.notEqual(a, b);
  });
});

describe('jwtDecode', () => {
  it('decodes valid JWT', () => {
    // Test JWT: {"alg":"HS256","typ":"JWT"}.{"sub":"1234567890","name":"John","iat":1516239022}
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4iLCJpYXQiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const r = jwtDecode(token);
    assert.equal(r.header.alg, 'HS256');
    assert.equal(r.payload.name, 'John');
    assert.equal(r.isExpired, null); // no exp field
  });
  it('rejects invalid format', () => {
    assert.throws(() => jwtDecode('not.a.valid.jwt'));
  });
});
