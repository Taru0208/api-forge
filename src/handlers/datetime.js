// Date/Time utility functions — works in Cloudflare Workers (no Node.js APIs)

/**
 * Get current timestamp in multiple formats.
 * @param {string} [timezone] — IANA timezone name (e.g. "America/New_York")
 */
export function now(timezone) {
  const date = new Date();
  const result = {
    iso: date.toISOString(),
    unix: Math.floor(date.getTime() / 1000),
    unix_ms: date.getTime(),
    utc: date.toUTCString(),
  };
  if (timezone) {
    try {
      result.local = date.toLocaleString('en-US', { timeZone: timezone });
      result.timezone = timezone;
    } catch {
      throw new Error(`Invalid timezone: ${timezone}`);
    }
  }
  return result;
}

/**
 * Calculate difference between two dates.
 * @param {string} from — ISO date string
 * @param {string} to — ISO date string
 */
export function dateDiff(from, to) {
  if (!from || !to) throw new Error('Both "from" and "to" dates are required');
  const d1 = new Date(from);
  const d2 = new Date(to);
  if (isNaN(d1.getTime())) throw new Error(`Invalid date: ${from}`);
  if (isNaN(d2.getTime())) throw new Error(`Invalid date: ${to}`);

  const diffMs = d2.getTime() - d1.getTime();
  const absDiff = Math.abs(diffMs);
  const sign = diffMs >= 0 ? 1 : -1;

  const seconds = Math.floor(absDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30.44);
  const years = Math.floor(days / 365.25);

  return {
    milliseconds: diffMs,
    seconds: sign * seconds,
    minutes: sign * minutes,
    hours: sign * hours,
    days: sign * days,
    weeks: sign * weeks,
    months: sign * months,
    years: sign * years,
    human: humanDuration(absDiff, sign),
  };
}

function humanDuration(ms, sign) {
  const prefix = sign < 0 ? '-' : '';
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${prefix}${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${prefix}${minutes}m ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${prefix}${hours}h ${minutes % 60}m`;
  const days = Math.floor(hours / 24);
  if (days < 365) return `${prefix}${days}d ${hours % 24}h`;
  const years = Math.floor(days / 365.25);
  return `${prefix}${years}y ${Math.floor(days % 365.25)}d`;
}

/**
 * Parse a date string into components.
 * @param {string} date — ISO date string or common format
 */
export function parseDate(date) {
  if (!date) throw new Error('"date" is required');
  const d = new Date(date);
  if (isNaN(d.getTime())) throw new Error(`Cannot parse date: ${date}`);

  return {
    iso: d.toISOString(),
    unix: Math.floor(d.getTime() / 1000),
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    second: d.getUTCSeconds(),
    dayOfWeek: d.getUTCDay(),
    dayOfWeekName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getUTCDay()],
    isLeapYear: isLeapYear(d.getUTCFullYear()),
    dayOfYear: dayOfYear(d),
    weekNumber: weekNumber(d),
  };
}

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

function dayOfYear(d) {
  const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 0));
  return Math.floor((d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function weekNumber(d) {
  const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const diff = d.getTime() - start.getTime();
  return Math.ceil((diff / (1000 * 60 * 60 * 24) + start.getUTCDay() + 1) / 7);
}

/**
 * Add or subtract time from a date.
 * @param {string} date — ISO date string
 * @param {number} amount — amount to add (negative to subtract)
 * @param {string} unit — 'seconds'|'minutes'|'hours'|'days'|'weeks'|'months'|'years'
 */
export function addTime(date, amount, unit) {
  if (!date) throw new Error('"date" is required');
  if (amount === undefined) throw new Error('"amount" is required');
  if (!unit) throw new Error('"unit" is required');

  const d = new Date(date);
  if (isNaN(d.getTime())) throw new Error(`Invalid date: ${date}`);

  const multipliers = {
    seconds: 1000,
    minutes: 60 * 1000,
    hours: 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000,
    weeks: 7 * 24 * 60 * 60 * 1000,
  };

  if (unit === 'months') {
    d.setUTCMonth(d.getUTCMonth() + amount);
  } else if (unit === 'years') {
    d.setUTCFullYear(d.getUTCFullYear() + amount);
  } else if (multipliers[unit]) {
    d.setTime(d.getTime() + amount * multipliers[unit]);
  } else {
    throw new Error(`Invalid unit: ${unit}. Use: seconds, minutes, hours, days, weeks, months, years`);
  }

  return {
    iso: d.toISOString(),
    unix: Math.floor(d.getTime() / 1000),
  };
}

/**
 * Convert between Unix timestamp and ISO.
 * @param {number|string} input — Unix timestamp (seconds) or ISO string
 */
export function convertTimestamp(input) {
  if (input === undefined || input === null) throw new Error('"input" is required');

  if (typeof input === 'number') {
    // Unix seconds → ISO
    const d = new Date(input * 1000);
    if (isNaN(d.getTime())) throw new Error(`Invalid unix timestamp: ${input}`);
    return { iso: d.toISOString(), unix: input, unix_ms: input * 1000 };
  }

  // ISO → Unix
  const d = new Date(input);
  if (isNaN(d.getTime())) throw new Error(`Cannot parse: ${input}`);
  return { iso: d.toISOString(), unix: Math.floor(d.getTime() / 1000), unix_ms: d.getTime() };
}
