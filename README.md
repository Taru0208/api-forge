# API Forge

[![Tests](https://github.com/Taru0208/api-forge/actions/workflows/test.yml/badge.svg)](https://github.com/Taru0208/api-forge/actions/workflows/test.yml)

All-in-one developer toolkit API. 156 endpoints for text processing, readability scoring, sentiment analysis, math/statistics, barcode generation, MIME type detection, URL parsing, encoding, hashing, validation, QR codes, language detection, cron parsing, fake data, and more.

**Zero dependencies.** Runs on Cloudflare Workers (free tier) and Node.js.

## Live

- **API**: https://api-forge.quietnode.workers.dev
- **Docs**: https://api-forge.quietnode.workers.dev/docs (interactive, with "Try it" buttons)
- **OpenAPI**: https://api-forge.quietnode.workers.dev/openapi.json


## Endpoints (156)

| Category | Count | Examples |
|----------|-------|---------|
| Text Processing | 7 | slugify, word-count, extract-emails, diff |
| String Utilities | 12 | camelCase, snake_case, reverse, similarity |
| Hashing & Encoding | 16 | SHA, Base64, JWT decode, URL/HTML/ROT13/morse/binary/hex |
| Data Transform | 5 | JSON↔CSV, flatten, markdown→HTML |
| Validation | 4 | email, URL, JSON, credit card (Luhn) |
| Random Generation | 9 | string, number, color, lorem, password, IP, user-agent |
| Date & Time | 6 | now, diff, parse, add, convert |
| Regex | 5 | test, extract, replace, split, escape |
| IP & Network | 4 | my IP, validate, CIDR contains, subnet calc |
| Color | 11 | parse, convert (hex/rgb/hsl), contrast ratio, palette |
| JSON Utilities | 6 | format, minify, sort-keys, query, diff, stats |
| Number Formatting | 8 | ordinal, roman, words, bytes, percentage |
| Unit Conversion | 4 | temperature, weight, distance, volume, base conversion |
| Fake Test Data | 9 | person, address, company, credit card, product, profile |
| Security | 5 | HMAC, password strength, CSP, header analysis |
| QR Code | 4 | generate (SVG/matrix/ASCII), direct image embed |
| Language Detection | 2 | detect (20+ languages), text analysis |
| Cron Expressions | 3 | parse, next occurrences, validate |
| Readability | 9 | Flesch-Kincaid, Gunning Fog, sentiment, keywords |
| Math & Statistics | 10 | stats, correlation, regression, outliers, evaluate |
| Barcode | 3 | generate (Code128/EAN-13/Code39), direct SVG image, formats |
| MIME Type | 6 | detect from bytes, from extension, to extension, validate, list types |
| URL Utilities | 5 | parse, build, normalize, extract domain, compare |

## Quick Start

```bash
# Generate a QR code
curl -X POST https://api-forge.quietnode.workers.dev/qr/generate \
  -H "Content-Type: application/json" \
  -d '{"text": "https://example.com", "format": "svg"}'

# Detect language
curl -X POST https://api-forge.quietnode.workers.dev/language/detect \
  -H "Content-Type: application/json" \
  -d '{"text": "안녕하세요, 만나서 반갑습니다"}'

# Slugify text
curl -X POST https://api-forge.quietnode.workers.dev/text/slugify \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello World! This is API Forge"}'

# Analyze readability
curl -X POST https://api-forge.quietnode.workers.dev/readability/all \
  -H "Content-Type: application/json" \
  -d '{"text": "The quick brown fox jumps over the lazy dog."}'

# Sentiment analysis
curl -X POST https://api-forge.quietnode.workers.dev/readability/sentiment \
  -H "Content-Type: application/json" \
  -d '{"text": "This product is amazing! Great quality."}'

# Generate a barcode
curl -X POST https://api-forge.quietnode.workers.dev/barcode/generate \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello World", "format": "code128"}'
```

## Architecture

Pure JavaScript, zero dependencies. The same code runs on both Cloudflare Workers and Node.js through the Web-standard `Request`/`Response` API:

```
src/
├── worker.js          # Cloudflare Workers entry
├── server.js          # Node.js entry (local dev)
├── router.js          # Route definitions + request handler
├── docs.js            # Auto-generated interactive docs
└── handlers/          # One module per category
    ├── text.js
    ├── string.js
    ├── hash.js
    ├── qr.js          # Pure JS QR code generator (Reed-Solomon)
    ├── language.js     # Unicode script + trigram language detection
    ├── readability.js  # Flesch-Kincaid, Gunning Fog, sentiment, keywords
    ├── math.js         # Stats, correlation, regression, expression eval
    ├── barcode.js      # Code128, EAN-13, Code39 barcode generation (SVG)
    ├── mime.js         # MIME type detection from magic bytes + extension
    ├── url.js          # URL parsing, normalization, domain extraction
    └── ...
```

## Development

```bash
# Run locally
node src/server.js

# Run tests (569 tests)
node --test src/**/*.test.js

# Deploy to Cloudflare Workers
wrangler deploy
```

## License

MIT
