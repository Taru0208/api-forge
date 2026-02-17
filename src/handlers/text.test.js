import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { slugify, wordCount, extractEmails, extractUrls, truncate, removeHtmlTags, textDiff } from './text.js';

describe('slugify', () => {
  it('converts basic text to slug', () => {
    assert.equal(slugify('Hello World'), 'hello-world');
  });
  it('handles special characters', () => {
    assert.equal(slugify('Héllo Wörld!'), 'hello-world');
  });
  it('handles multiple spaces', () => {
    assert.equal(slugify('  too   many   spaces  '), 'too-many-spaces');
  });
  it('supports custom separator', () => {
    assert.equal(slugify('Hello World', { separator: '_' }), 'hello_world');
  });
  it('preserves case when requested', () => {
    assert.equal(slugify('Hello World', { lowercase: false }), 'Hello-World');
  });
});

describe('wordCount', () => {
  it('counts words', () => {
    const r = wordCount('Hello world, this is a test.');
    assert.equal(r.words, 6);
    assert.equal(r.sentences, 1);
  });
  it('handles empty input', () => {
    const r = wordCount('');
    assert.equal(r.words, 0);
  });
  it('calculates reading time', () => {
    const text = new Array(238).fill('word').join(' ');
    const r = wordCount(text);
    assert.equal(r.readingTimeSeconds, 60);
  });
});

describe('extractEmails', () => {
  it('finds emails in text', () => {
    const emails = extractEmails('Contact us at hello@example.com or support@test.org');
    assert.deepEqual(emails, ['hello@example.com', 'support@test.org']);
  });
  it('deduplicates', () => {
    const emails = extractEmails('a@b.com and a@b.com again');
    assert.deepEqual(emails, ['a@b.com']);
  });
});

describe('extractUrls', () => {
  it('finds URLs', () => {
    const urls = extractUrls('Visit https://example.com and http://test.org/page');
    assert.deepEqual(urls, ['https://example.com', 'http://test.org/page']);
  });
});

describe('truncate', () => {
  it('truncates long text', () => {
    const r = truncate('This is a longer sentence that should be cut', 20);
    assert.ok(r.length <= 20);
    assert.ok(r.endsWith('...'));
  });
  it('returns short text unchanged', () => {
    assert.equal(truncate('short', 100), 'short');
  });
});

describe('removeHtmlTags', () => {
  it('strips tags', () => {
    assert.equal(removeHtmlTags('<p>Hello <b>world</b></p>'), 'Hello world');
  });
  it('removes scripts', () => {
    assert.equal(removeHtmlTags('<script>alert(1)</script>safe'), 'safe');
  });
  it('decodes entities', () => {
    assert.equal(removeHtmlTags('&amp; &lt; &gt;'), '& < >');
  });
});

describe('textDiff', () => {
  it('detects additions', () => {
    const r = textDiff('line1\nline2', 'line1\nline2\nline3');
    assert.equal(r.stats.added, 1);
    assert.equal(r.stats.removed, 0);
  });
  it('detects removals', () => {
    const r = textDiff('line1\nline2\nline3', 'line1\nline3');
    assert.equal(r.stats.removed, 1);
  });
  it('handles identical texts', () => {
    const r = textDiff('same\ntext', 'same\ntext');
    assert.equal(r.stats.added, 0);
    assert.equal(r.stats.removed, 0);
    assert.equal(r.stats.unchanged, 2);
  });
});
