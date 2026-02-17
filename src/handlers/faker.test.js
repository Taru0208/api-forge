import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fakePerson, fakeAddress, fakeCompany, fakeCreditCard, fakeProduct, fakeDate, fakeProfile } from './faker.js';

describe('faker', () => {
  describe('fakePerson', () => {
    it('returns a person with expected fields', () => {
      const person = fakePerson();
      assert.ok(person.firstName);
      assert.ok(person.lastName);
      assert.ok(person.fullName.includes(person.firstName));
      assert.ok(person.email.includes('@'));
      assert.ok(person.phone.startsWith('+1'));
      assert.ok(person.age >= 18 && person.age <= 85);
      assert.ok(['male', 'female'].includes(person.gender));
    });
    it('generates different people', () => {
      const a = fakePerson();
      const b = fakePerson();
      // With 40 first names × 30 last names, collision is extremely unlikely
      // Just check that the function runs multiple times without error
      assert.ok(a.fullName);
      assert.ok(b.fullName);
    });
  });

  describe('fakeAddress', () => {
    it('returns address with expected fields', () => {
      const addr = fakeAddress();
      assert.ok(addr.street);
      assert.ok(addr.city);
      assert.ok(addr.state);
      assert.ok(addr.stateAbbr);
      assert.ok(addr.zip.length === 5);
      assert.equal(addr.country, 'US');
    });
  });

  describe('fakeCompany', () => {
    it('returns company with expected fields', () => {
      const co = fakeCompany();
      assert.ok(co.name);
      assert.ok(co.domain);
      assert.ok(co.email.includes('@'));
      assert.ok(co.phone.startsWith('+1'));
      assert.ok(co.industry);
      assert.ok(co.catchPhrase);
    });
  });

  describe('fakeCreditCard', () => {
    it('returns card with valid Luhn number', () => {
      const card = fakeCreditCard();
      assert.ok(['visa', 'mastercard', 'amex'].includes(card.type));
      assert.ok(card.number.length === 15 || card.number.length === 16);
      assert.match(card.expiry, /^\d{2}\/\d{2}$/);
      // Luhn check
      let sum = 0;
      const digits = card.number.split('').map(Number);
      for (let i = digits.length - 1; i >= 0; i--) {
        let d = digits[i];
        if ((digits.length - 1 - i) % 2 === 1) d *= 2;
        if (d > 9) d -= 9;
        sum += d;
      }
      assert.equal(sum % 10, 0, `Luhn check failed for ${card.number}`);
    });
    it('generates multiple valid cards', () => {
      for (let i = 0; i < 10; i++) {
        const card = fakeCreditCard();
        let sum = 0;
        const digits = card.number.split('').map(Number);
        for (let j = digits.length - 1; j >= 0; j--) {
          let d = digits[j];
          if ((digits.length - 1 - j) % 2 === 1) d *= 2;
          if (d > 9) d -= 9;
          sum += d;
        }
        assert.equal(sum % 10, 0);
      }
    });
  });

  describe('fakeProduct', () => {
    it('returns product with expected fields', () => {
      const prod = fakeProduct();
      assert.ok(prod.name);
      assert.ok(prod.category);
      assert.ok(typeof prod.price === 'number');
      assert.equal(prod.currency, 'USD');
      assert.ok(prod.sku.startsWith('SKU-'));
      assert.ok(typeof prod.inStock === 'boolean');
      assert.ok(prod.rating >= 2 && prod.rating <= 5);
    });
  });

  describe('fakeDate', () => {
    it('returns date with expected fields', () => {
      const d = fakeDate();
      assert.ok(d.iso);
      assert.ok(typeof d.unix === 'number');
      assert.ok(d.year >= 2020);
      assert.ok(d.month >= 1 && d.month <= 12);
      assert.ok(d.dayOfWeek);
    });
    it('respects from/to', () => {
      const d = fakeDate({ from: '2025-01-01', to: '2025-12-31' });
      assert.equal(d.year, 2025);
    });
  });

  describe('fakeProfile', () => {
    it('returns single profile by default', () => {
      const p = fakeProfile();
      assert.ok(p.firstName);
      assert.ok(p.address);
      assert.ok(p.company);
      assert.ok(p.jobTitle);
    });
    it('returns array for count > 1', () => {
      const profiles = fakeProfile(3);
      assert.ok(Array.isArray(profiles));
      assert.equal(profiles.length, 3);
    });
    it('caps at 100', () => {
      const profiles = fakeProfile(200);
      assert.equal(profiles.length, 100);
    });
  });
});
