// JSON utility functions

export function formatJSON(input, indent = 2) {
  const obj = typeof input === 'string' ? JSON.parse(input) : input;
  return JSON.stringify(obj, null, indent);
}

export function minifyJSON(input) {
  const obj = typeof input === 'string' ? JSON.parse(input) : input;
  return JSON.stringify(obj);
}

export function sortKeys(input, recursive = true) {
  const obj = typeof input === 'string' ? JSON.parse(input) : input;
  return sortObj(obj, recursive);
}

function sortObj(obj, recursive) {
  if (Array.isArray(obj)) {
    return recursive ? obj.map(item => sortObj(item, true)) : obj;
  }
  if (obj !== null && typeof obj === 'object') {
    const sorted = {};
    for (const key of Object.keys(obj).sort()) {
      sorted[key] = recursive ? sortObj(obj[key], true) : obj[key];
    }
    return sorted;
  }
  return obj;
}

export function queryJSON(input, path) {
  const obj = typeof input === 'string' ? JSON.parse(input) : input;
  const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean);
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }
  return current;
}

export function diffJSON(a, b) {
  const objA = typeof a === 'string' ? JSON.parse(a) : a;
  const objB = typeof b === 'string' ? JSON.parse(b) : b;
  return computeDiff(objA, objB, '');
}

function computeDiff(a, b, prefix) {
  const changes = [];
  const allKeys = new Set([
    ...(a && typeof a === 'object' ? Object.keys(a) : []),
    ...(b && typeof b === 'object' ? Object.keys(b) : []),
  ]);

  if (typeof a !== typeof b || Array.isArray(a) !== Array.isArray(b)) {
    changes.push({ path: prefix || '$', type: 'changed', from: a, to: b });
    return changes;
  }

  if (a !== null && typeof a === 'object') {
    for (const key of allKeys) {
      const p = prefix ? `${prefix}.${key}` : key;
      if (!(key in a)) {
        changes.push({ path: p, type: 'added', value: b[key] });
      } else if (!(key in b)) {
        changes.push({ path: p, type: 'removed', value: a[key] });
      } else if (typeof a[key] === 'object' && a[key] !== null && typeof b[key] === 'object' && b[key] !== null) {
        changes.push(...computeDiff(a[key], b[key], p));
      } else if (a[key] !== b[key]) {
        changes.push({ path: p, type: 'changed', from: a[key], to: b[key] });
      }
    }
  } else if (a !== b) {
    changes.push({ path: prefix || '$', type: 'changed', from: a, to: b });
  }

  return changes;
}

export function statsJSON(input) {
  const obj = typeof input === 'string' ? JSON.parse(input) : input;
  const stats = { keys: 0, depth: 0, arrays: 0, objects: 0, strings: 0, numbers: 0, booleans: 0, nulls: 0, size: 0 };
  stats.size = JSON.stringify(obj).length;
  walk(obj, 0, stats);
  return stats;
}

function walk(obj, depth, stats) {
  if (depth > stats.depth) stats.depth = depth;
  if (obj === null) { stats.nulls++; return; }
  if (Array.isArray(obj)) {
    stats.arrays++;
    for (const item of obj) walk(item, depth + 1, stats);
    return;
  }
  if (typeof obj === 'object') {
    stats.objects++;
    const keys = Object.keys(obj);
    stats.keys += keys.length;
    for (const key of keys) walk(obj[key], depth + 1, stats);
    return;
  }
  if (typeof obj === 'string') stats.strings++;
  else if (typeof obj === 'number') stats.numbers++;
  else if (typeof obj === 'boolean') stats.booleans++;
}
