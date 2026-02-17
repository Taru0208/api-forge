import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  nanoid, ulid, cuid, snowflakeId, parseSnowflake,
  objectId, parseObjectId, shortId, prefixedId, batchIds
} from './id.js';

describe('nanoid', () => {
  it('generates default length 21', () => {
    const id = nanoid();
    assert.equal(id.length, 21);
  });

  it('uses default alphabet (URL-safe)', () => {
    const id = nanoid(100);
    assert.match(id, /^[A-Za-z0-9_-]+$/);
  });

  it('respects custom size', () => {
    assert.equal(nanoid(8).length, 8);
    assert.equal(nanoid(64).length, 64);
  });

  it('respects custom alphabet', () => {
    const id = nanoid(50, '0123456789');
    assert.match(id, /^[0-9]+$/);
    assert.equal(id.length, 50);
  });

  it('generates size=1', () => {
    const id = nanoid(1);
    assert.equal(id.length, 1);
  });

  it('generates unique values (100 IDs)', () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) ids.add(nanoid());
    assert.equal(ids.size, 100);
  });

  it('rejects size < 1', () => {
    assert.throws(() => nanoid(0), /Size must be between/);
  });

  it('rejects size > 256', () => {
    assert.throws(() => nanoid(300), /Size must be between/);
  });

  it('rejects alphabet with fewer than 2 chars', () => {
    assert.throws(() => nanoid(10, 'a'), /Alphabet must have at least/);
  });
});

describe('ulid', () => {
  it('generates 26-character string', () => {
    const id = ulid();
    assert.equal(id.length, 26);
  });

  it('uses Crockford base32 characters', () => {
    const id = ulid();
    assert.match(id, /^[0-9A-HJKMNP-TV-Z]+$/);
  });

  it('is lexicographically sortable (timestamp portion)', () => {
    const id1 = ulid();
    // Small busy-wait to ensure different millisecond
    const start = Date.now();
    while (Date.now() === start) { /* spin */ }
    const id2 = ulid();
    // First 10 chars are timestamp — second should be >= first
    assert.ok(id2.substring(0, 10) >= id1.substring(0, 10),
      `Expected ${id2.substring(0, 10)} >= ${id1.substring(0, 10)}`);
  });

  it('generates unique values (100 IDs)', () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) ids.add(ulid());
    assert.equal(ids.size, 100);
  });
});

describe('cuid', () => {
  it('starts with letter c', () => {
    const id = cuid();
    assert.equal(id[0], 'c');
  });

  it('contains only lowercase alphanumeric chars', () => {
    const id = cuid();
    assert.match(id, /^c[a-z0-9]+$/);
  });

  it('has reasonable length (>= 20 chars)', () => {
    const id = cuid();
    assert.ok(id.length >= 20, `CUID too short: ${id.length}`);
  });

  it('generates unique values (100 IDs)', () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) ids.add(cuid());
    assert.equal(ids.size, 100);
  });

  it('increments counter portion', () => {
    const id1 = cuid();
    const id2 = cuid();
    assert.notEqual(id1, id2);
  });
});

describe('snowflakeId', () => {
  it('returns a numeric string', () => {
    const id = snowflakeId();
    assert.match(id, /^\d+$/);
  });

  it('generates positive value', () => {
    const id = snowflakeId();
    assert.ok(BigInt(id) > 0n);
  });

  it('encodes timestamp that can be extracted', () => {
    const before = Date.now();
    const id = snowflakeId();
    const after = Date.now();
    const parsed = parseSnowflake(id);
    assert.ok(parsed.timestamp >= before && parsed.timestamp <= after,
      `Timestamp ${parsed.timestamp} not in range [${before}, ${after}]`);
  });

  it('respects custom worker ID', () => {
    const id = snowflakeId({ workerId: 500 });
    const parsed = parseSnowflake(id);
    assert.equal(parsed.workerId, 500);
  });

  it('respects custom sequence', () => {
    const id = snowflakeId({ sequence: 42 });
    const parsed = parseSnowflake(id);
    assert.equal(parsed.sequence, 42);
  });

  it('rejects invalid worker ID', () => {
    assert.throws(() => snowflakeId({ workerId: 2000 }), /Worker ID/);
  });

  it('rejects invalid sequence', () => {
    assert.throws(() => snowflakeId({ sequence: 5000 }), /Sequence/);
  });

  it('generates unique values (100 IDs)', () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) ids.add(snowflakeId({ sequence: i }));
    assert.equal(ids.size, 100);
  });
});

describe('parseSnowflake', () => {
  it('round-trips correctly', () => {
    const id = snowflakeId({ workerId: 7, sequence: 99 });
    const parsed = parseSnowflake(id);
    assert.equal(parsed.workerId, 7);
    assert.equal(parsed.sequence, 99);
    assert.ok(typeof parsed.date === 'string');
  });

  it('respects custom epoch', () => {
    const epoch = 1609459200000; // 2021-01-01
    const id = snowflakeId({ epoch });
    const parsed = parseSnowflake(id, epoch);
    const now = Date.now();
    assert.ok(Math.abs(parsed.timestamp - now) < 1000);
  });
});

describe('objectId', () => {
  it('generates 24-character hex string', () => {
    const id = objectId();
    assert.equal(id.length, 24);
    assert.match(id, /^[0-9a-f]{24}$/);
  });

  it('encodes current timestamp in first 8 chars', () => {
    const before = Math.floor(Date.now() / 1000);
    const id = objectId();
    const after = Math.floor(Date.now() / 1000);
    const ts = parseInt(id.substring(0, 8), 16);
    assert.ok(ts >= before && ts <= after,
      `ObjectId timestamp ${ts} not in range [${before}, ${after}]`);
  });

  it('generates unique values (100 IDs)', () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) ids.add(objectId());
    assert.equal(ids.size, 100);
  });

  it('increments counter across calls', () => {
    const id1 = objectId();
    const id2 = objectId();
    // Last 6 chars are counter — second should be +1
    const c1 = parseInt(id1.substring(18), 16);
    const c2 = parseInt(id2.substring(18), 16);
    assert.equal(c2, c1 + 1);
  });
});

describe('parseObjectId', () => {
  it('extracts timestamp from ObjectId', () => {
    const id = objectId();
    const parsed = parseObjectId(id);
    const now = Math.floor(Date.now() / 1000);
    assert.ok(Math.abs(parsed.timestamp - now) <= 1);
    assert.ok(typeof parsed.date === 'string');
  });

  it('rejects invalid ObjectId', () => {
    assert.throws(() => parseObjectId('not-an-objectid'), /Invalid ObjectId/);
    assert.throws(() => parseObjectId('abc'), /Invalid ObjectId/);
  });
});

describe('shortId', () => {
  it('generates default length 8', () => {
    const id = shortId();
    assert.equal(id.length, 8);
  });

  it('uses base62 characters only', () => {
    const id = shortId(100);
    assert.match(id, /^[a-zA-Z0-9]+$/);
  });

  it('respects custom length', () => {
    assert.equal(shortId(1).length, 1);
    assert.equal(shortId(32).length, 32);
  });

  it('generates unique values (100 IDs)', () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) ids.add(shortId());
    assert.equal(ids.size, 100);
  });

  it('rejects invalid length', () => {
    assert.throws(() => shortId(0), /Length must be between/);
    assert.throws(() => shortId(200), /Length must be between/);
  });
});

describe('prefixedId', () => {
  it('generates ID with prefix and underscore', () => {
    const id = prefixedId('sk');
    assert.ok(id.startsWith('sk_'));
  });

  it('generates correct total length', () => {
    const id = prefixedId('cus', 24);
    assert.equal(id.length, 24);
  });

  it('random part is base62', () => {
    const id = prefixedId('test', 30);
    const random = id.split('_')[1];
    assert.match(random, /^[a-zA-Z0-9]+$/);
  });

  it('throws on empty prefix', () => {
    assert.throws(() => prefixedId(''), /Prefix is required/);
  });

  it('throws on invalid prefix (starts with number)', () => {
    assert.throws(() => prefixedId('123'), /Prefix must start with a letter/);
  });

  it('throws when length too small for prefix', () => {
    assert.throws(() => prefixedId('longprefix', 5), /Length must be greater than/);
  });

  it('generates unique values (100 IDs)', () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) ids.add(prefixedId('pk'));
    assert.equal(ids.size, 100);
  });
});

describe('batchIds', () => {
  it('generates default 10 IDs', () => {
    const ids = batchIds('uuid');
    assert.equal(ids.length, 10);
  });

  it('generates requested count', () => {
    const ids = batchIds('nanoid', 5);
    assert.equal(ids.length, 5);
  });

  it('generates valid UUIDs in batch', () => {
    const ids = batchIds('uuid', 3);
    for (const id of ids) {
      assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    }
  });

  it('passes options to nanoid', () => {
    const ids = batchIds('nanoid', 5, { size: 10, alphabet: '0123456789' });
    for (const id of ids) {
      assert.equal(id.length, 10);
      assert.match(id, /^[0-9]+$/);
    }
  });

  it('supports all types', () => {
    const types = ['uuid', 'nanoid', 'ulid', 'cuid', 'snowflake', 'objectid', 'short'];
    for (const type of types) {
      const ids = batchIds(type, 2);
      assert.equal(ids.length, 2, `Failed for type: ${type}`);
    }
  });

  it('supports prefixed type', () => {
    const ids = batchIds('prefixed', 3, { prefix: 'tok', length: 20 });
    for (const id of ids) {
      assert.ok(id.startsWith('tok_'));
      assert.equal(id.length, 20);
    }
  });

  it('rejects count > 100', () => {
    assert.throws(() => batchIds('uuid', 200), /Count must be between/);
  });

  it('rejects count < 1', () => {
    assert.throws(() => batchIds('uuid', 0), /Count must be between/);
  });

  it('rejects unknown type', () => {
    assert.throws(() => batchIds('unknown', 5), /Unknown type/);
  });

  it('all IDs in batch are unique', () => {
    const ids = batchIds('nanoid', 100);
    assert.equal(new Set(ids).size, 100);
  });
});
