import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { jwtEncode, jwtDecode, jwtVerify } from './jwt.js';

describe('JWT Utilities', () => {
  const secret = 'test-secret-key-for-testing';
  const payload = { sub: '1234567890', name: 'Test User', admin: true };

  describe('jwtEncode', () => {
    it('throws on missing payload', async () => {
      await assert.rejects(() => jwtEncode(null, secret), /Payload must be an object/);
    });

    it('throws on missing secret', async () => {
      await assert.rejects(() => jwtEncode(payload, ''), /Secret is required/);
    });

    it('throws on invalid algorithm', async () => {
      await assert.rejects(() => jwtEncode(payload, secret, { algorithm: 'RS256' }), /HS256, HS384, or HS512/);
    });

    it('encodes a valid JWT with HS256', async () => {
      const token = await jwtEncode(payload, secret);
      assert.ok(typeof token === 'string');
      const parts = token.split('.');
      assert.equal(parts.length, 3);
    });

    it('sets iat automatically', async () => {
      const token = await jwtEncode({ sub: '123' }, secret);
      const decoded = jwtDecode(token);
      assert.ok(decoded.payload.iat > 0);
    });

    it('sets exp with expiresIn option', async () => {
      const token = await jwtEncode({ sub: '123' }, secret, { expiresIn: 3600 });
      const decoded = jwtDecode(token);
      assert.ok(decoded.payload.exp > decoded.payload.iat);
      assert.equal(decoded.payload.exp - decoded.payload.iat, 3600);
    });

    it('uses HS384 algorithm', async () => {
      const token = await jwtEncode(payload, secret, { algorithm: 'HS384' });
      const decoded = jwtDecode(token);
      assert.equal(decoded.header.alg, 'HS384');
    });

    it('uses HS512 algorithm', async () => {
      const token = await jwtEncode(payload, secret, { algorithm: 'HS512' });
      const decoded = jwtDecode(token);
      assert.equal(decoded.header.alg, 'HS512');
    });

    it('preserves custom claims', async () => {
      const token = await jwtEncode({ sub: '123', role: 'admin', custom: 42 }, secret);
      const decoded = jwtDecode(token);
      assert.equal(decoded.payload.sub, '123');
      assert.equal(decoded.payload.role, 'admin');
      assert.equal(decoded.payload.custom, 42);
    });
  });

  describe('jwtDecode', () => {
    it('throws on missing token', () => {
      assert.throws(() => jwtDecode(''), /Token is required/);
      assert.throws(() => jwtDecode(null), /Token is required/);
    });

    it('throws on invalid format', () => {
      assert.throws(() => jwtDecode('not.a.valid.jwt'), /expected 3 parts/);
      assert.throws(() => jwtDecode('onlyonepart'), /expected 3 parts/);
    });

    it('decodes a valid JWT', async () => {
      const token = await jwtEncode(payload, secret);
      const decoded = jwtDecode(token);
      assert.equal(decoded.header.alg, 'HS256');
      assert.equal(decoded.header.typ, 'JWT');
      assert.equal(decoded.payload.sub, '1234567890');
      assert.equal(decoded.payload.name, 'Test User');
      assert.equal(decoded.payload.admin, true);
      assert.ok(decoded.signature);
    });
  });

  describe('jwtVerify', () => {
    it('returns error on missing token', async () => {
      const result = await jwtVerify('', secret);
      assert.equal(result.valid, false);
    });

    it('returns error on missing secret', async () => {
      const token = await jwtEncode(payload, secret);
      const result = await jwtVerify(token, '');
      assert.equal(result.valid, false);
    });

    it('verifies a valid token', async () => {
      const token = await jwtEncode(payload, secret);
      const result = await jwtVerify(token, secret);
      assert.equal(result.valid, true);
      assert.equal(result.payload.sub, '1234567890');
    });

    it('rejects invalid signature', async () => {
      const token = await jwtEncode(payload, secret);
      const result = await jwtVerify(token, 'wrong-secret');
      assert.equal(result.valid, false);
      assert.ok(result.error.includes('Invalid signature'));
    });

    it('rejects expired token', async () => {
      const token = await jwtEncode({ sub: '123', exp: Math.floor(Date.now() / 1000) - 100 }, secret);
      const result = await jwtVerify(token, secret);
      assert.equal(result.valid, false);
      assert.equal(result.expired, true);
    });

    it('accepts expired token within clock tolerance', async () => {
      const token = await jwtEncode({ sub: '123', exp: Math.floor(Date.now() / 1000) - 5 }, secret);
      const result = await jwtVerify(token, secret, { clockTolerance: 60 });
      assert.equal(result.valid, true);
    });

    it('rejects disallowed algorithm', async () => {
      const token = await jwtEncode(payload, secret, { algorithm: 'HS384' });
      const result = await jwtVerify(token, secret, { algorithms: ['HS256'] });
      assert.equal(result.valid, false);
      assert.ok(result.error.includes('not allowed'));
    });

    it('verifies HS384 token', async () => {
      const token = await jwtEncode(payload, secret, { algorithm: 'HS384' });
      const result = await jwtVerify(token, secret);
      assert.equal(result.valid, true);
    });

    it('verifies HS512 token', async () => {
      const token = await jwtEncode(payload, secret, { algorithm: 'HS512' });
      const result = await jwtVerify(token, secret);
      assert.equal(result.valid, true);
    });

    it('rejects token not yet valid (nbf)', async () => {
      const token = await jwtEncode({ sub: '123', nbf: Math.floor(Date.now() / 1000) + 3600 }, secret);
      const result = await jwtVerify(token, secret);
      assert.equal(result.valid, false);
      assert.ok(result.error.includes('not yet valid'));
    });

    it('returns header and payload even on verification failure', async () => {
      const token = await jwtEncode(payload, secret);
      const result = await jwtVerify(token, 'wrong');
      assert.equal(result.valid, false);
      assert.ok(result.header);
      assert.ok(result.payload);
    });
  });
});
