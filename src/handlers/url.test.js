import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseURL, buildURL, normalizeURL, extractDomain, compareURLs } from './url.js';

describe('parseURL', () => {
  it('parses a full URL', () => {
    const r = parseURL('https://example.com:8080/path/to/page?q=hello&lang=en#section');
    assert.equal(r.protocol, 'https');
    assert.equal(r.hostname, 'example.com');
    assert.equal(r.port, '8080');
    assert.equal(r.pathname, '/path/to/page');
    assert.equal(r.hash, '#section');
    assert.equal(r.queryParams.q, 'hello');
    assert.equal(r.queryParams.lang, 'en');
    assert.equal(r.queryCount, 2);
    assert.deepEqual(r.pathSegments, ['path', 'to', 'page']);
  });

  it('parses simple URL with defaults', () => {
    const r = parseURL('https://example.com');
    assert.equal(r.protocol, 'https');
    assert.equal(r.port, '443');
    assert.equal(r.pathname, '/');
    assert.equal(r.queryCount, 0);
  });

  it('handles duplicate query params', () => {
    const r = parseURL('https://example.com?tag=a&tag=b&tag=c');
    assert.deepEqual(r.queryParams.tag, ['a', 'b', 'c']);
  });

  it('parses URL with auth', () => {
    const r = parseURL('https://user:pass@example.com/path');
    assert.equal(r.username, 'user');
    assert.equal(r.password, 'pass');
  });

  it('throws on invalid URL', () => {
    assert.throws(() => parseURL('not-a-url'), /Invalid URL/);
  });

  it('throws on empty', () => {
    assert.throws(() => parseURL(''), /required/);
  });
});

describe('buildURL', () => {
  it('builds a simple URL', () => {
    const r = buildURL({ hostname: 'example.com', pathname: '/api/v1' });
    assert.equal(r.url, 'https://example.com/api/v1');
  });

  it('builds URL with query params', () => {
    const r = buildURL({ hostname: 'example.com', query: { q: 'hello', page: '1' } });
    assert.ok(r.url.includes('q=hello'));
    assert.ok(r.url.includes('page=1'));
  });

  it('builds URL with auth', () => {
    const r = buildURL({ hostname: 'example.com', username: 'user', password: 'pass' });
    assert.ok(r.url.includes('user:pass@'));
  });

  it('builds URL with custom port', () => {
    const r = buildURL({ protocol: 'http', hostname: 'localhost', port: '3000', pathname: '/api' });
    assert.ok(r.url.includes(':3000'));
  });

  it('throws without hostname', () => {
    assert.throws(() => buildURL({ pathname: '/test' }), /hostname/);
  });
});

describe('normalizeURL', () => {
  it('lowercases hostname', () => {
    const r = normalizeURL('https://EXAMPLE.COM/path');
    assert.ok(r.normalized.includes('example.com'));
  });

  it('removes trailing slash', () => {
    const r = normalizeURL('https://example.com/path/');
    assert.equal(r.normalized, 'https://example.com/path');
  });

  it('keeps root slash', () => {
    const r = normalizeURL('https://example.com/');
    assert.equal(r.normalized, 'https://example.com/');
  });

  it('sorts query params', () => {
    const r = normalizeURL('https://example.com?z=1&a=2&m=3');
    assert.ok(r.normalized.indexOf('a=2') < r.normalized.indexOf('m=3'));
    assert.ok(r.normalized.indexOf('m=3') < r.normalized.indexOf('z=1'));
  });

  it('removes www when requested', () => {
    const r = normalizeURL('https://www.example.com/page', { removeWWW: true });
    assert.ok(!r.normalized.includes('www.'));
  });

  it('removes fragment when requested', () => {
    const r = normalizeURL('https://example.com/page#section', { removeFragment: true });
    assert.ok(!r.normalized.includes('#'));
  });

  it('reports changes', () => {
    const r = normalizeURL('https://EXAMPLE.COM/path/');
    assert.equal(r.changes, true);
  });

  it('reports no changes for already normalized', () => {
    const r = normalizeURL('https://example.com/path');
    assert.equal(r.changes, false);
  });

  it('throws on invalid URL', () => {
    assert.throws(() => normalizeURL('not-a-url'), /Invalid/);
  });
});

describe('extractDomain', () => {
  it('extracts simple domain', () => {
    const r = extractDomain('https://www.example.com/path');
    assert.equal(r.hostname, 'www.example.com');
    assert.equal(r.domain, 'example');
    assert.equal(r.tld, 'com');
    assert.equal(r.subdomain, 'www');
    assert.equal(r.registeredDomain, 'example.com');
  });

  it('extracts domain without subdomain', () => {
    const r = extractDomain('https://example.com');
    assert.equal(r.domain, 'example');
    assert.equal(r.subdomain, null);
  });

  it('handles multi-part TLD', () => {
    const r = extractDomain('https://shop.example.co.uk/page');
    assert.equal(r.tld, 'co.uk');
    assert.equal(r.domain, 'example');
    assert.equal(r.subdomain, 'shop');
    assert.equal(r.registeredDomain, 'example.co.uk');
  });

  it('handles bare hostname', () => {
    const r = extractDomain('example.com');
    assert.equal(r.domain, 'example');
    assert.equal(r.tld, 'com');
  });

  it('detects IP address', () => {
    const r = extractDomain('http://192.168.1.1:8080/api');
    assert.equal(r.isIP, true);
    assert.equal(r.registeredDomain, null);
  });

  it('detects localhost', () => {
    const r = extractDomain('http://localhost:3000');
    assert.equal(r.isLocalhost, true);
  });

  it('throws on empty', () => {
    assert.throws(() => extractDomain(''), /required/);
  });
});

describe('compareURLs', () => {
  it('detects identical URLs', () => {
    const r = compareURLs('https://example.com/path', 'https://example.com/path');
    assert.equal(r.identical, true);
    assert.equal(r.sameOrigin, true);
  });

  it('detects protocol difference', () => {
    const r = compareURLs('http://example.com', 'https://example.com');
    assert.equal(r.identical, false);
    assert.ok(r.differences.some(d => d.field === 'protocol'));
  });

  it('detects path difference', () => {
    const r = compareURLs('https://example.com/a', 'https://example.com/b');
    assert.equal(r.sameOrigin, true);
    assert.equal(r.samePath, false);
  });

  it('detects query difference', () => {
    const r = compareURLs('https://example.com?a=1', 'https://example.com?a=2');
    assert.ok(r.differences.some(d => d.field === 'query'));
  });

  it('detects same origin different path', () => {
    const r = compareURLs('https://example.com/api/v1', 'https://example.com/api/v2');
    assert.equal(r.sameOrigin, true);
    assert.equal(r.samePath, false);
  });

  it('throws on missing URLs', () => {
    assert.throws(() => compareURLs('', 'https://example.com'), /required/);
  });
});
