import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  fleschKincaid, gunningFog, colemanLiau, ari, smog, allReadability,
  textStatistics, extractKeywords, sentimentAnalysis,
} from './readability.js';

const SIMPLE_TEXT = 'The cat sat on the mat. The dog ran in the park. It was a nice day.';
const COMPLEX_TEXT = 'The epistemological ramifications of contemporary philosophical discourse necessitate a comprehensive examination of the fundamental presuppositions underlying our understanding of cognitive phenomena and their manifestation in observable behavioral patterns.';
const MEDIUM_TEXT = 'Software engineering is the systematic application of engineering approaches to software development. A software engineer creates and maintains computer programs. They work with programming languages and development tools.';

describe('fleschKincaid', () => {
  it('scores simple text as easy', () => {
    const r = fleschKincaid(SIMPLE_TEXT);
    assert.ok(r.readingEase > 70, `Expected easy reading, got ${r.readingEase}`);
    assert.ok(r.gradeLevel < 6, `Expected low grade, got ${r.gradeLevel}`);
  });

  it('scores complex text as hard', () => {
    const r = fleschKincaid(COMPLEX_TEXT);
    assert.ok(r.readingEase < 30, `Expected hard reading, got ${r.readingEase}`);
    assert.ok(r.gradeLevel > 12, `Expected high grade, got ${r.gradeLevel}`);
  });

  it('returns word and sentence counts', () => {
    const r = fleschKincaid(SIMPLE_TEXT);
    assert.ok(r.words > 0);
    assert.ok(r.sentences > 0);
    assert.ok(r.syllables > 0);
  });

  it('handles empty text', () => {
    const r = fleschKincaid('');
    assert.equal(r.words, 0);
    assert.equal(r.readingEase, 0);
  });

  it('includes interpretation', () => {
    const r = fleschKincaid(SIMPLE_TEXT);
    assert.ok(r.interpretation.length > 0);
  });
});

describe('gunningFog', () => {
  it('gives lower score for simple text', () => {
    const simple = gunningFog(SIMPLE_TEXT);
    const complex = gunningFog(COMPLEX_TEXT);
    assert.ok(simple.index < complex.index, `Simple ${simple.index} should be < complex ${complex.index}`);
  });

  it('counts complex words', () => {
    const r = gunningFog(COMPLEX_TEXT);
    assert.ok(r.complexWords > 0);
    assert.ok(r.percentComplex > 0);
  });

  it('handles empty text', () => {
    const r = gunningFog('');
    assert.equal(r.index, 0);
  });
});

describe('colemanLiau', () => {
  it('differentiates simple vs complex', () => {
    const simple = colemanLiau(SIMPLE_TEXT);
    const complex = colemanLiau(COMPLEX_TEXT);
    assert.ok(simple.index < complex.index, `Simple ${simple.index} should be < complex ${complex.index}`);
  });

  it('returns character count', () => {
    const r = colemanLiau(MEDIUM_TEXT);
    assert.ok(r.characters > 0);
    assert.ok(r.words > 0);
  });
});

describe('ari', () => {
  it('differentiates simple vs complex', () => {
    const simple = ari(SIMPLE_TEXT);
    const complex = ari(COMPLEX_TEXT);
    assert.ok(simple.index < complex.index, `Simple ${simple.index} should be < complex ${complex.index}`);
  });
});

describe('smog', () => {
  it('differentiates simple vs complex', () => {
    const simple = smog(SIMPLE_TEXT);
    const complex = smog(COMPLEX_TEXT);
    assert.ok(simple.index < complex.index, `Simple ${simple.index} should be < complex ${complex.index}`);
  });

  it('notes when sample is small', () => {
    const r = smog(SIMPLE_TEXT);
    assert.ok(r.note); // should have note about < 30 sentences
  });
});

describe('allReadability', () => {
  it('returns all five formulas', () => {
    const r = allReadability(MEDIUM_TEXT);
    assert.ok(r.fleschKincaid);
    assert.ok(r.gunningFog);
    assert.ok(r.colemanLiau);
    assert.ok(r.automatedReadabilityIndex);
    assert.ok(r.smog);
    assert.ok(r.consensus);
  });

  it('provides consensus average', () => {
    const r = allReadability(MEDIUM_TEXT);
    assert.ok(typeof r.consensus.averageGradeLevel === 'number');
    assert.ok(r.consensus.averageGradeLevel > 0);
  });
});

describe('textStatistics', () => {
  it('counts basic stats', () => {
    const r = textStatistics(MEDIUM_TEXT);
    assert.ok(r.words > 0);
    assert.ok(r.sentences > 0);
    assert.ok(r.characters > 0);
    assert.ok(r.paragraphs >= 1);
  });

  it('calculates vocabulary richness', () => {
    const r = textStatistics(MEDIUM_TEXT);
    assert.ok(r.vocabularyRichness > 0);
    assert.ok(r.vocabularyRichness <= 1);
    assert.ok(r.uniqueWords > 0);
  });

  it('finds top words', () => {
    const r = textStatistics('hello hello hello world world test');
    assert.ok(r.topWords.length > 0);
    assert.equal(r.topWords[0].word, 'hello');
    assert.equal(r.topWords[0].count, 3);
  });

  it('calculates reading and speaking time', () => {
    const r = textStatistics(MEDIUM_TEXT);
    assert.ok(r.readingTimeSeconds > 0);
    assert.ok(r.speakingTimeSeconds > 0);
    assert.ok(r.speakingTimeSeconds > r.readingTimeSeconds); // speaking is slower
  });

  it('handles empty text', () => {
    const r = textStatistics('');
    assert.equal(r.words, 0);
    assert.equal(r.vocabularyRichness, 0);
  });

  it('finds longest and shortest words', () => {
    const r = textStatistics(MEDIUM_TEXT);
    assert.ok(r.longestWord.length > 0);
    assert.ok(r.shortestWord.length > 0);
    assert.ok(r.longestWord.length >= r.shortestWord.length);
  });
});

describe('extractKeywords', () => {
  it('extracts keywords from text', () => {
    const r = extractKeywords('JavaScript is a programming language. JavaScript is used for web development. Web browsers run JavaScript code.');
    assert.ok(r.keywords.length > 0);
    assert.equal(r.keywords[0].word, 'javascript');
  });

  it('respects maxKeywords', () => {
    const r = extractKeywords(MEDIUM_TEXT, { maxKeywords: 3 });
    assert.ok(r.keywords.length <= 3);
  });

  it('filters stop words', () => {
    const r = extractKeywords('the a an and or but is was are were');
    assert.equal(r.keywords.length, 0);
  });

  it('respects minWordLength', () => {
    const r = extractKeywords('go do be me at on it if so no', { minWordLength: 3 });
    assert.equal(r.keywords.length, 0);
  });

  it('handles empty text', () => {
    const r = extractKeywords('');
    assert.equal(r.keywords.length, 0);
  });

  it('includes scores by default', () => {
    const r = extractKeywords(MEDIUM_TEXT);
    if (r.keywords.length > 0) {
      assert.ok('score' in r.keywords[0]);
      assert.ok('count' in r.keywords[0]);
    }
  });
});

describe('sentimentAnalysis', () => {
  it('detects positive text', () => {
    const r = sentimentAnalysis('This is a great product. I love it. Amazing quality and wonderful design.');
    assert.ok(r.score > 0, `Expected positive score, got ${r.score}`);
    assert.equal(r.label, 'positive');
  });

  it('detects negative text', () => {
    const r = sentimentAnalysis('This is terrible. I hate it. Awful quality and horrible design.');
    assert.ok(r.score < 0, `Expected negative score, got ${r.score}`);
    assert.ok(r.label.includes('negative'));
  });

  it('detects neutral text', () => {
    const r = sentimentAnalysis('The car is blue. It has four wheels. The engine uses gasoline.');
    assert.equal(r.label, 'neutral');
  });

  it('handles negation', () => {
    const r = sentimentAnalysis('This is not good. Not great at all.');
    assert.ok(r.score <= 0, `Expected non-positive score with negation, got ${r.score}`);
  });

  it('handles intensifiers', () => {
    const normal = sentimentAnalysis('This is good.');
    const intensified = sentimentAnalysis('This is very good.');
    assert.ok(intensified.positive >= normal.positive, 'Intensifier should increase score');
  });

  it('returns word lists', () => {
    const r = sentimentAnalysis('Great product but terrible service.');
    assert.ok(r.positiveWords.length > 0);
    assert.ok(r.negativeWords.length > 0);
  });

  it('handles empty text', () => {
    const r = sentimentAnalysis('');
    assert.equal(r.score, 0);
    assert.equal(r.label, 'neutral');
  });
});
