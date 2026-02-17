import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  listCountries, getCountry, searchCountries,
  getCurrency, listCurrencies, getCallingCode,
  listTimezones, getTimezone
} from './country.js';

// --- listCountries ---

describe('listCountries', () => {
  it('returns at least 50 countries', () => {
    const countries = listCountries();
    assert.ok(countries.length >= 50, `Expected >= 50, got ${countries.length}`);
  });

  it('each country has required fields', () => {
    const required = ['code', 'alpha3', 'numeric', 'name', 'capital', 'region', 'subregion', 'currency', 'callingCode', 'tld'];
    const countries = listCountries();
    for (const c of countries) {
      for (const field of required) {
        assert.ok(c[field] !== undefined, `Missing field ${field} in ${c.code || 'unknown'}`);
      }
      assert.ok(c.currency.code, `Missing currency.code in ${c.code}`);
      assert.ok(c.currency.name, `Missing currency.name in ${c.code}`);
    }
  });

  it('alpha-2 codes are 2 uppercase letters', () => {
    for (const c of listCountries()) {
      assert.match(c.code, /^[A-Z]{2}$/);
    }
  });

  it('alpha-3 codes are 3 uppercase letters', () => {
    for (const c of listCountries()) {
      assert.match(c.alpha3, /^[A-Z]{3}$/);
    }
  });

  it('returns copies (not references)', () => {
    const a = listCountries();
    const b = listCountries();
    a[0].name = 'MODIFIED';
    assert.notEqual(b[0].name, 'MODIFIED');
  });
});

// --- getCountry ---

describe('getCountry', () => {
  it('finds US by alpha-2', () => {
    const c = getCountry('US');
    assert.equal(c.name, 'United States');
    assert.equal(c.alpha3, 'USA');
    assert.equal(c.capital, 'Washington, D.C.');
  });

  it('finds Japan by alpha-3', () => {
    const c = getCountry('JPN');
    assert.equal(c.code, 'JP');
    assert.equal(c.name, 'Japan');
  });

  it('is case-insensitive', () => {
    const c = getCountry('gb');
    assert.equal(c.name, 'United Kingdom');
  });

  it('handles alpha-3 case-insensitive', () => {
    const c = getCountry('kor');
    assert.equal(c.code, 'KR');
    assert.equal(c.name, 'South Korea');
  });

  it('throws on invalid code', () => {
    assert.throws(() => getCountry('XX'), /not found/i);
  });

  it('throws on empty input', () => {
    assert.throws(() => getCountry(''), /required/i);
  });

  it('throws on null', () => {
    assert.throws(() => getCountry(null), /required/i);
  });

  it('returns a copy', () => {
    const a = getCountry('US');
    a.name = 'CHANGED';
    assert.equal(getCountry('US').name, 'United States');
  });
});

// --- searchCountries ---

describe('searchCountries', () => {
  it('finds by substring', () => {
    const results = searchCountries('united');
    assert.ok(results.length >= 2); // United States, United Kingdom, United Arab Emirates
    const names = results.map(r => r.name);
    assert.ok(names.includes('United States'));
    assert.ok(names.includes('United Kingdom'));
  });

  it('is case-insensitive', () => {
    const results = searchCountries('JAPAN');
    assert.equal(results.length, 1);
    assert.equal(results[0].code, 'JP');
  });

  it('returns empty array for no match', () => {
    const results = searchCountries('zzzzzzz');
    assert.deepEqual(results, []);
  });

  it('throws on empty query', () => {
    assert.throws(() => searchCountries(''), /required/i);
  });

  it('throws on whitespace-only query', () => {
    assert.throws(() => searchCountries('   '), /required/i);
  });

  it('finds partial match', () => {
    const results = searchCountries('land');
    const names = results.map(r => r.name);
    assert.ok(names.includes('Finland'));
    assert.ok(names.includes('Iceland'));
  });
});

// --- getCurrency ---

describe('getCurrency', () => {
  it('finds USD', () => {
    const c = getCurrency('USD');
    assert.equal(c.name, 'United States Dollar');
    assert.equal(c.symbol, '$');
    assert.ok(c.countries.some(x => x.code === 'US'));
  });

  it('EUR is used by multiple countries', () => {
    const c = getCurrency('EUR');
    assert.ok(c.countries.length > 5, `Expected >5 EUR countries, got ${c.countries.length}`);
    assert.equal(c.symbol, '€');
  });

  it('is case-insensitive', () => {
    const c = getCurrency('gbp');
    assert.equal(c.code, 'GBP');
    assert.equal(c.name, 'British Pound Sterling');
  });

  it('throws on unknown currency', () => {
    assert.throws(() => getCurrency('XYZ'), /not found/i);
  });

  it('throws on empty input', () => {
    assert.throws(() => getCurrency(''), /required/i);
  });
});

// --- listCurrencies ---

describe('listCurrencies', () => {
  it('returns unique currencies', () => {
    const currencies = listCurrencies();
    const codes = currencies.map(c => c.code);
    assert.equal(new Set(codes).size, codes.length, 'Duplicate currency codes found');
  });

  it('each currency has code, name, symbol', () => {
    for (const c of listCurrencies()) {
      assert.ok(c.code, 'Missing code');
      assert.ok(c.name, 'Missing name');
      assert.ok(c.symbol, 'Missing symbol');
    }
  });

  it('includes common currencies', () => {
    const codes = listCurrencies().map(c => c.code);
    for (const expected of ['USD', 'EUR', 'GBP', 'JPY', 'KRW']) {
      assert.ok(codes.includes(expected), `Missing ${expected}`);
    }
  });
});

// --- getCallingCode ---

describe('getCallingCode', () => {
  it('returns US calling code', () => {
    const r = getCallingCode('US');
    assert.equal(r.callingCode, '+1');
    assert.equal(r.country, 'US');
  });

  it('returns KR calling code', () => {
    const r = getCallingCode('KR');
    assert.equal(r.callingCode, '+82');
  });

  it('is case-insensitive', () => {
    const r = getCallingCode('jp');
    assert.equal(r.callingCode, '+81');
  });

  it('throws on invalid code', () => {
    assert.throws(() => getCallingCode('ZZ'), /not found/i);
  });

  it('throws on empty input', () => {
    assert.throws(() => getCallingCode(''), /required/i);
  });
});

// --- listTimezones ---

describe('listTimezones', () => {
  it('returns timezones grouped by region', () => {
    const tz = listTimezones();
    assert.ok(tz.Africa && tz.Africa.length > 0);
    assert.ok(tz.America && tz.America.length > 0);
    assert.ok(tz.Asia && tz.Asia.length > 0);
    assert.ok(tz.Europe && tz.Europe.length > 0);
    assert.ok(tz.Pacific && tz.Pacific.length > 0);
    assert.ok(tz.Australia && tz.Australia.length > 0);
  });

  it('all timezone strings follow IANA format', () => {
    const tz = listTimezones();
    for (const [region, zones] of Object.entries(tz)) {
      for (const z of zones) {
        // IANA: Region/City or UTC
        assert.ok(z === 'UTC' || z.includes('/'), `Invalid timezone format: ${z} in ${region}`);
      }
    }
  });

  it('returns copies', () => {
    const a = listTimezones();
    a.Africa.push('Fake/Zone');
    const b = listTimezones();
    assert.ok(!b.Africa.includes('Fake/Zone'));
  });
});

// --- getTimezone ---

describe('getTimezone', () => {
  it('returns info for Asia/Seoul', () => {
    const r = getTimezone('Asia/Seoul');
    assert.equal(r.timezone, 'Asia/Seoul');
    assert.equal(r.utcOffset, 'UTC+09:00');
    assert.equal(r.offsetMinutes, 540);
    assert.ok(r.currentTime.includes('+09:00'));
  });

  it('returns info for UTC', () => {
    const r = getTimezone('UTC');
    assert.equal(r.utcOffset, 'UTC+00:00');
    assert.equal(r.offsetMinutes, 0);
  });

  it('handles negative offset (America/New_York)', () => {
    const r = getTimezone('America/New_York');
    assert.equal(r.utcOffset, 'UTC-05:00');
    assert.equal(r.offsetMinutes, -300);
    assert.ok(r.currentTime.includes('-05:00'));
  });

  it('handles half-hour offset (Asia/Kolkata)', () => {
    const r = getTimezone('Asia/Kolkata');
    assert.equal(r.utcOffset, 'UTC+05:30');
    assert.equal(r.offsetMinutes, 330);
  });

  it('currentTime is a valid ISO-like string', () => {
    const r = getTimezone('Europe/London');
    // Should match YYYY-MM-DDTHH:MM:SS±HH:MM
    assert.match(r.currentTime, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/);
  });

  it('throws on unknown timezone', () => {
    assert.throws(() => getTimezone('Fake/Place'), /unknown/i);
  });

  it('throws on empty input', () => {
    assert.throws(() => getTimezone(''), /required/i);
  });

  it('throws on null', () => {
    assert.throws(() => getTimezone(null), /required/i);
  });
});
