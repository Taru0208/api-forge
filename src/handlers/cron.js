/**
 * Cron expression parser and utilities.
 * Supports standard 5-field cron (minute hour day month weekday)
 * and extended 6-field (second minute hour day month weekday).
 */

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const FIELD_RANGES = {
  minute:  { min: 0, max: 59 },
  hour:    { min: 0, max: 23 },
  day:     { min: 1, max: 31 },
  month:   { min: 1, max: 12 },
  weekday: { min: 0, max: 7 },  // 0 and 7 both = Sunday
};

const MONTH_NAMES = { jan:1, feb:2, mar:3, apr:4, may:5, jun:6, jul:7, aug:8, sep:9, oct:10, nov:11, dec:12 };
const DAY_NAMES = { sun:0, mon:1, tue:2, wed:3, thu:4, fri:5, sat:6 };

/**
 * Parse a single cron field into an array of values.
 */
function parseField(field, range) {
  const values = new Set();

  for (const part of field.split(',')) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    // Handle */n
    const stepMatch = trimmed.match(/^(\S+)\/(\d+)$/);
    let base = stepMatch ? stepMatch[1] : trimmed;
    const step = stepMatch ? parseInt(stepMatch[2], 10) : null;

    if (step !== null && (step <= 0 || isNaN(step))) {
      throw new Error(`Invalid step value in "${field}"`);
    }

    if (base === '*') {
      const start = range.min;
      const end = range.max;
      if (step) {
        for (let i = start; i <= end; i += step) values.add(i);
      } else {
        for (let i = start; i <= end; i++) values.add(i);
      }
    } else if (base.includes('-')) {
      const [startStr, endStr] = base.split('-');
      let start = parseName(startStr, range);
      let end = parseName(endStr, range);
      if (start > end) {
        // wrap around (e.g. FRI-MON)
        for (let i = start; i <= range.max; i += (step || 1)) values.add(i);
        for (let i = range.min; i <= end; i += (step || 1)) values.add(i);
      } else {
        for (let i = start; i <= end; i += (step || 1)) values.add(i);
      }
    } else {
      const val = parseName(base, range);
      if (step) {
        for (let i = val; i <= range.max; i += step) values.add(i);
      } else {
        values.add(val);
      }
    }
  }

  return [...values].sort((a, b) => a - b);
}

function parseName(str, range) {
  const lower = str.toLowerCase();
  if (MONTH_NAMES[lower] !== undefined) return MONTH_NAMES[lower];
  if (DAY_NAMES[lower] !== undefined) return DAY_NAMES[lower];
  const num = parseInt(str, 10);
  if (isNaN(num)) throw new Error(`Invalid value: "${str}"`);
  // Normalize weekday 7 → 0
  if (range.max === 7 && num === 7) return 0;
  if (num < range.min || num > range.max) {
    throw new Error(`Value ${num} out of range [${range.min}-${range.max}]`);
  }
  return num;
}

/**
 * Parse a cron expression into structured data.
 */
export function parseCron(expression) {
  if (!expression || typeof expression !== 'string') {
    throw new Error('expression is required');
  }

  const parts = expression.trim().split(/\s+/);
  if (parts.length < 5 || parts.length > 6) {
    throw new Error('Expected 5 or 6 fields (minute hour day month weekday, or second minute hour day month weekday)');
  }

  const hasSeconds = parts.length === 6;
  const fields = hasSeconds
    ? { second: parts[0], minute: parts[1], hour: parts[2], day: parts[3], month: parts[4], weekday: parts[5] }
    : { minute: parts[0], hour: parts[1], day: parts[2], month: parts[3], weekday: parts[4] };

  const parsed = {
    minutes: parseField(fields.minute, FIELD_RANGES.minute),
    hours: parseField(fields.hour, FIELD_RANGES.hour),
    days: parseField(fields.day, FIELD_RANGES.day),
    months: parseField(fields.month, FIELD_RANGES.month),
    weekdays: parseField(fields.weekday, FIELD_RANGES.weekday),
  };

  if (hasSeconds) {
    parsed.seconds = parseField(fields.second, { min: 0, max: 59 });
  }

  return {
    expression: expression.trim(),
    fields: hasSeconds ? 6 : 5,
    hasSeconds,
    parsed,
    description: describeCron(parsed, hasSeconds),
  };
}

/**
 * Convert parsed cron to human-readable description.
 */
function describeCron(parsed, hasSeconds) {
  const parts = [];

  // Seconds
  if (hasSeconds && parsed.seconds) {
    if (parsed.seconds.length === 60) {
      parts.push('Every second');
    } else if (parsed.seconds.length === 1 && parsed.seconds[0] === 0) {
      // default, don't mention
    } else {
      parts.push(`at second ${listValues(parsed.seconds)}`);
    }
  }

  // Minutes
  if (parsed.minutes.length === 60) {
    parts.push('every minute');
  } else if (parsed.minutes.length === 1 && parsed.minutes[0] === 0) {
    // at the top of the hour, implicit
  } else {
    // Check for step pattern
    const stepMinutes = detectStep(parsed.minutes, 0, 59);
    if (stepMinutes) {
      parts.push(`every ${stepMinutes} minutes`);
    } else {
      parts.push(`at minute ${listValues(parsed.minutes)}`);
    }
  }

  // Hours
  if (parsed.hours.length === 24) {
    // every hour — implicit if minutes specified
    if (parsed.minutes.length === 1) {
      parts.push('every hour');
    }
  } else if (parsed.hours.length === 1) {
    parts.push(`at ${formatHour(parsed.hours[0])}`);
  } else {
    const stepHours = detectStep(parsed.hours, 0, 23);
    if (stepHours) {
      parts.push(`every ${stepHours} hours`);
    } else {
      parts.push(`at ${parsed.hours.map(formatHour).join(', ')}`);
    }
  }

  // Days of month
  if (parsed.days.length < 31) {
    parts.push(`on day ${listValues(parsed.days)} of the month`);
  }

  // Months
  if (parsed.months.length < 12) {
    const monthNames = parsed.months.map(m => MONTHS[m]);
    parts.push(`in ${monthNames.join(', ')}`);
  }

  // Weekdays
  if (parsed.weekdays.length < 7) {
    const dayNames = parsed.weekdays.map(d => WEEKDAYS[d % 7]);
    parts.push(`on ${dayNames.join(', ')}`);
  }

  if (parts.length === 0) {
    return 'Every minute';
  }

  // Capitalize first letter
  let result = parts.join(', ');
  return result.charAt(0).toUpperCase() + result.slice(1);
}

function detectStep(values, min, max) {
  if (values.length < 2) return null;
  const step = values[1] - values[0];
  if (step <= 1) return null;
  for (let i = 2; i < values.length; i++) {
    if (values[i] - values[i - 1] !== step) return null;
  }
  // Verify it covers the full range from min
  if (values[0] === min && values[values.length - 1] + step > max) {
    return step;
  }
  return null;
}

function formatHour(h) {
  if (h === 0) return '12:00 AM';
  if (h < 12) return `${h}:00 AM`;
  if (h === 12) return '12:00 PM';
  return `${h - 12}:00 PM`;
}

function listValues(arr) {
  if (arr.length <= 5) return arr.join(', ');
  return `${arr.slice(0, 3).join(', ')} ... ${arr[arr.length - 1]} (${arr.length} values)`;
}

/**
 * Get the next N occurrences of a cron expression from a given date.
 */
export function nextOccurrences(expression, count = 5, from = null) {
  if (!expression || typeof expression !== 'string') {
    throw new Error('expression is required');
  }

  const maxCount = Math.min(count, 25);
  const { parsed, hasSeconds } = parseCron(expression);
  const start = from ? new Date(from) : new Date();

  if (isNaN(start.getTime())) {
    throw new Error('Invalid "from" date');
  }

  const results = [];
  const current = new Date(start);
  // Move 1 second/minute forward to avoid returning "now"
  if (hasSeconds) {
    current.setUTCSeconds(current.getUTCSeconds() + 1);
  } else {
    current.setUTCMinutes(current.getUTCMinutes() + 1);
    current.setUTCSeconds(0);
  }
  current.setUTCMilliseconds(0);

  const maxIterations = 525960; // ~1 year of minutes

  for (let i = 0; i < maxIterations && results.length < maxCount; i++) {
    if (!parsed.months.includes(current.getUTCMonth() + 1)) {
      // Skip to next month
      current.setUTCMonth(current.getUTCMonth() + 1);
      current.setUTCDate(1);
      current.setUTCHours(0, 0, 0, 0);
      continue;
    }

    if (!parsed.days.includes(current.getUTCDate())) {
      current.setUTCDate(current.getUTCDate() + 1);
      current.setUTCHours(0, 0, 0, 0);
      continue;
    }

    if (!parsed.weekdays.includes(current.getUTCDay())) {
      current.setUTCDate(current.getUTCDate() + 1);
      current.setUTCHours(0, 0, 0, 0);
      continue;
    }

    if (!parsed.hours.includes(current.getUTCHours())) {
      current.setUTCHours(current.getUTCHours() + 1, 0, 0, 0);
      continue;
    }

    if (!parsed.minutes.includes(current.getUTCMinutes())) {
      current.setUTCMinutes(current.getUTCMinutes() + 1, 0, 0);
      continue;
    }

    if (hasSeconds && parsed.seconds && !parsed.seconds.includes(current.getUTCSeconds())) {
      current.setUTCSeconds(current.getUTCSeconds() + 1, 0);
      continue;
    }

    results.push(current.toISOString());

    // Move to next candidate
    if (hasSeconds) {
      current.setUTCSeconds(current.getUTCSeconds() + 1);
    } else {
      current.setUTCMinutes(current.getUTCMinutes() + 1);
      current.setUTCSeconds(0);
    }
  }

  return results;
}

/**
 * Validate a cron expression and return errors or success.
 */
export function validateCron(expression) {
  try {
    const result = parseCron(expression);
    return {
      valid: true,
      expression: result.expression,
      fields: result.fields,
      description: result.description,
    };
  } catch (e) {
    return {
      valid: false,
      expression: expression || '',
      error: e.message,
    };
  }
}
