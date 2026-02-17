// Math and statistics utilities

export function descriptiveStats(numbers) {
  if (!Array.isArray(numbers) || numbers.length === 0) {
    throw new Error('numbers must be a non-empty array');
  }
  const n = numbers.length;
  const sorted = [...numbers].sort((a, b) => a - b);

  const sum = numbers.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  const median = n % 2 === 0
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
    : sorted[Math.floor(n / 2)];

  const variance = numbers.reduce((acc, x) => acc + (x - mean) ** 2, 0) / n;
  const stdDev = Math.sqrt(variance);
  const sampleVariance = n > 1 ? numbers.reduce((acc, x) => acc + (x - mean) ** 2, 0) / (n - 1) : 0;
  const sampleStdDev = Math.sqrt(sampleVariance);

  // Mode
  const freq = {};
  let maxFreq = 0;
  for (const x of numbers) {
    freq[x] = (freq[x] || 0) + 1;
    if (freq[x] > maxFreq) maxFreq = freq[x];
  }
  const mode = maxFreq > 1
    ? Object.entries(freq).filter(([, f]) => f === maxFreq).map(([v]) => Number(v))
    : [];

  return {
    count: n,
    sum: round(sum),
    mean: round(mean),
    median: round(median),
    mode,
    min: sorted[0],
    max: sorted[n - 1],
    range: round(sorted[n - 1] - sorted[0]),
    variance: round(variance),
    stdDev: round(stdDev),
    sampleVariance: round(sampleVariance),
    sampleStdDev: round(sampleStdDev),
  };
}

export function percentile(numbers, p) {
  if (!Array.isArray(numbers) || numbers.length === 0) {
    throw new Error('numbers must be a non-empty array');
  }
  if (p < 0 || p > 100) throw new Error('percentile must be between 0 and 100');

  const sorted = [...numbers].sort((a, b) => a - b);
  const n = sorted.length;

  if (p === 0) return sorted[0];
  if (p === 100) return sorted[n - 1];

  const index = (p / 100) * (n - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const frac = index - lower;

  return round(sorted[lower] + frac * (sorted[upper] - sorted[lower]));
}

export function percentiles(numbers, pList) {
  const result = {};
  for (const p of pList) {
    result[`p${p}`] = percentile(numbers, p);
  }
  return result;
}

export function correlation(x, y) {
  if (x.length !== y.length) throw new Error('Arrays must have same length');
  const n = x.length;
  if (n < 2) throw new Error('Need at least 2 data points');

  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    sumXY += dx * dy;
    sumX2 += dx * dx;
    sumY2 += dy * dy;
  }

  const denom = Math.sqrt(sumX2 * sumY2);
  const r = denom > 0 ? sumXY / denom : 0;

  return {
    r: round(r),
    rSquared: round(r * r),
    interpretation: interpretCorrelation(r),
    n,
  };
}

function interpretCorrelation(r) {
  const abs = Math.abs(r);
  const dir = r >= 0 ? 'positive' : 'negative';
  if (abs >= 0.9) return `Very strong ${dir}`;
  if (abs >= 0.7) return `Strong ${dir}`;
  if (abs >= 0.5) return `Moderate ${dir}`;
  if (abs >= 0.3) return `Weak ${dir}`;
  return 'Very weak / no correlation';
}

export function linearRegression(x, y) {
  if (x.length !== y.length) throw new Error('Arrays must have same length');
  const n = x.length;
  if (n < 2) throw new Error('Need at least 2 data points');

  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumXY += (x[i] - meanX) * (y[i] - meanY);
    sumX2 += (x[i] - meanX) ** 2;
  }

  const slope = sumX2 > 0 ? sumXY / sumX2 : 0;
  const intercept = meanY - slope * meanX;

  // R-squared
  const { rSquared } = correlation(x, y);

  return {
    slope: round(slope),
    intercept: round(intercept),
    equation: `y = ${round(slope)}x + ${round(intercept)}`,
    rSquared,
    n,
  };
}

export function zScore(value, mean, stdDev) {
  if (stdDev === 0) throw new Error('Standard deviation cannot be zero');
  return round((value - mean) / stdDev);
}

export function normalize(numbers, opts = {}) {
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);
  const range = max - min;

  if (range === 0) return numbers.map(() => 0);

  const targetMin = opts.min ?? 0;
  const targetMax = opts.max ?? 1;
  const targetRange = targetMax - targetMin;

  return numbers.map(x => round(((x - min) / range) * targetRange + targetMin));
}

export function histogram(numbers, bins = 10) {
  if (!Array.isArray(numbers) || numbers.length === 0) {
    throw new Error('numbers must be a non-empty array');
  }

  const min = Math.min(...numbers);
  const max = Math.max(...numbers);
  const binWidth = (max - min) / bins || 1;

  const buckets = [];
  for (let i = 0; i < bins; i++) {
    const low = min + i * binWidth;
    const high = i === bins - 1 ? max + 0.001 : low + binWidth;
    const count = numbers.filter(x => x >= low && x < high).length;
    buckets.push({
      range: [round(low), round(i === bins - 1 ? max : high)],
      count,
      percentage: round(count / numbers.length * 100),
    });
  }

  return { bins: buckets, binWidth: round(binWidth), total: numbers.length };
}

export function outliers(numbers, method = 'iqr') {
  const sorted = [...numbers].sort((a, b) => a - b);
  const n = sorted.length;

  if (method === 'iqr') {
    const q1 = percentile(numbers, 25);
    const q3 = percentile(numbers, 75);
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    return {
      method: 'IQR',
      q1: round(q1),
      q3: round(q3),
      iqr: round(iqr),
      lowerBound: round(lowerBound),
      upperBound: round(upperBound),
      outliers: numbers.filter(x => x < lowerBound || x > upperBound),
      count: numbers.filter(x => x < lowerBound || x > upperBound).length,
    };
  }

  // Z-score method
  const mean = numbers.reduce((a, b) => a + b, 0) / n;
  const stdDev = Math.sqrt(numbers.reduce((acc, x) => acc + (x - mean) ** 2, 0) / n);
  const threshold = 2;

  return {
    method: 'z-score',
    mean: round(mean),
    stdDev: round(stdDev),
    threshold,
    outliers: numbers.filter(x => Math.abs((x - mean) / stdDev) > threshold),
    count: numbers.filter(x => Math.abs((x - mean) / stdDev) > threshold).length,
  };
}

export function evaluateExpression(expr) {
  // Safe math expression evaluator — no eval()
  // Supports: +, -, *, /, %, ^, (, ), numbers, and math functions
  const tokens = tokenize(expr);
  const result = parseExpression(tokens, 0);
  if (result.pos !== tokens.length) throw new Error('Unexpected token');
  return round(result.value);
}

function tokenize(expr) {
  const tokens = [];
  let i = 0;
  expr = expr.replace(/\s+/g, '');

  while (i < expr.length) {
    const ch = expr[i];

    // Number
    if (/[0-9.]/.test(ch)) {
      let num = '';
      while (i < expr.length && /[0-9.eE+-]/.test(expr[i])) {
        if ((expr[i] === '+' || expr[i] === '-') && expr[i - 1] !== 'e' && expr[i - 1] !== 'E') break;
        num += expr[i++];
      }
      tokens.push({ type: 'num', value: parseFloat(num) });
      continue;
    }

    // Operators
    if ('+-*/%^()'.includes(ch)) {
      tokens.push({ type: 'op', value: ch });
      i++;
      continue;
    }

    // Functions and constants
    if (/[a-zA-Z]/.test(ch)) {
      let name = '';
      while (i < expr.length && /[a-zA-Z0-9_]/.test(expr[i])) name += expr[i++];
      const lower = name.toLowerCase();

      const constants = { pi: Math.PI, e: Math.E, tau: Math.PI * 2 };
      if (constants[lower] !== undefined) {
        tokens.push({ type: 'num', value: constants[lower] });
      } else {
        tokens.push({ type: 'func', value: lower });
      }
      continue;
    }

    throw new Error(`Unexpected character: ${ch}`);
  }
  return tokens;
}

function parseExpression(tokens, pos) {
  let { value, pos: p } = parseTerm(tokens, pos);
  while (p < tokens.length && (tokens[p].value === '+' || tokens[p].value === '-')) {
    const op = tokens[p].value;
    p++;
    const right = parseTerm(tokens, p);
    p = right.pos;
    value = op === '+' ? value + right.value : value - right.value;
  }
  return { value, pos: p };
}

function parseTerm(tokens, pos) {
  let { value, pos: p } = parsePower(tokens, pos);
  while (p < tokens.length && ('*/%'.includes(tokens[p].value))) {
    const op = tokens[p].value;
    p++;
    const right = parsePower(tokens, p);
    p = right.pos;
    if (op === '*') value *= right.value;
    else if (op === '/') { if (right.value === 0) throw new Error('Division by zero'); value /= right.value; }
    else value %= right.value;
  }
  return { value, pos: p };
}

function parsePower(tokens, pos) {
  let { value, pos: p } = parseUnary(tokens, pos);
  if (p < tokens.length && tokens[p].value === '^') {
    p++;
    const right = parsePower(tokens, p); // right-associative
    p = right.pos;
    value = Math.pow(value, right.value);
  }
  return { value, pos: p };
}

function parseUnary(tokens, pos) {
  if (pos < tokens.length && (tokens[pos].value === '+' || tokens[pos].value === '-')) {
    const sign = tokens[pos].value === '-' ? -1 : 1;
    const { value, pos: p } = parseUnary(tokens, pos + 1);
    return { value: sign * value, pos: p };
  }
  return parsePrimary(tokens, pos);
}

function parsePrimary(tokens, pos) {
  if (pos >= tokens.length) throw new Error('Unexpected end of expression');

  const tok = tokens[pos];

  if (tok.type === 'num') return { value: tok.value, pos: pos + 1 };

  if (tok.type === 'func') {
    const funcName = tok.value;
    if (pos + 1 >= tokens.length || tokens[pos + 1].value !== '(') {
      throw new Error(`Expected ( after function ${funcName}`);
    }
    const { value: arg, pos: p } = parseExpression(tokens, pos + 2);
    if (p >= tokens.length || tokens[p].value !== ')') throw new Error('Missing )');

    const fns = {
      sqrt: Math.sqrt, abs: Math.abs, floor: Math.floor, ceil: Math.ceil, round: Math.round,
      sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan,
      log: Math.log, log2: Math.log2, log10: Math.log10, exp: Math.exp,
      sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
    };

    if (!fns[funcName]) throw new Error(`Unknown function: ${funcName}`);
    return { value: fns[funcName](arg), pos: p + 1 };
  }

  if (tok.value === '(') {
    const { value, pos: p } = parseExpression(tokens, pos + 1);
    if (p >= tokens.length || tokens[p].value !== ')') throw new Error('Missing )');
    return { value, pos: p + 1 };
  }

  throw new Error(`Unexpected token: ${JSON.stringify(tok)}`);
}

function round(x) {
  return Math.round(x * 1e10) / 1e10;
}
