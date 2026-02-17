// IBAN validation and parsing

// Country-specific IBAN lengths and formats
const IBAN_SPECS = {
  AL: { len: 28, name: 'Albania' },
  AD: { len: 24, name: 'Andorra' },
  AT: { len: 20, name: 'Austria' },
  AZ: { len: 28, name: 'Azerbaijan' },
  BH: { len: 22, name: 'Bahrain' },
  BY: { len: 28, name: 'Belarus' },
  BE: { len: 16, name: 'Belgium' },
  BA: { len: 20, name: 'Bosnia and Herzegovina' },
  BR: { len: 29, name: 'Brazil' },
  BG: { len: 22, name: 'Bulgaria' },
  CR: { len: 22, name: 'Costa Rica' },
  HR: { len: 21, name: 'Croatia' },
  CY: { len: 28, name: 'Cyprus' },
  CZ: { len: 24, name: 'Czech Republic' },
  DK: { len: 18, name: 'Denmark' },
  DO: { len: 28, name: 'Dominican Republic' },
  TL: { len: 23, name: 'East Timor' },
  EG: { len: 29, name: 'Egypt' },
  SV: { len: 28, name: 'El Salvador' },
  EE: { len: 20, name: 'Estonia' },
  FO: { len: 18, name: 'Faroe Islands' },
  FI: { len: 18, name: 'Finland' },
  FR: { len: 27, name: 'France' },
  GE: { len: 22, name: 'Georgia' },
  DE: { len: 22, name: 'Germany' },
  GI: { len: 23, name: 'Gibraltar' },
  GR: { len: 27, name: 'Greece' },
  GL: { len: 18, name: 'Greenland' },
  GT: { len: 28, name: 'Guatemala' },
  HU: { len: 28, name: 'Hungary' },
  IS: { len: 26, name: 'Iceland' },
  IQ: { len: 23, name: 'Iraq' },
  IE: { len: 22, name: 'Ireland' },
  IL: { len: 23, name: 'Israel' },
  IT: { len: 27, name: 'Italy' },
  JO: { len: 30, name: 'Jordan' },
  KZ: { len: 20, name: 'Kazakhstan' },
  XK: { len: 20, name: 'Kosovo' },
  KW: { len: 30, name: 'Kuwait' },
  LV: { len: 21, name: 'Latvia' },
  LB: { len: 28, name: 'Lebanon' },
  LI: { len: 21, name: 'Liechtenstein' },
  LT: { len: 20, name: 'Lithuania' },
  LU: { len: 20, name: 'Luxembourg' },
  MK: { len: 19, name: 'North Macedonia' },
  MT: { len: 31, name: 'Malta' },
  MR: { len: 27, name: 'Mauritania' },
  MU: { len: 30, name: 'Mauritius' },
  MC: { len: 27, name: 'Monaco' },
  MD: { len: 24, name: 'Moldova' },
  ME: { len: 22, name: 'Montenegro' },
  NL: { len: 18, name: 'Netherlands' },
  NO: { len: 15, name: 'Norway' },
  PK: { len: 24, name: 'Pakistan' },
  PS: { len: 29, name: 'Palestine' },
  PL: { len: 28, name: 'Poland' },
  PT: { len: 25, name: 'Portugal' },
  QA: { len: 29, name: 'Qatar' },
  RO: { len: 24, name: 'Romania' },
  LC: { len: 32, name: 'Saint Lucia' },
  SM: { len: 27, name: 'San Marino' },
  ST: { len: 25, name: 'Sao Tome and Principe' },
  SA: { len: 24, name: 'Saudi Arabia' },
  RS: { len: 22, name: 'Serbia' },
  SC: { len: 31, name: 'Seychelles' },
  SK: { len: 24, name: 'Slovakia' },
  SI: { len: 19, name: 'Slovenia' },
  ES: { len: 24, name: 'Spain' },
  SE: { len: 24, name: 'Sweden' },
  CH: { len: 21, name: 'Switzerland' },
  TN: { len: 24, name: 'Tunisia' },
  TR: { len: 26, name: 'Turkey' },
  UA: { len: 29, name: 'Ukraine' },
  AE: { len: 23, name: 'United Arab Emirates' },
  GB: { len: 22, name: 'United Kingdom' },
  VA: { len: 22, name: 'Vatican City' },
  VG: { len: 24, name: 'Virgin Islands, British' },
};

// Mod 97 check (handles big numbers via string chunking)
function mod97(digits) {
  let remainder = '';
  for (const ch of digits) {
    remainder += ch;
    remainder = String(parseInt(remainder, 10) % 97);
  }
  return parseInt(remainder, 10);
}

// Convert IBAN to numeric string for mod-97 check
function ibanToDigits(iban) {
  // Move first 4 chars to end
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let digits = '';
  for (const ch of rearranged) {
    if (ch >= '0' && ch <= '9') {
      digits += ch;
    } else {
      // A=10, B=11, ..., Z=35
      digits += String(ch.charCodeAt(0) - 55);
    }
  }
  return digits;
}

export function validateIBAN(iban) {
  if (!iban || typeof iban !== 'string') {
    return { valid: false, reason: 'IBAN is required' };
  }

  // Clean: remove spaces and dashes, uppercase
  const cleaned = iban.replace(/[\s-]/g, '').toUpperCase();

  // Check basic format
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(cleaned)) {
    return { valid: false, reason: 'Invalid IBAN format' };
  }

  const country = cleaned.slice(0, 2);
  const checkDigits = cleaned.slice(2, 4);
  const bban = cleaned.slice(4);

  // Check country
  const spec = IBAN_SPECS[country];
  if (!spec) {
    return { valid: false, reason: `Unsupported country code: ${country}` };
  }

  // Check length
  if (cleaned.length !== spec.len) {
    return { valid: false, reason: `Invalid length for ${spec.name}: expected ${spec.len}, got ${cleaned.length}` };
  }

  // Mod-97 check
  const digits = ibanToDigits(cleaned);
  const remainder = mod97(digits);
  if (remainder !== 1) {
    return { valid: false, reason: 'Check digits failed (mod-97)' };
  }

  return {
    valid: true,
    country,
    countryName: spec.name,
    checkDigits,
    bban,
    formatted: formatIBAN(cleaned),
    electronicFormat: cleaned,
  };
}

export function formatIBAN(iban) {
  const cleaned = iban.replace(/[\s-]/g, '').toUpperCase();
  // Group in blocks of 4
  return cleaned.replace(/(.{4})/g, '$1 ').trim();
}

export function generateIBANCheckDigits(country, bban) {
  if (!country || !bban) {
    return { error: 'Country code and BBAN are required' };
  }
  country = country.toUpperCase();
  bban = bban.replace(/[\s-]/g, '').toUpperCase();

  const spec = IBAN_SPECS[country];
  if (!spec) {
    return { error: `Unsupported country code: ${country}` };
  }

  if (bban.length !== spec.len - 4) {
    return { error: `BBAN length should be ${spec.len - 4} for ${spec.name}, got ${bban.length}` };
  }

  // Calculate check digits: use 00 as placeholder
  const placeholder = country + '00' + bban;
  const digits = ibanToDigits(placeholder);
  const remainder = mod97(digits);
  const checkDigits = String(98 - remainder).padStart(2, '0');

  const iban = country + checkDigits + bban;
  return {
    iban: iban,
    formatted: formatIBAN(iban),
    checkDigits,
    country,
    countryName: spec.name,
  };
}

export function listIBANCountries() {
  return Object.entries(IBAN_SPECS).map(([code, spec]) => ({
    code,
    name: spec.name,
    ibanLength: spec.len,
  })).sort((a, b) => a.name.localeCompare(b.name));
}
