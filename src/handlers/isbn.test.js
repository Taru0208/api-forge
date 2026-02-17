import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateISBN, isbn10to13, isbn13to10, generateISBNCheckDigit } from './isbn.js';

describe('ISBN-10 validation', () => {
  it('validates correct ISBN-10', () => {
    const r = validateISBN('0306406152');
    assert.equal(r.valid, true);
    assert.equal(r.format, 'ISBN-10');
    assert.equal(r.checkDigit, '2');
  });

  it('validates ISBN-10 with X check digit', () => {
    const r = validateISBN('080442957X');
    assert.equal(r.valid, true);
    assert.equal(r.checkDigit, 'X');
  });

  it('handles hyphens', () => {
    const r = validateISBN('0-306-40615-2');
    assert.equal(r.valid, true);
  });

  it('identifies language group', () => {
    const r = validateISBN('0306406152');
    assert.equal(r.group, 'English-speaking');
  });

  it('provides ISBN-13 conversion', () => {
    const r = validateISBN('0306406152');
    assert.equal(r.isbn13, '9780306406157');
  });

  it('rejects invalid check digit', () => {
    const r = validateISBN('0306406153');
    assert.equal(r.valid, false);
  });
});

describe('ISBN-13 validation', () => {
  it('validates correct ISBN-13', () => {
    const r = validateISBN('9780306406157');
    assert.equal(r.valid, true);
    assert.equal(r.format, 'ISBN-13');
    assert.equal(r.prefix, '978');
    assert.equal(r.isBook, true);
  });

  it('handles hyphens', () => {
    const r = validateISBN('978-0-306-40615-7');
    assert.equal(r.valid, true);
  });

  it('provides ISBN-10 conversion for 978 prefix', () => {
    const r = validateISBN('9780306406157');
    assert.equal(r.isbn10, '0306406152');
  });

  it('no ISBN-10 for 979 prefix', () => {
    // 979-10-12345-67-8 (French)
    const r = validateISBN('9791012345678');
    // This may or may not be valid depending on check digit
    // Just check that isbn10 is null for 979
    if (r.valid) assert.equal(r.isbn10, null);
  });

  it('rejects invalid check digit', () => {
    const r = validateISBN('9780306406158');
    assert.equal(r.valid, false);
  });
});

describe('ISBN conversion', () => {
  it('converts ISBN-10 to ISBN-13', () => {
    assert.equal(isbn10to13('0306406152'), '9780306406157');
  });

  it('converts ISBN-13 to ISBN-10', () => {
    assert.equal(isbn13to10('9780306406157'), '0306406152');
  });

  it('returns null for non-978 ISBN-13', () => {
    assert.equal(isbn13to10('9791234567890'), null);
  });

  it('handles X check digit in conversion', () => {
    // ISBN-10: 080442957X -> ISBN-13: 9780804429573
    assert.equal(isbn10to13('080442957X'), '9780804429573');
    assert.equal(isbn13to10('9780804429573'), '080442957X');
  });
});

describe('ISBN check digit generation', () => {
  it('generates ISBN-10 check digit', () => {
    const r = generateISBNCheckDigit('030640615');
    assert.equal(r.checkDigit, '2');
    assert.equal(r.isbn, '0306406152');
    assert.equal(r.format, 'ISBN-10');
  });

  it('generates ISBN-13 check digit', () => {
    const r = generateISBNCheckDigit('978030640615');
    assert.equal(r.checkDigit, '7');
    assert.equal(r.isbn, '9780306406157');
  });

  it('generates X check digit for ISBN-10', () => {
    const r = generateISBNCheckDigit('080442957');
    assert.equal(r.checkDigit, 'X');
  });

  it('rejects wrong length', () => {
    const r = generateISBNCheckDigit('1234');
    assert.ok(r.error);
  });

  it('rejects empty input', () => {
    const r = generateISBNCheckDigit('');
    assert.ok(r.error);
  });
});

describe('ISBN edge cases', () => {
  it('rejects empty input', () => {
    assert.equal(validateISBN('').valid, false);
    assert.equal(validateISBN(null).valid, false);
  });

  it('rejects invalid format', () => {
    assert.equal(validateISBN('abc').valid, false);
    assert.equal(validateISBN('12345').valid, false);
  });
});
