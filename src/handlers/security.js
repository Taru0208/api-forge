// Security-related utilities

export async function hmacSign(text, key, algorithm = 'SHA-256') {
  const validAlgorithms = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];
  if (!validAlgorithms.includes(algorithm)) {
    throw new Error(`Unsupported algorithm: ${algorithm}. Use: ${validAlgorithms.join(', ')}`);
  }
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw', encoder.encode(key), { name: 'HMAC', hash: algorithm }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(text));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function hmacVerify(text, key, signature, algorithm = 'SHA-256') {
  const expected = await hmacSign(text, key, algorithm);
  // Constant-time comparison
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}

export function passwordStrength(password) {
  if (typeof password !== 'string') throw new Error('password must be a string');

  const checks = {
    length: password.length,
    hasLower: /[a-z]/.test(password),
    hasUpper: /[A-Z]/.test(password),
    hasDigit: /\d/.test(password),
    hasSpecial: /[^a-zA-Z0-9]/.test(password),
    hasRepeat: /(.)\1{2,}/.test(password),
    hasSequential: hasSequential(password),
    hasCommonPattern: hasCommonPattern(password),
  };

  let score = 0;
  // Length scoring
  if (checks.length >= 8) score += 1;
  if (checks.length >= 12) score += 1;
  if (checks.length >= 16) score += 1;
  // Character variety
  if (checks.hasLower) score += 1;
  if (checks.hasUpper) score += 1;
  if (checks.hasDigit) score += 1;
  if (checks.hasSpecial) score += 1;
  // Deductions
  if (checks.hasRepeat) score -= 1;
  if (checks.hasSequential) score -= 1;
  if (checks.hasCommonPattern) score -= 2;
  if (checks.length < 6) score = Math.min(score, 1);

  score = Math.max(0, Math.min(score, 7));

  const levels = ['very_weak', 'weak', 'weak', 'fair', 'fair', 'strong', 'strong', 'very_strong'];
  const level = levels[score];

  // Entropy estimation (bits)
  let charset = 0;
  if (checks.hasLower) charset += 26;
  if (checks.hasUpper) charset += 26;
  if (checks.hasDigit) charset += 10;
  if (checks.hasSpecial) charset += 33;
  const entropy = charset > 0 ? Math.round(checks.length * Math.log2(charset)) : 0;

  const suggestions = [];
  if (checks.length < 12) suggestions.push('Use at least 12 characters');
  if (!checks.hasUpper) suggestions.push('Add uppercase letters');
  if (!checks.hasDigit) suggestions.push('Add numbers');
  if (!checks.hasSpecial) suggestions.push('Add special characters');
  if (checks.hasRepeat) suggestions.push('Avoid repeated characters');
  if (checks.hasSequential) suggestions.push('Avoid sequential characters (abc, 123)');
  if (checks.hasCommonPattern) suggestions.push('Avoid common patterns (password, qwerty)');

  return { score, level, entropy, checks, suggestions };
}

function hasSequential(str) {
  const lower = str.toLowerCase();
  for (let i = 0; i < lower.length - 2; i++) {
    const a = lower.charCodeAt(i);
    const b = lower.charCodeAt(i + 1);
    const c = lower.charCodeAt(i + 2);
    if (b === a + 1 && c === b + 1) return true;
    if (b === a - 1 && c === b - 1) return true;
  }
  return false;
}

function hasCommonPattern(str) {
  const common = [
    'password', 'qwerty', 'abc123', '123456', 'letmein', 'welcome',
    'monkey', 'dragon', 'master', 'admin', 'login', 'princess',
  ];
  const lower = str.toLowerCase();
  return common.some(p => lower.includes(p));
}

export function generateCSP(options = {}) {
  const directives = [];
  const defaults = {
    defaultSrc: options.defaultSrc || ["'self'"],
    scriptSrc: options.scriptSrc || ["'self'"],
    styleSrc: options.styleSrc || ["'self'", "'unsafe-inline'"],
    imgSrc: options.imgSrc || ["'self'", 'data:'],
    fontSrc: options.fontSrc || ["'self'"],
    connectSrc: options.connectSrc || ["'self'"],
    frameSrc: options.frameSrc || ["'none'"],
    objectSrc: options.objectSrc || ["'none'"],
    baseUri: options.baseUri || ["'self'"],
    formAction: options.formAction || ["'self'"],
  };

  const mapping = {
    defaultSrc: 'default-src',
    scriptSrc: 'script-src',
    styleSrc: 'style-src',
    imgSrc: 'img-src',
    fontSrc: 'font-src',
    connectSrc: 'connect-src',
    frameSrc: 'frame-src',
    objectSrc: 'object-src',
    baseUri: 'base-uri',
    formAction: 'form-action',
  };

  for (const [key, directive] of Object.entries(mapping)) {
    const values = defaults[key];
    if (values && values.length > 0) {
      directives.push(`${directive} ${values.join(' ')}`);
    }
  }

  if (options.upgradeInsecureRequests !== false) {
    directives.push('upgrade-insecure-requests');
  }

  return {
    header: 'Content-Security-Policy',
    value: directives.join('; '),
    directives: defaults,
  };
}

export function analyzeHeaders(headers) {
  if (typeof headers !== 'object' || !headers) throw new Error('headers must be an object');

  const results = [];
  const normalized = {};
  for (const [k, v] of Object.entries(headers)) {
    normalized[k.toLowerCase()] = v;
  }

  const checks = [
    { header: 'strict-transport-security', name: 'HSTS', severity: 'high', fix: 'Add Strict-Transport-Security: max-age=31536000; includeSubDomains' },
    { header: 'content-security-policy', name: 'CSP', severity: 'high', fix: 'Add Content-Security-Policy header' },
    { header: 'x-frame-options', name: 'X-Frame-Options', severity: 'medium', fix: 'Add X-Frame-Options: DENY or SAMEORIGIN' },
    { header: 'x-content-type-options', name: 'X-Content-Type-Options', severity: 'medium', fix: 'Add X-Content-Type-Options: nosniff' },
    { header: 'referrer-policy', name: 'Referrer-Policy', severity: 'low', fix: 'Add Referrer-Policy: strict-origin-when-cross-origin' },
    { header: 'permissions-policy', name: 'Permissions-Policy', severity: 'low', fix: 'Add Permissions-Policy header' },
  ];

  const bad = [
    { header: 'server', name: 'Server Header', severity: 'low', fix: 'Remove or obscure Server header' },
    { header: 'x-powered-by', name: 'X-Powered-By', severity: 'low', fix: 'Remove X-Powered-By header' },
  ];

  for (const check of checks) {
    const present = check.header in normalized;
    results.push({
      name: check.name,
      header: check.header,
      present,
      severity: present ? 'pass' : check.severity,
      value: normalized[check.header] || null,
      fix: present ? null : check.fix,
    });
  }

  for (const b of bad) {
    const present = b.header in normalized;
    if (present) {
      results.push({
        name: b.name,
        header: b.header,
        present: true,
        severity: b.severity,
        value: normalized[b.header],
        fix: b.fix,
      });
    }
  }

  const score = results.filter(r => r.severity === 'pass').length;
  const total = checks.length;
  const grade = score >= 5 ? 'A' : score >= 4 ? 'B' : score >= 3 ? 'C' : score >= 2 ? 'D' : 'F';

  return { score, total, grade, results };
}
