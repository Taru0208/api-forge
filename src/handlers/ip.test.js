import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ipInfo, ipValidate, cidrContains, subnetCalc } from './ip.js';

describe('ipInfo()', () => {
  it('extracts IP and country from headers', () => {
    const req = {
      headers: new Map([
        ['CF-Connecting-IP', '1.2.3.4'],
        ['CF-IPCountry', 'US'],
      ]),
    };
    req.headers.get = (k) => req.headers.has(k) ? req.headers.get(k) : null;
    // Need proper Map.get
    const headers = new Map([
      ['CF-Connecting-IP', '1.2.3.4'],
      ['CF-IPCountry', 'US'],
    ]);
    const result = ipInfo({ headers });
    assert.equal(result.ip, '1.2.3.4');
    assert.equal(result.country, 'US');
  });

  it('returns unknown for missing headers', () => {
    const headers = new Map();
    const result = ipInfo({ headers });
    assert.equal(result.ip, 'unknown');
    assert.equal(result.country, 'unknown');
  });
});

describe('ipValidate()', () => {
  it('validates IPv4', () => {
    const result = ipValidate('192.168.1.1');
    assert.equal(result.valid, true);
    assert.equal(result.version, 4);
    assert.equal(result.isPrivate, true);
  });

  it('detects public IPv4', () => {
    const result = ipValidate('8.8.8.8');
    assert.equal(result.valid, true);
    assert.equal(result.isPrivate, false);
  });

  it('validates loopback', () => {
    const result = ipValidate('127.0.0.1');
    assert.equal(result.valid, true);
    assert.equal(result.isPrivate, true);
  });

  it('rejects invalid IPv4', () => {
    assert.equal(ipValidate('999.999.999.999').valid, false);
  });

  it('rejects non-IP strings', () => {
    assert.equal(ipValidate('not-an-ip').valid, false);
  });

  it('throws on missing input', () => {
    assert.throws(() => ipValidate(), /required/);
  });

  it('detects 172.16.x private range', () => {
    assert.equal(ipValidate('172.16.0.1').isPrivate, true);
    assert.equal(ipValidate('172.32.0.1').isPrivate, false);
  });
});

describe('cidrContains()', () => {
  it('detects IP in range', () => {
    const result = cidrContains('192.168.1.0/24', '192.168.1.100');
    assert.equal(result.contains, true);
  });

  it('detects IP outside range', () => {
    const result = cidrContains('192.168.1.0/24', '192.168.2.1');
    assert.equal(result.contains, false);
  });

  it('handles /32 single host', () => {
    const result = cidrContains('10.0.0.5/32', '10.0.0.5');
    assert.equal(result.contains, true);
    assert.equal(result.totalHosts, 1);
  });

  it('throws on missing cidr', () => {
    assert.throws(() => cidrContains(undefined, '1.2.3.4'), /required/);
  });

  it('throws on missing ip', () => {
    assert.throws(() => cidrContains('10.0.0.0/8'), /required/);
  });

  it('throws on invalid CIDR notation', () => {
    assert.throws(() => cidrContains('10.0.0.0', '10.0.0.1'), /CIDR/);
  });
});

describe('subnetCalc()', () => {
  it('calculates /24 subnet', () => {
    const result = subnetCalc('192.168.1.0/24');
    assert.equal(result.networkAddress, '192.168.1.0');
    assert.equal(result.broadcastAddress, '192.168.1.255');
    assert.equal(result.subnetMask, '255.255.255.0');
    assert.equal(result.totalHosts, 256);
    assert.equal(result.usableHosts, 254);
    assert.equal(result.firstUsable, '192.168.1.1');
    assert.equal(result.lastUsable, '192.168.1.254');
  });

  it('calculates /16 subnet', () => {
    const result = subnetCalc('10.0.0.0/16');
    assert.equal(result.subnetMask, '255.255.0.0');
    assert.equal(result.totalHosts, 65536);
    assert.equal(result.usableHosts, 65534);
  });

  it('calculates /32 host', () => {
    const result = subnetCalc('10.0.0.1/32');
    assert.equal(result.totalHosts, 1);
    assert.equal(result.usableHosts, 1);
  });

  it('throws on missing input', () => {
    assert.throws(() => subnetCalc(), /required/);
  });

  it('throws on invalid mask', () => {
    assert.throws(() => subnetCalc('10.0.0.0/33'), /mask/);
  });
});
