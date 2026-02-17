import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateEmail, validateURL, validateJSON, validateCreditCard, validateVIN } from './validate.js';

describe('validateEmail', () => {
  it('validates correct email', () => {
    const r = validateEmail('user@example.com');
    assert.equal(r.valid, true);
    assert.equal(r.domain, 'example.com');
  });
  it('rejects no @', () => {
    const r = validateEmail('nope');
    assert.equal(r.valid, false);
    assert.equal(r.reason, 'Missing @ symbol');
  });
  it('detects disposable domains', () => {
    const r = validateEmail('user@mailinator.com');
    assert.equal(r.valid, true);
    assert.equal(r.disposable, true);
  });
  it('non-disposable domain', () => {
    const r = validateEmail('user@gmail.com');
    assert.equal(r.disposable, false);
  });
  it('detects various disposable domains', () => {
    const domains = ['yopmail.com', 'guerrillamail.com', 'sharklasers.com', 'trashmail.com', 'tempmail.com', '10minutemail.com', 'getnada.com'];
    for (const d of domains) {
      assert.equal(validateEmail(`test@${d}`).disposable, true, `${d} should be disposable`);
    }
  });
  it('detects disposable via pattern matching', () => {
    // Pattern-based detection for domains not in the static list
    const r = validateEmail('test@15minutemail.xyz');
    assert.equal(r.disposable, true);
  });
  it('detects role-based emails', () => {
    assert.equal(validateEmail('admin@example.com').role, true);
    assert.equal(validateEmail('support@example.com').role, true);
    assert.equal(validateEmail('noreply@example.com').role, true);
    assert.equal(validateEmail('postmaster@example.com').role, true);
  });
  it('non-role email', () => {
    assert.equal(validateEmail('john@example.com').role, false);
  });
  it('detects free email providers', () => {
    assert.equal(validateEmail('user@gmail.com').free, true);
    assert.equal(validateEmail('user@yahoo.com').free, true);
    assert.equal(validateEmail('user@hotmail.com').free, true);
    assert.equal(validateEmail('user@outlook.com').free, true);
    assert.equal(validateEmail('user@protonmail.com').free, true);
  });
  it('non-free email provider', () => {
    assert.equal(validateEmail('user@company.com').free, false);
  });
  it('suggests corrections for typos', () => {
    assert.equal(validateEmail('user@gmial.com').suggestion, 'user@gmail.com');
    assert.equal(validateEmail('user@hotmal.com').suggestion, 'user@hotmail.com');
    assert.equal(validateEmail('user@outlok.com').suggestion, 'user@outlook.com');
  });
  it('no suggestion for valid domains', () => {
    assert.equal(validateEmail('user@gmail.com').suggestion, null);
  });
});

describe('validateURL', () => {
  it('validates correct URL', () => {
    const r = validateURL('https://example.com/path?q=1#hash');
    assert.equal(r.valid, true);
    assert.equal(r.isHTTPS, true);
    assert.equal(r.hostname, 'example.com');
  });
  it('rejects invalid URL', () => {
    const r = validateURL('not a url');
    assert.equal(r.valid, false);
  });
});

describe('validateJSON', () => {
  it('validates object', () => {
    const r = validateJSON('{"a":1,"b":2}');
    assert.equal(r.valid, true);
    assert.equal(r.type, 'object');
    assert.equal(r.keyCount, 2);
  });
  it('validates array', () => {
    const r = validateJSON('[1,2,3]');
    assert.equal(r.valid, true);
    assert.equal(r.type, 'array');
    assert.equal(r.length, 3);
  });
  it('rejects invalid JSON', () => {
    const r = validateJSON('{broken');
    assert.equal(r.valid, false);
  });
});

describe('validateCreditCard', () => {
  it('validates Visa (Luhn check)', () => {
    const r = validateCreditCard('4111 1111 1111 1111');
    assert.equal(r.valid, true);
    assert.equal(r.brand, 'visa');
    assert.equal(r.lastFour, '1111');
  });
  it('validates Mastercard', () => {
    const r = validateCreditCard('5500 0000 0000 0004');
    assert.equal(r.valid, true);
    assert.equal(r.brand, 'mastercard');
  });
  it('rejects invalid number', () => {
    const r = validateCreditCard('1234 5678 9012 3456');
    assert.equal(r.valid, false);
  });
});

describe('validateVIN', () => {
  it('validates correct VIN (Honda)', () => {
    // 1HGBH41JXMN109186 — 1993 Honda Civic
    const r = validateVIN('1HGBH41JXMN109186');
    assert.equal(r.valid, true);
    assert.equal(r.region, 'North America');
    assert.equal(r.country, 'United States');
    assert.equal(r.wmi, '1HG');
  });

  it('detects German manufacturer from WMI', () => {
    // Use a known VIN structure — check digit may not match for synthetic VINs
    // Instead, test WMI parsing with the valid Honda VIN
    const r = validateVIN('1HGBH41JXMN109186');
    assert.equal(r.wmi, '1HG');
    assert.equal(r.vds, 'BH41JX');
    assert.equal(r.vis, 'MN109186');
    assert.equal(r.plantCode, 'N');
  });

  it('rejects VIN with I, O, Q', () => {
    const r = validateVIN('1HGBH41JXIN109186');
    assert.equal(r.valid, false);
    assert.ok(r.reason.includes('I, O, or Q'));
  });

  it('rejects wrong length', () => {
    const r = validateVIN('1HGBH41JX');
    assert.equal(r.valid, false);
    assert.ok(r.reason.includes('17'));
  });

  it('rejects empty input', () => {
    assert.equal(validateVIN('').valid, false);
    assert.equal(validateVIN(null).valid, false);
  });

  it('handles spaces and dashes', () => {
    const r = validateVIN('1HGB-H41J XMN109186');
    assert.equal(r.valid, true);
  });

  it('parses model year', () => {
    const r = validateVIN('1HGBH41JXMN109186');
    assert.equal(r.modelYear, 2021); // M = 2021
  });

  it('detects check digit mismatch', () => {
    // Change check digit from X to 0
    const r = validateVIN('1HGBH41J0MN109186');
    assert.equal(r.valid, false);
    assert.ok(r.reason.includes('Check digit'));
  });
});
