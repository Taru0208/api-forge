import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  htmlToMarkdown,
  extractHeadings,
  extractTOC,
  stripMarkdown,
  markdownStats,
  extractLinks,
  extractImages
} from './markdown.js';

// --- htmlToMarkdown ---

describe('htmlToMarkdown', () => {
  it('converts headings h1-h6', () => {
    assert.equal(htmlToMarkdown('<h1>Title</h1>'), '# Title');
    assert.equal(htmlToMarkdown('<h3>Sub</h3>'), '### Sub');
    assert.equal(htmlToMarkdown('<h6>Deep</h6>'), '###### Deep');
  });

  it('converts paragraphs', () => {
    assert.equal(htmlToMarkdown('<p>Hello world</p>'), 'Hello world');
  });

  it('converts bold and italic', () => {
    assert.ok(htmlToMarkdown('<strong>bold</strong>').includes('**bold**'));
    assert.ok(htmlToMarkdown('<em>italic</em>').includes('*italic*'));
    assert.ok(htmlToMarkdown('<b>bold</b>').includes('**bold**'));
    assert.ok(htmlToMarkdown('<i>italic</i>').includes('*italic*'));
  });

  it('converts inline code', () => {
    assert.ok(htmlToMarkdown('<code>x = 1</code>').includes('`x = 1`'));
  });

  it('converts links', () => {
    const result = htmlToMarkdown('<a href="https://example.com">Example</a>');
    assert.ok(result.includes('[Example](https://example.com)'));
  });

  it('converts images', () => {
    const result = htmlToMarkdown('<img src="pic.png" alt="Photo">');
    assert.ok(result.includes('![Photo](pic.png)'));
  });

  it('converts unordered lists', () => {
    const result = htmlToMarkdown('<ul><li>One</li><li>Two</li></ul>');
    assert.ok(result.includes('- One'));
    assert.ok(result.includes('- Two'));
  });

  it('converts ordered lists', () => {
    const result = htmlToMarkdown('<ol><li>First</li><li>Second</li></ol>');
    assert.ok(result.includes('1. First'));
    assert.ok(result.includes('2. Second'));
  });

  it('converts blockquotes', () => {
    const result = htmlToMarkdown('<blockquote>Quote text</blockquote>');
    assert.ok(result.includes('> Quote text'));
  });

  it('converts code blocks with language', () => {
    const result = htmlToMarkdown('<pre><code class="javascript">const x = 1;</code></pre>');
    assert.ok(result.includes('```javascript'));
    assert.ok(result.includes('const x = 1;'));
    assert.ok(result.includes('```'));
  });

  it('converts code blocks without language', () => {
    const result = htmlToMarkdown('<pre><code>plain code</code></pre>');
    assert.ok(result.includes('```'));
    assert.ok(result.includes('plain code'));
  });

  it('converts horizontal rules', () => {
    assert.ok(htmlToMarkdown('<hr>').includes('---'));
    assert.ok(htmlToMarkdown('<hr/>').includes('---'));
  });

  it('converts line breaks', () => {
    const result = htmlToMarkdown('line1<br>line2');
    assert.ok(result.includes('line1\nline2'));
  });

  it('converts tables', () => {
    const html = '<table><tr><th>Name</th><th>Age</th></tr><tr><td>Alice</td><td>30</td></tr></table>';
    const result = htmlToMarkdown(html);
    assert.ok(result.includes('| Name | Age |'));
    assert.ok(result.includes('| --- | --- |'));
    assert.ok(result.includes('| Alice | 30 |'));
  });

  it('strips unknown tags', () => {
    const result = htmlToMarkdown('<div><span>text</span></div>');
    assert.equal(result, 'text');
  });

  it('handles empty input', () => {
    assert.equal(htmlToMarkdown(''), '');
    assert.equal(htmlToMarkdown(null), '');
    assert.equal(htmlToMarkdown(undefined), '');
  });

  it('decodes HTML entities', () => {
    const result = htmlToMarkdown('<p>&amp; &lt; &gt; &quot;</p>');
    assert.ok(result.includes('& < > "'));
  });

  it('handles nested inline formatting', () => {
    const result = htmlToMarkdown('<p><strong>bold and <em>italic</em></strong></p>');
    assert.ok(result.includes('**bold and *italic***'));
  });
});

// --- extractHeadings ---

describe('extractHeadings', () => {
  it('extracts headings with level, text, slug', () => {
    const md = '# Title\n\nSome text\n\n## Section One\n\n### Sub Section';
    const headings = extractHeadings(md);
    assert.equal(headings.length, 3);
    assert.deepEqual(headings[0], { level: 1, text: 'Title', slug: 'title' });
    assert.deepEqual(headings[1], { level: 2, text: 'Section One', slug: 'section-one' });
    assert.deepEqual(headings[2], { level: 3, text: 'Sub Section', slug: 'sub-section' });
  });

  it('generates slugs from special characters', () => {
    const headings = extractHeadings('## Hello, World! (2024)');
    assert.equal(headings[0].slug, 'hello-world-2024');
  });

  it('returns empty array for no headings', () => {
    assert.deepEqual(extractHeadings('Just text, no headings.'), []);
  });

  it('returns empty for null/undefined', () => {
    assert.deepEqual(extractHeadings(null), []);
    assert.deepEqual(extractHeadings(''), []);
  });

  it('handles all 6 heading levels', () => {
    const md = '# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6';
    const headings = extractHeadings(md);
    assert.equal(headings.length, 6);
    assert.equal(headings[5].level, 6);
  });
});

// --- extractTOC ---

describe('extractTOC', () => {
  it('builds nested TOC structure', () => {
    const md = '# Root\n## Child 1\n### Grandchild\n## Child 2';
    const toc = extractTOC(md);
    assert.equal(toc.length, 1);
    assert.equal(toc[0].text, 'Root');
    assert.equal(toc[0].children.length, 2);
    assert.equal(toc[0].children[0].text, 'Child 1');
    assert.equal(toc[0].children[0].children.length, 1);
    assert.equal(toc[0].children[0].children[0].text, 'Grandchild');
    assert.equal(toc[0].children[1].text, 'Child 2');
  });

  it('handles flat headings at same level', () => {
    const md = '## A\n## B\n## C';
    const toc = extractTOC(md);
    assert.equal(toc.length, 3);
  });

  it('returns empty array for empty input', () => {
    assert.deepEqual(extractTOC(''), []);
  });
});

// --- stripMarkdown ---

describe('stripMarkdown', () => {
  it('removes heading markers', () => {
    assert.equal(stripMarkdown('# Hello'), 'Hello');
    assert.equal(stripMarkdown('### Deep'), 'Deep');
  });

  it('removes bold and italic', () => {
    assert.equal(stripMarkdown('**bold** and *italic*'), 'bold and italic');
  });

  it('removes links but keeps text', () => {
    assert.equal(stripMarkdown('[click here](http://example.com)'), 'click here');
  });

  it('removes images but keeps alt text', () => {
    assert.equal(stripMarkdown('![photo](img.png)'), 'photo');
  });

  it('removes inline code backticks', () => {
    assert.equal(stripMarkdown('use `console.log`'), 'use console.log');
  });

  it('removes code blocks entirely', () => {
    const result = stripMarkdown('before\n```js\ncode\n```\nafter');
    assert.ok(!result.includes('code'));
    assert.ok(result.includes('before'));
    assert.ok(result.includes('after'));
  });

  it('removes blockquote markers', () => {
    assert.ok(stripMarkdown('> quoted text').includes('quoted text'));
    assert.ok(!stripMarkdown('> quoted text').includes('>'));
  });

  it('removes list markers', () => {
    const result = stripMarkdown('- item 1\n- item 2');
    assert.ok(result.includes('item 1'));
    assert.ok(!result.startsWith('-'));
  });

  it('handles empty input', () => {
    assert.equal(stripMarkdown(''), '');
    assert.equal(stripMarkdown(null), '');
  });

  it('removes strikethrough', () => {
    assert.equal(stripMarkdown('~~deleted~~'), 'deleted');
  });
});

// --- markdownStats ---

describe('markdownStats', () => {
  it('counts all stats correctly', () => {
    const md = `# Title

This is a paragraph with some words.

## Section

- item 1
- item 2

Another paragraph with [a link](http://example.com) and ![img](pic.png).

\`\`\`js
const x = 1;
\`\`\``;
    const stats = markdownStats(md);
    assert.equal(stats.headingCount, 2);
    assert.equal(stats.linkCount, 1);
    assert.equal(stats.imageCount, 1);
    assert.equal(stats.codeBlockCount, 1);
    assert.equal(stats.listCount, 2);
    assert.ok(stats.wordCount > 0);
    assert.ok(stats.paragraphCount >= 1);
  });

  it('returns zeros for empty input', () => {
    const stats = markdownStats('');
    assert.equal(stats.wordCount, 0);
    assert.equal(stats.headingCount, 0);
    assert.equal(stats.linkCount, 0);
  });

  it('does not count images as links', () => {
    const stats = markdownStats('![alt](img.png) and [text](url.com)');
    assert.equal(stats.linkCount, 1);
    assert.equal(stats.imageCount, 1);
  });
});

// --- extractLinks ---

describe('extractLinks', () => {
  it('extracts links with text and url', () => {
    const links = extractLinks('Check [Google](https://google.com) and [GitHub](https://github.com).');
    assert.equal(links.length, 2);
    assert.deepEqual(links[0], { text: 'Google', url: 'https://google.com' });
    assert.deepEqual(links[1], { text: 'GitHub', url: 'https://github.com' });
  });

  it('does not extract images as links', () => {
    const links = extractLinks('![alt](img.png) and [link](url.com)');
    assert.equal(links.length, 1);
    assert.equal(links[0].text, 'link');
  });

  it('returns empty for no links', () => {
    assert.deepEqual(extractLinks('No links here.'), []);
  });

  it('handles empty input', () => {
    assert.deepEqual(extractLinks(''), []);
    assert.deepEqual(extractLinks(null), []);
  });
});

// --- extractImages ---

describe('extractImages', () => {
  it('extracts images with alt and src', () => {
    const images = extractImages('![Photo](pic.jpg) and ![](logo.png)');
    assert.equal(images.length, 2);
    assert.deepEqual(images[0], { alt: 'Photo', src: 'pic.jpg' });
    assert.deepEqual(images[1], { alt: '', src: 'logo.png' });
  });

  it('returns empty for no images', () => {
    assert.deepEqual(extractImages('Just [a link](url.com).'), []);
  });

  it('handles empty input', () => {
    assert.deepEqual(extractImages(''), []);
    assert.deepEqual(extractImages(null), []);
  });
});
