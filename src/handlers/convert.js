// Unit conversion utilities

const conversions = {
  // Length (base: meters)
  length: {
    mm: 0.001, cm: 0.01, m: 1, km: 1000,
    in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344,
    nm: 1852, // nautical mile
  },
  // Weight (base: grams)
  weight: {
    mg: 0.001, g: 1, kg: 1000, t: 1000000, // metric ton
    oz: 28.3495, lb: 453.592, st: 6350.29, // stone
  },
  // Temperature (special handling)
  temperature: { C: true, F: true, K: true },
  // Speed (base: m/s)
  speed: {
    'km/h': 1 / 3.6, 'm/s': 1, 'mph': 0.44704, 'ft/s': 0.3048, knot: 0.514444,
  },
  // Data (base: bytes)
  data: {
    b: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776,
    Kb: 128, Mb: 131072, Gb: 134217728, // bits
  },
  // Area (base: sq meters)
  area: {
    'mm²': 0.000001, 'cm²': 0.0001, 'm²': 1, 'km²': 1000000,
    'in²': 0.00064516, 'ft²': 0.092903, 'yd²': 0.836127,
    acre: 4046.86, ha: 10000,
  },
  // Volume (base: liters)
  volume: {
    ml: 0.001, l: 1, 'gal(US)': 3.78541, 'gal(UK)': 4.54609,
    'fl oz': 0.0295735, cup: 0.236588, pt: 0.473176, qt: 0.946353,
  },
  // Time (base: seconds)
  time: {
    ms: 0.001, s: 1, min: 60, h: 3600, d: 86400, wk: 604800, yr: 31557600,
  },
};

function convertTemperature(value, from, to) {
  // Normalize to Celsius first
  let celsius;
  switch (from) {
    case 'C': celsius = value; break;
    case 'F': celsius = (value - 32) * 5 / 9; break;
    case 'K': celsius = value - 273.15; break;
    default: throw new Error(`Unknown temperature unit: ${from}`);
  }
  // Convert from Celsius to target
  switch (to) {
    case 'C': return parseFloat(celsius.toFixed(4));
    case 'F': return parseFloat((celsius * 9 / 5 + 32).toFixed(4));
    case 'K': return parseFloat((celsius + 273.15).toFixed(4));
    default: throw new Error(`Unknown temperature unit: ${to}`);
  }
}

export function convert(value, from, to, category) {
  // Auto-detect category if not provided
  if (!category) {
    for (const [cat, units] of Object.entries(conversions)) {
      if (from in units && to in units) {
        category = cat;
        break;
      }
    }
    if (!category) throw new Error(`Cannot find matching category for units: ${from} → ${to}`);
  }

  if (category === 'temperature') {
    return convertTemperature(value, from, to);
  }

  const units = conversions[category];
  if (!units) throw new Error(`Unknown category: ${category}`);
  if (!(from in units)) throw new Error(`Unknown unit '${from}' in category '${category}'`);
  if (!(to in units)) throw new Error(`Unknown unit '${to}' in category '${category}'`);

  const baseValue = value * units[from];
  const result = baseValue / units[to];
  return parseFloat(result.toFixed(8));
}

export function listUnits(category) {
  if (category) {
    const units = conversions[category];
    if (!units) throw new Error(`Unknown category: ${category}`);
    return Object.keys(units);
  }
  const result = {};
  for (const [cat, units] of Object.entries(conversions)) {
    result[cat] = Object.keys(units);
  }
  return result;
}
