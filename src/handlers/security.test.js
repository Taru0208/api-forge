import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { hmacSign, hmacVerify, passwordStrength, generateCSP, analyzeHeaders } from './security.js';

describe('security', () => {
  describe('hmacSign', () => {
    it('produces hex signature', async () => {
      const sig = await hmacSign('hello', 'secret');
      assert.match(sig, /^[0-9a-f]+$/);
      assert.ok(sig.length > 0);
    });
    it('same input produces same output', async () => {
      const a = await hmacSign('test', 'key');
      const b = await hmacSign('test', 'key');
      assert.equal(a, b);
    });
    it('different keys produce different output', async () => {
      const a = await hmacSign('test', 'key1');
      const b = await hmacSign('test', 'key2');
      assert.notEqual(a, b);
    });
    it('supports different algorithms', async () => {
      const sha1 = await hmacSign('test', 'key', 'SHA-1');
      const sha256 = await hmacSign('test', 'key', 'SHA-256');
      assert.notEqual(sha1, sha256);
      assert.ok(sha1.length < sha256.length); // SHA-1 = 40 hex chars, SHA-256 = 64
    });
    it('throws on invalid algorithm', async () => {
      await assert.rejects(() => hmacSign('test', 'key', 'MD5'), /Unsupported/);
    });
  });

  describe('hmacVerify', () => {
    it('verifies valid signature', async () => {
      const sig = await hmacSign('hello', 'secret');
      const valid = await hmacVerify('hello', 'secret', sig);
      assert.equal(valid, true);
    });
    it('rejects invalid signature', async () => {
      const valid = await hmacVerify('hello', 'secret', 'deadbeef');
      assert.equal(valid, false);
    });
    it('rejects wrong key', async () => {
      const sig = await hmacSign('hello', 'secret');
      const valid = await hmacVerify('hello', 'wrong', sig);
      assert.equal(valid, false);
    });
  });

  describe('passwordStrength', () => {
    it('rates weak password', () => {
      const result = passwordStrength('123');
      assert.equal(result.level, 'very_weak');
      assert.ok(result.suggestions.length > 0);
    });
    it('rates strong password', () => {
      const result = passwordStrength('Tr0ub4d&or#Hx9!');
      assert.ok(result.score >= 5);
      assert.ok(['strong', 'very_strong'].includes(result.level));
    });
    it('detects common patterns', () => {
      const result = passwordStrength('password123');
      assert.ok(result.checks.hasCommonPattern);
    });
    it('detects sequential chars', () => {
      const result = passwordStrength('abc456xyz');
      assert.ok(result.checks.hasSequential);
    });
    it('calculates entropy', () => {
      const result = passwordStrength('aB1!');
      assert.ok(result.entropy > 0);
    });
    it('detects repeated chars', () => {
      const result = passwordStrength('aaa111');
      assert.ok(result.checks.hasRepeat);
    });
  });

  describe('generateCSP', () => {
    it('generates default CSP', () => {
      const csp = generateCSP();
      assert.equal(csp.header, 'Content-Security-Policy');
      assert.ok(csp.value.includes("default-src 'self'"));
      assert.ok(csp.value.includes("script-src 'self'"));
      assert.ok(csp.value.includes('upgrade-insecure-requests'));
    });
    it('accepts custom directives', () => {
      const csp = generateCSP({ scriptSrc: ["'self'", 'cdn.example.com'] });
      assert.ok(csp.value.includes('cdn.example.com'));
    });
    it('can disable upgrade-insecure-requests', () => {
      const csp = generateCSP({ upgradeInsecureRequests: false });
      assert.ok(!csp.value.includes('upgrade-insecure-requests'));
    });
  });

  describe('analyzeHeaders', () => {
    it('scores perfect headers', () => {
      const result = analyzeHeaders({
        'Strict-Transport-Security': 'max-age=31536000',
        'Content-Security-Policy': "default-src 'self'",
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=()',
      });
      assert.equal(result.score, 6);
      assert.equal(result.grade, 'A');
    });
    it('scores empty headers as F', () => {
      const result = analyzeHeaders({});
      assert.equal(result.score, 0);
      assert.equal(result.grade, 'F');
    });
    it('flags server header', () => {
      const result = analyzeHeaders({ 'Server': 'Apache/2.4.41' });
      const serverCheck = result.results.find(r => r.name === 'Server Header');
      assert.ok(serverCheck);
      assert.ok(serverCheck.fix);
    });
    it('is case insensitive', () => {
      const result = analyzeHeaders({ 'strict-transport-security': 'max-age=31536000' });
      const hsts = result.results.find(r => r.name === 'HSTS');
      assert.equal(hsts.present, true);
    });
  });
});
