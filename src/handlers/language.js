// Language detection via Unicode script analysis + trigram profiles
// No external dependencies — pure JS

// Unicode script ranges (codepoint ranges → script name)
const SCRIPT_RANGES = [
  [0x0000, 0x007F, 'Latin'],     // Basic Latin
  [0x0080, 0x00FF, 'Latin'],     // Latin-1 Supplement
  [0x0100, 0x024F, 'Latin'],     // Latin Extended-A/B
  [0x0250, 0x02AF, 'Latin'],     // IPA Extensions
  [0x0370, 0x03FF, 'Greek'],
  [0x0400, 0x04FF, 'Cyrillic'],
  [0x0500, 0x052F, 'Cyrillic'],  // Cyrillic Supplement
  [0x0530, 0x058F, 'Armenian'],
  [0x0590, 0x05FF, 'Hebrew'],
  [0x0600, 0x06FF, 'Arabic'],
  [0x0700, 0x074F, 'Syriac'],
  [0x0900, 0x097F, 'Devanagari'],
  [0x0980, 0x09FF, 'Bengali'],
  [0x0A00, 0x0A7F, 'Gurmukhi'],
  [0x0A80, 0x0AFF, 'Gujarati'],
  [0x0B80, 0x0BFF, 'Tamil'],
  [0x0C00, 0x0C7F, 'Telugu'],
  [0x0C80, 0x0CFF, 'Kannada'],
  [0x0D00, 0x0D7F, 'Malayalam'],
  [0x0E00, 0x0E7F, 'Thai'],
  [0x0E80, 0x0EFF, 'Lao'],
  [0x1000, 0x109F, 'Myanmar'],
  [0x10A0, 0x10FF, 'Georgian'],
  [0x1100, 0x11FF, 'Hangul'],    // Hangul Jamo
  [0x1780, 0x17FF, 'Khmer'],
  [0x3040, 0x309F, 'Hiragana'],
  [0x30A0, 0x30FF, 'Katakana'],
  [0x3100, 0x312F, 'Bopomofo'],
  [0x3130, 0x318F, 'Hangul'],    // Hangul Compatibility Jamo
  [0x31F0, 0x31FF, 'Katakana'],  // Katakana Phonetic Extensions
  [0x3400, 0x4DBF, 'CJK'],       // CJK Unified Ideographs Extension A
  [0x4E00, 0x9FFF, 'CJK'],       // CJK Unified Ideographs
  [0xA960, 0xA97F, 'Hangul'],    // Hangul Jamo Extended-A
  [0xAC00, 0xD7AF, 'Hangul'],    // Hangul Syllables
  [0xD7B0, 0xD7FF, 'Hangul'],    // Hangul Jamo Extended-B
  [0xF900, 0xFAFF, 'CJK'],       // CJK Compatibility Ideographs
  [0xFF65, 0xFF9F, 'Katakana'],   // Halfwidth Katakana
  [0x20000, 0x2A6DF, 'CJK'],     // CJK Extension B
];

function getScript(codePoint) {
  for (const [start, end, script] of SCRIPT_RANGES) {
    if (codePoint >= start && codePoint <= end) return script;
  }
  return 'Common';
}

function analyzeScripts(text) {
  const counts = {};
  let total = 0;
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    // Skip whitespace, digits, punctuation
    if (cp <= 0x40 || (cp >= 0x5B && cp <= 0x60) || (cp >= 0x7B && cp <= 0x7F)) continue;
    const script = getScript(cp);
    if (script === 'Common') continue;
    counts[script] = (counts[script] || 0) + 1;
    total++;
  }
  return { counts, total };
}

// Script → language mapping (most common mapping)
const SCRIPT_TO_LANG = {
  'Hangul': { code: 'ko', name: 'Korean', nativeName: '한국어' },
  'Hiragana': { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  'Katakana': { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  'CJK': null, // Ambiguous: could be Chinese, Japanese, or Korean
  'Devanagari': { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  'Bengali': { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  'Tamil': { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  'Telugu': { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  'Kannada': { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  'Malayalam': { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  'Gujarati': { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  'Gurmukhi': { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  'Thai': { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  'Lao': { code: 'lo', name: 'Lao', nativeName: 'ລາວ' },
  'Myanmar': { code: 'my', name: 'Burmese', nativeName: 'မြန်မာစာ' },
  'Georgian': { code: 'ka', name: 'Georgian', nativeName: 'ქართული' },
  'Armenian': { code: 'hy', name: 'Armenian', nativeName: 'Հայերեն' },
  'Hebrew': { code: 'he', name: 'Hebrew', nativeName: 'עברית' },
  'Arabic': { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  'Greek': { code: 'el', name: 'Greek', nativeName: 'Ελληνικά' },
  'Cyrillic': null, // Ambiguous: Russian, Ukrainian, etc.
  'Khmer': { code: 'km', name: 'Khmer', nativeName: 'ខ្មែរ' },
};

// Common trigram profiles for Latin-script languages (top 20 trigrams each)
const LATIN_PROFILES = {
  en: [' th', 'the', 'he ', 'nd ', 'ion', 'tio', ' an', 'and', 'ing', 'ati', 'for', 'ent', 'on ', 'hat', 'tha', ' in', 'is ', 'ed ', 'er ', 'es '],
  es: [' de', 'de ', ' la', ' en', 'la ', 'ión', 'ent', 'ció', 'aci', 'el ', 'en ', 'es ', 'os ', 'as ', ' co', 'que', ' qu', 'con', 'te ', ' se'],
  fr: [' de', 'es ', 'de ', ' le', 'le ', 'ent', 'nt ', ' la', 'la ', 'ion', 'tio', 'on ', 'les', ' le', ' co', 'que', 'ati', ' pa', 'ous', 'ons'],
  de: [' de', 'der', 'die', 'er ', 'en ', 'ein', 'und', 'nd ', 'che', 'sch', 'ich', 'den', 'gen', ' di', ' ei', 'ie ', 'ung', 'das', ' da', 'ine'],
  pt: [' de', 'de ', ' a ', 'os ', 'ão ', ' co', 'ent', 'ção', 'nte', ' da', 'da ', 'que', ' qu', ' se', 'as ', 'com', 'do ', 'es ', 'no ', ' no'],
  it: [' di', 'lla', 'la ', 'di ', 'che', 'ell', 'per', ' de', 'del', 'ato', 'ent', 'one', 'azi', 'zio', 'ion', 'on ', ' pe', ' co', 'ta ', 'to '],
  nl: [' de', 'de ', 'en ', 'an ', 'et ', 'het', 'van', ' va', 'een', ' he', ' ee', 'der', 'er ', 'in ', ' in', 'aar', 'oor', 'ver', ' ve', 'ge '],
  sv: [' de', 'för', 'en ', 'att', ' at', 'och', 'der', 'det', 'er ', ' oc', 'ch ', ' fö', 'den', ' en', 'ing', ' so', 'som', ' me', 'gen', 'et '],
  da: [' de', 'er ', 'en ', 'der', 'det', 'og ', ' og', 'for', 'den', 'til', ' ti', ' fo', ' at', 'et ', 'at ', 'af ', 'med', ' me', 'de ', 'ige'],
  no: [' de', 'en ', 'er ', 'det', 'for', 'og ', ' og', ' fo', 'den', 'til', ' ti', 'et ', 'som', 'ter', 'med', ' me', ' so', ' en', 'ing', 'and'],
  fi: [' ja', 'ja ', 'en ', 'ssa', 'ist', 'sta', ' on', 'on ', 'tta', ' ka', 'ais', 'ta ', 'an ', 'ise', 'tä ', 'ään', 'in ', 'mis', 'sen', 'ksi'],
  pl: [' ni', 'nie', 'prz', 'rze', 'nia', ' pr', 'owa', 'wie', 'ego', 'ych', 'iem', ' je', 'jes', 'est', ' si', 'cze', 'ści', 'kie', 'ani', 'sta'],
  tr: [' bi', 'bir', 'lar', 'ler', 'eri', 'ını', 'nın', 'ın ', 'ara', ' ka', 'ası', 'ile', ' ve', 'an ', 'da ', 'arı', 'ır ', 'aya', 'ini', 'rak'],
  ro: [' de', 'de ', 'are', 'rea', 're ', 'ate', 'ea ', 'lor', ' și', 'și ', 'ent', 'ele', 'ări', 'ul ', 'ulu', ' în', 'în ', 'pen', 'tru', 'nte'],
  vi: [' ng', 'ng ', 'nh ', ' nh', ' tr', 'ông', ' cá', 'các', 'ác ', 'ung', 'ủa', 'của', ' củ', 'ượ', 'ược', 'được', ' đư', 'ội', 'ện', 'ình'],
  id: [' me', 'ang', ' di', 'an ', 'kan', 'ber', 'men', 'eng', 'nga', ' da', 'dan', ' se', 'per', 'yan', ' pe', 'ala', ' ke', 'eri', 'ter', 'ata'],
  ms: [' me', 'ang', 'an ', 'kan', 'ber', 'men', 'eng', 'nga', ' da', 'dan', ' se', 'per', 'yan', ' pe', 'ala', ' ke', 'eri', 'ter', ' di', 'ata'],
};

// Cyrillic trigram profiles
const CYRILLIC_PROFILES = {
  ru: [' пр', 'ени', 'ани', ' не', 'ния', ' по', 'ста', 'ост', 'ово', 'ого', 'ать', 'про', 'ова', 'ить', 'ие ', 'ой ', 'ств', 'ель', 'тор', 'ент'],
  uk: [' пр', 'ння', 'ого', 'ано', 'ені', 'ств', ' не', ' за', 'іст', 'ськ', 'ати', 'пер', 'ова', ' по', 'ост', 'ись', 'ько', 'від', ' ві', 'ний'],
  bg: [' на', 'на ', 'ата', 'ите', 'ена', ' пр', 'то ', 'та ', 'ни ', 'ани', 'ото', 'ова', ' за', ' от', 'ски', 'ств', 'ите', 'ста', 'ра ', 'и н'],
  sr: [' пр', ' не', 'ста', 'ост', 'ање', 'ати', 'ако', 'ога', 'ина', 'ово', 'ова', ' по', 'про', 'ити', 'ење', ' на', 'ост', 'ска', 'ног', 'тор'],
};

// CJK detection: Korean has Hangul, Japanese has Hiragana/Katakana, Chinese is pure CJK
function detectCJK(scriptCounts) {
  const hangul = scriptCounts['Hangul'] || 0;
  const hiragana = scriptCounts['Hiragana'] || 0;
  const katakana = scriptCounts['Katakana'] || 0;
  const cjk = scriptCounts['CJK'] || 0;

  if (hangul > 0 && hangul >= (hiragana + katakana)) {
    return { code: 'ko', name: 'Korean', nativeName: '한국어' };
  }
  if ((hiragana + katakana) > 0) {
    return { code: 'ja', name: 'Japanese', nativeName: '日本語' };
  }
  if (cjk > 0) {
    // Pure CJK without Hangul or Kana → most likely Chinese
    return { code: 'zh', name: 'Chinese', nativeName: '中文' };
  }
  return null;
}

function getTrigrams(text) {
  const clean = text.toLowerCase().replace(/[^\p{L}\s]/gu, '').replace(/\s+/g, ' ');
  const trigrams = {};
  for (let i = 0; i < clean.length - 2; i++) {
    const tri = clean.substring(i, i + 3);
    trigrams[tri] = (trigrams[tri] || 0) + 1;
  }
  return trigrams;
}

function trigramDistance(textTrigrams, profileTrigrams) {
  // Out-of-place distance measure
  const textSorted = Object.entries(textTrigrams)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 300)
    .map(([tri]) => tri);

  let distance = 0;
  for (let i = 0; i < profileTrigrams.length; i++) {
    const idx = textSorted.indexOf(profileTrigrams[i]);
    if (idx === -1) {
      distance += 300; // Maximum penalty
    } else {
      distance += Math.abs(i - idx);
    }
  }
  return distance;
}

function detectLatinLanguage(text) {
  const trigrams = getTrigrams(text);
  if (Object.keys(trigrams).length < 3) {
    return { code: 'en', name: 'English', nativeName: 'English', confidence: 0.3 };
  }

  let best = null;
  let bestDist = Infinity;

  for (const [lang, profile] of Object.entries(LATIN_PROFILES)) {
    const dist = trigramDistance(trigrams, profile);
    if (dist < bestDist) {
      bestDist = dist;
      best = lang;
    }
  }

  // Normalize confidence: lower distance = higher confidence
  const maxDist = 300 * 20; // 20 trigrams × max penalty
  const confidence = Math.max(0.1, Math.min(0.99, 1 - (bestDist / maxDist)));

  const langNames = {
    en: { name: 'English', nativeName: 'English' },
    es: { name: 'Spanish', nativeName: 'Español' },
    fr: { name: 'French', nativeName: 'Français' },
    de: { name: 'German', nativeName: 'Deutsch' },
    pt: { name: 'Portuguese', nativeName: 'Português' },
    it: { name: 'Italian', nativeName: 'Italiano' },
    nl: { name: 'Dutch', nativeName: 'Nederlands' },
    sv: { name: 'Swedish', nativeName: 'Svenska' },
    da: { name: 'Danish', nativeName: 'Dansk' },
    no: { name: 'Norwegian', nativeName: 'Norsk' },
    fi: { name: 'Finnish', nativeName: 'Suomi' },
    pl: { name: 'Polish', nativeName: 'Polski' },
    tr: { name: 'Turkish', nativeName: 'Türkçe' },
    ro: { name: 'Romanian', nativeName: 'Română' },
    vi: { name: 'Vietnamese', nativeName: 'Tiếng Việt' },
    id: { name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
    ms: { name: 'Malay', nativeName: 'Bahasa Melayu' },
  };

  return { code: best, ...langNames[best], confidence: parseFloat(confidence.toFixed(3)) };
}

function detectCyrillicLanguage(text) {
  const trigrams = getTrigrams(text);
  if (Object.keys(trigrams).length < 3) {
    return { code: 'ru', name: 'Russian', nativeName: 'Русский', confidence: 0.3 };
  }

  let best = null;
  let bestDist = Infinity;

  for (const [lang, profile] of Object.entries(CYRILLIC_PROFILES)) {
    const dist = trigramDistance(trigrams, profile);
    if (dist < bestDist) {
      bestDist = dist;
      best = lang;
    }
  }

  const maxDist = 300 * 20;
  const confidence = Math.max(0.1, Math.min(0.99, 1 - (bestDist / maxDist)));

  const langNames = {
    ru: { name: 'Russian', nativeName: 'Русский' },
    uk: { name: 'Ukrainian', nativeName: 'Українська' },
    bg: { name: 'Bulgarian', nativeName: 'Български' },
    sr: { name: 'Serbian', nativeName: 'Српски' },
  };

  return { code: best, ...langNames[best], confidence: parseFloat(confidence.toFixed(3)) };
}

export function detectLanguage(text) {
  if (!text || typeof text !== 'string' || (typeof text === 'string' && text.trim().length === 0)) {
    throw new Error('text is required and cannot be empty');
  }

  const clean = text.trim();

  const { counts, total } = analyzeScripts(clean);
  if (total === 0) {
    return { language: { code: 'und', name: 'Undetermined', confidence: 0 }, scripts: {}, details: 'No identifiable script characters found' };
  }

  // Build script percentages
  const scripts = {};
  for (const [script, count] of Object.entries(counts)) {
    scripts[script] = parseFloat((count / total * 100).toFixed(1));
  }

  // Find dominant script
  const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a);
  const dominantScript = sorted[0][0];
  const dominantPct = sorted[0][1] / total;

  let language;

  // CJK family detection
  if (['CJK', 'Hangul', 'Hiragana', 'Katakana'].includes(dominantScript)) {
    const cjkResult = detectCJK(counts);
    if (cjkResult) {
      language = { ...cjkResult, confidence: parseFloat(Math.min(0.99, dominantPct + 0.3).toFixed(3)) };
    }
  }

  // Script with unique language mapping
  if (!language) {
    const mapping = SCRIPT_TO_LANG[dominantScript];
    if (mapping) {
      language = { ...mapping, confidence: parseFloat(Math.min(0.99, dominantPct + 0.2).toFixed(3)) };
    }
  }

  // Latin script → trigram analysis
  if (!language && dominantScript === 'Latin') {
    language = detectLatinLanguage(clean);
  }

  // Cyrillic script → trigram analysis
  if (!language && dominantScript === 'Cyrillic') {
    language = detectCyrillicLanguage(clean);
  }

  if (!language) {
    language = { code: 'und', name: 'Undetermined', confidence: 0.1 };
  }

  return { language, scripts };
}

export function analyzeText(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('text is required');
  }

  const { counts, total } = analyzeScripts(text.trim());
  const scripts = {};
  for (const [script, count] of Object.entries(counts)) {
    scripts[script] = { count, percentage: parseFloat((count / total * 100).toFixed(1)) };
  }

  // Count characters
  const chars = [...text];
  const stats = {
    length: text.length,
    codePoints: chars.length,
    words: text.trim().split(/\s+/).filter(Boolean).length,
    lines: text.split('\n').length,
    scripts,
    scriptCharacters: total,
  };

  // Direction
  const rtlScripts = ['Arabic', 'Hebrew', 'Syriac'];
  const hasRTL = Object.keys(counts).some(s => rtlScripts.includes(s));
  stats.direction = hasRTL ? 'rtl' : 'ltr';

  return stats;
}
