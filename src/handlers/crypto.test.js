import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateCryptoAddress, detectCryptoAddress, listSupportedCurrencies } from './crypto.js';

describe('Bitcoin address validation', () => {
  it('validates P2PKH address (1...)', () => {
    const r = validateCryptoAddress('1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2', 'btc');
    assert.equal(r.valid, true);
    assert.equal(r.type, 'P2PKH');
  });

  it('validates P2SH address (3...)', () => {
    const r = validateCryptoAddress('3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy', 'btc');
    assert.equal(r.valid, true);
    assert.equal(r.type, 'P2SH');
  });

  it('validates Bech32 SegWit address (bc1q...)', () => {
    const r = validateCryptoAddress('bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq', 'btc');
    assert.equal(r.valid, true);
    assert.equal(r.type, 'P2WPKH');
  });

  it('rejects invalid Bitcoin address', () => {
    const r = validateCryptoAddress('1invalid', 'btc');
    assert.equal(r.valid, false);
  });
});

describe('Ethereum address validation', () => {
  it('validates correct ETH address', () => {
    const r = validateCryptoAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18', 'eth');
    assert.equal(r.valid, true);
  });

  it('validates lowercase ETH address', () => {
    const r = validateCryptoAddress('0x742d35cc6634c0532925a3b844bc9e7595f2bd18', 'eth');
    assert.equal(r.valid, true);
  });

  it('rejects short ETH address', () => {
    const r = validateCryptoAddress('0x742d35', 'eth');
    assert.equal(r.valid, false);
  });

  it('rejects missing 0x prefix', () => {
    const r = validateCryptoAddress('742d35Cc6634C0532925a3b844Bc9e7595f2bD18', 'eth');
    assert.equal(r.valid, false);
  });
});

describe('Litecoin address validation', () => {
  it('validates L-prefix address', () => {
    const r = validateCryptoAddress('LaMT348PWRnrqeeWArpwQPbuanpXDZGEUz', 'ltc');
    assert.equal(r.valid, true);
    assert.equal(r.type, 'P2PKH');
  });

  it('validates M-prefix P2SH address', () => {
    const r = validateCryptoAddress('MJKLbSYMpSccvRCMoaWZMFqyirg1KNdjcJ', 'ltc');
    assert.equal(r.valid, true);
    assert.equal(r.type, 'P2SH');
  });
});

describe('Dogecoin address validation', () => {
  it('validates D-prefix address', () => {
    const r = validateCryptoAddress('D7Y55hVGntzbQAYq3s5hBiRb87M9VRKvEG', 'doge');
    assert.equal(r.valid, true);
    assert.equal(r.type, 'P2PKH');
  });

  it('rejects invalid Dogecoin address', () => {
    const r = validateCryptoAddress('1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2', 'doge');
    assert.equal(r.valid, false);
  });
});

describe('XRP address validation', () => {
  it('validates correct XRP address', () => {
    const r = validateCryptoAddress('rN7R8XLDEiSnAhpCrPMErotY3kQ9Tdz1no', 'xrp');
    assert.equal(r.valid, true);
    assert.equal(r.type, 'Classic');
  });

  it('rejects non-r prefix', () => {
    const r = validateCryptoAddress('xN7R8XLDEiSnAhpCrPMErotY3kQ9Tdz1no', 'xrp');
    assert.equal(r.valid, false);
  });
});

describe('Solana address validation', () => {
  it('validates correct Solana address', () => {
    const r = validateCryptoAddress('7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV', 'sol');
    assert.equal(r.valid, true);
    assert.equal(r.type, 'Ed25519');
  });
});

describe('TRON address validation', () => {
  it('validates correct TRON address', () => {
    const r = validateCryptoAddress('TJCnKsPa7y5okkXvQAidZBzqx3QyQ6sxMW', 'trx');
    assert.equal(r.valid, true);
    assert.equal(r.type, 'TRC20');
  });

  it('rejects non-T prefix', () => {
    const r = validateCryptoAddress('AJCnKsPa7y5okkXvQAidZBzqx3QyQ6sxMW', 'trx');
    assert.equal(r.valid, false);
  });
});

describe('Auto-detect cryptocurrency', () => {
  it('detects Bitcoin address', () => {
    const r = detectCryptoAddress('1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2');
    assert.equal(r.valid, true);
    assert.equal(r.currency, 'BTC');
  });

  it('detects Ethereum address', () => {
    const r = detectCryptoAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18');
    assert.equal(r.valid, true);
    assert.equal(r.currency, 'ETH');
  });

  it('returns invalid for garbage', () => {
    const r = detectCryptoAddress('notanaddress');
    assert.equal(r.valid, false);
  });
});

describe('Unsupported currency', () => {
  it('rejects unsupported currency code', () => {
    const r = validateCryptoAddress('someaddr', 'zzz');
    assert.equal(r.valid, false);
    assert.ok(r.reason.includes('Unsupported'));
  });
});

describe('Supported currencies list', () => {
  it('returns all supported currencies', () => {
    const list = listSupportedCurrencies();
    assert.ok(list.length >= 8);
    const codes = list.map(c => c.code);
    assert.ok(codes.includes('BTC'));
    assert.ok(codes.includes('ETH'));
    assert.ok(codes.includes('SOL'));
  });

  it('includes format descriptions', () => {
    const list = listSupportedCurrencies();
    const btc = list.find(c => c.code === 'BTC');
    assert.ok(btc.formats.length >= 3);
  });
});

describe('Edge cases', () => {
  it('handles empty address', () => {
    assert.equal(validateCryptoAddress('', 'btc').valid, false);
    assert.equal(validateCryptoAddress(null).valid, false);
  });

  it('trims whitespace', () => {
    const r = validateCryptoAddress('  0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18  ', 'eth');
    assert.equal(r.valid, true);
  });
});
