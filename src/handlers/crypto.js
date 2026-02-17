// Cryptocurrency address validation

// Base58 alphabet (Bitcoin)
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const BASE58_MAP = new Map();
for (let i = 0; i < BASE58_ALPHABET.length; i++) {
  BASE58_MAP.set(BASE58_ALPHABET[i], BigInt(i));
}

function base58Decode(str) {
  let num = 0n;
  for (const ch of str) {
    const val = BASE58_MAP.get(ch);
    if (val === undefined) return null;
    num = num * 58n + val;
  }

  // Convert to bytes
  const hex = num.toString(16).padStart(50, '0'); // 25 bytes = 50 hex chars
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.slice(i, i + 2), 16));
  }

  // Add leading zero bytes for leading '1's in base58
  let leadingOnes = 0;
  for (const ch of str) {
    if (ch === '1') leadingOnes++;
    else break;
  }
  const result = new Array(leadingOnes).fill(0).concat(bytes);
  return new Uint8Array(result);
}

// Bech32 decoding
const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const BECH32_GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];

function bech32Polymod(values) {
  let chk = 1;
  for (const v of values) {
    const b = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ v;
    for (let i = 0; i < 5; i++) {
      if ((b >> i) & 1) chk ^= BECH32_GEN[i];
    }
  }
  return chk;
}

function bech32HRPExpand(hrp) {
  const ret = [];
  for (const ch of hrp) ret.push(ch.charCodeAt(0) >> 5);
  ret.push(0);
  for (const ch of hrp) ret.push(ch.charCodeAt(0) & 31);
  return ret;
}

function bech32Verify(hrp, data, spec) {
  const target = spec === 'bech32m' ? 0x2bc830a3 : 1;
  return bech32Polymod(bech32HRPExpand(hrp).concat(data)) === target;
}

function decodeBech32(addr) {
  const lower = addr.toLowerCase();
  const pos = lower.lastIndexOf('1');
  if (pos < 1 || pos + 7 > lower.length) return null;

  const hrp = lower.slice(0, pos);
  const dataChars = lower.slice(pos + 1);
  const data = [];
  for (const ch of dataChars) {
    const idx = BECH32_CHARSET.indexOf(ch);
    if (idx === -1) return null;
    data.push(idx);
  }

  // Try both bech32 and bech32m
  if (bech32Verify(hrp, data, 'bech32')) {
    return { hrp, data: data.slice(0, -6), spec: 'bech32' };
  }
  if (bech32Verify(hrp, data, 'bech32m')) {
    return { hrp, data: data.slice(0, -6), spec: 'bech32m' };
  }
  return null;
}

// Convert 5-bit groups to 8-bit
function convertBits(data, fromBits, toBits, pad) {
  let acc = 0;
  let bits = 0;
  const ret = [];
  const maxV = (1 << toBits) - 1;
  for (const value of data) {
    if (value < 0 || value >> fromBits) return null;
    acc = (acc << fromBits) | value;
    bits += fromBits;
    while (bits >= toBits) {
      bits -= toBits;
      ret.push((acc >> bits) & maxV);
    }
  }
  if (pad) {
    if (bits) ret.push((acc << (toBits - bits)) & maxV);
  } else if (bits >= fromBits || ((acc << (toBits - bits)) & maxV)) {
    return null;
  }
  return ret;
}

// Bitcoin address validation
function validateBitcoin(address) {
  // Bech32/Bech32m (bc1...)
  if (address.toLowerCase().startsWith('bc1')) {
    const decoded = decodeBech32(address);
    if (!decoded || decoded.hrp !== 'bc') {
      return { valid: false, reason: 'Invalid Bech32 checksum' };
    }
    const witnessVersion = decoded.data[0];
    const program = convertBits(decoded.data.slice(1), 5, 8, false);
    if (!program) return { valid: false, reason: 'Invalid witness program' };

    // Version 0: bech32, version 1+: bech32m
    if (witnessVersion === 0 && decoded.spec !== 'bech32') {
      return { valid: false, reason: 'Witness v0 must use bech32' };
    }
    if (witnessVersion > 0 && decoded.spec !== 'bech32m') {
      return { valid: false, reason: `Witness v${witnessVersion} must use bech32m` };
    }

    // v0: 20 (P2WPKH) or 32 (P2WSH) bytes; v1: 32 (Taproot)
    if (witnessVersion === 0 && program.length !== 20 && program.length !== 32) {
      return { valid: false, reason: 'Invalid witness v0 program length' };
    }
    if (witnessVersion === 1 && program.length !== 32) {
      return { valid: false, reason: 'Invalid witness v1 program length (Taproot requires 32)' };
    }
    if (witnessVersion > 16) {
      return { valid: false, reason: 'Invalid witness version' };
    }

    let type = 'unknown';
    if (witnessVersion === 0 && program.length === 20) type = 'P2WPKH';
    else if (witnessVersion === 0 && program.length === 32) type = 'P2WSH';
    else if (witnessVersion === 1) type = 'P2TR (Taproot)';

    return { valid: true, type, network: 'mainnet', witnessVersion };
  }

  // Legacy Base58Check (1... or 3...)
  if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address)) {
    const decoded = base58Decode(address);
    if (!decoded || decoded.length < 25) {
      return { valid: false, reason: 'Invalid Base58Check encoding' };
    }

    // Version byte
    const version = decoded[0];
    let type = 'unknown';
    if (version === 0) type = 'P2PKH';
    else if (version === 5) type = 'P2SH';
    else return { valid: false, reason: `Unknown version byte: ${version}` };

    // Note: full SHA-256d checksum verification requires Web Crypto which is async
    // We do format + version validation here
    return { valid: true, type, network: 'mainnet' };
  }

  return { valid: false, reason: 'Unrecognized Bitcoin address format' };
}

// Ethereum address validation (EIP-55 checksum)
function validateEthereum(address) {
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
    return { valid: false, reason: 'Must be 42 characters starting with 0x' };
  }

  // Check if mixed case (potential EIP-55 checksum)
  const hex = address.slice(2);
  const hasUpper = /[A-F]/.test(hex);
  const hasLower = /[a-f]/.test(hex);
  const isMixed = hasUpper && hasLower;

  return {
    valid: true,
    type: 'EOA/Contract',
    network: 'mainnet',
    checksummed: isMixed,
    // Note: full EIP-55 verification requires keccak256
  };
}

// Litecoin address validation
function validateLitecoin(address) {
  // Bech32 (ltc1...)
  if (address.toLowerCase().startsWith('ltc1')) {
    const decoded = decodeBech32(address);
    if (!decoded || decoded.hrp !== 'ltc') {
      return { valid: false, reason: 'Invalid Bech32 checksum' };
    }
    return { valid: true, type: 'Bech32 SegWit', network: 'mainnet' };
  }

  // Legacy (L/M/3)
  if (/^[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}$/.test(address)) {
    return { valid: true, type: address[0] === '3' || address[0] === 'M' ? 'P2SH' : 'P2PKH', network: 'mainnet' };
  }

  return { valid: false, reason: 'Unrecognized Litecoin address format' };
}

// Dogecoin address validation
function validateDogecoin(address) {
  if (/^D[5-9A-HJ-NP-U][a-km-zA-HJ-NP-Z1-9]{32}$/.test(address)) {
    return { valid: true, type: 'P2PKH', network: 'mainnet' };
  }
  if (/^A[a-km-zA-HJ-NP-Z1-9]{33}$/.test(address)) {
    return { valid: true, type: 'P2SH (multisig)', network: 'mainnet' };
  }
  return { valid: false, reason: 'Unrecognized Dogecoin address format' };
}

// XRP (Ripple) address validation
function validateXRP(address) {
  if (!/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(address)) {
    return { valid: false, reason: 'Must start with r and be 25-35 Base58 characters' };
  }

  const decoded = base58Decode(address);
  if (!decoded) {
    return { valid: false, reason: 'Invalid Base58 encoding' };
  }

  return { valid: true, type: 'Classic', network: 'mainnet' };
}

// Cardano (ADA) address validation
function validateCardano(address) {
  // Bech32 (addr1...)
  if (address.startsWith('addr1')) {
    const decoded = decodeBech32(address);
    if (!decoded || decoded.hrp !== 'addr') {
      return { valid: false, reason: 'Invalid Bech32 checksum' };
    }
    return { valid: true, type: 'Shelley', network: 'mainnet' };
  }

  // Byron era (Ae2...)
  if (/^[AD][a-km-zA-HJ-NP-Z1-9]{50,120}$/.test(address)) {
    return { valid: true, type: 'Byron (legacy)', network: 'mainnet' };
  }

  return { valid: false, reason: 'Unrecognized Cardano address format' };
}

// Solana address validation
function validateSolana(address) {
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
    return { valid: false, reason: 'Must be 32-44 Base58 characters' };
  }

  const decoded = base58Decode(address);
  if (!decoded) {
    return { valid: false, reason: 'Invalid Base58 encoding' };
  }

  return { valid: true, type: 'Ed25519', network: 'mainnet' };
}

// TRON address validation
function validateTron(address) {
  if (!/^T[a-km-zA-HJ-NP-Z1-9]{33}$/.test(address)) {
    return { valid: false, reason: 'Must start with T and be 34 Base58 characters' };
  }
  return { valid: true, type: 'TRC20', network: 'mainnet' };
}

const VALIDATORS = {
  btc: { name: 'Bitcoin', fn: validateBitcoin },
  eth: { name: 'Ethereum', fn: validateEthereum },
  ltc: { name: 'Litecoin', fn: validateLitecoin },
  doge: { name: 'Dogecoin', fn: validateDogecoin },
  xrp: { name: 'XRP (Ripple)', fn: validateXRP },
  ada: { name: 'Cardano', fn: validateCardano },
  sol: { name: 'Solana', fn: validateSolana },
  trx: { name: 'TRON', fn: validateTron },
};

export function validateCryptoAddress(address, currency) {
  if (!address || typeof address !== 'string') {
    return { valid: false, reason: 'Address is required' };
  }

  address = address.trim();

  if (currency) {
    currency = currency.toLowerCase();
    const validator = VALIDATORS[currency];
    if (!validator) {
      return { valid: false, reason: `Unsupported currency: ${currency}. Supported: ${Object.keys(VALIDATORS).join(', ')}` };
    }
    const result = validator.fn(address);
    return { ...result, currency: currency.toUpperCase(), currencyName: validator.name };
  }

  // Auto-detect currency
  return detectCryptoAddress(address);
}

export function detectCryptoAddress(address) {
  if (!address || typeof address !== 'string') {
    return { valid: false, reason: 'Address is required' };
  }

  address = address.trim();
  const results = [];

  for (const [code, { name, fn }] of Object.entries(VALIDATORS)) {
    const result = fn(address);
    if (result.valid) {
      results.push({ currency: code.toUpperCase(), currencyName: name, ...result });
    }
  }

  if (results.length === 0) {
    return { valid: false, reason: 'Could not identify cryptocurrency for this address', address };
  }

  if (results.length === 1) {
    return results[0];
  }

  // Multiple matches (rare) — return most likely with all matches
  return {
    valid: true,
    currency: results[0].currency,
    currencyName: results[0].currencyName,
    type: results[0].type,
    network: results[0].network,
    matches: results,
  };
}

export function listSupportedCurrencies() {
  return Object.entries(VALIDATORS).map(([code, { name }]) => ({
    code: code.toUpperCase(),
    name,
    formats: getFormats(code),
  }));
}

function getFormats(code) {
  switch (code) {
    case 'btc': return ['P2PKH (1...)', 'P2SH (3...)', 'Bech32 (bc1...)'];
    case 'eth': return ['Hex (0x...)'];
    case 'ltc': return ['P2PKH (L...)', 'P2SH (M/3...)', 'Bech32 (ltc1...)'];
    case 'doge': return ['P2PKH (D...)', 'P2SH (A...)'];
    case 'xrp': return ['Classic (r...)'];
    case 'ada': return ['Shelley (addr1...)', 'Byron (Ae2...)'];
    case 'sol': return ['Ed25519 (Base58)'];
    case 'trx': return ['TRC20 (T...)'];
    default: return [];
  }
}
