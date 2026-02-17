/**
 * URL parsing, building, normalization, and analysis utilities.
 * Uses the WHATWG URL API (available in Workers and Node.js).
 */

/**
 * Parse a URL into its components.
 */
export function parseURL(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') {
    throw new Error('url is required');
  }

  let url;
  try {
    url = new URL(urlStr);
  } catch {
    throw new Error('Invalid URL');
  }

  const queryParams = {};
  for (const [key, value] of url.searchParams) {
    if (queryParams[key]) {
      if (Array.isArray(queryParams[key])) {
        queryParams[key].push(value);
      } else {
        queryParams[key] = [queryParams[key], value];
      }
    } else {
      queryParams[key] = value;
    }
  }

  return {
    href: url.href,
    protocol: url.protocol.replace(':', ''),
    host: url.host,
    hostname: url.hostname,
    port: url.port || defaultPort(url.protocol),
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
    origin: url.origin,
    username: url.username || null,
    password: url.password || null,
    queryParams,
    queryCount: url.searchParams.size || [...url.searchParams].length,
    pathSegments: url.pathname.split('/').filter(Boolean),
  };
}

function defaultPort(protocol) {
  const map = { 'http:': '80', 'https:': '443', 'ftp:': '21' };
  return map[protocol] || '';
}

/**
 * Build a URL from components.
 */
export function buildURL(components) {
  if (!components) throw new Error('components object is required');

  const { protocol = 'https', hostname, port, pathname = '/', query = {}, hash = '', username, password } = components;

  if (!hostname) throw new Error('hostname is required');

  let urlStr = `${protocol}://`;

  if (username) {
    urlStr += encodeURIComponent(username);
    if (password) urlStr += `:${encodeURIComponent(password)}`;
    urlStr += '@';
  }

  urlStr += hostname;
  if (port && port !== defaultPort(protocol + ':')) {
    urlStr += `:${port}`;
  }

  urlStr += pathname.startsWith('/') ? pathname : `/${pathname}`;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      for (const v of value) params.append(key, v);
    } else {
      params.append(key, String(value));
    }
  }
  const qs = params.toString();
  if (qs) urlStr += `?${qs}`;

  if (hash) urlStr += hash.startsWith('#') ? hash : `#${hash}`;

  // Validate the constructed URL
  try {
    const url = new URL(urlStr);
    return { url: url.href };
  } catch {
    throw new Error('Could not construct a valid URL from components');
  }
}

/**
 * Normalize a URL — lowercase host, sort query params, remove defaults.
 */
export function normalizeURL(urlStr, options = {}) {
  if (!urlStr || typeof urlStr !== 'string') {
    throw new Error('url is required');
  }

  let url;
  try {
    url = new URL(urlStr);
  } catch {
    throw new Error('Invalid URL');
  }

  const {
    sortQuery = true,
    removeTrailingSlash = true,
    removeDefaultPort = true,
    removeFragment = false,
    lowercasePath = false,
    removeWWW = false,
  } = options;

  // Lowercase host (always)
  let normalized = `${url.protocol}//`;

  let hostname = url.hostname.toLowerCase();
  if (removeWWW && hostname.startsWith('www.')) {
    hostname = hostname.slice(4);
  }
  normalized += hostname;

  // Port
  if (url.port && !(removeDefaultPort && isDefaultPort(url.protocol, url.port))) {
    normalized += `:${url.port}`;
  }

  // Path
  let path = url.pathname;
  if (lowercasePath) path = path.toLowerCase();
  if (removeTrailingSlash && path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1);
  }
  normalized += path;

  // Query
  if (url.search) {
    const params = new URLSearchParams(url.search);
    if (sortQuery) {
      params.sort();
    }
    const qs = params.toString();
    if (qs) normalized += `?${qs}`;
  }

  // Fragment
  if (!removeFragment && url.hash) {
    normalized += url.hash;
  }

  return { original: urlStr, normalized, changes: urlStr !== normalized };
}

function isDefaultPort(protocol, port) {
  return (protocol === 'http:' && port === '80') ||
         (protocol === 'https:' && port === '443') ||
         (protocol === 'ftp:' && port === '21');
}

/**
 * Extract domain info from URL.
 */
export function extractDomain(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') {
    throw new Error('url is required');
  }

  let url;
  try {
    url = new URL(urlStr.includes('://') ? urlStr : `https://${urlStr}`);
  } catch {
    throw new Error('Invalid URL');
  }

  const hostname = url.hostname;
  const parts = hostname.split('.');

  // Simple TLD detection (covers most cases)
  let domain, subdomain, tld;

  // Handle known multi-part TLDs
  const multiPartTLDs = ['co.uk', 'co.jp', 'co.kr', 'com.au', 'com.br', 'co.in', 'org.uk', 'net.au', 'ac.uk', 'gov.uk'];
  const lastTwo = parts.slice(-2).join('.');

  if (multiPartTLDs.includes(lastTwo) && parts.length >= 3) {
    tld = lastTwo;
    domain = parts[parts.length - 3];
    subdomain = parts.length > 3 ? parts.slice(0, -3).join('.') : null;
  } else {
    tld = parts[parts.length - 1];
    domain = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
    subdomain = parts.length > 2 ? parts.slice(0, -2).join('.') : null;
  }

  const registeredDomain = `${domain}.${tld}`;
  const isIP = /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) || hostname.includes(':');

  return {
    hostname,
    domain,
    tld,
    subdomain,
    registeredDomain: isIP ? null : registeredDomain,
    isIP,
    isLocalhost: hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1',
  };
}

/**
 * Compare two URLs and identify differences.
 */
export function compareURLs(url1Str, url2Str) {
  if (!url1Str || !url2Str) throw new Error('Two URLs are required');

  const u1 = parseURL(url1Str);
  const u2 = parseURL(url2Str);

  const differences = [];

  if (u1.protocol !== u2.protocol) differences.push({ field: 'protocol', url1: u1.protocol, url2: u2.protocol });
  if (u1.hostname !== u2.hostname) differences.push({ field: 'hostname', url1: u1.hostname, url2: u2.hostname });
  if (u1.port !== u2.port) differences.push({ field: 'port', url1: u1.port, url2: u2.port });
  if (u1.pathname !== u2.pathname) differences.push({ field: 'pathname', url1: u1.pathname, url2: u2.pathname });
  if (u1.search !== u2.search) differences.push({ field: 'query', url1: u1.search, url2: u2.search });
  if (u1.hash !== u2.hash) differences.push({ field: 'hash', url1: u1.hash, url2: u2.hash });

  return {
    identical: differences.length === 0,
    sameOrigin: u1.origin === u2.origin,
    samePath: u1.origin === u2.origin && u1.pathname === u2.pathname,
    differences,
  };
}
