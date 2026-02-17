/**
 * Barcode generation — Code128, EAN-13, Code39.
 * Pure JS, outputs SVG strings. No native dependencies.
 */

// Code128 character set B (ASCII 32-127) — most common for general text
const CODE128_START_B = 104;
const CODE128_STOP = 106;

// Code128 encoding patterns (each character = 6 bars + 6 spaces = 11 modules)
const CODE128_PATTERNS = [
  '11011001100', '11001101100', '11001100110', '10010011000', '10010001100',
  '10001001100', '10011001000', '10011000100', '10001100100', '11001001000',
  '11001000100', '11000100100', '10110011100', '10011011100', '10011001110',
  '10111001100', '10011101100', '10011100110', '11001110010', '11001011100',
  '11001001110', '11011100100', '11001110100', '11101101110', '11101001100',
  '11100101100', '11100100110', '11101100100', '11100110100', '11100110010',
  '11011011000', '11011000110', '11000110110', '10100011000', '10001011000',
  '10001000110', '10110001000', '10001101000', '10001100010', '11010001000',
  '11000101000', '11000100010', '10110111000', '10110001110', '10001101110',
  '10111011000', '10111000110', '10001110110', '11101110110', '11010001110',
  '11000101110', '11011101000', '11011100010', '11011101110', '11101011000',
  '11101000110', '11100010110', '11101101000', '11101100010', '11100011010',
  '11101111010', '11001000010', '11110001010', '10100110000', '10100001100',
  '10010110000', '10010000110', '10000101100', '10000100110', '10110010000',
  '10110000100', '10011010000', '10011000010', '10000110100', '10000110010',
  '11000010010', '11001010000', '11110111010', '11000010100', '10001111010',
  '10100111100', '10010111100', '10010011110', '10111100100', '10011110100',
  '10011110010', '11110100100', '11110010100', '11110010010', '11011011110',
  '11011110110', '11110110110', '10101111000', '10100011110', '10001011110',
  '10111101000', '10111100010', '11110101000', '11110100010', '10111011110',
  '10111101110', '11101011110', '11110101110',
  '11010000100', // START A (103)
  '11010010000', // START B (104)
  '11010011100', // START C (105)
  '1100011101011', // STOP (106)
];

/**
 * Encode text as Code128B barcode pattern.
 * Returns array of 0/1 (bar/space widths).
 */
export function encodeCode128(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('text is required');
  }
  if (text.length > 80) {
    throw new Error('Text too long (max 80 characters)');
  }

  // Check all characters are in Code B range (ASCII 32-127)
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code < 32 || code > 127) {
      throw new Error(`Character at position ${i} (code ${code}) not supported in Code128B`);
    }
  }

  const values = [];
  values.push(CODE128_START_B);

  let checksum = CODE128_START_B;
  for (let i = 0; i < text.length; i++) {
    const value = text.charCodeAt(i) - 32;
    values.push(value);
    checksum += value * (i + 1);
  }

  values.push(checksum % 103);
  values.push(CODE128_STOP);

  // Convert to binary pattern
  let pattern = '';
  for (const v of values) {
    pattern += CODE128_PATTERNS[v];
  }

  return pattern;
}

// EAN-13 encoding tables
const EAN_L = ['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011'];
const EAN_G = ['0100111','0110011','0011011','0100001','0011101','0111001','0000101','0010001','0001001','0010111'];
const EAN_R = ['1110010','1100110','1101100','1000010','1011100','1001110','1010000','1000100','1001000','1110100'];
const EAN_PARITY = [
  'LLLLLL','LLGLGG','LLGGLG','LLGGGL','LGLLGG',
  'LGGLLG','LGGGLL','LGLGLG','LGLGGL','LGGLGL'
];

/**
 * Encode a 12 or 13-digit number as EAN-13 barcode.
 * If 12 digits, calculates check digit. If 13, validates it.
 */
export function encodeEAN13(digits) {
  if (!digits || typeof digits !== 'string') {
    throw new Error('digits is required (12 or 13 digit string)');
  }

  const clean = digits.replace(/\D/g, '');
  if (clean.length !== 12 && clean.length !== 13) {
    throw new Error('Expected 12 or 13 digits');
  }

  let d;
  if (clean.length === 12) {
    d = clean + calculateEANCheckDigit(clean);
  } else {
    const expected = calculateEANCheckDigit(clean.slice(0, 12));
    if (clean[12] !== expected) {
      throw new Error(`Invalid check digit: expected ${expected}, got ${clean[12]}`);
    }
    d = clean;
  }

  const parityPattern = EAN_PARITY[parseInt(d[0], 10)];

  // Start guard
  let pattern = '101';

  // Left group (digits 1-6)
  for (let i = 0; i < 6; i++) {
    const digit = parseInt(d[i + 1], 10);
    pattern += parityPattern[i] === 'L' ? EAN_L[digit] : EAN_G[digit];
  }

  // Center guard
  pattern += '01010';

  // Right group (digits 7-12)
  for (let i = 0; i < 6; i++) {
    const digit = parseInt(d[i + 7], 10);
    pattern += EAN_R[digit];
  }

  // End guard
  pattern += '101';

  return { pattern, digits: d };
}

function calculateEANCheckDigit(digits12) {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits12[i], 10) * (i % 2 === 0 ? 1 : 3);
  }
  return String((10 - (sum % 10)) % 10);
}

// Code39 encoding
const CODE39_CHARS = {
  '0':'101001101101','1':'110100101011','2':'101100101011','3':'110110010101',
  '4':'101001101011','5':'110100110101','6':'101100110101','7':'101001011011',
  '8':'110100101101','9':'101100101101','A':'110101001011','B':'101101001011',
  'C':'110110100101','D':'101011001011','E':'110101100101','F':'101101100101',
  'G':'101010011011','H':'110101001101','I':'101101001101','J':'101011001101',
  'K':'110101010011','L':'101101010011','M':'110110101001','N':'101011010011',
  'O':'110101101001','P':'101101101001','Q':'101010110011','R':'110101011001',
  'S':'101101011001','T':'101011011001','U':'110010101011','V':'100110101011',
  'W':'110011010101','X':'100101101011','Y':'110010110101','Z':'100110110101',
  '-':'100101011011','.':'110010101101',' ':'100110101101','$':'100100100101',
  '/':'100100101001','+':'100101001001','%':'101001001001','*':'100101101101'
};

/**
 * Encode text as Code39 barcode.
 */
export function encodeCode39(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('text is required');
  }
  if (text.length > 40) {
    throw new Error('Text too long (max 40 characters)');
  }

  const upper = text.toUpperCase();
  for (const ch of upper) {
    if (!CODE39_CHARS[ch]) {
      throw new Error(`Character "${ch}" not supported in Code39`);
    }
  }

  // Add start/stop asterisks
  let pattern = CODE39_CHARS['*'] + '0'; // narrow space between chars
  for (const ch of upper) {
    pattern += CODE39_CHARS[ch] + '0';
  }
  pattern += CODE39_CHARS['*'];

  return pattern;
}

/**
 * Render a barcode pattern to SVG string.
 */
export function barcodeToSVG(pattern, options = {}) {
  const {
    width = null,
    height = 100,
    barColor = '#000000',
    background = '#ffffff',
    showText = true,
    text = '',
    fontSize = 14,
    margin = 10,
  } = options;

  const moduleWidth = width ? (width - margin * 2) / pattern.length : 2;
  const totalWidth = width || (pattern.length * moduleWidth + margin * 2);
  const barHeight = showText && text ? height - fontSize - 8 : height - margin;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}" viewBox="0 0 ${totalWidth} ${height}">`;
  svg += `<rect width="${totalWidth}" height="${height}" fill="${background}"/>`;

  let x = margin;
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === '1') {
      svg += `<rect x="${x}" y="${margin}" width="${moduleWidth}" height="${barHeight}" fill="${barColor}"/>`;
    }
    x += moduleWidth;
  }

  if (showText && text) {
    svg += `<text x="${totalWidth / 2}" y="${height - 4}" text-anchor="middle" font-family="monospace" font-size="${fontSize}" fill="${barColor}">${escapeXml(text)}</text>`;
  }

  svg += '</svg>';
  return svg;
}

function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * High-level barcode generation.
 */
export function generateBarcode(text, format = 'code128', options = {}) {
  if (!text || typeof text !== 'string') {
    throw new Error('text is required');
  }

  let pattern, displayText;

  switch (format.toLowerCase()) {
    case 'code128':
      pattern = encodeCode128(text);
      displayText = text;
      break;
    case 'ean13':
    case 'ean-13': {
      const result = encodeEAN13(text);
      pattern = result.pattern;
      displayText = result.digits;
      break;
    }
    case 'code39':
      pattern = encodeCode39(text);
      displayText = `*${text.toUpperCase()}*`;
      break;
    default:
      throw new Error(`Unsupported format: ${format}. Supported: code128, ean13, code39`);
  }

  const svg = barcodeToSVG(pattern, { ...options, text: displayText });

  return {
    format: format.toLowerCase(),
    text: displayText,
    pattern,
    svg,
    modules: pattern.length,
  };
}

/**
 * List supported barcode formats.
 */
export function listFormats() {
  return {
    formats: [
      { id: 'code128', name: 'Code 128', description: 'High-density barcode for alphanumeric data', maxLength: 80, characters: 'ASCII 32-127' },
      { id: 'ean13', name: 'EAN-13', description: 'European Article Number (retail products)', maxLength: 13, characters: 'Digits 0-9 only' },
      { id: 'code39', name: 'Code 39', description: 'Alphanumeric barcode for industrial use', maxLength: 40, characters: 'A-Z, 0-9, - . $ / + % SPACE' },
    ]
  };
}
