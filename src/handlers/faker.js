// Data faker — generates realistic-looking test data without external dependencies

const FIRST_NAMES = [
  'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda',
  'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Daniel', 'Lisa', 'Matthew', 'Nancy',
  'Anthony', 'Betty', 'Mark', 'Margaret', 'Steven', 'Sandra', 'Paul', 'Ashley',
  'Andrew', 'Dorothy', 'Joshua', 'Kimberly', 'Kenneth', 'Emily', 'Kevin', 'Donna',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
];

const STREETS = [
  'Main St', 'Oak Ave', 'Elm St', 'Park Blvd', 'Cedar Ln', 'Maple Dr',
  'Pine St', 'Washington Ave', 'Lake Rd', 'Hill St', 'River Rd', 'Forest Dr',
  'Sunset Blvd', 'Broadway', 'Church St', 'Highland Ave', 'Valley Rd', 'Spring St',
];

const CITIES = [
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia',
  'San Antonio', 'San Diego', 'Dallas', 'Austin', 'Jacksonville', 'San Francisco',
  'Columbus', 'Charlotte', 'Indianapolis', 'Seattle', 'Denver', 'Nashville',
  'Portland', 'Memphis', 'Boston', 'Atlanta', 'Miami', 'Minneapolis',
];

const STATES = [
  { name: 'California', abbr: 'CA' }, { name: 'Texas', abbr: 'TX' },
  { name: 'Florida', abbr: 'FL' }, { name: 'New York', abbr: 'NY' },
  { name: 'Pennsylvania', abbr: 'PA' }, { name: 'Illinois', abbr: 'IL' },
  { name: 'Ohio', abbr: 'OH' }, { name: 'Georgia', abbr: 'GA' },
  { name: 'Michigan', abbr: 'MI' }, { name: 'North Carolina', abbr: 'NC' },
  { name: 'New Jersey', abbr: 'NJ' }, { name: 'Virginia', abbr: 'VA' },
  { name: 'Washington', abbr: 'WA' }, { name: 'Arizona', abbr: 'AZ' },
  { name: 'Massachusetts', abbr: 'MA' }, { name: 'Colorado', abbr: 'CO' },
];

const COMPANY_SUFFIXES = ['Inc', 'LLC', 'Corp', 'Ltd', 'Co', 'Group', 'Solutions', 'Technologies', 'Systems', 'Services'];
const COMPANY_ADJECTIVES = ['Global', 'Premier', 'Advanced', 'Digital', 'Core', 'Prime', 'Elite', 'Next', 'Smart', 'Blue'];
const COMPANY_NOUNS = ['Tech', 'Data', 'Cloud', 'Net', 'Web', 'Logic', 'Soft', 'Wave', 'Link', 'Code'];

const DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'proton.me', 'icloud.com', 'mail.com'];
const TLD = ['.com', '.io', '.co', '.net', '.org', '.dev', '.app'];

const PHRASES = [
  'The quick brown fox jumps over the lazy dog',
  'Innovation drives progress in modern technology',
  'Quality software requires careful planning and execution',
  'Data-driven decisions lead to better outcomes',
  'Collaboration and communication are key to success',
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function fakePerson() {
  const first = pick(FIRST_NAMES);
  const last = pick(LAST_NAMES);
  const email = `${first.toLowerCase()}.${last.toLowerCase()}${randInt(1, 999)}@${pick(DOMAINS)}`;
  const phone = `+1${randInt(200, 999)}${randInt(200, 999)}${randInt(1000, 9999)}`;
  return {
    firstName: first,
    lastName: last,
    fullName: `${first} ${last}`,
    email,
    phone,
    age: randInt(18, 85),
    gender: pick(['male', 'female']),
  };
}

export function fakeAddress() {
  const state = pick(STATES);
  return {
    street: `${randInt(100, 9999)} ${pick(STREETS)}`,
    city: pick(CITIES),
    state: state.name,
    stateAbbr: state.abbr,
    zip: String(randInt(10000, 99999)),
    country: 'US',
  };
}

export function fakeCompany() {
  const name = `${pick(COMPANY_ADJECTIVES)}${pick(COMPANY_NOUNS)}`;
  const suffix = pick(COMPANY_SUFFIXES);
  const domain = `${name.toLowerCase()}${pick(TLD)}`;
  return {
    name: `${name} ${suffix}`,
    domain,
    email: `contact@${domain}`,
    phone: `+1${randInt(200, 999)}${randInt(200, 999)}${randInt(1000, 9999)}`,
    industry: pick(['Technology', 'Finance', 'Healthcare', 'Education', 'Retail', 'Manufacturing', 'Media', 'Energy']),
    catchPhrase: pick(PHRASES),
  };
}

export function fakeCreditCard() {
  // Generates Luhn-valid test numbers (NOT real cards)
  const prefixes = [
    { type: 'visa', prefix: '4', length: 16 },
    { type: 'mastercard', prefix: '5' + randInt(1, 5), length: 16 },
    { type: 'amex', prefix: '3' + pick(['4', '7']), length: 15 },
  ];
  const card = pick(prefixes);
  let number = card.prefix;
  while (number.length < card.length - 1) {
    number += randInt(0, 9);
  }
  // Luhn check digit
  let sum = 0;
  for (let i = 0; i < number.length; i++) {
    let d = parseInt(number[number.length - 1 - i], 10);
    if (i % 2 === 0) d *= 2;
    if (d > 9) d -= 9;
    sum += d;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  number += checkDigit;

  const expMonth = String(randInt(1, 12)).padStart(2, '0');
  const expYear = String(randInt(26, 30));
  return {
    type: card.type,
    number,
    expiry: `${expMonth}/${expYear}`,
    cvv: String(randInt(card.type === 'amex' ? 1000 : 100, card.type === 'amex' ? 9999 : 999)),
  };
}

export function fakeProduct() {
  const adjectives = ['Premium', 'Deluxe', 'Pro', 'Ultra', 'Essential', 'Classic', 'Smart', 'Eco'];
  const products = ['Widget', 'Gadget', 'Device', 'Tool', 'Kit', 'Pack', 'Module', 'System'];
  const categories = ['Electronics', 'Home', 'Office', 'Sports', 'Kitchen', 'Garden', 'Auto', 'Health'];
  const name = `${pick(adjectives)} ${pick(products)}`;
  const price = (Math.random() * 200 + 5).toFixed(2);
  return {
    name,
    category: pick(categories),
    price: parseFloat(price),
    currency: 'USD',
    sku: `SKU-${randInt(10000, 99999)}`,
    inStock: Math.random() > 0.2,
    rating: parseFloat((Math.random() * 3 + 2).toFixed(1)),
  };
}

export function fakeDate(options = {}) {
  const start = options.from ? new Date(options.from).getTime() : new Date('2020-01-01').getTime();
  const end = options.to ? new Date(options.to).getTime() : Date.now();
  const ts = randInt(start, end);
  const d = new Date(ts);
  return {
    iso: d.toISOString(),
    unix: Math.floor(ts / 1000),
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
    dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()],
  };
}

export function fakeProfile(count = 1) {
  count = Math.min(Math.max(1, count), 100);
  const profiles = [];
  for (let i = 0; i < count; i++) {
    const person = fakePerson();
    const address = fakeAddress();
    const company = fakeCompany();
    profiles.push({
      ...person,
      address,
      company: company.name,
      jobTitle: pick(['Developer', 'Designer', 'Manager', 'Analyst', 'Engineer', 'Consultant', 'Director', 'Specialist']),
      avatar: `https://i.pravatar.cc/150?u=${person.email}`,
    });
  }
  return count === 1 ? profiles[0] : profiles;
}
