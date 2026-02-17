// Text readability and analysis utilities

// --- Syllable counting ---
function countSyllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 2) return word.length > 0 ? 1 : 0;

  // Special suffixes
  word = word.replace(/(?:es|ed)$/, '');
  if (word.endsWith('le') && word.length > 2 && !/[aeiou]/.test(word[word.length - 3])) {
    // consonant+le counts as syllable
  } else {
    word = word.replace(/e$/, '');
  }

  const vowelGroups = word.match(/[aeiouy]+/g);
  const count = vowelGroups ? vowelGroups.length : 1;
  return Math.max(1, count);
}

function tokenize(text) {
  return text
    .replace(/[^\w\s'-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0 && /[a-zA-Z]/.test(w));
}

function countSentences(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  return Math.max(1, sentences.length);
}

// --- Readability Formulas ---

export function fleschKincaid(text) {
  const words = tokenize(text);
  const wordCount = words.length;
  if (wordCount === 0) return { gradeLevel: 0, readingEase: 0, words: 0, sentences: 0, syllables: 0 };

  const sentenceCount = countSentences(text);
  const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0);

  const avgSentenceLength = wordCount / sentenceCount;
  const avgSyllablesPerWord = totalSyllables / wordCount;

  // Flesch-Kincaid Grade Level
  const gradeLevel = 0.39 * avgSentenceLength + 11.8 * avgSyllablesPerWord - 15.59;

  // Flesch Reading Ease
  const readingEase = 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;

  return {
    gradeLevel: Math.round(gradeLevel * 100) / 100,
    readingEase: Math.round(Math.max(0, Math.min(100, readingEase)) * 100) / 100,
    interpretation: interpretReadingEase(readingEase),
    words: wordCount,
    sentences: sentenceCount,
    syllables: totalSyllables,
    avgSentenceLength: Math.round(avgSentenceLength * 100) / 100,
    avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 100) / 100,
  };
}

function interpretReadingEase(score) {
  if (score >= 90) return 'Very Easy (5th grade)';
  if (score >= 80) return 'Easy (6th grade)';
  if (score >= 70) return 'Fairly Easy (7th grade)';
  if (score >= 60) return 'Standard (8th-9th grade)';
  if (score >= 50) return 'Fairly Difficult (10th-12th grade)';
  if (score >= 30) return 'Difficult (college)';
  return 'Very Difficult (professional)';
}

export function gunningFog(text) {
  const words = tokenize(text);
  const wordCount = words.length;
  if (wordCount === 0) return { index: 0, words: 0, sentences: 0, complexWords: 0 };

  const sentenceCount = countSentences(text);
  const complexWords = words.filter(w => countSyllables(w) >= 3).length;

  const index = 0.4 * (wordCount / sentenceCount + 100 * complexWords / wordCount);

  return {
    index: Math.round(index * 100) / 100,
    interpretation: `Grade level ~${Math.round(index)}`,
    words: wordCount,
    sentences: sentenceCount,
    complexWords,
    percentComplex: Math.round(complexWords / wordCount * 10000) / 100,
  };
}

export function colemanLiau(text) {
  const words = tokenize(text);
  const wordCount = words.length;
  if (wordCount === 0) return { index: 0, words: 0, sentences: 0, characters: 0 };

  const sentenceCount = countSentences(text);
  const charCount = words.reduce((sum, w) => sum + w.replace(/[^a-zA-Z]/g, '').length, 0);

  const L = (charCount / wordCount) * 100; // avg letters per 100 words
  const S = (sentenceCount / wordCount) * 100; // avg sentences per 100 words

  const index = 0.0588 * L - 0.296 * S - 15.8;

  return {
    index: Math.round(index * 100) / 100,
    interpretation: `Grade level ~${Math.round(Math.max(1, index))}`,
    words: wordCount,
    sentences: sentenceCount,
    characters: charCount,
  };
}

export function ari(text) {
  const words = tokenize(text);
  const wordCount = words.length;
  if (wordCount === 0) return { index: 0, words: 0, sentences: 0, characters: 0 };

  const sentenceCount = countSentences(text);
  const charCount = words.reduce((sum, w) => sum + w.replace(/[^a-zA-Z0-9]/g, '').length, 0);

  const index = 4.71 * (charCount / wordCount) + 0.5 * (wordCount / sentenceCount) - 21.43;

  return {
    index: Math.round(index * 100) / 100,
    interpretation: `Grade level ~${Math.round(Math.max(1, index))}`,
    words: wordCount,
    sentences: sentenceCount,
    characters: charCount,
  };
}

export function smog(text) {
  const words = tokenize(text);
  const wordCount = words.length;
  if (wordCount === 0) return { index: 0, words: 0, sentences: 0, polysyllabicWords: 0 };

  const sentenceCount = countSentences(text);
  const polysyllabic = words.filter(w => countSyllables(w) >= 3).length;

  // SMOG needs at least 30 sentences for accuracy, but we compute anyway
  const index = 1.0430 * Math.sqrt(polysyllabic * (30 / sentenceCount)) + 3.1291;

  return {
    index: Math.round(index * 100) / 100,
    interpretation: `Grade level ~${Math.round(index)}`,
    words: wordCount,
    sentences: sentenceCount,
    polysyllabicWords: polysyllabic,
    note: sentenceCount < 30 ? 'SMOG is most accurate with 30+ sentences' : undefined,
  };
}

export function allReadability(text) {
  const fk = fleschKincaid(text);
  const gf = gunningFog(text);
  const cl = colemanLiau(text);
  const ariResult = ari(text);
  const smogResult = smog(text);

  const grades = [fk.gradeLevel, gf.index, cl.index, ariResult.index, smogResult.index];
  const avg = grades.reduce((a, b) => a + b, 0) / grades.length;

  return {
    fleschKincaid: fk,
    gunningFog: gf,
    colemanLiau: cl,
    automatedReadabilityIndex: ariResult,
    smog: smogResult,
    consensus: {
      averageGradeLevel: Math.round(avg * 100) / 100,
      readingEase: fk.readingEase,
      interpretation: fk.interpretation,
    },
  };
}

// --- Text Statistics ---

export function textStatistics(text) {
  const words = tokenize(text);
  const wordCount = words.length;
  if (wordCount === 0) {
    return {
      characters: 0, words: 0, sentences: 0, paragraphs: 0,
      avgWordLength: 0, avgSentenceLength: 0,
      vocabularyRichness: 0, uniqueWords: 0,
      longestWord: '', shortestWord: '',
      readingTimeSeconds: 0, speakingTimeSeconds: 0,
    };
  }

  const sentenceCount = countSentences(text);
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
  const lowerWords = words.map(w => w.toLowerCase());
  const uniqueWords = new Set(lowerWords);

  const wordLengths = words.map(w => w.replace(/[^a-zA-Z]/g, '').length);
  const avgWordLength = wordLengths.reduce((a, b) => a + b, 0) / wordCount;

  // Word frequency
  const freq = {};
  for (const w of lowerWords) {
    freq[w] = (freq[w] || 0) + 1;
  }
  const topWords = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count, percentage: Math.round(count / wordCount * 10000) / 100 }));

  // Type-Token Ratio (vocabulary richness)
  const ttr = uniqueWords.size / wordCount;

  const sorted = [...words].sort((a, b) => b.length - a.length);

  return {
    characters: text.length,
    charactersNoSpaces: text.replace(/\s/g, '').length,
    words: wordCount,
    uniqueWords: uniqueWords.size,
    sentences: sentenceCount,
    paragraphs: Math.max(1, paragraphs),
    avgWordLength: Math.round(avgWordLength * 100) / 100,
    avgSentenceLength: Math.round(wordCount / sentenceCount * 100) / 100,
    vocabularyRichness: Math.round(ttr * 1000) / 1000, // Type-Token Ratio
    longestWord: sorted[0] || '',
    shortestWord: sorted[sorted.length - 1] || '',
    readingTimeSeconds: Math.ceil((wordCount / 238) * 60),
    speakingTimeSeconds: Math.ceil((wordCount / 150) * 60),
    topWords,
  };
}

// --- Keyword Extraction (TF-based) ---

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
  'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'could', 'should', 'may', 'might', 'can', 'shall', 'must',
  'it', 'its', 'this', 'that', 'these', 'those', 'i', 'you', 'he',
  'she', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your',
  'his', 'our', 'their', 'not', 'no', 'nor', 'so', 'if', 'then',
  'than', 'too', 'very', 'just', 'about', 'up', 'out', 'all', 'also',
  'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some',
  'such', 'only', 'own', 'same', 'into', 'over', 'after', 'before',
  'between', 'through', 'during', 'above', 'below', 'which', 'what',
  'who', 'whom', 'when', 'where', 'why', 'how', 'there', 'here',
  'while', 'because', 'although', 'though', 'since', 'until', 'unless',
  'whether', 'while', 'however', 'therefore', 'thus', 'hence', 'yet',
  'still', 'already', 'even', 'much', 'many', 'well', 'back', 'like',
  'get', 'got', 'make', 'made', 'take', 'took', 'go', 'went', 'come',
  'came', 'say', 'said', 'know', 'knew', 'think', 'thought', 'see',
  'saw', 'want', 'give', 'use', 'find', 'tell', 'new', 'first', 'last',
]);

export function extractKeywords(text, opts = {}) {
  const maxKeywords = opts.maxKeywords || 10;
  const minWordLength = opts.minWordLength || 3;
  const includeScores = opts.includeScores !== false;

  const words = tokenize(text).map(w => w.toLowerCase());
  const wordCount = words.length;
  if (wordCount === 0) return { keywords: [], wordCount: 0 };

  // Term frequency
  const tf = {};
  for (const w of words) {
    if (w.length < minWordLength || STOP_WORDS.has(w)) continue;
    tf[w] = (tf[w] || 0) + 1;
  }

  // Score = TF normalized
  const scored = Object.entries(tf)
    .map(([word, count]) => ({
      word,
      count,
      score: Math.round(count / wordCount * 10000) / 100,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, maxKeywords);

  return {
    keywords: includeScores ? scored : scored.map(s => s.word),
    wordCount,
    analyzedWords: Object.keys(tf).length,
  };
}

// --- Simple Sentiment Analysis (lexicon-based) ---

const POSITIVE_WORDS = new Set([
  'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'perfect',
  'beautiful', 'love', 'loved', 'happy', 'joy', 'awesome', 'best', 'better',
  'brilliant', 'outstanding', 'superb', 'impressive', 'remarkable', 'exceptional',
  'delightful', 'pleasant', 'enjoyable', 'exciting', 'thrilling', 'magnificent',
  'marvelous', 'terrific', 'fabulous', 'splendid', 'glorious', 'graceful',
  'elegant', 'charming', 'lovely', 'nice', 'fine', 'decent', 'solid', 'strong',
  'positive', 'fortunate', 'lucky', 'grateful', 'thankful', 'pleased', 'satisfied',
  'glad', 'cheerful', 'optimistic', 'hopeful', 'confident', 'proud', 'successful',
  'win', 'winning', 'victory', 'triumph', 'achieve', 'accomplish', 'improve',
  'recommend', 'praise', 'celebrate', 'incredible', 'extraordinary', 'phenomenal',
]);

const NEGATIVE_WORDS = new Set([
  'bad', 'terrible', 'horrible', 'awful', 'poor', 'worst', 'worse', 'ugly',
  'hate', 'hated', 'angry', 'sad', 'disappointed', 'disappointing', 'frustrating',
  'annoying', 'boring', 'dull', 'stupid', 'useless', 'worthless', 'pathetic',
  'miserable', 'dreadful', 'atrocious', 'abysmal', 'appalling', 'disgusting',
  'revolting', 'offensive', 'unpleasant', 'painful', 'difficult', 'impossible',
  'wrong', 'broken', 'failed', 'failure', 'problem', 'issue', 'bug', 'error',
  'crash', 'slow', 'expensive', 'overpriced', 'cheap', 'waste', 'regret',
  'negative', 'unfortunate', 'unlucky', 'tragic', 'disaster', 'catastrophe',
  'loss', 'lose', 'losing', 'defeat', 'destroy', 'damage', 'harm', 'hurt',
  'suffer', 'struggle', 'reject', 'deny', 'refuse', 'complain', 'criticize',
  'fear', 'worried', 'anxious', 'stressed', 'depressed', 'lonely', 'confused',
]);

const NEGATORS = new Set(['not', "n't", 'no', 'never', 'neither', 'nor', 'hardly', 'barely', 'scarcely']);
const INTENSIFIERS = new Set(['very', 'really', 'extremely', 'incredibly', 'absolutely', 'totally', 'completely', 'utterly', 'highly']);

export function sentimentAnalysis(text) {
  const words = tokenize(text).map(w => w.toLowerCase());
  const wordCount = words.length;
  if (wordCount === 0) return { score: 0, label: 'neutral', positive: 0, negative: 0, words: 0 };

  let positiveCount = 0;
  let negativeCount = 0;
  const positiveWords = [];
  const negativeWords = [];

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const prevWord = i > 0 ? words[i - 1] : '';
    const isNegated = NEGATORS.has(prevWord) || (prevWord.endsWith("n't"));
    const isIntensified = INTENSIFIERS.has(prevWord);
    const multiplier = isIntensified ? 1.5 : 1;

    if (POSITIVE_WORDS.has(w)) {
      if (isNegated) {
        negativeCount += multiplier;
        negativeWords.push(isNegated ? `not ${w}` : w);
      } else {
        positiveCount += multiplier;
        positiveWords.push(isIntensified ? `${prevWord} ${w}` : w);
      }
    } else if (NEGATIVE_WORDS.has(w)) {
      if (isNegated) {
        positiveCount += multiplier * 0.5; // negated negative is weakly positive
        positiveWords.push(`not ${w}`);
      } else {
        negativeCount += multiplier;
        negativeWords.push(isIntensified ? `${prevWord} ${w}` : w);
      }
    }
  }

  const total = positiveCount + negativeCount;
  const score = total > 0 ? Math.round((positiveCount - negativeCount) / total * 1000) / 1000 : 0;

  let label = 'neutral';
  if (score > 0.2) label = 'positive';
  else if (score > 0.05) label = 'slightly positive';
  else if (score < -0.2) label = 'negative';
  else if (score < -0.05) label = 'slightly negative';

  return {
    score, // -1 to 1
    label,
    confidence: total > 0 ? Math.round(Math.min(total / wordCount * 5, 1) * 100) / 100 : 0,
    positive: Math.round(positiveCount * 100) / 100,
    negative: Math.round(negativeCount * 100) / 100,
    words: wordCount,
    positiveWords: [...new Set(positiveWords)].slice(0, 10),
    negativeWords: [...new Set(negativeWords)].slice(0, 10),
  };
}
