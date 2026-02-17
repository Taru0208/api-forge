#!/usr/bin/env node
// Enhance OpenAPI spec with tags, descriptions, and better metadata
import { readFileSync, writeFileSync } from 'fs';

const spec = JSON.parse(readFileSync(new URL('../openapi.json', import.meta.url), 'utf8'));

// Tag definitions with descriptions (shown in RapidAPI sidebar)
const tagDefs = [
  { name: 'Text Processing', description: 'Slugify, word count, email/URL extraction, HTML stripping, text diff' },
  { name: 'String Utilities', description: 'Case conversion (camelCase, snake_case, kebab-case, etc.), reverse, similarity, padding' },
  { name: 'Data Transform', description: 'JSON↔CSV, flatten/unflatten JSON, Markdown→HTML' },
  { name: 'JSON Utilities', description: 'Format, minify, sort keys, query by path, diff, stats' },
  { name: 'Hashing & Encoding', description: 'SHA/MD5 hashing, Base64, URL/HTML encoding, ROT13, Morse, binary, hex, base conversion' },
  { name: 'Validation', description: 'Validate emails, URLs, JSON, credit card numbers (Luhn check)' },
  { name: 'Random Generation', description: 'Random strings, numbers, colors, lorem ipsum, passwords, IPs, user agents' },
  { name: 'Fake Test Data', description: 'Generate realistic fake people, addresses, companies, credit cards, products, profiles' },
  { name: 'Date & Time', description: 'Current time with timezone, date diff, parse, add/subtract, timestamp conversion' },
  { name: 'Regular Expressions', description: 'Test, extract, replace, split with regex patterns. Escape special characters' },
  { name: 'IP & Network', description: 'IP validation, geolocation, CIDR range check, subnet calculator' },
  { name: 'Color Utilities', description: 'Color conversion (HEX↔RGB↔HSL), contrast ratio, lighten/darken, palettes' },
  { name: 'Number Formatting', description: 'Ordinals, Roman numerals, number-to-words, byte formatting, clamping' },
  { name: 'Unit Conversion', description: 'Convert temperature, length, weight, speed, data, time, area units' },
  { name: 'Security', description: 'HMAC signing/verification, password strength analysis, CSP generation, header security audit' },
];

spec.tags = tagDefs;

// Map path prefixes to tag names
const tagMap = {
  'text': 'Text Processing',
  'string': 'String Utilities',
  'transform': 'Data Transform',
  'json': 'JSON Utilities',
  'hash': 'Hashing & Encoding',
  'encode': 'Hashing & Encoding',
  'decode': 'Hashing & Encoding',
  'convert': 'Unit Conversion',
  'validate': 'Validation',
  'generate': 'Random Generation',
  'faker': 'Fake Test Data',
  'datetime': 'Date & Time',
  'regex': 'Regular Expressions',
  'ip': 'IP & Network',
  'color': 'Color Utilities',
  'number': 'Number Formatting',
  'security': 'Security',
  'uuid': 'Hashing & Encoding',
};

// Endpoint-specific descriptions
const descriptions = {
  '/health': 'Returns API health status, version, and total endpoint count.',
  '/uuid': 'Generate a cryptographically random UUID v4 string. No input required.',
  '/text/slugify': 'Convert any text into a URL-friendly slug. Handles Unicode, special characters, and multiple separators. Options: custom separator, preserve case.',
  '/text/word-count': 'Count words, characters, sentences, and paragraphs. Also estimates reading time based on average reading speed (200 wpm).',
  '/text/extract-emails': 'Find and extract all email addresses from a block of text. Returns deduplicated array.',
  '/text/extract-urls': 'Find and extract all URLs (http/https) from text content.',
  '/text/truncate': 'Truncate text to a maximum length with customizable ellipsis. Supports word-boundary truncation.',
  '/text/strip-html': 'Remove all HTML tags from text, including script/style content. Decodes HTML entities.',
  '/text/diff': 'Compare two texts and return a list of additions, removals, and unchanged segments.',
  '/transform/json-to-csv': 'Convert a JSON array of objects to CSV format. Handles nested values, escapes commas and quotes.',
  '/transform/csv-to-json': 'Parse CSV text into a JSON array of objects. First row is treated as headers.',
  '/transform/flatten': 'Flatten a nested JSON object into dot-notation keys. Custom separator supported.',
  '/transform/unflatten': 'Convert a flat dot-notation object back into nested structure.',
  '/transform/markdown-to-html': 'Convert Markdown text to HTML. Supports headers, bold, italic, links, code blocks, and lists.',
  '/hash': 'Generate a cryptographic hash of the input text. Supports SHA-256, SHA-1, SHA-384, SHA-512, and MD5.',
  '/encode/base64': 'Encode text to Base64 format. Handles Unicode characters.',
  '/decode/base64': 'Decode a Base64 string back to plain text.',
  '/decode/jwt': 'Decode a JWT token without verification. Returns header and payload as JSON.',
  '/validate/email': 'Validate an email address format. Checks syntax and detects disposable email domains.',
  '/validate/url': 'Validate a URL format. Checks protocol, domain, and structure.',
  '/validate/json': 'Check if a string is valid JSON. Returns parsed result and validation status.',
  '/validate/credit-card': 'Validate a credit card number using the Luhn algorithm. Detects card network (Visa, Mastercard, Amex, etc.).',
  '/generate/string': 'Generate a random string of specified length. Supports charsets: alphanumeric, hex, alpha, numeric.',
  '/generate/number': 'Generate a random number within a range. Supports decimal precision.',
  '/generate/color': 'Generate a random color in HEX, RGB, or HSL format.',
  '/generate/lorem': 'Generate Lorem Ipsum placeholder text. Choose paragraphs, sentences, or words.',
  '/generate/password': 'Generate a secure random password. Options: length, include/exclude uppercase, lowercase, numbers, symbols.',
  '/generate/ipv4': 'Generate a random valid IPv4 address.',
  '/generate/ipv6': 'Generate a random valid IPv6 address.',
  '/generate/user-agent': 'Generate a random realistic browser User-Agent string.',
  '/datetime/now': 'Get current date and time in ISO 8601, Unix timestamp, and UTC formats. Optional timezone parameter.',
  '/datetime/diff': 'Calculate the difference between two dates in days, hours, minutes, and seconds. Returns human-readable duration.',
  '/datetime/parse': 'Parse a date string and return detailed breakdown: year, month, day, day of week, day of year, week number, leap year, quarter.',
  '/datetime/add': 'Add or subtract time from a date. Supports: years, months, weeks, days, hours, minutes, seconds.',
  '/datetime/convert': 'Convert between Unix timestamp and ISO 8601 format in either direction.',
  '/regex/test': 'Test if a text matches a regular expression pattern. Supports flags (g, i, m, etc.).',
  '/regex/extract': 'Extract all matches of a regex pattern from text. Returns matches with capture groups and positions.',
  '/regex/replace': 'Replace matches of a regex pattern in text. Supports capture group references ($1, $2, etc.).',
  '/regex/split': 'Split text by a regex pattern. Optional limit parameter.',
  '/regex/escape': 'Escape special regex characters in a string so it can be used as a literal pattern.',
  '/ip/me': 'Get your own IP address and country based on request headers (CF-Connecting-IP, X-Forwarded-For).',
  '/ip/validate': 'Validate an IP address. Returns version (4/6), type (public/private/loopback), and validity.',
  '/ip/cidr-contains': 'Check if an IP address falls within a CIDR range (e.g., 192.168.1.0/24).',
  '/ip/subnet': 'Calculate subnet details from CIDR notation: network address, broadcast, first/last host, total hosts.',
  '/string/camel-case': 'Convert text to camelCase. Handles spaces, hyphens, underscores, and PascalCase input.',
  '/string/snake-case': 'Convert text to snake_case.',
  '/string/kebab-case': 'Convert text to kebab-case.',
  '/string/pascal-case': 'Convert text to PascalCase.',
  '/string/title-case': 'Convert text to Title Case (capitalize first letter of each word).',
  '/string/constant-case': 'Convert text to CONSTANT_CASE (uppercase snake_case).',
  '/string/dot-case': 'Convert text to dot.case.',
  '/string/reverse': 'Reverse a string.',
  '/string/count': 'Count occurrences of a substring in text. Case-sensitive by default, with option for case-insensitive.',
  '/string/similarity': 'Calculate similarity between two strings using Levenshtein distance. Returns 0-1 score.',
  '/string/pad': 'Pad a string to a target length. Supports left, right, or both sides. Custom padding character.',
  '/string/wrap': 'Wrap text at a specified column width. Default: 80 characters.',
  '/color/parse': 'Parse any color format (hex, rgb(), hsl()) and return normalized RGB and HSL values.',
  '/color/hex-to-rgb': 'Convert a hex color code (#RGB or #RRGGBB) to RGB values.',
  '/color/rgb-to-hex': 'Convert RGB values (0-255) to a hex color code.',
  '/color/rgb-to-hsl': 'Convert RGB color to HSL (Hue, Saturation, Lightness).',
  '/color/hsl-to-rgb': 'Convert HSL color to RGB values.',
  '/color/hsl-to-hex': 'Convert HSL color directly to hex code.',
  '/color/contrast': 'Calculate WCAG contrast ratio between two hex colors. Returns ratio and AA/AAA compliance.',
  '/color/lighten': 'Lighten a color by a percentage amount.',
  '/color/darken': 'Darken a color by a percentage amount.',
  '/color/complementary': 'Get the complementary (opposite) color on the color wheel.',
  '/color/palette': 'Generate color palettes: analogous (3 colors), triadic (3), or tetradic (4).',
  '/json/format': 'Pretty-print JSON with configurable indentation. Accepts string or object input.',
  '/json/minify': 'Minify JSON by removing all whitespace. Accepts string or object input.',
  '/json/sort-keys': 'Sort JSON object keys alphabetically. Recursive by default.',
  '/json/query': 'Query a JSON object by dot-notation path (e.g., "user.address.city"). Supports array indices.',
  '/json/diff': 'Compare two JSON objects and list all differences: additions, removals, and value changes.',
  '/json/stats': 'Analyze a JSON structure: count keys, arrays, depth, nesting level, and estimated byte size.',
  '/number/ordinal': 'Convert a number to its ordinal form (1→"1st", 2→"2nd", 23→"23rd").',
  '/number/roman': 'Convert a number (1-3999) to Roman numerals.',
  '/number/from-roman': 'Convert Roman numerals back to a decimal number.',
  '/number/words': 'Convert a number to English words (e.g., 42→"forty-two"). Handles negatives and millions.',
  '/number/format-bytes': 'Format a byte count into human-readable form (e.g., 1024→"1 KB"). Configurable decimal places.',
  '/number/format': 'Format a number with locale-specific separators and decimal places.',
  '/number/clamp': 'Clamp a number within a min/max range.',
  '/number/percentage': 'Calculate what percentage a value is of a total.',
  '/convert': 'Convert a value between units. Supports temperature, length, weight, speed, data, time, and area.',
  '/convert/units': 'List all available unit categories and their units.',
  '/encode/url': 'URL-encode a string (percent-encoding). Handles Unicode.',
  '/decode/url': 'Decode a URL-encoded (percent-encoded) string.',
  '/encode/html': 'Encode special characters as HTML entities (&amp;, &lt;, &gt;, etc.).',
  '/decode/html': 'Decode HTML entities back to characters.',
  '/encode/rot13': 'Apply ROT13 cipher to text. Applying twice returns the original.',
  '/encode/morse': 'Encode text to International Morse Code. Letters separated by spaces, words by " / ".',
  '/decode/morse': 'Decode Morse Code back to text.',
  '/encode/binary': 'Convert text to binary representation (8-bit per character, space-separated).',
  '/decode/binary': 'Convert binary string back to text.',
  '/encode/hex': 'Convert text to hexadecimal representation.',
  '/decode/hex': 'Convert hexadecimal string back to text.',
  '/convert/base': 'Convert numbers between bases (2-36). E.g., binary to hex, octal to decimal.',
  '/faker/person': 'Generate a fake person with first name, last name, email, phone, and date of birth.',
  '/faker/address': 'Generate a fake address with street, city, state, zip code, and country.',
  '/faker/company': 'Generate a fake company with name, industry, catch phrase, and founding year.',
  '/faker/credit-card': 'Generate a fake credit card with valid Luhn number, expiry date, CVV, and card type.',
  '/faker/product': 'Generate a fake product with name, category, price, description, and SKU.',
  '/faker/date': 'Generate a random date. Optional from/to range parameters.',
  '/faker/profile': 'Generate complete fake user profiles with personal info, address, company, and bio. Supports bulk generation (up to 100).',
  '/security/hmac': 'Generate an HMAC signature for a message using a secret key. Supports SHA-256, SHA-1, SHA-384, SHA-512.',
  '/security/hmac-verify': 'Verify an HMAC signature against a message and key. Timing-safe comparison.',
  '/security/password-strength': 'Analyze password strength: entropy, score (0-100), grade, and specific weakness detection (common patterns, sequences, repetition).',
  '/security/csp': 'Generate a Content-Security-Policy header string from a configuration object.',
  '/security/analyze-headers': 'Audit HTTP response headers for security best practices. Returns score (A-F) and recommendations.',
};

let tagged = 0;
let described = 0;

for (const [path, methods] of Object.entries(spec.paths)) {
  const prefix = path.split('/')[1] || '';
  const tag = tagMap[prefix];

  for (const [method, endpoint] of Object.entries(methods)) {
    // Add tag
    if (tag && !endpoint.tags) {
      endpoint.tags = [tag];
      tagged++;
    }

    // Add description
    const desc = descriptions[path];
    if (desc && !endpoint.description) {
      endpoint.description = desc;
      described++;
    }
  }
}

writeFileSync(new URL('../openapi.json', import.meta.url), JSON.stringify(spec, null, 2) + '\n');

console.log(`Enhanced OpenAPI spec:`);
console.log(`  Tags added: ${tagged} endpoints`);
console.log(`  Descriptions added: ${described} endpoints`);
console.log(`  Total paths: ${Object.keys(spec.paths).length}`);
console.log(`  Tag definitions: ${tagDefs.length}`);
