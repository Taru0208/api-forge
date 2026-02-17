import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { detectLanguage, analyzeText } from './language.js';

describe('Language detection', () => {
  it('detects English', () => {
    const r = detectLanguage('The quick brown fox jumps over the lazy dog. This is a longer sentence with more English words to improve detection accuracy and make the trigram analysis more reliable.');
    assert.equal(r.language.code, 'en');
    assert.ok(r.language.confidence > 0);
  });

  it('detects Korean', () => {
    const r = detectLanguage('안녕하세요, 만나서 반갑습니다');
    assert.equal(r.language.code, 'ko');
    assert.ok(r.language.confidence > 0.5);
  });

  it('detects Japanese (hiragana)', () => {
    const r = detectLanguage('おはようございます、今日はいい天気ですね');
    assert.equal(r.language.code, 'ja');
  });

  it('detects Chinese', () => {
    const r = detectLanguage('今天天气很好，我们去公园吧');
    assert.equal(r.language.code, 'zh');
  });

  it('detects Spanish', () => {
    const r = detectLanguage('Buenos días, ¿cómo estás? Hoy hace buen tiempo en la ciudad');
    assert.equal(r.language.code, 'es');
  });

  it('detects French', () => {
    const r = detectLanguage('Bonjour, comment allez-vous aujourd\'hui? Je suis très content de vous voir');
    assert.equal(r.language.code, 'fr');
  });

  it('detects German', () => {
    const r = detectLanguage('Guten Tag, wie geht es Ihnen? Das Wetter ist heute sehr schön');
    assert.equal(r.language.code, 'de');
  });

  it('detects Russian', () => {
    const r = detectLanguage('Здравствуйте, как у вас дела? Сегодня прекрасная погода. Я очень рад вас видеть, давайте пойдём гулять вместе.');
    assert.equal(r.language.code, 'ru');
  });

  it('detects Arabic', () => {
    const r = detectLanguage('مرحبا، كيف حالك؟ الطقس جميل اليوم');
    assert.equal(r.language.code, 'ar');
  });

  it('detects Thai', () => {
    const r = detectLanguage('สวัสดีครับ วันนี้อากาศดีมาก');
    assert.equal(r.language.code, 'th');
  });

  it('detects Hindi', () => {
    const r = detectLanguage('नमस्ते, आप कैसे हैं? आज मौसम बहुत अच्छा है');
    assert.equal(r.language.code, 'hi');
  });

  it('detects Portuguese', () => {
    const r = detectLanguage('Olá, como você está? O tempo está muito bom hoje na cidade');
    assert.equal(r.language.code, 'pt');
  });

  it('detects Italian', () => {
    const r = detectLanguage('Buongiorno, come state? Il tempo è molto bello oggi nella città');
    assert.equal(r.language.code, 'it');
  });

  it('returns scripts breakdown', () => {
    const r = detectLanguage('Hello 안녕');
    assert.ok(r.scripts);
    assert.ok(r.scripts.Latin >= 0 || r.scripts.Hangul >= 0);
  });

  it('rejects empty text', () => {
    assert.throws(() => detectLanguage(''), /required|empty/);
  });

  it('rejects non-string', () => {
    assert.throws(() => detectLanguage(123), /required/);
  });

  it('handles numbers-only text', () => {
    const r = detectLanguage('12345');
    assert.equal(r.language.code, 'und');
  });

  it('detects Hebrew', () => {
    const r = detectLanguage('שלום, מה שלומך היום');
    assert.equal(r.language.code, 'he');
  });

  it('detects Greek', () => {
    const r = detectLanguage('Καλημέρα, πώς είστε σήμερα');
    assert.equal(r.language.code, 'el');
  });

  it('detects Turkish', () => {
    const r = detectLanguage('Merhaba, nasılsınız? Bugün hava çok güzel bir gün olacak');
    assert.equal(r.language.code, 'tr');
  });

  it('handles mixed scripts', () => {
    const r = detectLanguage('Hello World 안녕하세요 こんにちは');
    assert.ok(r.scripts);
    assert.ok(Object.keys(r.scripts).length >= 2);
  });

  it('confidence is between 0 and 1', () => {
    const r = detectLanguage('This is a test sentence in English');
    assert.ok(r.language.confidence >= 0);
    assert.ok(r.language.confidence <= 1);
  });
});

describe('Text analysis', () => {
  it('analyzes basic stats', () => {
    const r = analyzeText('Hello World');
    assert.equal(r.words, 2);
    assert.equal(r.lines, 1);
    assert.ok(r.length > 0);
  });

  it('detects LTR direction', () => {
    const r = analyzeText('Hello World');
    assert.equal(r.direction, 'ltr');
  });

  it('detects RTL direction', () => {
    const r = analyzeText('مرحبا بالعالم');
    assert.equal(r.direction, 'rtl');
  });

  it('counts scripts', () => {
    const r = analyzeText('Hello 안녕');
    assert.ok(r.scripts.Latin || r.scripts.Hangul);
    assert.ok(r.scriptCharacters > 0);
  });

  it('counts multiline', () => {
    const r = analyzeText('Line 1\nLine 2\nLine 3');
    assert.equal(r.lines, 3);
    assert.equal(r.words, 6);
  });
});
