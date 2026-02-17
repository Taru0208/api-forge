// Lightweight router — works in both Cloudflare Workers and Node.js
import openApiSpec from '../openapi.json';
import { generateDocs } from './docs.js';
import { slugify, wordCount, extractEmails, extractUrls, truncate, removeHtmlTags, textDiff } from './handlers/text.js';
import { jsonToCSV, csvToJSON, flattenJSON, unflattenJSON, markdownToHTML } from './handlers/transform.js';
import { hashText, base64Encode, base64Decode, generateUUID, jwtDecode } from './handlers/hash.js';
import { validateEmail, validateURL, validateJSON, validateCreditCard, validateVIN } from './handlers/validate.js';
import { randomString, randomNumber, randomColor, loremIpsum, randomPassword, randomIPv4, randomIPv6, randomUserAgent } from './handlers/generate.js';
import { now, dateDiff, parseDate, addTime, convertTimestamp } from './handlers/datetime.js';
import { regexTest, regexExtract, regexReplace, regexSplit, regexEscape } from './handlers/regex.js';
import { ipInfo, ipValidate, cidrContains, subnetCalc } from './handlers/ip.js';
import { toCamelCase, toSnakeCase, toKebabCase, toPascalCase, toTitleCase, toConstantCase, toDotCase, reverse, countOccurrences, similarity, pad, wrap } from './handlers/string.js';
import { hexToRgb, rgbToHex, rgbToHsl, hslToRgb, hslToHex, contrastRatio, lighten, darken, complementary, palette, parseColor } from './handlers/color.js';
import { formatJSON, minifyJSON, sortKeys, queryJSON, diffJSON, statsJSON } from './handlers/json.js';
import { toOrdinal, toRoman, fromRoman, toWords, formatBytes, formatNumber, clamp, percentage } from './handlers/number.js';
import { convert, listUnits } from './handlers/convert.js';
import { urlEncode, urlDecode, htmlEncode, htmlDecode, rot13, toBase, fromBase, baseConvert, textToBinary, binaryToText, textToHex, hexToText, morseEncode, morseDecode } from './handlers/encode.js';
import { fakePerson, fakeAddress, fakeCompany, fakeCreditCard, fakeProduct, fakeDate, fakeProfile } from './handlers/faker.js';
import { hmacSign, hmacVerify, passwordStrength, generateCSP, analyzeHeaders } from './handlers/security.js';
import { generateQR, qrToSVG, qrToSVGOptimized, qrToASCII, qrToMatrix } from './handlers/qr.js';
import { detectLanguage, analyzeText } from './handlers/language.js';
import { parseCron, nextOccurrences, validateCron } from './handlers/cron.js';
import { fleschKincaid, gunningFog, colemanLiau, ari, smog, allReadability, textStatistics, extractKeywords, sentimentAnalysis } from './handlers/readability.js';
import { descriptiveStats, percentile, percentiles, correlation, linearRegression, zScore, normalize, histogram, outliers, evaluateExpression } from './handlers/math.js';
import { generateBarcode, listFormats } from './handlers/barcode.js';
import { detectFromBytes, detectFromExtension, mimeToExtension, validateType, listMimeTypes } from './handlers/mime.js';
import { parseURL, buildURL, normalizeURL, extractDomain, compareURLs } from './handlers/url.js';
import { htmlToMarkdown, extractHeadings, extractTOC, stripMarkdown, markdownStats, extractLinks, extractImages } from './handlers/markdown.js';
import { yamlToJSON, jsonToYAML, validateYAML } from './handlers/yaml.js';
import { nanoid, ulid, cuid, snowflakeId, parseSnowflake, objectId, parseObjectId, shortId, prefixedId, batchIds } from './handlers/id.js';
import { searchEmoji, getEmoji, randomEmoji, emojiInfo, listCategories as listEmojiCategories, stripEmoji, extractEmojis, replaceEmoji } from './handlers/emoji.js';
import { listCountries, getCountry, searchCountries, getCurrency, listCurrencies, getCallingCode, listTimezones, getTimezone } from './handlers/country.js';
import { validateIBAN, formatIBAN, generateIBANCheckDigits, listIBANCountries } from './handlers/iban.js';
import { validateISBN, isbn10to13, isbn13to10, generateISBNCheckDigit } from './handlers/isbn.js';
import { validateCryptoAddress, detectCryptoAddress, listSupportedCurrencies } from './handlers/crypto.js';
import { jwtEncode, jwtDecode as jwtDecodeFull, jwtVerify } from './handlers/jwt.js';
import { parseUserAgent, isBot as isUABot, compareUserAgents } from './handlers/useragent.js';
import { jsonToXML, xmlToJSON, validateXML, formatXML } from './handlers/xml.js';

const routes = new Map();

function get(path, handler) { routes.set(`GET:${path}`, handler); }
function post(path, handler) { routes.set(`POST:${path}`, handler); }

// --- Text Processing ---
post('/text/slugify', async (body) => {
  return { slug: slugify(body.text, body.options) };
});

post('/text/word-count', async (body) => {
  return wordCount(body.text);
});

post('/text/extract-emails', async (body) => {
  return { emails: extractEmails(body.text) };
});

post('/text/extract-urls', async (body) => {
  return { urls: extractUrls(body.text) };
});

post('/text/truncate', async (body) => {
  return { result: truncate(body.text, body.maxLength || 100, body.options) };
});

post('/text/strip-html', async (body) => {
  return { text: removeHtmlTags(body.html) };
});

post('/text/diff', async (body) => {
  return textDiff(body.old, body.new);
});

// --- Data Transform ---
post('/transform/json-to-csv', async (body) => {
  return { csv: jsonToCSV(body.data, body.options) };
});

post('/transform/csv-to-json', async (body) => {
  return { data: csvToJSON(body.csv, body.options) };
});

post('/transform/flatten', async (body) => {
  return { result: flattenJSON(body.data, '', body.separator) };
});

post('/transform/unflatten', async (body) => {
  return { result: unflattenJSON(body.data, body.separator) };
});

post('/transform/markdown-to-html', async (body) => {
  return { html: markdownToHTML(body.markdown) };
});

// --- Hash & Encode ---
post('/hash', async (body) => {
  const algorithm = body.algorithm || 'SHA-256';
  return { hash: await hashText(body.text, algorithm), algorithm };
});

post('/encode/base64', async (body) => {
  return { encoded: base64Encode(body.text) };
});

post('/decode/base64', async (body) => {
  return { decoded: base64Decode(body.encoded) };
});

get('/uuid', async () => {
  return { uuid: generateUUID() };
});

post('/decode/jwt', async (body) => {
  return jwtDecode(body.token);
});

// --- Validate ---
post('/validate/email', async (body) => {
  return validateEmail(body.email);
});

post('/validate/url', async (body) => {
  return validateURL(body.url);
});

post('/validate/json', async (body) => {
  return validateJSON(body.input);
});

post('/validate/credit-card', async (body) => {
  return validateCreditCard(body.number);
});

post('/validate/vin', async (body) => {
  return validateVIN(body.vin);
});

// --- IBAN ---
post('/validate/iban', async (body) => {
  return validateIBAN(body.iban);
});

post('/iban/format', async (body) => {
  return { formatted: formatIBAN(body.iban) };
});

post('/iban/generate-check-digits', async (body) => {
  return generateIBANCheckDigits(body.country, body.bban);
});

get('/iban/countries', async () => {
  return { countries: listIBANCountries() };
});

// --- ISBN ---
post('/validate/isbn', async (body) => {
  return validateISBN(body.isbn);
});

post('/isbn/to-13', async (body) => {
  const result = isbn10to13(body.isbn);
  if (!result) return { error: 'Invalid ISBN-10 or conversion failed' };
  return { isbn10: body.isbn.replace(/[\s-]/g, ''), isbn13: result };
});

post('/isbn/to-10', async (body) => {
  const result = isbn13to10(body.isbn);
  if (!result) return { error: 'Invalid ISBN-13 or not a 978 prefix' };
  return { isbn13: body.isbn.replace(/[\s-]/g, ''), isbn10: result };
});

post('/isbn/check-digit', async (body) => {
  return generateISBNCheckDigit(body.isbn);
});

// --- Cryptocurrency ---
post('/crypto/validate', async (body) => {
  return validateCryptoAddress(body.address, body.currency);
});

post('/crypto/detect', async (body) => {
  return detectCryptoAddress(body.address);
});

get('/crypto/currencies', async () => {
  return { currencies: listSupportedCurrencies() };
});

// --- JWT ---
post('/jwt/encode', async (body) => {
  return { token: await jwtEncode(body.payload, body.secret, body.options) };
});

post('/jwt/decode', async (body) => {
  return jwtDecodeFull(body.token);
});

post('/jwt/verify', async (body) => {
  return await jwtVerify(body.token, body.secret, body.options);
});

// --- User-Agent ---
post('/useragent/parse', async (body) => {
  return parseUserAgent(body.ua);
});

post('/useragent/is-bot', async (body) => {
  return isUABot(body.ua);
});

post('/useragent/compare', async (body) => {
  return compareUserAgents(body.ua1, body.ua2);
});

// --- Generate ---
post('/generate/string', async (body) => {
  return { result: randomString(body.length || 16, body.charset) };
});

post('/generate/number', async (body) => {
  return { result: randomNumber(body.min, body.max, body.decimals) };
});

get('/generate/color', async () => {
  return { hex: randomColor('hex').hex, rgb: randomColor('rgb'), hsl: randomColor('hsl') };
});

post('/generate/color', async (body) => {
  return randomColor(body.format || 'hex');
});

post('/generate/lorem', async (body) => {
  return { text: loremIpsum(body.count || 1, body.unit || 'paragraphs') };
});

post('/generate/password', async (body) => {
  return { password: randomPassword(body.length || 16, body.options) };
});

get('/generate/ipv4', async () => {
  return { ip: randomIPv4() };
});

get('/generate/ipv6', async () => {
  return { ip: randomIPv6() };
});

get('/generate/user-agent', async () => {
  return { userAgent: randomUserAgent() };
});

// --- DateTime ---
get('/datetime/now', async () => {
  return now();
});

post('/datetime/now', async (body) => {
  return now(body.timezone);
});

post('/datetime/diff', async (body) => {
  return dateDiff(body.from, body.to);
});

post('/datetime/parse', async (body) => {
  return parseDate(body.date);
});

post('/datetime/add', async (body) => {
  return addTime(body.date, body.amount, body.unit);
});

post('/datetime/convert', async (body) => {
  return convertTimestamp(body.input);
});

// --- Regex ---
post('/regex/test', async (body) => {
  return regexTest(body.text, body.pattern, body.flags);
});

post('/regex/extract', async (body) => {
  return regexExtract(body.text, body.pattern, body.flags);
});

post('/regex/replace', async (body) => {
  return regexReplace(body.text, body.pattern, body.replacement, body.flags);
});

post('/regex/split', async (body) => {
  return regexSplit(body.text, body.pattern, body.limit);
});

post('/regex/escape', async (body) => {
  return regexEscape(body.text);
});

// --- IP & Network ---
get('/ip/me', async (body, request) => {
  return ipInfo(request);
});

post('/ip/validate', async (body) => {
  return ipValidate(body.ip);
});

post('/ip/cidr-contains', async (body) => {
  return cidrContains(body.cidr, body.ip);
});

post('/ip/subnet', async (body) => {
  return subnetCalc(body.cidr);
});

// --- String / Case Conversion ---
post('/string/camel-case', async (body) => {
  return { result: toCamelCase(body.text) };
});

post('/string/snake-case', async (body) => {
  return { result: toSnakeCase(body.text) };
});

post('/string/kebab-case', async (body) => {
  return { result: toKebabCase(body.text) };
});

post('/string/pascal-case', async (body) => {
  return { result: toPascalCase(body.text) };
});

post('/string/title-case', async (body) => {
  return { result: toTitleCase(body.text) };
});

post('/string/constant-case', async (body) => {
  return { result: toConstantCase(body.text) };
});

post('/string/dot-case', async (body) => {
  return { result: toDotCase(body.text) };
});

post('/string/reverse', async (body) => {
  return { result: reverse(body.text) };
});

post('/string/count', async (body) => {
  return { count: countOccurrences(body.text, body.substring, body.caseSensitive !== false) };
});

post('/string/similarity', async (body) => {
  return { similarity: similarity(body.a, body.b), a: body.a, b: body.b };
});

post('/string/pad', async (body) => {
  return { result: pad(body.text, body.length, body.char, body.side) };
});

post('/string/wrap', async (body) => {
  return { result: wrap(body.text, body.width || 80) };
});

// --- Color ---
post('/color/parse', async (body) => {
  return parseColor(body.color);
});

post('/color/hex-to-rgb', async (body) => {
  return hexToRgb(body.hex);
});

post('/color/rgb-to-hex', async (body) => {
  return { hex: rgbToHex(body.r, body.g, body.b) };
});

post('/color/rgb-to-hsl', async (body) => {
  return rgbToHsl(body.r, body.g, body.b);
});

post('/color/hsl-to-rgb', async (body) => {
  return hslToRgb(body.h, body.s, body.l);
});

post('/color/hsl-to-hex', async (body) => {
  return { hex: hslToHex(body.h, body.s, body.l) };
});

post('/color/contrast', async (body) => {
  return contrastRatio(body.color1, body.color2);
});

post('/color/lighten', async (body) => {
  const result = lighten(body.r, body.g, body.b, body.amount || 10);
  return { ...result, hex: rgbToHex(result.r, result.g, result.b) };
});

post('/color/darken', async (body) => {
  const result = darken(body.r, body.g, body.b, body.amount || 10);
  return { ...result, hex: rgbToHex(result.r, result.g, result.b) };
});

post('/color/complementary', async (body) => {
  return complementary(body.r, body.g, body.b);
});

post('/color/palette', async (body) => {
  return { colors: palette(body.r, body.g, body.b, body.type || 'analogous') };
});

// --- JSON Utilities ---
post('/json/format', async (body) => {
  return { result: formatJSON(body.input, body.indent || 2) };
});

post('/json/minify', async (body) => {
  return { result: minifyJSON(body.input) };
});

post('/json/sort-keys', async (body) => {
  return { result: sortKeys(body.input, body.recursive !== false) };
});

post('/json/query', async (body) => {
  return { result: queryJSON(body.input, body.path) };
});

post('/json/diff', async (body) => {
  return { changes: diffJSON(body.a, body.b) };
});

post('/json/stats', async (body) => {
  return statsJSON(body.input);
});

// --- Number Utilities ---
post('/number/ordinal', async (body) => {
  return { result: toOrdinal(body.number) };
});

post('/number/roman', async (body) => {
  return { result: toRoman(body.number) };
});

post('/number/from-roman', async (body) => {
  return { result: fromRoman(body.numeral) };
});

post('/number/words', async (body) => {
  return { result: toWords(body.number) };
});

post('/number/format-bytes', async (body) => {
  return { result: formatBytes(body.bytes, body.decimals) };
});

post('/number/format', async (body) => {
  return { result: formatNumber(body.number, body.options) };
});

post('/number/clamp', async (body) => {
  return { result: clamp(body.number, body.min, body.max) };
});

post('/number/percentage', async (body) => {
  return { result: percentage(body.value, body.total) };
});

// --- Unit Conversion ---
post('/convert', async (body) => {
  return { result: convert(body.value, body.from, body.to, body.category), from: body.from, to: body.to, value: body.value };
});

get('/convert/units', async () => {
  return { units: listUnits() };
});

post('/convert/units', async (body) => {
  return { units: listUnits(body.category) };
});

// --- Encode / Decode ---
post('/encode/url', async (body) => {
  return { result: urlEncode(body.text) };
});

post('/decode/url', async (body) => {
  return { result: urlDecode(body.text) };
});

post('/encode/html', async (body) => {
  return { result: htmlEncode(body.text) };
});

post('/decode/html', async (body) => {
  return { result: htmlDecode(body.text) };
});

post('/encode/rot13', async (body) => {
  return { result: rot13(body.text) };
});

post('/encode/morse', async (body) => {
  return { result: morseEncode(body.text) };
});

post('/decode/morse', async (body) => {
  return { result: morseDecode(body.text) };
});

post('/encode/binary', async (body) => {
  return { result: textToBinary(body.text) };
});

post('/decode/binary', async (body) => {
  return { result: binaryToText(body.text) };
});

post('/encode/hex', async (body) => {
  return { result: textToHex(body.text) };
});

post('/decode/hex', async (body) => {
  return { result: hexToText(body.text) };
});

post('/convert/base', async (body) => {
  if (body.from && body.to) {
    return baseConvert(body.value, body.from, body.to);
  }
  if (body.base) {
    return { result: toBase(body.number, body.base) };
  }
  throw new Error('Provide {value, from, to} for base conversion or {number, base} for to-base');
});

// --- Faker (Test Data) ---
get('/faker/person', async () => {
  return fakePerson();
});

get('/faker/address', async () => {
  return fakeAddress();
});

get('/faker/company', async () => {
  return fakeCompany();
});

get('/faker/credit-card', async () => {
  return fakeCreditCard();
});

get('/faker/product', async () => {
  return fakeProduct();
});

post('/faker/date', async (body) => {
  return fakeDate(body);
});

get('/faker/date', async () => {
  return fakeDate();
});

post('/faker/profile', async (body) => {
  return { data: fakeProfile(body.count || 1) };
});

get('/faker/profile', async () => {
  return { data: fakeProfile(1) };
});

// --- Security ---
post('/security/hmac', async (body) => {
  const signature = await hmacSign(body.text, body.key, body.algorithm);
  return { signature, algorithm: body.algorithm || 'SHA-256' };
});

post('/security/hmac-verify', async (body) => {
  const valid = await hmacVerify(body.text, body.key, body.signature, body.algorithm);
  return { valid };
});

post('/security/password-strength', async (body) => {
  return passwordStrength(body.password);
});

post('/security/csp', async (body) => {
  return generateCSP(body);
});

post('/security/analyze-headers', async (body) => {
  return analyzeHeaders(body.headers);
});

// --- Language ---
post('/language/detect', async (body) => {
  return detectLanguage(body.text);
});

post('/language/analyze', async (body) => {
  return analyzeText(body.text);
});

// --- QR Code ---
post('/qr/generate', async (body) => {
  if (!body.text) throw new Error('text is required');
  const qr = generateQR(body.text, { ecLevel: body.ecLevel || 'M' });
  const format = (body.format || 'svg').toLowerCase();

  switch (format) {
    case 'svg':
      return { svg: qrToSVGOptimized(qr, {
        moduleSize: body.moduleSize || 10,
        margin: body.margin ?? 4,
        darkColor: body.darkColor || '#000000',
        lightColor: body.lightColor || '#ffffff',
      }), version: qr.version, size: qr.size, ecLevel: qr.ecLevel };
    case 'matrix':
      return { matrix: qrToMatrix(qr), version: qr.version, size: qr.size, ecLevel: qr.ecLevel };
    case 'ascii':
      return { ascii: qrToASCII(qr), version: qr.version, size: qr.size, ecLevel: qr.ecLevel };
    default:
      throw new Error('Invalid format. Use svg, matrix, or ascii');
  }
});

post('/qr/svg', async (body) => {
  if (!body.text) throw new Error('text is required');
  const qr = generateQR(body.text, { ecLevel: body.ecLevel || 'M' });
  return {
    svg: qrToSVGOptimized(qr, {
      moduleSize: body.moduleSize || 10,
      margin: body.margin ?? 4,
      darkColor: body.darkColor || '#000000',
      lightColor: body.lightColor || '#ffffff',
    }),
    version: qr.version,
    size: qr.size,
  };
});

post('/qr/matrix', async (body) => {
  if (!body.text) throw new Error('text is required');
  const qr = generateQR(body.text, { ecLevel: body.ecLevel || 'M' });
  return { matrix: qrToMatrix(qr), version: qr.version, size: qr.size };
});

// --- Cron ---
post('/cron/parse', async (body) => {
  return parseCron(body.expression);
});

post('/cron/next', async (body) => {
  const occurrences = nextOccurrences(body.expression, body.count || 5, body.from || null);
  return { expression: body.expression, count: occurrences.length, occurrences };
});

post('/cron/validate', async (body) => {
  return validateCron(body.expression);
});

// --- Readability & Text Analysis ---
post('/readability/flesch-kincaid', async (body) => {
  if (!body.text) throw new Error('text is required');
  return fleschKincaid(body.text);
});

post('/readability/gunning-fog', async (body) => {
  if (!body.text) throw new Error('text is required');
  return gunningFog(body.text);
});

post('/readability/coleman-liau', async (body) => {
  if (!body.text) throw new Error('text is required');
  return colemanLiau(body.text);
});

post('/readability/ari', async (body) => {
  if (!body.text) throw new Error('text is required');
  return ari(body.text);
});

post('/readability/smog', async (body) => {
  if (!body.text) throw new Error('text is required');
  return smog(body.text);
});

post('/readability/all', async (body) => {
  if (!body.text) throw new Error('text is required');
  return allReadability(body.text);
});

post('/readability/statistics', async (body) => {
  if (!body.text) throw new Error('text is required');
  return textStatistics(body.text);
});

post('/readability/keywords', async (body) => {
  if (!body.text) throw new Error('text is required');
  return extractKeywords(body.text, body.options);
});

post('/readability/sentiment', async (body) => {
  if (!body.text) throw new Error('text is required');
  return sentimentAnalysis(body.text);
});

// --- Math & Statistics ---
post('/math/stats', async (body) => {
  if (!body.numbers) throw new Error('numbers array is required');
  return descriptiveStats(body.numbers);
});

post('/math/percentile', async (body) => {
  if (!body.numbers) throw new Error('numbers array is required');
  if (body.percentile === undefined) throw new Error('percentile is required (0-100)');
  return { value: percentile(body.numbers, body.percentile), percentile: body.percentile };
});

post('/math/percentiles', async (body) => {
  if (!body.numbers) throw new Error('numbers array is required');
  const pList = body.percentiles || [25, 50, 75, 90, 95, 99];
  return percentiles(body.numbers, pList);
});

post('/math/correlation', async (body) => {
  if (!body.x || !body.y) throw new Error('x and y arrays are required');
  return correlation(body.x, body.y);
});

post('/math/regression', async (body) => {
  if (!body.x || !body.y) throw new Error('x and y arrays are required');
  return linearRegression(body.x, body.y);
});

post('/math/zscore', async (body) => {
  if (body.value === undefined || body.mean === undefined || body.stdDev === undefined) {
    throw new Error('value, mean, and stdDev are required');
  }
  return { zScore: zScore(body.value, body.mean, body.stdDev), value: body.value, mean: body.mean, stdDev: body.stdDev };
});

post('/math/normalize', async (body) => {
  if (!body.numbers) throw new Error('numbers array is required');
  return { result: normalize(body.numbers, body.options) };
});

post('/math/histogram', async (body) => {
  if (!body.numbers) throw new Error('numbers array is required');
  return histogram(body.numbers, body.bins || 10);
});

post('/math/outliers', async (body) => {
  if (!body.numbers) throw new Error('numbers array is required');
  return outliers(body.numbers, body.method || 'iqr');
});

post('/math/evaluate', async (body) => {
  if (!body.expression) throw new Error('expression is required');
  return { result: evaluateExpression(body.expression), expression: body.expression };
});

// --- MIME Type ---
post('/mime/detect', async (body) => {
  if (!body.data) throw new Error('base64-encoded data is required');
  return detectFromBytes(body.data);
});

post('/mime/from-extension', async (body) => {
  if (!body.filename) throw new Error('filename is required');
  return detectFromExtension(body.filename);
});

post('/mime/to-extension', async (body) => {
  if (!body.mime) throw new Error('mime type is required');
  return mimeToExtension(body.mime);
});

post('/mime/validate', async (body) => {
  if (!body.data || !body.mime) throw new Error('data (base64) and mime type are required');
  return validateType(body.data, body.mime);
});

get('/mime/types', async () => {
  return listMimeTypes();
});

post('/mime/types', async (body) => {
  return listMimeTypes(body.category);
});

// --- URL Utilities ---
post('/url/parse', async (body) => {
  if (!body.url) throw new Error('url is required');
  return parseURL(body.url);
});

post('/url/build', async (body) => {
  return buildURL(body);
});

post('/url/normalize', async (body) => {
  if (!body.url) throw new Error('url is required');
  return normalizeURL(body.url, body.options);
});

post('/url/domain', async (body) => {
  if (!body.url) throw new Error('url is required');
  return extractDomain(body.url);
});

post('/url/compare', async (body) => {
  if (!body.url1 || !body.url2) throw new Error('url1 and url2 are required');
  return compareURLs(body.url1, body.url2);
});

// --- Barcode ---
post('/barcode/generate', async (body) => {
  if (!body.text) throw new Error('text is required');
  return generateBarcode(body.text, body.format || 'code128', body.options);
});

get('/barcode/formats', async () => {
  return listFormats();
});

// --- Markdown ---
post('/markdown/html-to-markdown', async (body) => {
  if (!body.html) throw new Error('html is required');
  return { markdown: htmlToMarkdown(body.html) };
});

post('/markdown/strip', async (body) => {
  if (!body.markdown) throw new Error('markdown is required');
  return { text: stripMarkdown(body.markdown) };
});

post('/markdown/headings', async (body) => {
  if (!body.markdown) throw new Error('markdown is required');
  return { headings: extractHeadings(body.markdown) };
});

post('/markdown/toc', async (body) => {
  if (!body.markdown) throw new Error('markdown is required');
  return { toc: extractTOC(body.markdown) };
});

post('/markdown/stats', async (body) => {
  if (!body.markdown) throw new Error('markdown is required');
  return markdownStats(body.markdown);
});

post('/markdown/links', async (body) => {
  if (!body.markdown) throw new Error('markdown is required');
  return { links: extractLinks(body.markdown) };
});

post('/markdown/images', async (body) => {
  if (!body.markdown) throw new Error('markdown is required');
  return { images: extractImages(body.markdown) };
});

// --- YAML ---
post('/yaml/to-json', async (body) => {
  if (body.yaml === undefined) throw new Error('yaml is required');
  return { json: yamlToJSON(body.yaml) };
});

post('/yaml/from-json', async (body) => {
  if (body.json === undefined) throw new Error('json is required');
  return { yaml: jsonToYAML(body.json, body.options) };
});

post('/yaml/validate', async (body) => {
  if (body.yaml === undefined) throw new Error('yaml is required');
  return validateYAML(body.yaml);
});

// --- XML ---
post('/xml/from-json', async (body) => {
  if (body.data === undefined) throw new Error('data (JSON object) is required');
  return { xml: jsonToXML(body.data, body.options) };
});

post('/xml/to-json', async (body) => {
  if (!body.xml) throw new Error('xml string is required');
  return { json: xmlToJSON(body.xml, body.options) };
});

post('/xml/validate', async (body) => {
  if (!body.xml) throw new Error('xml string is required');
  return validateXML(body.xml);
});

post('/xml/format', async (body) => {
  if (!body.xml) throw new Error('xml string is required');
  return { xml: formatXML(body.xml, body.indent || 2) };
});

// --- ID Generation ---
post('/id/nanoid', async (body) => {
  return { id: nanoid(body.size, body.alphabet) };
});

post('/id/ulid', async (body) => {
  return { id: ulid(body.timestamp) };
});

post('/id/cuid', async () => {
  return { id: cuid() };
});

post('/id/snowflake', async (body) => {
  return { id: snowflakeId(body.options) };
});

post('/id/snowflake/parse', async (body) => {
  if (!body.id) throw new Error('id is required');
  return parseSnowflake(body.id, body.options);
});

post('/id/objectid', async () => {
  return { id: objectId() };
});

post('/id/objectid/parse', async (body) => {
  if (!body.id) throw new Error('id is required');
  return parseObjectId(body.id);
});

post('/id/short', async (body) => {
  return { id: shortId(body.length) };
});

post('/id/prefixed', async (body) => {
  if (!body.prefix) throw new Error('prefix is required');
  return { id: prefixedId(body.prefix, body.options) };
});

post('/id/batch', async (body) => {
  if (!body.type) throw new Error('type is required');
  return batchIds(body.type, body.count, body.options);
});

// --- Emoji ---
post('/emoji/search', async (body) => {
  if (!body.query) throw new Error('query is required');
  return searchEmoji(body.query, body.limit);
});

post('/emoji/get', async (body) => {
  if (!body.name) throw new Error('name is required');
  return getEmoji(body.name);
});

get('/emoji/random', async () => {
  return randomEmoji();
});

post('/emoji/info', async (body) => {
  if (!body.emoji) throw new Error('emoji is required');
  return emojiInfo(body.emoji);
});

get('/emoji/categories', async () => {
  return listEmojiCategories();
});

post('/emoji/strip', async (body) => {
  if (!body.text) throw new Error('text is required');
  return stripEmoji(body.text);
});

post('/emoji/extract', async (body) => {
  if (!body.text) throw new Error('text is required');
  return extractEmojis(body.text);
});

post('/emoji/replace', async (body) => {
  if (!body.text) throw new Error('text is required');
  return replaceEmoji(body.text, body.replacement || '');
});

// --- Country ---
get('/country/list', async () => {
  return { countries: listCountries() };
});

post('/country/get', async (body) => {
  if (!body.code) throw new Error('code is required (ISO 3166-1 alpha-2)');
  return getCountry(body.code);
});

post('/country/search', async (body) => {
  if (!body.query) throw new Error('query is required');
  return { results: searchCountries(body.query) };
});

post('/country/currency', async (body) => {
  if (!body.code) throw new Error('code is required (e.g., "USD", "KRW")');
  return getCurrency(body.code);
});

get('/country/currencies', async () => {
  return { currencies: listCurrencies() };
});

post('/country/calling-code', async (body) => {
  if (!body.code) throw new Error('code is required');
  return getCallingCode(body.code);
});

get('/country/timezones', async () => {
  return { timezones: listTimezones() };
});

post('/country/timezone', async (body) => {
  if (!body.timezone) throw new Error('timezone is required (e.g., "Asia/Seoul", "America/New_York")');
  return getTimezone(body.timezone);
});

// --- OpenAPI ---
get('/openapi.json', async () => {
  return openApiSpec;
});

// --- Health ---
get('/health', async () => {
  return { status: 'ok', version: '1.0.0', endpoints: routes.size };
});

get('/', async () => {
  const endpoints = [];
  for (const key of routes.keys()) {
    const [method, path] = key.split(':');
    endpoints.push({ method, path });
  }
  return { name: 'API Forge — Text & Data Utility API', version: '1.0.0', endpoints };
});

// --- Request Handler ---
export async function handleRequest(request) {
  const url = new URL(request.url);
  const method = request.method;
  const path = url.pathname.replace(/\/$/, '') || '/';

  // CORS
  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  // QR image (returns SVG directly for embedding)
  if (path === '/qr/image' && method === 'GET') {
    try {
      const text = url.searchParams.get('text');
      if (!text) return jsonResponse({ error: 'text query parameter is required' }, 400);
      const ecLevel = url.searchParams.get('ecLevel') || 'M';
      const darkColor = url.searchParams.get('dark') || '#000000';
      const lightColor = url.searchParams.get('light') || '#ffffff';
      const size = parseInt(url.searchParams.get('size') || '10', 10);
      const margin = parseInt(url.searchParams.get('margin') || '4', 10);
      const qr = generateQR(text, { ecLevel });
      const svg = qrToSVGOptimized(qr, { moduleSize: size, margin, darkColor, lightColor });
      return new Response(svg, {
        status: 200,
        headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400', ...corsHeaders() },
      });
    } catch (e) {
      return jsonResponse({ error: e.message }, 400);
    }
  }

  // Barcode image (returns SVG directly for embedding)
  if (path === '/barcode/image' && method === 'GET') {
    try {
      const text = url.searchParams.get('text');
      if (!text) return jsonResponse({ error: 'text query parameter is required' }, 400);
      const format = url.searchParams.get('format') || 'code128';
      const height = parseInt(url.searchParams.get('height') || '100', 10);
      const barColor = url.searchParams.get('color') || '#000000';
      const result = generateBarcode(text, format, { height, barColor, showText: url.searchParams.get('showText') !== 'false' });
      return new Response(result.svg, {
        status: 200,
        headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400', ...corsHeaders() },
      });
    } catch (e) {
      return jsonResponse({ error: e.message }, 400);
    }
  }

  // Sitemap
  if (path === '/sitemap.xml' && method === 'GET') {
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://api-forge.quietnode.workers.dev/docs</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>https://api-forge.quietnode.workers.dev/openapi.json</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>
</urlset>`;
    return new Response(sitemap, {
      status: 200,
      headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=86400', ...corsHeaders() },
    });
  }

  // Robots.txt
  if (path === '/robots.txt' && method === 'GET') {
    return new Response('User-agent: *\nAllow: /\nSitemap: https://api-forge.quietnode.workers.dev/sitemap.xml\n', {
      status: 200,
      headers: { 'Content-Type': 'text/plain', ...corsHeaders() },
    });
  }

  // Docs page (HTML)
  if (path === '/docs' && method === 'GET') {
    return new Response(generateDocs(), {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders() },
    });
  }

  const routeKey = `${method}:${path}`;
  const handler = routes.get(routeKey);

  if (!handler) {
    return jsonResponse({ error: 'Not found', path }, 404);
  }

  try {
    let body = {};
    if (method === 'POST') {
      const text = await request.text();
      if (!text) return jsonResponse({ error: 'Request body required' }, 400);
      try { body = JSON.parse(text); }
      catch { return jsonResponse({ error: 'Invalid JSON body' }, 400); }
    }
    const result = await handler(body, request);
    return jsonResponse(result);
  } catch (e) {
    if (e instanceof TypeError) {
      return jsonResponse({ error: 'Missing or invalid required parameter. Check the API docs at /docs' }, 400);
    }
    return jsonResponse({ error: e.message }, 400);
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}
