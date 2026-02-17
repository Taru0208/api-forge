// Country, currency, calling code, and timezone utilities.
// Static data — no external dependencies.

const COUNTRIES = [
  { code: 'US', alpha3: 'USA', numeric: '840', name: 'United States', capital: 'Washington, D.C.', region: 'Americas', subregion: 'Northern America', currency: { code: 'USD', name: 'United States Dollar' }, callingCode: '+1', tld: '.us' },
  { code: 'GB', alpha3: 'GBR', numeric: '826', name: 'United Kingdom', capital: 'London', region: 'Europe', subregion: 'Northern Europe', currency: { code: 'GBP', name: 'British Pound Sterling' }, callingCode: '+44', tld: '.uk' },
  { code: 'CA', alpha3: 'CAN', numeric: '124', name: 'Canada', capital: 'Ottawa', region: 'Americas', subregion: 'Northern America', currency: { code: 'CAD', name: 'Canadian Dollar' }, callingCode: '+1', tld: '.ca' },
  { code: 'AU', alpha3: 'AUS', numeric: '036', name: 'Australia', capital: 'Canberra', region: 'Oceania', subregion: 'Australia and New Zealand', currency: { code: 'AUD', name: 'Australian Dollar' }, callingCode: '+61', tld: '.au' },
  { code: 'DE', alpha3: 'DEU', numeric: '276', name: 'Germany', capital: 'Berlin', region: 'Europe', subregion: 'Western Europe', currency: { code: 'EUR', name: 'Euro' }, callingCode: '+49', tld: '.de' },
  { code: 'FR', alpha3: 'FRA', numeric: '250', name: 'France', capital: 'Paris', region: 'Europe', subregion: 'Western Europe', currency: { code: 'EUR', name: 'Euro' }, callingCode: '+33', tld: '.fr' },
  { code: 'JP', alpha3: 'JPN', numeric: '392', name: 'Japan', capital: 'Tokyo', region: 'Asia', subregion: 'Eastern Asia', currency: { code: 'JPY', name: 'Japanese Yen' }, callingCode: '+81', tld: '.jp' },
  { code: 'KR', alpha3: 'KOR', numeric: '410', name: 'South Korea', capital: 'Seoul', region: 'Asia', subregion: 'Eastern Asia', currency: { code: 'KRW', name: 'South Korean Won' }, callingCode: '+82', tld: '.kr' },
  { code: 'CN', alpha3: 'CHN', numeric: '156', name: 'China', capital: 'Beijing', region: 'Asia', subregion: 'Eastern Asia', currency: { code: 'CNY', name: 'Chinese Yuan' }, callingCode: '+86', tld: '.cn' },
  { code: 'IN', alpha3: 'IND', numeric: '356', name: 'India', capital: 'New Delhi', region: 'Asia', subregion: 'Southern Asia', currency: { code: 'INR', name: 'Indian Rupee' }, callingCode: '+91', tld: '.in' },
  { code: 'BR', alpha3: 'BRA', numeric: '076', name: 'Brazil', capital: 'Brasília', region: 'Americas', subregion: 'South America', currency: { code: 'BRL', name: 'Brazilian Real' }, callingCode: '+55', tld: '.br' },
  { code: 'MX', alpha3: 'MEX', numeric: '484', name: 'Mexico', capital: 'Mexico City', region: 'Americas', subregion: 'Central America', currency: { code: 'MXN', name: 'Mexican Peso' }, callingCode: '+52', tld: '.mx' },
  { code: 'AR', alpha3: 'ARG', numeric: '032', name: 'Argentina', capital: 'Buenos Aires', region: 'Americas', subregion: 'South America', currency: { code: 'ARS', name: 'Argentine Peso' }, callingCode: '+54', tld: '.ar' },
  { code: 'RU', alpha3: 'RUS', numeric: '643', name: 'Russia', capital: 'Moscow', region: 'Europe', subregion: 'Eastern Europe', currency: { code: 'RUB', name: 'Russian Ruble' }, callingCode: '+7', tld: '.ru' },
  { code: 'ZA', alpha3: 'ZAF', numeric: '710', name: 'South Africa', capital: 'Pretoria', region: 'Africa', subregion: 'Southern Africa', currency: { code: 'ZAR', name: 'South African Rand' }, callingCode: '+27', tld: '.za' },
  { code: 'NG', alpha3: 'NGA', numeric: '566', name: 'Nigeria', capital: 'Abuja', region: 'Africa', subregion: 'Western Africa', currency: { code: 'NGN', name: 'Nigerian Naira' }, callingCode: '+234', tld: '.ng' },
  { code: 'EG', alpha3: 'EGY', numeric: '818', name: 'Egypt', capital: 'Cairo', region: 'Africa', subregion: 'Northern Africa', currency: { code: 'EGP', name: 'Egyptian Pound' }, callingCode: '+20', tld: '.eg' },
  { code: 'KE', alpha3: 'KEN', numeric: '404', name: 'Kenya', capital: 'Nairobi', region: 'Africa', subregion: 'Eastern Africa', currency: { code: 'KES', name: 'Kenyan Shilling' }, callingCode: '+254', tld: '.ke' },
  { code: 'IT', alpha3: 'ITA', numeric: '380', name: 'Italy', capital: 'Rome', region: 'Europe', subregion: 'Southern Europe', currency: { code: 'EUR', name: 'Euro' }, callingCode: '+39', tld: '.it' },
  { code: 'ES', alpha3: 'ESP', numeric: '724', name: 'Spain', capital: 'Madrid', region: 'Europe', subregion: 'Southern Europe', currency: { code: 'EUR', name: 'Euro' }, callingCode: '+34', tld: '.es' },
  { code: 'PT', alpha3: 'PRT', numeric: '620', name: 'Portugal', capital: 'Lisbon', region: 'Europe', subregion: 'Southern Europe', currency: { code: 'EUR', name: 'Euro' }, callingCode: '+351', tld: '.pt' },
  { code: 'NL', alpha3: 'NLD', numeric: '528', name: 'Netherlands', capital: 'Amsterdam', region: 'Europe', subregion: 'Western Europe', currency: { code: 'EUR', name: 'Euro' }, callingCode: '+31', tld: '.nl' },
  { code: 'BE', alpha3: 'BEL', numeric: '056', name: 'Belgium', capital: 'Brussels', region: 'Europe', subregion: 'Western Europe', currency: { code: 'EUR', name: 'Euro' }, callingCode: '+32', tld: '.be' },
  { code: 'CH', alpha3: 'CHE', numeric: '756', name: 'Switzerland', capital: 'Bern', region: 'Europe', subregion: 'Western Europe', currency: { code: 'CHF', name: 'Swiss Franc' }, callingCode: '+41', tld: '.ch' },
  { code: 'AT', alpha3: 'AUT', numeric: '040', name: 'Austria', capital: 'Vienna', region: 'Europe', subregion: 'Western Europe', currency: { code: 'EUR', name: 'Euro' }, callingCode: '+43', tld: '.at' },
  { code: 'SE', alpha3: 'SWE', numeric: '752', name: 'Sweden', capital: 'Stockholm', region: 'Europe', subregion: 'Northern Europe', currency: { code: 'SEK', name: 'Swedish Krona' }, callingCode: '+46', tld: '.se' },
  { code: 'NO', alpha3: 'NOR', numeric: '578', name: 'Norway', capital: 'Oslo', region: 'Europe', subregion: 'Northern Europe', currency: { code: 'NOK', name: 'Norwegian Krone' }, callingCode: '+47', tld: '.no' },
  { code: 'DK', alpha3: 'DNK', numeric: '208', name: 'Denmark', capital: 'Copenhagen', region: 'Europe', subregion: 'Northern Europe', currency: { code: 'DKK', name: 'Danish Krone' }, callingCode: '+45', tld: '.dk' },
  { code: 'FI', alpha3: 'FIN', numeric: '246', name: 'Finland', capital: 'Helsinki', region: 'Europe', subregion: 'Northern Europe', currency: { code: 'EUR', name: 'Euro' }, callingCode: '+358', tld: '.fi' },
  { code: 'PL', alpha3: 'POL', numeric: '616', name: 'Poland', capital: 'Warsaw', region: 'Europe', subregion: 'Eastern Europe', currency: { code: 'PLN', name: 'Polish Zloty' }, callingCode: '+48', tld: '.pl' },
  { code: 'IE', alpha3: 'IRL', numeric: '372', name: 'Ireland', capital: 'Dublin', region: 'Europe', subregion: 'Northern Europe', currency: { code: 'EUR', name: 'Euro' }, callingCode: '+353', tld: '.ie' },
  { code: 'GR', alpha3: 'GRC', numeric: '300', name: 'Greece', capital: 'Athens', region: 'Europe', subregion: 'Southern Europe', currency: { code: 'EUR', name: 'Euro' }, callingCode: '+30', tld: '.gr' },
  { code: 'TR', alpha3: 'TUR', numeric: '792', name: 'Turkey', capital: 'Ankara', region: 'Asia', subregion: 'Western Asia', currency: { code: 'TRY', name: 'Turkish Lira' }, callingCode: '+90', tld: '.tr' },
  { code: 'SA', alpha3: 'SAU', numeric: '682', name: 'Saudi Arabia', capital: 'Riyadh', region: 'Asia', subregion: 'Western Asia', currency: { code: 'SAR', name: 'Saudi Riyal' }, callingCode: '+966', tld: '.sa' },
  { code: 'AE', alpha3: 'ARE', numeric: '784', name: 'United Arab Emirates', capital: 'Abu Dhabi', region: 'Asia', subregion: 'Western Asia', currency: { code: 'AED', name: 'UAE Dirham' }, callingCode: '+971', tld: '.ae' },
  { code: 'IL', alpha3: 'ISR', numeric: '376', name: 'Israel', capital: 'Jerusalem', region: 'Asia', subregion: 'Western Asia', currency: { code: 'ILS', name: 'Israeli New Shekel' }, callingCode: '+972', tld: '.il' },
  { code: 'TH', alpha3: 'THA', numeric: '764', name: 'Thailand', capital: 'Bangkok', region: 'Asia', subregion: 'South-Eastern Asia', currency: { code: 'THB', name: 'Thai Baht' }, callingCode: '+66', tld: '.th' },
  { code: 'VN', alpha3: 'VNM', numeric: '704', name: 'Vietnam', capital: 'Hanoi', region: 'Asia', subregion: 'South-Eastern Asia', currency: { code: 'VND', name: 'Vietnamese Dong' }, callingCode: '+84', tld: '.vn' },
  { code: 'PH', alpha3: 'PHL', numeric: '608', name: 'Philippines', capital: 'Manila', region: 'Asia', subregion: 'South-Eastern Asia', currency: { code: 'PHP', name: 'Philippine Peso' }, callingCode: '+63', tld: '.ph' },
  { code: 'MY', alpha3: 'MYS', numeric: '458', name: 'Malaysia', capital: 'Kuala Lumpur', region: 'Asia', subregion: 'South-Eastern Asia', currency: { code: 'MYR', name: 'Malaysian Ringgit' }, callingCode: '+60', tld: '.my' },
  { code: 'SG', alpha3: 'SGP', numeric: '702', name: 'Singapore', capital: 'Singapore', region: 'Asia', subregion: 'South-Eastern Asia', currency: { code: 'SGD', name: 'Singapore Dollar' }, callingCode: '+65', tld: '.sg' },
  { code: 'ID', alpha3: 'IDN', numeric: '360', name: 'Indonesia', capital: 'Jakarta', region: 'Asia', subregion: 'South-Eastern Asia', currency: { code: 'IDR', name: 'Indonesian Rupiah' }, callingCode: '+62', tld: '.id' },
  { code: 'PK', alpha3: 'PAK', numeric: '586', name: 'Pakistan', capital: 'Islamabad', region: 'Asia', subregion: 'Southern Asia', currency: { code: 'PKR', name: 'Pakistani Rupee' }, callingCode: '+92', tld: '.pk' },
  { code: 'BD', alpha3: 'BGD', numeric: '050', name: 'Bangladesh', capital: 'Dhaka', region: 'Asia', subregion: 'Southern Asia', currency: { code: 'BDT', name: 'Bangladeshi Taka' }, callingCode: '+880', tld: '.bd' },
  { code: 'NZ', alpha3: 'NZL', numeric: '554', name: 'New Zealand', capital: 'Wellington', region: 'Oceania', subregion: 'Australia and New Zealand', currency: { code: 'NZD', name: 'New Zealand Dollar' }, callingCode: '+64', tld: '.nz' },
  { code: 'CL', alpha3: 'CHL', numeric: '152', name: 'Chile', capital: 'Santiago', region: 'Americas', subregion: 'South America', currency: { code: 'CLP', name: 'Chilean Peso' }, callingCode: '+56', tld: '.cl' },
  { code: 'CO', alpha3: 'COL', numeric: '170', name: 'Colombia', capital: 'Bogotá', region: 'Americas', subregion: 'South America', currency: { code: 'COP', name: 'Colombian Peso' }, callingCode: '+57', tld: '.co' },
  { code: 'PE', alpha3: 'PER', numeric: '604', name: 'Peru', capital: 'Lima', region: 'Americas', subregion: 'South America', currency: { code: 'PEN', name: 'Peruvian Sol' }, callingCode: '+51', tld: '.pe' },
  { code: 'UA', alpha3: 'UKR', numeric: '804', name: 'Ukraine', capital: 'Kyiv', region: 'Europe', subregion: 'Eastern Europe', currency: { code: 'UAH', name: 'Ukrainian Hryvnia' }, callingCode: '+380', tld: '.ua' },
  { code: 'CZ', alpha3: 'CZE', numeric: '203', name: 'Czech Republic', capital: 'Prague', region: 'Europe', subregion: 'Eastern Europe', currency: { code: 'CZK', name: 'Czech Koruna' }, callingCode: '+420', tld: '.cz' },
  { code: 'RO', alpha3: 'ROU', numeric: '642', name: 'Romania', capital: 'Bucharest', region: 'Europe', subregion: 'Eastern Europe', currency: { code: 'RON', name: 'Romanian Leu' }, callingCode: '+40', tld: '.ro' },
  { code: 'HU', alpha3: 'HUN', numeric: '348', name: 'Hungary', capital: 'Budapest', region: 'Europe', subregion: 'Eastern Europe', currency: { code: 'HUF', name: 'Hungarian Forint' }, callingCode: '+36', tld: '.hu' },
  { code: 'GH', alpha3: 'GHA', numeric: '288', name: 'Ghana', capital: 'Accra', region: 'Africa', subregion: 'Western Africa', currency: { code: 'GHS', name: 'Ghanaian Cedi' }, callingCode: '+233', tld: '.gh' },
  { code: 'ET', alpha3: 'ETH', numeric: '231', name: 'Ethiopia', capital: 'Addis Ababa', region: 'Africa', subregion: 'Eastern Africa', currency: { code: 'ETB', name: 'Ethiopian Birr' }, callingCode: '+251', tld: '.et' },
  { code: 'TZ', alpha3: 'TZA', numeric: '834', name: 'Tanzania', capital: 'Dodoma', region: 'Africa', subregion: 'Eastern Africa', currency: { code: 'TZS', name: 'Tanzanian Shilling' }, callingCode: '+255', tld: '.tz' },
  { code: 'MA', alpha3: 'MAR', numeric: '504', name: 'Morocco', capital: 'Rabat', region: 'Africa', subregion: 'Northern Africa', currency: { code: 'MAD', name: 'Moroccan Dirham' }, callingCode: '+212', tld: '.ma' },
  { code: 'TW', alpha3: 'TWN', numeric: '158', name: 'Taiwan', capital: 'Taipei', region: 'Asia', subregion: 'Eastern Asia', currency: { code: 'TWD', name: 'New Taiwan Dollar' }, callingCode: '+886', tld: '.tw' },
  { code: 'HK', alpha3: 'HKG', numeric: '344', name: 'Hong Kong', capital: 'Hong Kong', region: 'Asia', subregion: 'Eastern Asia', currency: { code: 'HKD', name: 'Hong Kong Dollar' }, callingCode: '+852', tld: '.hk' },
  { code: 'FJ', alpha3: 'FJI', numeric: '242', name: 'Fiji', capital: 'Suva', region: 'Oceania', subregion: 'Melanesia', currency: { code: 'FJD', name: 'Fijian Dollar' }, callingCode: '+679', tld: '.fj' },
  { code: 'IS', alpha3: 'ISL', numeric: '352', name: 'Iceland', capital: 'Reykjavik', region: 'Europe', subregion: 'Northern Europe', currency: { code: 'ISK', name: 'Icelandic Krona' }, callingCode: '+354', tld: '.is' },
];

// Currency symbols mapping (ISO 4217 -> symbol)
const CURRENCY_SYMBOLS = {
  USD: '$', EUR: '€', GBP: '£', JPY: '¥', KRW: '₩', CNY: '¥', INR: '₹',
  BRL: 'R$', MXN: '$', ARS: '$', RUB: '₽', ZAR: 'R', NGN: '₦', EGP: 'E£',
  KES: 'KSh', CHF: 'CHF', SEK: 'kr', NOK: 'kr', DKK: 'kr', PLN: 'zł',
  TRY: '₺', SAR: '﷼', AED: 'د.إ', ILS: '₪', THB: '฿', VND: '₫',
  PHP: '₱', MYR: 'RM', SGD: 'S$', IDR: 'Rp', PKR: '₨', BDT: '৳',
  CAD: 'C$', AUD: 'A$', NZD: 'NZ$', CLP: '$', COP: '$', PEN: 'S/',
  UAH: '₴', CZK: 'Kč', RON: 'lei', HUF: 'Ft', GHS: 'GH₵', ETB: 'Br',
  TZS: 'TSh', MAD: 'MAD', TWD: 'NT$', HKD: 'HK$', FJD: 'FJ$', ISK: 'kr',
};

// IANA timezone data grouped by region
const TIMEZONES = {
  Africa: [
    'Africa/Abidjan', 'Africa/Accra', 'Africa/Addis_Ababa', 'Africa/Algiers',
    'Africa/Cairo', 'Africa/Casablanca', 'Africa/Dar_es_Salaam', 'Africa/Johannesburg',
    'Africa/Lagos', 'Africa/Nairobi', 'Africa/Tunis',
  ],
  America: [
    'America/Anchorage', 'America/Argentina/Buenos_Aires', 'America/Bogota',
    'America/Chicago', 'America/Denver', 'America/Halifax', 'America/Lima',
    'America/Los_Angeles', 'America/Mexico_City', 'America/New_York',
    'America/Santiago', 'America/Sao_Paulo', 'America/Toronto', 'America/Vancouver',
  ],
  Asia: [
    'Asia/Bangkok', 'Asia/Colombo', 'Asia/Dhaka', 'Asia/Dubai', 'Asia/Hong_Kong',
    'Asia/Istanbul', 'Asia/Jakarta', 'Asia/Jerusalem', 'Asia/Karachi',
    'Asia/Kolkata', 'Asia/Kuala_Lumpur', 'Asia/Manila', 'Asia/Riyadh',
    'Asia/Seoul', 'Asia/Shanghai', 'Asia/Singapore', 'Asia/Taipei',
    'Asia/Tehran', 'Asia/Tokyo',
  ],
  Atlantic: [
    'Atlantic/Azores', 'Atlantic/Canary', 'Atlantic/Reykjavik',
  ],
  Australia: [
    'Australia/Adelaide', 'Australia/Brisbane', 'Australia/Darwin',
    'Australia/Melbourne', 'Australia/Perth', 'Australia/Sydney',
  ],
  Europe: [
    'Europe/Amsterdam', 'Europe/Athens', 'Europe/Berlin', 'Europe/Brussels',
    'Europe/Bucharest', 'Europe/Budapest', 'Europe/Copenhagen', 'Europe/Dublin',
    'Europe/Helsinki', 'Europe/Kyiv', 'Europe/Lisbon', 'Europe/London',
    'Europe/Madrid', 'Europe/Moscow', 'Europe/Oslo', 'Europe/Paris',
    'Europe/Prague', 'Europe/Rome', 'Europe/Stockholm', 'Europe/Vienna',
    'Europe/Warsaw', 'Europe/Zurich',
  ],
  Pacific: [
    'Pacific/Auckland', 'Pacific/Fiji', 'Pacific/Guam', 'Pacific/Honolulu',
    'Pacific/Noumea', 'Pacific/Pago_Pago', 'Pacific/Tahiti', 'Pacific/Tongatapu',
  ],
  Other: [
    'UTC',
  ],
};

// UTC offset data for timezones (standard offset in minutes)
// Some timezones observe DST but we provide the standard offset.
const TZ_OFFSETS = {
  'Africa/Abidjan': 0, 'Africa/Accra': 0, 'Africa/Addis_Ababa': 180,
  'Africa/Algiers': 60, 'Africa/Cairo': 120, 'Africa/Casablanca': 60,
  'Africa/Dar_es_Salaam': 180, 'Africa/Johannesburg': 120, 'Africa/Lagos': 60,
  'Africa/Nairobi': 180, 'Africa/Tunis': 60,
  'America/Anchorage': -540, 'America/Argentina/Buenos_Aires': -180,
  'America/Bogota': -300, 'America/Chicago': -360, 'America/Denver': -420,
  'America/Halifax': -240, 'America/Lima': -300, 'America/Los_Angeles': -480,
  'America/Mexico_City': -360, 'America/New_York': -300,
  'America/Santiago': -240, 'America/Sao_Paulo': -180,
  'America/Toronto': -300, 'America/Vancouver': -480,
  'Asia/Bangkok': 420, 'Asia/Colombo': 330, 'Asia/Dhaka': 360,
  'Asia/Dubai': 240, 'Asia/Hong_Kong': 480, 'Asia/Istanbul': 180,
  'Asia/Jakarta': 420, 'Asia/Jerusalem': 120, 'Asia/Karachi': 300,
  'Asia/Kolkata': 330, 'Asia/Kuala_Lumpur': 480, 'Asia/Manila': 480,
  'Asia/Riyadh': 180, 'Asia/Seoul': 540, 'Asia/Shanghai': 480,
  'Asia/Singapore': 480, 'Asia/Taipei': 480, 'Asia/Tehran': 210,
  'Asia/Tokyo': 540,
  'Atlantic/Azores': -60, 'Atlantic/Canary': 0, 'Atlantic/Reykjavik': 0,
  'Australia/Adelaide': 570, 'Australia/Brisbane': 600, 'Australia/Darwin': 570,
  'Australia/Melbourne': 600, 'Australia/Perth': 480, 'Australia/Sydney': 600,
  'Europe/Amsterdam': 60, 'Europe/Athens': 120, 'Europe/Berlin': 60,
  'Europe/Brussels': 60, 'Europe/Bucharest': 120, 'Europe/Budapest': 60,
  'Europe/Copenhagen': 60, 'Europe/Dublin': 0, 'Europe/Helsinki': 120,
  'Europe/Kyiv': 120, 'Europe/Lisbon': 0, 'Europe/London': 0,
  'Europe/Madrid': 60, 'Europe/Moscow': 180, 'Europe/Oslo': 60,
  'Europe/Paris': 60, 'Europe/Prague': 60, 'Europe/Rome': 60,
  'Europe/Stockholm': 60, 'Europe/Vienna': 60, 'Europe/Warsaw': 60,
  'Europe/Zurich': 60,
  'Pacific/Auckland': 720, 'Pacific/Fiji': 720, 'Pacific/Guam': 600,
  'Pacific/Honolulu': -600, 'Pacific/Noumea': 660, 'Pacific/Pago_Pago': -660,
  'Pacific/Tahiti': -600, 'Pacific/Tongatapu': 780,
  'UTC': 0,
};

// Build lookup indices
const byAlpha2 = new Map();
const byAlpha3 = new Map();
for (const c of COUNTRIES) {
  byAlpha2.set(c.code, c);
  byAlpha3.set(c.alpha3, c);
}

/**
 * Return the full list of countries.
 */
export function listCountries() {
  return COUNTRIES.map(c => ({ ...c }));
}

/**
 * Look up a country by alpha-2 or alpha-3 code.
 */
export function getCountry(code) {
  if (!code || typeof code !== 'string') {
    throw new Error('Country code is required');
  }
  const upper = code.toUpperCase().trim();
  const found = upper.length === 2 ? byAlpha2.get(upper) : byAlpha3.get(upper);
  if (!found) throw new Error(`Country not found: ${code}`);
  return { ...found };
}

/**
 * Search countries by name substring (case-insensitive).
 */
export function searchCountries(query) {
  if (!query || typeof query !== 'string') {
    throw new Error('Search query is required');
  }
  const lower = query.toLowerCase().trim();
  if (lower.length === 0) throw new Error('Search query is required');
  return COUNTRIES.filter(c => c.name.toLowerCase().includes(lower)).map(c => ({ ...c }));
}

/**
 * Look up a currency by ISO 4217 code.
 * Returns name, symbol, and list of countries using it.
 */
export function getCurrency(code) {
  if (!code || typeof code !== 'string') {
    throw new Error('Currency code is required');
  }
  const upper = code.toUpperCase().trim();
  const countries = COUNTRIES.filter(c => c.currency.code === upper);
  if (countries.length === 0) throw new Error(`Currency not found: ${code}`);
  const first = countries[0];
  return {
    code: upper,
    name: first.currency.name,
    symbol: CURRENCY_SYMBOLS[upper] || upper,
    countries: countries.map(c => ({ code: c.code, name: c.name })),
  };
}

/**
 * Return all unique currencies with code, name, and symbol.
 */
export function listCurrencies() {
  const seen = new Set();
  const result = [];
  for (const c of COUNTRIES) {
    if (!seen.has(c.currency.code)) {
      seen.add(c.currency.code);
      result.push({
        code: c.currency.code,
        name: c.currency.name,
        symbol: CURRENCY_SYMBOLS[c.currency.code] || c.currency.code,
      });
    }
  }
  return result;
}

/**
 * Get the international calling code for a country (by alpha-2 code).
 */
export function getCallingCode(code) {
  if (!code || typeof code !== 'string') {
    throw new Error('Country code is required');
  }
  const upper = code.toUpperCase().trim();
  const country = byAlpha2.get(upper);
  if (!country) throw new Error(`Country not found: ${code}`);
  return {
    country: country.code,
    name: country.name,
    callingCode: country.callingCode,
  };
}

/**
 * Return all IANA timezone strings grouped by region.
 */
export function listTimezones() {
  // Return a deep copy
  const result = {};
  for (const [region, zones] of Object.entries(TIMEZONES)) {
    result[region] = [...zones];
  }
  return result;
}

/**
 * Get current time information for a given IANA timezone.
 * Returns the UTC offset, formatted offset string, and current time (ISO).
 */
export function getTimezone(tz) {
  if (!tz || typeof tz !== 'string') {
    throw new Error('Timezone is required');
  }
  const trimmed = tz.trim();

  // Validate: check if this timezone exists in our data
  const offsetMinutes = TZ_OFFSETS[trimmed];
  if (offsetMinutes === undefined) {
    throw new Error(`Unknown timezone: ${tz}`);
  }

  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const localMs = utcMs + offsetMinutes * 60000;
  const local = new Date(localMs);

  const absMinutes = Math.abs(offsetMinutes);
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const hours = String(Math.floor(absMinutes / 60)).padStart(2, '0');
  const mins = String(absMinutes % 60).padStart(2, '0');
  const offsetStr = `UTC${sign}${hours}:${mins}`;

  const pad = (n) => String(n).padStart(2, '0');
  const localISO = `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}T${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}:${pad(local.getUTCSeconds())}${sign}${hours}:${mins}`;

  return {
    timezone: trimmed,
    utcOffset: offsetStr,
    offsetMinutes,
    currentTime: localISO,
  };
}
