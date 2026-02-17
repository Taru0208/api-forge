// Markdown processing utilities

/**
 * Convert HTML to Markdown.
 * Handles: headings, paragraphs, bold/italic/code, links, images,
 * lists (ul/ol), blockquotes, code blocks, hr, br, tables.
 * Strips unknown tags.
 */
export function htmlToMarkdown(html) {
  if (!html || typeof html !== 'string') return '';

  let md = html;

  // Normalize line endings
  md = md.replace(/\r\n/g, '\n');

  // Pre-process: extract <pre><code> blocks to protect them
  const codeBlocks = [];
  md = md.replace(/<pre>\s*<code(?:\s+class="([^"]*)")?>([\s\S]*?)<\/code>\s*<\/pre>/gi, (_, lang, code) => {
    const langTag = lang || '';
    const decoded = decodeHTMLEntities(code.trim());
    const placeholder = `%%CODEBLOCK_${codeBlocks.length}%%`;
    codeBlocks.push(`\`\`\`${langTag}\n${decoded}\n\`\`\``);
    return placeholder;
  });

  // Also handle standalone <pre> without <code>
  md = md.replace(/<pre>([\s\S]*?)<\/pre>/gi, (_, code) => {
    const decoded = decodeHTMLEntities(code.trim());
    const placeholder = `%%CODEBLOCK_${codeBlocks.length}%%`;
    codeBlocks.push(`\`\`\`\n${decoded}\n\`\`\``);
    return placeholder;
  });

  // Tables
  md = md.replace(/<table>([\s\S]*?)<\/table>/gi, (_, tableContent) => {
    const rows = [];
    const rowRegex = /<tr>([\s\S]*?)<\/tr>/gi;
    let rowMatch;
    while ((rowMatch = rowRegex.exec(tableContent)) !== null) {
      const cells = [];
      const cellRegex = /<(?:td|th)(?:\s[^>]*)?>([^<]*)<\/(?:td|th)>/gi;
      let cellMatch;
      while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
        cells.push(cellMatch[1].trim());
      }
      rows.push(cells);
    }
    if (rows.length === 0) return '';

    const colCount = Math.max(...rows.map(r => r.length));
    const lines = [];
    for (let i = 0; i < rows.length; i++) {
      // Pad row to colCount
      while (rows[i].length < colCount) rows[i].push('');
      lines.push('| ' + rows[i].join(' | ') + ' |');
      if (i === 0) {
        lines.push('| ' + rows[i].map(() => '---').join(' | ') + ' |');
      }
    }
    return '\n' + lines.join('\n') + '\n';
  });

  // Headings
  md = md.replace(/<h([1-6])(?:\s[^>]*)?>(.+?)<\/h[1-6]>/gi, (_, level, text) => {
    return '\n' + '#'.repeat(Number(level)) + ' ' + stripTags(text).trim() + '\n';
  });

  // Blockquotes
  md = md.replace(/<blockquote(?:\s[^>]*)?>([^]*?)<\/blockquote>/gi, (_, content) => {
    const lines = stripTags(content).trim().split('\n');
    return '\n' + lines.map(l => '> ' + l.trim()).join('\n') + '\n';
  });

  // Ordered lists
  md = md.replace(/<ol(?:\s[^>]*)?>([\s\S]*?)<\/ol>/gi, (_, content) => {
    let idx = 0;
    const items = content.replace(/<li(?:\s[^>]*)?>([^]*?)<\/li>/gi, (_, text) => {
      idx++;
      return `${idx}. ${stripTags(text).trim()}`;
    });
    return '\n' + stripTags(items).trim() + '\n';
  });

  // Unordered lists
  md = md.replace(/<ul(?:\s[^>]*)?>([\s\S]*?)<\/ul>/gi, (_, content) => {
    const items = content.replace(/<li(?:\s[^>]*)?>([^]*?)<\/li>/gi, (_, text) => {
      return `- ${stripTags(text).trim()}`;
    });
    return '\n' + stripTags(items).trim() + '\n';
  });

  // Images (before links so ![alt](src) isn't caught by link regex)
  md = md.replace(/<img\s[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, '![$2]($1)');
  md = md.replace(/<img\s[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*\/?>/gi, '![$1]($2)');
  md = md.replace(/<img\s[^>]*src="([^"]*)"[^>]*\/?>/gi, '![]($1)');

  // Links
  md = md.replace(/<a\s[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');

  // Bold
  md = md.replace(/<(?:strong|b)(?:\s[^>]*)?>(.+?)<\/(?:strong|b)>/gi, '**$1**');

  // Italic
  md = md.replace(/<(?:em|i)(?:\s[^>]*)?>(.+?)<\/(?:em|i)>/gi, '*$1*');

  // Inline code
  md = md.replace(/<code(?:\s[^>]*)?>(.+?)<\/code>/gi, '`$1`');

  // Horizontal rule
  md = md.replace(/<hr\s*\/?>/gi, '\n---\n');

  // Line break
  md = md.replace(/<br\s*\/?>/gi, '\n');

  // Paragraphs
  md = md.replace(/<p(?:\s[^>]*)?>([^]*?)<\/p>/gi, (_, content) => '\n' + content.trim() + '\n');

  // Strip any remaining tags
  md = stripTags(md);

  // Restore code blocks
  for (let i = 0; i < codeBlocks.length; i++) {
    md = md.replace(`%%CODEBLOCK_${i}%%`, codeBlocks[i]);
  }

  // Decode HTML entities
  md = decodeHTMLEntities(md);

  // Clean up excessive newlines
  md = md.replace(/\n{3,}/g, '\n\n');

  return md.trim();
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, '');
}

function decodeHTMLEntities(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

/**
 * Extract all headings from markdown with level, text, and slug.
 */
export function extractHeadings(markdown) {
  if (!markdown || typeof markdown !== 'string') return [];

  const headings = [];
  const lines = markdown.split('\n');

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const slug = slugify(text);
      headings.push({ level, text, slug });
    }
  }

  return headings;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Generate a table of contents as nested structure from headings.
 */
export function extractTOC(markdown) {
  const headings = extractHeadings(markdown);
  if (headings.length === 0) return [];

  const root = [];
  const stack = [{ children: root, level: 0 }];

  for (const h of headings) {
    const node = { level: h.level, text: h.text, slug: h.slug, children: [] };

    // Pop back to the right parent level
    while (stack.length > 1 && stack[stack.length - 1].level >= h.level) {
      stack.pop();
    }

    stack[stack.length - 1].children.push(node);
    stack.push(node);
  }

  return root;
}

/**
 * Remove all markdown formatting, return plain text.
 */
export function stripMarkdown(markdown) {
  if (!markdown || typeof markdown !== 'string') return '';

  let text = markdown;

  // Remove code blocks (before inline code)
  text = text.replace(/```[\s\S]*?```/g, '');

  // Remove inline code
  text = text.replace(/`([^`]+)`/g, '$1');

  // Remove images (before links)
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');

  // Remove links, keep text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Remove headings markers
  text = text.replace(/^#{1,6}\s+/gm, '');

  // Remove bold/italic markers
  text = text.replace(/\*\*\*(.+?)\*\*\*/g, '$1');
  text = text.replace(/\*\*(.+?)\*\*/g, '$1');
  text = text.replace(/\*(.+?)\*/g, '$1');
  text = text.replace(/___(.+?)___/g, '$1');
  text = text.replace(/__(.+?)__/g, '$1');
  text = text.replace(/_(.+?)_/g, '$1');

  // Remove blockquote markers
  text = text.replace(/^>\s+/gm, '');

  // Remove horizontal rules
  text = text.replace(/^---+$/gm, '');
  text = text.replace(/^\*\*\*+$/gm, '');

  // Remove list markers
  text = text.replace(/^\s*[-*+]\s+/gm, '');
  text = text.replace(/^\s*\d+\.\s+/gm, '');

  // Remove strikethrough
  text = text.replace(/~~(.+?)~~/g, '$1');

  // Clean up whitespace
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}

/**
 * Return stats about a markdown document.
 */
export function markdownStats(markdown) {
  if (!markdown || typeof markdown !== 'string') {
    return { wordCount: 0, headingCount: 0, linkCount: 0, imageCount: 0, codeBlockCount: 0, listCount: 0, paragraphCount: 0 };
  }

  // Word count (from stripped text)
  const plainText = stripMarkdown(markdown);
  const words = plainText.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;

  // Heading count
  const headingCount = (markdown.match(/^#{1,6}\s+.+$/gm) || []).length;

  // Link count (exclude images)
  const linkCount = (markdown.match(/(?<!!)\[([^\]]+)\]\([^)]+\)/g) || []).length;

  // Image count
  const imageCount = (markdown.match(/!\[([^\]]*)\]\([^)]+\)/g) || []).length;

  // Code block count
  const codeBlockCount = (markdown.match(/```/g) || []).length / 2 | 0;

  // List item count (count individual list items)
  const ulItems = (markdown.match(/^\s*[-*+]\s+.+$/gm) || []).length;
  const olItems = (markdown.match(/^\s*\d+\.\s+.+$/gm) || []).length;
  const listCount = ulItems + olItems;

  // Paragraph count (non-empty text blocks separated by blank lines, excluding headings/lists/code/blockquotes)
  const stripped = markdown
    .replace(/```[\s\S]*?```/g, '')  // remove code blocks
    .replace(/^#{1,6}\s+.+$/gm, '') // remove headings
    .replace(/^>\s+.+$/gm, '')      // remove blockquotes
    .replace(/^\s*[-*+]\s+.+$/gm, '') // remove ul items
    .replace(/^\s*\d+\.\s+.+$/gm, ''); // remove ol items
  const paragraphs = stripped.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const paragraphCount = paragraphs.length;

  return { wordCount, headingCount, linkCount, imageCount, codeBlockCount, listCount, paragraphCount };
}

/**
 * Extract all links with text and url.
 */
export function extractLinks(markdown) {
  if (!markdown || typeof markdown !== 'string') return [];

  const links = [];
  // Match [text](url) but not ![alt](src)
  const regex = /(?<!!)\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    links.push({ text: match[1], url: match[2] });
  }
  return links;
}

/**
 * Extract all images with alt and src.
 */
export function extractImages(markdown) {
  if (!markdown || typeof markdown !== 'string') return [];

  const images = [];
  const regex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    images.push({ alt: match[1], src: match[2] });
  }
  return images;
}
