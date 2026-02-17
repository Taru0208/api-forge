import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateIBAN, formatIBAN, generateIBANCheckDigits, listIBANCountries } from './iban.js';

describe('IBAN validation', () => {
  it('validates correct German IBAN', () => {
    const r = validateIBAN('DE89370400440532013000');
    assert.equal(r.valid, true);
    assert.equal(r.country, 'DE');
    assert.equal(r.countryName, 'Germany');
    assert.equal(r.checkDigits, '89');
    assert.equal(r.bban, '370400440532013000');
  });

  it('validates correct UK IBAN', () => {
    const r = validateIBAN('GB29NWBK60161331926819');
    assert.equal(r.valid, true);
    assert.equal(r.country, 'GB');
    assert.equal(r.countryName, 'United Kingdom');
  });

  it('validates correct French IBAN', () => {
    const r = validateIBAN('FR7630006000011234567890189');
    assert.equal(r.valid, true);
    assert.equal(r.country, 'FR');
  });

  it('validates correct Spanish IBAN', () => {
    const r = validateIBAN('ES9121000418450200051332');
    assert.equal(r.valid, true);
    assert.equal(r.country, 'ES');
  });

  it('validates correct Netherlands IBAN', () => {
    const r = validateIBAN('NL91ABNA0417164300');
    assert.equal(r.valid, true);
    assert.equal(r.country, 'NL');
  });

  it('handles spaces in IBAN', () => {
    const r = validateIBAN('DE89 3704 0044 0532 0130 00');
    assert.equal(r.valid, true);
    assert.equal(r.electronicFormat, 'DE89370400440532013000');
  });

  it('handles lowercase', () => {
    const r = validateIBAN('de89370400440532013000');
    assert.equal(r.valid, true);
  });

  it('rejects wrong check digits', () => {
    const r = validateIBAN('DE00370400440532013000');
    assert.equal(r.valid, false);
    assert.ok(r.reason.includes('Check digits'));
  });

  it('rejects wrong length', () => {
    const r = validateIBAN('DE8937040044053201300');
    assert.equal(r.valid, false);
    assert.ok(r.reason.includes('length'));
  });

  it('rejects unknown country', () => {
    const r = validateIBAN('XX12345678901234');
    assert.equal(r.valid, false);
    assert.ok(r.reason.includes('Unsupported'));
  });

  it('rejects empty input', () => {
    assert.equal(validateIBAN('').valid, false);
    assert.equal(validateIBAN(null).valid, false);
  });

  it('rejects invalid characters', () => {
    const r = validateIBAN('DE89!70400440532013000');
    assert.equal(r.valid, false);
  });
});

describe('IBAN formatting', () => {
  it('formats in groups of 4', () => {
    assert.equal(formatIBAN('DE89370400440532013000'), 'DE89 3704 0044 0532 0130 00');
  });
});

describe('IBAN check digit generation', () => {
  it('generates correct check digits for German BBAN', () => {
    const r = generateIBANCheckDigits('DE', '370400440532013000');
    assert.equal(r.checkDigits, '89');
    assert.equal(r.iban, 'DE89370400440532013000');
  });

  it('generates correct check digits for UK BBAN', () => {
    const r = generateIBANCheckDigits('GB', 'NWBK60161331926819');
    assert.equal(r.checkDigits, '29');
  });

  it('rejects wrong BBAN length', () => {
    const r = generateIBANCheckDigits('DE', '1234');
    assert.ok(r.error);
  });

  it('rejects unknown country', () => {
    const r = generateIBANCheckDigits('XX', '123456');
    assert.ok(r.error);
  });
});

describe('IBAN country list', () => {
  it('returns sorted country list', () => {
    const list = listIBANCountries();
    assert.ok(list.length > 70);
    assert.ok(list[0].code);
    assert.ok(list[0].name);
    assert.ok(list[0].ibanLength > 0);
    // Check sorted by name
    for (let i = 1; i < list.length; i++) {
      assert.ok(list[i].name >= list[i - 1].name, `${list[i].name} should come after ${list[i - 1].name}`);
    }
  });
});
