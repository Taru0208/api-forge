// IP & Network utility endpoints

export function ipInfo(request) {
  // Extract IP from Cloudflare headers
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Real-IP') || 'unknown';
  const country = request.headers.get('CF-IPCountry') || 'unknown';
  const city = request.headers.get('CF-City') || undefined;
  const region = request.headers.get('CF-Region') || undefined;
  const timezone = request.headers.get('CF-Timezone') || undefined;
  const asn = request.headers.get('CF-ASN') || undefined;

  const result = { ip, country };
  if (city) result.city = city;
  if (region) result.region = region;
  if (timezone) result.timezone = timezone;
  if (asn) result.asn = asn;
  return result;
}

export function ipValidate(ip) {
  if (!ip) throw new Error('ip is required');

  const v4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.test(ip) &&
    ip.split('.').every(n => parseInt(n) >= 0 && parseInt(n) <= 255);

  const v6 = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/.test(ip) ||
    /^::([0-9a-fA-F]{1,4}:){0,5}[0-9a-fA-F]{0,4}$/.test(ip) ||
    /^([0-9a-fA-F]{1,4}:){1,6}:$/.test(ip);

  let version = null;
  if (v4) version = 4;
  else if (v6) version = 6;

  let isPrivate = false;
  if (v4) {
    const parts = ip.split('.').map(Number);
    isPrivate = parts[0] === 10 ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168) ||
      (parts[0] === 127);
  }

  return { ip, valid: v4 || v6, version, isPrivate };
}

export function cidrContains(cidr, ip) {
  if (!cidr) throw new Error('cidr is required');
  if (!ip) throw new Error('ip is required');

  const [network, bits] = cidr.split('/');
  if (!bits) throw new Error('Invalid CIDR notation (expected format: x.x.x.x/y)');

  const mask = parseInt(bits);
  if (mask < 0 || mask > 32) throw new Error('CIDR mask must be 0-32');

  const toNum = (addr) => {
    const p = addr.split('.').map(Number);
    if (p.length !== 4 || p.some(n => isNaN(n) || n < 0 || n > 255)) {
      throw new Error(`Invalid IPv4 address: ${addr}`);
    }
    return ((p[0] << 24) | (p[1] << 16) | (p[2] << 8) | p[3]) >>> 0;
  };

  const netNum = toNum(network);
  const ipNum = toNum(ip);
  const maskBits = mask === 0 ? 0 : (~0 << (32 - mask)) >>> 0;

  return {
    cidr,
    ip,
    contains: (netNum & maskBits) === (ipNum & maskBits),
    networkAddress: [(netNum & maskBits) >>> 24, ((netNum & maskBits) >> 16) & 255, ((netNum & maskBits) >> 8) & 255, (netNum & maskBits) & 255].join('.'),
    broadcastAddress: [((netNum & maskBits) | ~maskBits) >>> 24 & 255, ((netNum & maskBits) | ~maskBits) >> 16 & 255, ((netNum & maskBits) | ~maskBits) >> 8 & 255, ((netNum & maskBits) | ~maskBits) & 255].join('.'),
    totalHosts: Math.pow(2, 32 - mask),
  };
}

export function subnetCalc(cidr) {
  if (!cidr) throw new Error('cidr is required');

  const [network, bits] = cidr.split('/');
  if (!bits) throw new Error('Invalid CIDR notation');

  const mask = parseInt(bits);
  if (mask < 0 || mask > 32) throw new Error('CIDR mask must be 0-32');

  const toNum = (addr) => {
    const p = addr.split('.').map(Number);
    if (p.length !== 4 || p.some(n => isNaN(n) || n < 0 || n > 255)) {
      throw new Error(`Invalid IPv4 address: ${addr}`);
    }
    return ((p[0] << 24) | (p[1] << 16) | (p[2] << 8) | p[3]) >>> 0;
  };

  const toStr = (num) => [num >>> 24, (num >> 16) & 255, (num >> 8) & 255, num & 255].join('.');

  const netNum = toNum(network);
  const maskBits = mask === 0 ? 0 : (~0 << (32 - mask)) >>> 0;
  const networkAddr = netNum & maskBits;
  const broadcastAddr = (networkAddr | ~maskBits) >>> 0;
  const totalHosts = Math.pow(2, 32 - mask);
  const usableHosts = mask >= 31 ? totalHosts : totalHosts - 2;

  return {
    cidr,
    networkAddress: toStr(networkAddr),
    broadcastAddress: toStr(broadcastAddr),
    subnetMask: toStr(maskBits),
    totalHosts,
    usableHosts: Math.max(0, usableHosts),
    firstUsable: mask >= 31 ? toStr(networkAddr) : toStr(networkAddr + 1),
    lastUsable: mask >= 31 ? toStr(broadcastAddr) : toStr(broadcastAddr - 1),
    prefixLength: mask,
  };
}
