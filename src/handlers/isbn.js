// ISBN validation and utilities

export function validateISBN(isbn) {
  if (!isbn || typeof isbn !== 'string') {
    return { valid: false, reason: 'ISBN is required' };
  }

  const cleaned = isbn.replace(/[\s-]/g, '');

  if (/^\d{9}[\dXx]$/.test(cleaned)) {
    return validateISBN10(cleaned);
  } else if (/^\d{13}$/.test(cleaned)) {
    return validateISBN13(cleaned);
  }

  return { valid: false, reason: 'Invalid ISBN format (must be 10 or 13 digits)' };
}

function validateISBN10(isbn) {
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(isbn[i], 10) * (10 - i);
  }
  const last = isbn[9].toUpperCase();
  sum += last === 'X' ? 10 : parseInt(last, 10);

  const valid = sum % 11 === 0;

  // Extract group info
  const prefix = isbn.slice(0, 1);
  let group = null;
  if (['0', '1'].includes(prefix)) group = 'English-speaking';
  else if (prefix === '2') group = 'French-speaking';
  else if (prefix === '3') group = 'German-speaking';
  else if (prefix === '4') group = 'Japan';
  else if (prefix === '5') group = 'Russia/Former Soviet';
  else if (prefix === '7') group = 'China';
  else if (['8', '9'].includes(prefix)) group = 'Other';

  return {
    valid,
    format: 'ISBN-10',
    isbn: isbn,
    formatted: formatISBN10(isbn),
    checkDigit: isbn[9].toUpperCase(),
    group,
    reason: valid ? null : 'Check digit failed',
    isbn13: valid ? isbn10to13(isbn) : null,
  };
}

function validateISBN13(isbn) {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(isbn[i], 10) * (i % 2 === 0 ? 1 : 3);
  }
  const check = (10 - (sum % 10)) % 10;
  const valid = check === parseInt(isbn[12], 10);

  const prefix = isbn.slice(0, 3);
  const isBook = prefix === '978' || prefix === '979';

  return {
    valid,
    format: 'ISBN-13',
    isbn: isbn,
    formatted: formatISBN13(isbn),
    checkDigit: isbn[12],
    prefix,
    isBook,
    reason: valid ? null : 'Check digit failed',
    isbn10: valid && prefix === '978' ? isbn13to10(isbn) : null,
  };
}

function formatISBN10(isbn) {
  // Simple formatting: X-XXX-XXXXX-X
  return `${isbn[0]}-${isbn.slice(1, 4)}-${isbn.slice(4, 9)}-${isbn[9]}`;
}

function formatISBN13(isbn) {
  // Simple formatting: XXX-X-XXX-XXXXX-X
  return `${isbn.slice(0, 3)}-${isbn[3]}-${isbn.slice(4, 7)}-${isbn.slice(7, 12)}-${isbn[12]}`;
}

export function isbn10to13(isbn10) {
  const cleaned = isbn10.replace(/[\s-]/g, '');
  if (cleaned.length !== 10) return null;

  const base = '978' + cleaned.slice(0, 9);
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(base[i], 10) * (i % 2 === 0 ? 1 : 3);
  }
  const check = (10 - (sum % 10)) % 10;
  return base + String(check);
}

export function isbn13to10(isbn13) {
  const cleaned = isbn13.replace(/[\s-]/g, '');
  if (cleaned.length !== 13 || !cleaned.startsWith('978')) return null;

  const base = cleaned.slice(3, 12);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(base[i], 10) * (10 - i);
  }
  const check = (11 - (sum % 11)) % 11;
  const checkChar = check === 10 ? 'X' : String(check);
  return base + checkChar;
}

export function generateISBNCheckDigit(partial) {
  if (!partial || typeof partial !== 'string') {
    return { error: 'Partial ISBN is required' };
  }
  const cleaned = partial.replace(/[\s-]/g, '');

  if (/^\d{9}$/.test(cleaned)) {
    // ISBN-10 check digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleaned[i], 10) * (10 - i);
    }
    const check = (11 - (sum % 11)) % 11;
    const checkChar = check === 10 ? 'X' : String(check);
    return { isbn: cleaned + checkChar, checkDigit: checkChar, format: 'ISBN-10' };
  } else if (/^\d{12}$/.test(cleaned)) {
    // ISBN-13 check digit
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleaned[i], 10) * (i % 2 === 0 ? 1 : 3);
    }
    const check = (10 - (sum % 10)) % 10;
    return { isbn: cleaned + String(check), checkDigit: String(check), format: 'ISBN-13' };
  }

  return { error: 'Partial ISBN must be 9 digits (ISBN-10) or 12 digits (ISBN-13)' };
}
