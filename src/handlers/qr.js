// QR Code generation — pure JS, outputs SVG
// Implements QR Code Model 2, versions 1-10, error correction levels L/M/Q/H

// ===== Reed-Solomon GF(256) arithmetic =====
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);

(function initGaloisField() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x = x << 1;
    if (x & 0x100) x ^= 0x11D;
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
})();

function gfMul(a, b) {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[(GF_LOG[a] + GF_LOG[b]) % 255];
}

function rsGeneratorPoly(nsym) {
  let g = [1];
  for (let i = 0; i < nsym; i++) {
    const ng = new Array(g.length + 1).fill(0);
    for (let j = 0; j < g.length; j++) {
      ng[j] ^= g[j];
      ng[j + 1] ^= gfMul(g[j], GF_EXP[i]);
    }
    g = ng;
  }
  return g;
}

function rsEncode(data, nsym) {
  const gen = rsGeneratorPoly(nsym);
  const res = new Array(data.length + nsym).fill(0);
  for (let i = 0; i < data.length; i++) res[i] = data[i];

  for (let i = 0; i < data.length; i++) {
    const coef = res[i];
    if (coef !== 0) {
      for (let j = 1; j < gen.length; j++) {
        res[i + j] ^= gfMul(gen[j], coef);
      }
    }
  }
  return res.slice(data.length);
}

// ===== QR Code constants =====
const EC_CODEWORDS_TABLE = {
  //     L    M    Q    H
  1:  [  7,  10,  13,  17],
  2:  [ 10,  16,  22,  28],
  3:  [ 15,  26,  36,  44],
  4:  [ 20,  36,  52,  64],
  5:  [ 26,  48,  72,  88],
  6:  [ 36,  64,  96, 112],
  7:  [ 40,  72, 108, 130],
  8:  [ 48,  88, 132, 156],
  9:  [ 60, 110, 160, 192],
  10: [ 72, 130, 192, 224],
};

const DATA_CODEWORDS = {
  1: 26, 2: 44, 3: 70, 4: 100, 5: 134, 6: 172, 7: 196, 8: 242, 9: 292, 10: 346,
};

// Number of error correction blocks [L, M, Q, H]
const NUM_BLOCKS = {
  1:  [1, 1, 1, 1],
  2:  [1, 1, 1, 1],
  3:  [1, 1, 2, 2],
  4:  [1, 2, 2, 4],
  5:  [1, 2, 2, 2],
  6:  [2, 4, 4, 4],
  7:  [2, 4, 2, 4],
  8:  [2, 2, 4, 4],
  9:  [2, 3, 4, 4],
  10: [2, 4, 6, 6],
};

// Block structure: some versions need two different block sizes
// Format: [numBlocks1, dataPerBlock1, numBlocks2, dataPerBlock2]
// If only one block type, numBlocks2 = 0
const BLOCK_STRUCTURE = {
  1:  { L: [1,19,0,0], M: [1,16,0,0], Q: [1,13,0,0], H: [1,9,0,0] },
  2:  { L: [1,34,0,0], M: [1,28,0,0], Q: [1,22,0,0], H: [1,16,0,0] },
  3:  { L: [1,55,0,0], M: [1,44,0,0], Q: [2,17,0,0], H: [2,13,0,0] },
  4:  { L: [1,80,0,0], M: [2,32,0,0], Q: [2,24,0,0], H: [4,9,0,0] },
  5:  { L: [1,108,0,0], M: [2,43,0,0], Q: [2,15,2,16], H: [2,11,2,12] },
  6:  { L: [2,68,0,0], M: [4,27,0,0], Q: [4,19,0,0], H: [4,15,0,0] },
  7:  { L: [2,78,0,0], M: [4,31,0,0], Q: [2,14,4,15], H: [4,13,1,14] },
  8:  { L: [2,97,0,0], M: [2,38,2,39], Q: [4,18,2,19], H: [4,14,2,15] },
  9:  { L: [2,116,0,0], M: [3,36,2,37], Q: [4,16,4,17], H: [4,12,4,13] },
  10: { L: [2,68,2,69], M: [4,43,1,44], Q: [6,19,2,20], H: [6,15,2,16] },
};

const ALIGNMENT_POSITIONS = {
  2: [6, 18],
  3: [6, 22],
  4: [6, 26],
  5: [6, 30],
  6: [6, 34],
  7: [6, 22, 38],
  8: [6, 24, 42],
  9: [6, 26, 46],
  10: [6, 28, 52],
};

const EC_LEVEL_BITS = { L: 1, M: 0, Q: 3, H: 2 };

// Byte mode capacity (number of characters that can be encoded)
const BYTE_CAPACITY = {
  //     L    M    Q    H
  1:  [ 17,  14,  11,   7],
  2:  [ 32,  26,  20,  14],
  3:  [ 53,  42,  32,  24],
  4:  [ 78,  62,  46,  34],
  5:  [106,  84,  60,  44],
  6:  [134, 106,  74,  58],
  7:  [154, 122,  86,  64],
  8:  [192, 152, 108,  84],
  9:  [230, 180, 130,  98],
  10: [271, 213, 151, 119],
};

const EC_INDEX = { L: 0, M: 1, Q: 2, H: 3 };

// ===== Encoding =====

function encodeData(text, ecLevel) {
  const data = new TextEncoder().encode(text);
  const ecIdx = EC_INDEX[ecLevel];

  // Find minimum version
  let version = 0;
  for (let v = 1; v <= 10; v++) {
    if (data.length <= BYTE_CAPACITY[v][ecIdx]) {
      version = v;
      break;
    }
  }
  if (version === 0) throw new Error(`Text too long for QR versions 1-10 (max ${BYTE_CAPACITY[10][ecIdx]} bytes at EC level ${ecLevel})`);

  // Build data stream: mode indicator (0100 = byte) + character count + data + terminator + padding
  const totalDataCW = DATA_CODEWORDS[version] - EC_CODEWORDS_TABLE[version][ecIdx];
  const bits = [];

  // Mode: byte (0100)
  pushBits(bits, 0b0100, 4);

  // Character count (8 bits for byte mode, version 1-9; 16 bits for version 10+)
  const ccBits = version <= 9 ? 8 : 16;
  pushBits(bits, data.length, ccBits);

  // Data
  for (const b of data) {
    pushBits(bits, b, 8);
  }

  // Terminator (up to 4 zeros)
  const totalBits = totalDataCW * 8;
  const termLen = Math.min(4, totalBits - bits.length);
  pushBits(bits, 0, termLen);

  // Pad to byte boundary
  while (bits.length % 8 !== 0) bits.push(0);

  // Pad bytes (0xEC, 0x11 alternating)
  const padBytes = [0xEC, 0x11];
  let padIdx = 0;
  while (bits.length < totalBits) {
    pushBits(bits, padBytes[padIdx % 2], 8);
    padIdx++;
  }

  // Convert bits to codewords
  const codewords = [];
  for (let i = 0; i < bits.length; i += 8) {
    let val = 0;
    for (let j = 0; j < 8; j++) val = (val << 1) | (bits[i + j] || 0);
    codewords.push(val);
  }

  return { version, codewords, totalDataCW };
}

function pushBits(arr, value, count) {
  for (let i = count - 1; i >= 0; i--) {
    arr.push((value >> i) & 1);
  }
}

// ===== Error correction & interleaving =====

function addErrorCorrection(codewords, version, ecLevel) {
  const ecIdx = EC_INDEX[ecLevel];
  const ecCW = EC_CODEWORDS_TABLE[version][ecIdx];
  const bs = BLOCK_STRUCTURE[version][ecLevel];
  const [nb1, dpb1, nb2, dpb2] = bs;
  const totalBlocks = nb1 + nb2;
  const ecPerBlock = Math.floor(ecCW / totalBlocks);

  const dataBlocks = [];
  const ecBlocks = [];
  let offset = 0;

  for (let i = 0; i < nb1; i++) {
    const block = codewords.slice(offset, offset + dpb1);
    dataBlocks.push(block);
    ecBlocks.push(rsEncode(block, ecPerBlock));
    offset += dpb1;
  }
  for (let i = 0; i < nb2; i++) {
    const block = codewords.slice(offset, offset + dpb2);
    dataBlocks.push(block);
    ecBlocks.push(rsEncode(block, ecPerBlock));
    offset += dpb2;
  }

  // Interleave data codewords
  const maxDataLen = Math.max(dpb1, dpb2 || 0);
  const result = [];
  for (let i = 0; i < maxDataLen; i++) {
    for (const block of dataBlocks) {
      if (i < block.length) result.push(block[i]);
    }
  }

  // Interleave EC codewords
  for (let i = 0; i < ecPerBlock; i++) {
    for (const block of ecBlocks) {
      if (i < block.length) result.push(block[i]);
    }
  }

  return result;
}

// ===== Matrix construction =====

function createMatrix(version) {
  const size = 17 + version * 4;
  // 0 = not set, 1 = black function pattern, 2 = white function pattern
  // 3 = black data, 4 = white data
  const matrix = Array.from({ length: size }, () => new Uint8Array(size));
  return { matrix, size };
}

function addFinderPatterns(m, size) {
  const positions = [[0, 0], [size - 7, 0], [0, size - 7]];
  for (const [row, col] of positions) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBlack = (r === 0 || r === 6 || c === 0 || c === 6) ||
                        (r >= 2 && r <= 4 && c >= 2 && c <= 4);
        set(m, row + r, col + c, size, isBlack ? 1 : 2);
      }
    }
  }

  // Separators
  for (let i = 0; i < 8; i++) {
    // Top-left
    setIfValid(m, 7, i, size, 2);
    setIfValid(m, i, 7, size, 2);
    // Top-right
    setIfValid(m, i, size - 8, size, 2);
    setIfValid(m, 7, size - 8 + i, size, 2);
    // Bottom-left
    setIfValid(m, size - 8, i, size, 2);
    setIfValid(m, size - 8 + i, 7, size, 2);
  }
}

function addAlignmentPatterns(m, version, size) {
  if (version < 2) return;
  const positions = ALIGNMENT_POSITIONS[version];
  for (const row of positions) {
    for (const col of positions) {
      // Skip if overlaps with finder patterns
      if (row <= 8 && col <= 8) continue;
      if (row <= 8 && col >= size - 8) continue;
      if (row >= size - 8 && col <= 8) continue;

      for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
          const isBlack = Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0);
          set(m, row + r, col + c, size, isBlack ? 1 : 2);
        }
      }
    }
  }
}

function addTimingPatterns(m, size) {
  for (let i = 8; i < size - 8; i++) {
    if (m[6][i] === 0) set(m, 6, i, size, i % 2 === 0 ? 1 : 2);
    if (m[i][6] === 0) set(m, i, 6, size, i % 2 === 0 ? 1 : 2);
  }
}

function addDarkModule(m, version, size) {
  set(m, (4 * version) + 9, 8, size, 1);
}

function reserveFormatArea(m, size) {
  // Around top-left finder
  for (let i = 0; i < 9; i++) {
    if (m[8][i] === 0) set(m, 8, i, size, 2);
    if (m[i][8] === 0) set(m, i, 8, size, 2);
  }
  // Around top-right finder
  for (let i = 0; i < 8; i++) {
    if (m[8][size - 1 - i] === 0) set(m, 8, size - 1 - i, size, 2);
  }
  // Around bottom-left finder
  for (let i = 0; i < 7; i++) {
    if (m[size - 1 - i][8] === 0) set(m, size - 1 - i, 8, size, 2);
  }
}

function set(m, r, c, size, val) {
  if (r >= 0 && r < size && c >= 0 && c < size) m[r][c] = val;
}

function setIfValid(m, r, c, size, val) {
  if (r >= 0 && r < size && c >= 0 && c < size && m[r][c] === 0) m[r][c] = val;
}

function placeData(m, size, dataBits) {
  let bitIdx = 0;
  let upward = true;

  for (let col = size - 1; col >= 0; col -= 2) {
    if (col === 6) col = 5; // Skip timing column

    const rows = upward ? rangeDesc(size - 1, 0) : rangeAsc(0, size - 1);
    for (const row of rows) {
      for (const c of [col, col - 1]) {
        if (c < 0) continue;
        if (m[row][c] !== 0) continue;
        const bit = bitIdx < dataBits.length ? dataBits[bitIdx] : 0;
        m[row][c] = bit ? 3 : 4; // 3 = black data, 4 = white data
        bitIdx++;
      }
    }
    upward = !upward;
  }
}

function rangeAsc(from, to) {
  const arr = [];
  for (let i = from; i <= to; i++) arr.push(i);
  return arr;
}

function rangeDesc(from, to) {
  const arr = [];
  for (let i = from; i >= to; i--) arr.push(i);
  return arr;
}

// ===== Masking =====

const MASK_FUNCTIONS = [
  (r, c) => (r + c) % 2 === 0,
  (r, c) => r % 2 === 0,
  (r, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
];

function applyMask(matrix, size, maskNum) {
  const result = matrix.map(row => new Uint8Array(row));
  const fn = MASK_FUNCTIONS[maskNum];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const val = result[r][c];
      if (val === 3 || val === 4) {
        if (fn(r, c)) {
          result[r][c] = val === 3 ? 4 : 3; // Toggle
        }
      }
    }
  }
  return result;
}

function isBlack(val) {
  return val === 1 || val === 3;
}

function penaltyScore(matrix, size) {
  let penalty = 0;

  // Rule 1: Adjacent modules in row/column (5+ same color)
  for (let r = 0; r < size; r++) {
    let count = 1;
    for (let c = 1; c < size; c++) {
      if (isBlack(matrix[r][c]) === isBlack(matrix[r][c - 1])) {
        count++;
      } else {
        if (count >= 5) penalty += count - 2;
        count = 1;
      }
    }
    if (count >= 5) penalty += count - 2;
  }

  for (let c = 0; c < size; c++) {
    let count = 1;
    for (let r = 1; r < size; r++) {
      if (isBlack(matrix[r][c]) === isBlack(matrix[r - 1][c])) {
        count++;
      } else {
        if (count >= 5) penalty += count - 2;
        count = 1;
      }
    }
    if (count >= 5) penalty += count - 2;
  }

  // Rule 2: 2x2 blocks of same color
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const b = isBlack(matrix[r][c]);
      if (b === isBlack(matrix[r][c + 1]) &&
          b === isBlack(matrix[r + 1][c]) &&
          b === isBlack(matrix[r + 1][c + 1])) {
        penalty += 3;
      }
    }
  }

  // Rule 3: Finder-like patterns
  const patterns = [
    [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1],
  ];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c <= size - 11; c++) {
      for (const pat of patterns) {
        let match = true;
        for (let i = 0; i < 11; i++) {
          if ((isBlack(matrix[r][c + i]) ? 1 : 0) !== pat[i]) { match = false; break; }
        }
        if (match) penalty += 40;
      }
    }
  }
  for (let c = 0; c < size; c++) {
    for (let r = 0; r <= size - 11; r++) {
      for (const pat of patterns) {
        let match = true;
        for (let i = 0; i < 11; i++) {
          if ((isBlack(matrix[r + i][c]) ? 1 : 0) !== pat[i]) { match = false; break; }
        }
        if (match) penalty += 40;
      }
    }
  }

  // Rule 4: Proportion of dark modules
  let dark = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (isBlack(matrix[r][c])) dark++;
    }
  }
  const pct = (dark * 100) / (size * size);
  const prev5 = Math.floor(pct / 5) * 5;
  const next5 = prev5 + 5;
  penalty += Math.min(Math.abs(prev5 - 50), Math.abs(next5 - 50)) * 2;

  return penalty;
}

// ===== Format information =====

const FORMAT_POLY = 0x537;
const FORMAT_MASK = 0x5412;

function getFormatBits(ecLevel, maskNum) {
  const ecBits = EC_LEVEL_BITS[ecLevel];
  let data = (ecBits << 3) | maskNum;
  let rem = data << 10;
  for (let i = 14; i >= 10; i--) {
    if (rem & (1 << i)) rem ^= FORMAT_POLY << (i - 10);
  }
  const bits = ((data << 10) | rem) ^ FORMAT_MASK;
  return bits;
}

function placeFormatBits(matrix, size, ecLevel, maskNum) {
  const bits = getFormatBits(ecLevel, maskNum);

  // Top-left: row 8, columns 0-7 (skip col 6 = timing)
  const seq1 = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5],
    [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  ];

  // Bottom-left + top-right
  const seq2 = [
    [size - 1, 8], [size - 2, 8], [size - 3, 8], [size - 4, 8],
    [size - 5, 8], [size - 6, 8], [size - 7, 8],
    [8, size - 8], [8, size - 7], [8, size - 6], [8, size - 5],
    [8, size - 4], [8, size - 3], [8, size - 2], [8, size - 1],
  ];

  for (let i = 0; i < 15; i++) {
    const bit = (bits >> i) & 1;
    const [r1, c1] = seq1[i];
    matrix[r1][c1] = bit ? 1 : 2;
    const [r2, c2] = seq2[i];
    matrix[r2][c2] = bit ? 1 : 2;
  }
}

// ===== Main QR generation =====

export function generateQR(text, options = {}) {
  const ecLevel = (options.ecLevel || 'M').toUpperCase();
  if (!['L', 'M', 'Q', 'H'].includes(ecLevel)) {
    throw new Error('Invalid EC level. Use L, M, Q, or H');
  }

  const { version, codewords } = encodeData(text, ecLevel);
  const allCodewords = addErrorCorrection(codewords, version, ecLevel);

  // Convert codewords to bits
  const dataBits = [];
  for (const cw of allCodewords) {
    for (let i = 7; i >= 0; i--) {
      dataBits.push((cw >> i) & 1);
    }
  }

  const { matrix, size } = createMatrix(version);

  // Place function patterns
  addFinderPatterns(matrix, size);
  addAlignmentPatterns(matrix, version, size);
  addTimingPatterns(matrix, size);
  addDarkModule(matrix, version, size);
  reserveFormatArea(matrix, size);

  // Place data
  placeData(matrix, size, dataBits);

  // Try all masks, pick best
  let bestMask = 0;
  let bestPenalty = Infinity;
  let bestMatrix = null;

  for (let mask = 0; mask < 8; mask++) {
    const masked = applyMask(matrix, size, mask);
    placeFormatBits(masked, size, ecLevel, mask);
    const p = penaltyScore(masked, size);
    if (p < bestPenalty) {
      bestPenalty = p;
      bestMask = mask;
      bestMatrix = masked;
    }
  }

  return {
    version,
    size,
    ecLevel,
    mask: bestMask,
    modules: bestMatrix,
  };
}

// ===== SVG output =====

export function qrToSVG(qr, options = {}) {
  const {
    moduleSize = 10,
    margin = 4,
    darkColor = '#000000',
    lightColor = '#ffffff',
  } = options;

  const { size, modules } = qr;
  const totalSize = (size + margin * 2) * moduleSize;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${totalSize}" height="${totalSize}">`;
  svg += `<rect width="${totalSize}" height="${totalSize}" fill="${lightColor}"/>`;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (isBlack(modules[r][c])) {
        const x = (c + margin) * moduleSize;
        const y = (r + margin) * moduleSize;
        svg += `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="${darkColor}"/>`;
      }
    }
  }

  svg += '</svg>';
  return svg;
}

// Optimized SVG using path instead of individual rects
export function qrToSVGOptimized(qr, options = {}) {
  const {
    moduleSize = 10,
    margin = 4,
    darkColor = '#000000',
    lightColor = '#ffffff',
  } = options;

  const { size, modules } = qr;
  const totalSize = (size + margin * 2) * moduleSize;

  let path = '';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (isBlack(modules[r][c])) {
        const x = (c + margin) * moduleSize;
        const y = (r + margin) * moduleSize;
        path += `M${x},${y}h${moduleSize}v${moduleSize}h-${moduleSize}z`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${totalSize}" height="${totalSize}"><rect width="${totalSize}" height="${totalSize}" fill="${lightColor}"/><path d="${path}" fill="${darkColor}"/></svg>`;
}

// ASCII art output
export function qrToASCII(qr) {
  const { size, modules } = qr;
  let result = '';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      result += isBlack(modules[r][c]) ? '██' : '  ';
    }
    result += '\n';
  }
  return result;
}

// Matrix of 0/1 values
export function qrToMatrix(qr) {
  const { size, modules } = qr;
  const result = [];
  for (let r = 0; r < size; r++) {
    const row = [];
    for (let c = 0; c < size; c++) {
      row.push(isBlack(modules[r][c]) ? 1 : 0);
    }
    result.push(row);
  }
  return result;
}
