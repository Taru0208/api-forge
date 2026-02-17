// JSON to XML and XML to JSON conversion — zero dependencies

export function jsonToXML(data, options = {}) {
  const rootName = options.rootName || 'root';
  const indent = options.indent !== false;
  const declaration = options.declaration !== false;
  const itemName = options.itemName || 'item';

  let xml = '';
  if (declaration) xml += '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += toXMLNode(rootName, data, indent ? 0 : -1, itemName);
  return xml;
}

function toXMLNode(name, value, depth, itemName) {
  const pad = depth >= 0 ? '  '.repeat(depth) : '';
  const nl = depth >= 0 ? '\n' : '';
  const childDepth = depth >= 0 ? depth + 1 : -1;

  if (value === null || value === undefined) {
    return `${pad}<${escXMLTag(name)}/>` + nl;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return `${pad}<${escXMLTag(name)}/>` + nl;
    return value.map(item => toXMLNode(itemName, item, depth, itemName)).join('');
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) return `${pad}<${escXMLTag(name)}/>` + nl;

    let inner = '';
    for (const [key, val] of entries) {
      if (Array.isArray(val)) {
        // Wrap array in parent element
        if (val.length === 0) {
          inner += toXMLNode(key, null, childDepth, itemName);
        } else {
          const childPad = childDepth >= 0 ? '  '.repeat(childDepth) : '';
          const grandChildDepth = childDepth >= 0 ? childDepth + 1 : -1;
          inner += `${childPad}<${escXMLTag(key)}>${nl}`;
          for (const item of val) {
            inner += toXMLNode(itemName, item, grandChildDepth, itemName);
          }
          inner += `${childPad}</${escXMLTag(key)}>${nl}`;
        }
      } else {
        inner += toXMLNode(key, val, childDepth, itemName);
      }
    }

    return `${pad}<${escXMLTag(name)}>${nl}${inner}${pad}</${escXMLTag(name)}>${nl}`;
  }

  // Primitives
  const text = escXMLText(String(value));
  return `${pad}<${escXMLTag(name)}>${text}</${escXMLTag(name)}>${nl}`;
}

export function xmlToJSON(xml, options = {}) {
  const trimText = options.trim !== false;
  const alwaysArray = options.alwaysArray || [];

  // Strip XML declaration
  let str = xml.trim().replace(/<\?xml[^?]*\?>\s*/i, '');
  // Strip comments
  str = str.replace(/<!--[\s\S]*?-->/g, '');
  const result = parseElement(str, 0, trimText, alwaysArray);
  if (!result) throw new Error('Invalid XML: no root element found');
  return { [result.name]: result.value };
}

function parseElement(str, pos, trimText, alwaysArray) {
  // Skip whitespace
  while (pos < str.length && /\s/.test(str[pos])) pos++;
  if (pos >= str.length || str[pos] !== '<') return null;

  // Find tag name
  const tagStart = pos;
  pos++; // skip <

  // Read tag name
  let tagName = '';
  while (pos < str.length && !/[\s/>]/.test(str[pos])) {
    tagName += str[pos++];
  }
  if (!tagName) return null;

  // Read attributes
  const attrs = {};
  while (pos < str.length) {
    while (pos < str.length && /\s/.test(str[pos])) pos++;
    if (str[pos] === '/' && str[pos + 1] === '>') {
      pos += 2;
      const value = Object.keys(attrs).length > 0 ? { ...attrs } : '';
      return { name: tagName, value, end: pos };
    }
    if (str[pos] === '>') {
      pos++;
      break;
    }
    // Read attribute name
    let attrName = '';
    while (pos < str.length && !/[\s=/>]/.test(str[pos])) attrName += str[pos++];
    while (pos < str.length && /\s/.test(str[pos])) pos++;
    if (str[pos] === '=') {
      pos++;
      while (pos < str.length && /\s/.test(str[pos])) pos++;
      const quote = str[pos];
      if (quote === '"' || quote === "'") {
        pos++;
        let attrVal = '';
        while (pos < str.length && str[pos] !== quote) attrVal += str[pos++];
        pos++;
        attrs['@' + attrName] = attrVal;
      }
    }
  }

  // Parse children
  const children = {};
  let textContent = '';
  let hasChildElements = false;

  while (pos < str.length) {
    // Check for closing tag
    if (str[pos] === '<' && str[pos + 1] === '/') {
      // Find end of closing tag
      const closeEnd = str.indexOf('>', pos + 2);
      if (closeEnd === -1) break;
      pos = closeEnd + 1;

      // Build result
      if (!hasChildElements) {
        const text = trimText ? textContent.trim() : textContent;
        const parsed = parseValue(text);
        if (Object.keys(attrs).length > 0) {
          return { name: tagName, value: { ...attrs, '#text': parsed }, end: pos };
        }
        return { name: tagName, value: parsed, end: pos };
      }

      // Merge attrs into children
      const result = { ...attrs, ...children };
      // Apply alwaysArray
      for (const key of alwaysArray) {
        if (key in result && !Array.isArray(result[key])) {
          result[key] = [result[key]];
        }
      }
      return { name: tagName, value: result, end: pos };
    }

    // Handle CDATA sections
    if (str.startsWith('<![CDATA[', pos)) {
      const cdataEnd = str.indexOf(']]>', pos + 9);
      if (cdataEnd !== -1) {
        textContent += str.slice(pos + 9, cdataEnd);
        pos = cdataEnd + 3;
        continue;
      }
    }

    if (str[pos] === '<') {
      const child = parseElement(str, pos, trimText, alwaysArray);
      if (!child) { pos++; continue; }
      hasChildElements = true;
      pos = child.end;

      // Merge child into children object
      if (child.name in children) {
        if (!Array.isArray(children[child.name])) {
          children[child.name] = [children[child.name]];
        }
        children[child.name].push(child.value);
      } else {
        children[child.name] = child.value;
      }
    } else {
      textContent += str[pos++];
    }
  }

  return null;
}

function parseValue(text) {
  if (text === '') return '';
  if (text === 'true') return true;
  if (text === 'false') return false;
  if (text === 'null') return null;
  const num = Number(text);
  if (!isNaN(num) && text.trim() !== '') return num;
  return text;
}

export function validateXML(xml) {
  try {
    xmlToJSON(xml);
    return { valid: true };
  } catch (e) {
    return { valid: false, error: e.message };
  }
}

export function formatXML(xml, indentSize = 2) {
  // Strip declaration, then re-parse and format
  let str = xml.trim().replace(/<\?xml[^?]*\?>\s*/i, '');
  str = str.replace(/<!--[\s\S]*?-->/g, '');

  // Simple formatter: split by tags, re-indent
  const tokens = str.replace(/>\s*</g, '><').split(/(<[^>]+>)/g).filter(Boolean);
  let indent = 0;
  const sp = ' '.repeat(indentSize);
  const lines = [];
  let declaration = '';

  if (/^\s*<\?xml/.test(xml)) {
    const match = xml.match(/<\?xml[^?]*\?>/);
    if (match) declaration = match[0];
  }

  for (const token of tokens) {
    if (token.startsWith('</')) {
      indent--;
      lines.push(sp.repeat(Math.max(0, indent)) + token);
    } else if (token.startsWith('<') && token.endsWith('/>')) {
      lines.push(sp.repeat(indent) + token);
    } else if (token.startsWith('<')) {
      lines.push(sp.repeat(indent) + token);
      indent++;
    } else {
      // Text content — append to last line
      if (lines.length > 0) {
        lines[lines.length - 1] += token;
        // Don't increase indent for text
      } else {
        lines.push(token);
      }
    }
  }

  // Fix text nodes: merge lines where text is between open and close tags on adjacent lines
  const result = [];
  for (let i = 0; i < lines.length; i++) {
    if (i + 1 < lines.length && !lines[i + 1].trimStart().startsWith('<')) {
      result.push(lines[i] + lines[i + 1].trim());
      i++;
    } else {
      result.push(lines[i]);
    }
  }

  let formatted = result.join('\n');
  if (declaration) formatted = declaration + '\n' + formatted;
  return formatted;
}

function escXMLTag(name) {
  return name.replace(/[^a-zA-Z0-9_\-.]/g, '_');
}

function escXMLText(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
