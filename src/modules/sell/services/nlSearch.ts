// Natural-language search for the marketplace.
// Parses a typed sentence like "used honda city in delhi under 2 lakh automatic"
// into the marketplace's EXISTING filters (category, location, budget, condition,
// structured details). 100% local — no external AI API: instant, free, offline-safe.
// If a real LLM is wired in later, only the internals change; the return shape stays.

import { SELL_CATEGORIES, SELL_LOCATIONS } from '../constants';

export interface NLFilters {
  category?: string;
  location?: string;
  priceMin?: string;
  priceMax?: string;
  condition?: 'new' | 'used';
  details: Record<string, string>;
  chips: string[];
  search: string; // residual keywords for plain text search
}

// ---- Category synonyms → SELL_CATEGORIES values (longest phrases matched first) ----
const CATEGORY_SYNONYMS: Record<string, string[]> = {
  car: ['car', 'cars', 'sedan', 'hatchback', 'suv', 'muv', 'coupe', 'saloon'],
  bike: ['bike', 'bikes', 'motorcycle', 'motorbike', 'scooter', 'scooty'],
  mobiles: ['mobile', 'mobiles', 'phone', 'phones', 'smartphone', 'android'],
  laptops: ['laptop', 'laptops', 'notebook', 'computer', 'pc'],
  furniture: ['sofa', 'bed', 'table', 'chair', 'wardrobe', 'furniture', 'desk', 'cot', 'mattress', 'cupboard'],
  'real-estate': ['flat', 'flats', 'apartment', 'house', 'plot', 'villa', 'property'],
  bicycles: ['bicycle', 'cycle'],
  appliances: ['fridge', 'refrigerator', 'washing machine', 'microwave', 'ac', 'air conditioner', 'cooler', 'geyser'],
  'photography-cameras': ['camera', 'dslr', 'gopro'],
  electronics: ['tv', 'television', 'headphones', 'earphones', 'airpods', 'speaker', 'home theatre'],
  'gaming-recreation': ['playstation', 'ps5', 'ps4', 'xbox', 'nintendo'],
  jobs: ['job', 'jobs', 'hiring', 'vacancy', 'internship'],
  pets: ['dog', 'puppy', 'cat', 'kitten', 'parrot', 'aquarium'],
  'books-publications': ['book', 'books', 'novel'],
  fashion: ['saree', 'kurta', 'jeans', 'shirt', 'tshirt', 't-shirt', 'dress', 'jacket', 'sweater', 'lehenga'],
  sneakers: ['sneakers', 'shoes', 'footwear'],
  'jewelry-accessories': ['watch', 'watches', 'necklace', 'earrings', 'bracelet'],
  'sports-outdoor': ['dumbbell', 'treadmill', 'gym equipment', 'cricket bat', 'badminton'],
  'musical-instruments': ['guitar', 'piano', 'drums', 'violin', 'flute', 'harmonium'],
  'baby-kids': ['stroller', 'pram', 'crib', 'toys', 'toy'],
  'tools-equipment': ['drill', 'ladder', 'screwdriver'],
};

// ---- City aliases → SELL_LOCATIONS values ----
const LOCATION_ALIASES: Record<string, string> = {
  bombay: 'Mumbai',
  bangalore: 'Bengaluru',
  madras: 'Chennai',
  calcutta: 'Kolkata',
  vizag: 'Visakhapatnam',
  trivandrum: 'Thiruvananthapuram',
  cochin: 'Kochi',
  mysore: 'Mysuru',
  'navi mumbai': 'Navi Mumbai',
  'new delhi': 'Delhi',
  ncr: 'Delhi',
};

// ---- Brand triggers → canonical details.brand value ----
const BRAND_WORDS: Record<string, string> = {
  'maruti suzuki': 'Maruti Suzuki', maruti: 'Maruti Suzuki',
  hyundai: 'Hyundai', tata: 'Tata', mahindra: 'Mahindra', toyota: 'Toyota',
  honda: 'Honda', kia: 'Kia', renault: 'Renault', nissan: 'Nissan', mg: 'MG',
  volkswagen: 'Volkswagen', vw: 'Volkswagen', skoda: 'Skoda', jeep: 'Jeep',
  bmw: 'BMW', mercedes: 'Mercedes-Benz', audi: 'Audi', volvo: 'Volvo',
  jaguar: 'Jaguar', 'land rover': 'Land Rover', porsche: 'Porsche', lexus: 'Lexus',
  isuzu: 'Isuzu', datsun: 'Datsun', fiat: 'Fiat', chevrolet: 'Chevrolet', ford: 'Ford',
  'rolls royce': 'Rolls-Royce', bentley: 'Bentley', ferrari: 'Ferrari',
  lamborghini: 'Lamborghini', 'hindustan motors': 'Hindustan Motors',
  hero: 'Hero', bajaj: 'Bajaj', tvs: 'TVS', 'royal enfield': 'Royal Enfield',
  yamaha: 'Yamaha', suzuki: 'Suzuki', ktm: 'KTM', jawa: 'Jawa', yezdi: 'Yezdi',
  ather: 'Ather', 'ola electric': 'Ola Electric', revolt: 'Revolt',
  'harley davidson': 'Harley-Davidson', kawasaki: 'Kawasaki', ducati: 'Ducati',
  benelli: 'Benelli', um: 'UM',
  apple: 'Apple', iphone: 'Apple', samsung: 'Samsung', oneplus: 'OnePlus',
  xiaomi: 'Xiaomi', redmi: 'Redmi', realme: 'Realme', vivo: 'Vivo', oppo: 'Oppo',
  motorola: 'Motorola', moto: 'Motorola', nothing: 'Nothing', pixel: 'Google Pixel',
  nokia: 'Nokia', iqoo: 'iQOO', asus: 'Asus', infinix: 'Infinix', tecno: 'Tecno',
  macbook: 'Apple MacBook', dell: 'Dell', hp: 'HP', lenovo: 'Lenovo', acer: 'Acer',
  msi: 'MSI', alienware: 'Alienware', razer: 'Razer',
};

// Brand → category inference. Only UNAMBIGUOUS brands (Honda also sells bikes, etc.)
const BRAND_CATEGORY: Record<string, string> = {
  'Maruti Suzuki': 'car', Ferrari: 'car', Lamborghini: 'car', 'Rolls-Royce': 'car',
  Bentley: 'car', Porsche: 'car', 'Hindustan Motors': 'car', Datsun: 'car',
  'Royal Enfield': 'bike', Jawa: 'bike', Yezdi: 'bike', Ather: 'bike',
  'Ola Electric': 'bike', Revolt: 'bike', KTM: 'bike', Ducati: 'bike',
  Kawasaki: 'bike', Benelli: 'bike', 'Harley-Davidson': 'bike', UM: 'bike',
  Apple: 'mobiles', Samsung: 'mobiles', OnePlus: 'mobiles', Xiaomi: 'mobiles',
  Redmi: 'mobiles', Realme: 'mobiles', Vivo: 'mobiles', Oppo: 'mobiles',
  Motorola: 'mobiles', Nothing: 'mobiles', 'Google Pixel': 'mobiles', Nokia: 'mobiles',
  iQOO: 'mobiles', Infinix: 'mobiles', Tecno: 'mobiles',
  'Apple MacBook': 'laptops', Dell: 'laptops', HP: 'laptops', Lenovo: 'laptops',
  Asus: 'laptops', Acer: 'laptops', MSI: 'laptops', Alienware: 'laptops', Razer: 'laptops',
};

const CONDITION_NEW = ['brand new', 'never used', 'unused', 'sealed'];
const CONDITION_USED = ['second hand', 'secondhand', 'pre owned', 'pre-owned', 'used', 'old'];
const OWNERSHIP_PHRASES: Record<string, string> = {
  'first owner': '1st owner',
  'second owner': '2nd owner',
  'third owner': '3rd owner',
  '4th owner': '4+ owner',
  'fourth owner': '4+ owner',
};

const CATEGORY_WORD_LIST: Array<{ word: string; category: string }> = (() => {
  const list: Array<{ word: string; category: string }> = [];
  for (const [cat, words] of Object.entries(CATEGORY_SYNONYMS)) {
    for (const w of words) list.push({ word: w, category: cat });
  }
  return list.sort((a, b) => b.word.length - a.word.length);
})();

const BRAND_KEYS = Object.keys(BRAND_WORDS).sort((a, b) => b.length - a.length);
const LOCATION_ALIAS_KEYS = [...Object.keys(LOCATION_ALIASES), ...SELL_LOCATIONS.filter((l) => l !== 'Other').map((l) => l.toLowerCase())]
  .sort((a, b) => b.length - a.length);
const CONDITION_ALL = [...CONDITION_NEW.map((w) => ({ word: w, cond: 'new' as const })), ...CONDITION_USED.map((w) => ({ word: w, cond: 'used' as const }))]
  .sort((a, b) => b.word.length - a.word.length);

// ---- helpers ----
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const has = (text: string, phrase: string) => new RegExp(`\\b${esc(phrase)}\\b`, 'i').test(text);
const cut = (text: string, phrase: string) => text.replace(new RegExp(`\\b${esc(phrase)}\\b`, 'i'), ' ');

const UNIT_MULTIPLIERS: Record<string, number> = {
  lakh: 1e5, lakhs: 1e5, lac: 1e5, lacs: 1e5,
  cr: 1e7, crore: 1e7, crores: 1e7,
  k: 1e3, thousand: 1e3,
};

// "3 lakh" → 300000; "50k" → 50000; bare numbers < 500 or year-like → null (not money)
const money = (num: string, unit?: string): number | null => {
  const v = parseFloat(num.replace(/,/g, ''));
  if (isNaN(v)) return null;
  let out = v;
  if (unit) {
    const m = UNIT_MULTIPLIERS[unit.toLowerCase()];
    if (!m) return null;
    out = v * m;
  } else {
    if (v < 500) return null;
    if (v >= 1900 && v <= 2030) return null; // a year, not a price
  }
  return Math.round(out);
};

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

const NUM = '([\\d,]+(?:\\.\\d+)?)';
const UNIT_RE = '(lakh|lakhs|lac|lacs|cr|crore|crores|k|thousand)?';
const CUR = '(?:rs\\.?|inr|₹)?\\s*';
const MAX_RE = new RegExp(`\\b(?:under|below|less than|upto|up to|within|max|maximum)\\s*${CUR}${NUM}\\s*${UNIT_RE}\\b`, 'i');
const MIN_RE = new RegExp(`\\b(?:above|over|more than|min|minimum)\\s*${CUR}${NUM}\\s*${UNIT_RE}\\b`, 'i');
const BETWEEN_RE = new RegExp(`\\bbetween\\s*${CUR}${NUM}\\s*${UNIT_RE}\\s*(?:and|to|&)\\s*${CUR}${NUM}\\s*${UNIT_RE}\\b`, 'i');
const RANGE_RE = new RegExp(`\\b${NUM}\\s*${UNIT_RE}\\s*(?:-|–|to)\\s*${CUR}${NUM}\\s*${UNIT_RE}\\b`, 'i');
const AROUND_RE = new RegExp(`\\b(?:around|about|approx|approximately)\\s*${CUR}${NUM}\\s*${UNIT_RE}\\b`, 'i');

export function parseNLSearch(rawInput: string): NLFilters | null {
  const original = rawInput.trim();
  if (!original) return null;
  let text = ` ${original.toLowerCase()} `;

  const chips: string[] = [];
  const details: Record<string, string> = {};
  let category: string | undefined;
  let location: string | undefined;
  let priceMin: string | undefined;
  let priceMax: string | undefined;
  let condition: 'new' | 'used' | undefined;
  let m: RegExpMatchArray | null;

  // --- kilometers (BEFORE price so "under 45,000 km" isn't read as money) ---
  m = text.match(new RegExp(`${NUM}\\s*(?:km|kms|kilometers?|kilometres?)\\b`, 'i'));
  if (m) {
    const km = parseInt(m[1].replace(/,/g, ''), 10);
    if (!isNaN(km) && km > 0) {
      details.kmsDriven = String(km);
      chips.push(`${km.toLocaleString('en-IN')} km`);
      text = text.replace(m[0], ' ');
    }
  }

  // --- transmission ---
  if (has(text, 'automatic')) { details.transmission = 'Automatic'; chips.push('Automatic'); text = cut(text, 'automatic'); }
  else if (has(text, 'manual')) { details.transmission = 'Manual'; chips.push('Manual'); text = cut(text, 'manual'); }

  // --- fuel ---
  for (const [word, val] of [['petrol', 'Petrol'], ['diesel', 'Diesel'], ['cng', 'CNG'], ['hybrid', 'Hybrid'], ['ev', 'Electric'], ['electric', 'Electric']] as const) {
    if (has(text, word)) { details.fuel = val; chips.push(val); text = cut(text, word); break; }
  }

  // --- condition (longest phrase first) ---
  for (const { word, cond } of CONDITION_ALL) {
    if (has(text, word)) { condition = cond; chips.push(cond === 'new' ? 'New' : 'Used'); text = cut(text, word); break; }
  }

  // --- ownership ---
  for (const [phrase, val] of Object.entries(OWNERSHIP_PHRASES)) {
    if (has(text, phrase)) { details.ownership = val; chips.push(val); text = cut(text, phrase); break; }
  }

  // --- brand (first match, longest trigger first) ---
  for (const key of BRAND_KEYS) {
    if (has(text, key)) {
      details.brand = BRAND_WORDS[key];
      chips.push(BRAND_WORDS[key]);
      text = cut(text, key);
      break;
    }
  }

  // --- year ---
  m = text.match(/\b(19[9]\d|20[0-2]\d)\b/);
  if (m) { details.year = m[1]; chips.push(m[1]); text = text.replace(m[0], ' '); }

  // --- RAM & storage ---
  m = text.match(/\b(\d{1,2})\s*gb\s*ram\b/i);
  if (m) { details.ram = `${m[1]} GB`; chips.push(`${m[1]} GB RAM`); text = text.replace(m[0], ' '); }
  else {
    m = text.match(/\b(\d{2,4})\s*(gb|tb)\b/i);
    if (m) { details.storage = `${m[1]} ${m[2].toUpperCase()}`; chips.push(`${m[1]} ${m[2].toUpperCase()}`); text = text.replace(m[0], ' '); }
  }

  // --- BHK (sets real-estate) ---
  m = text.match(/\b([1-5])\s*bhk\b/i);
  if (m) { details.bhk = `${m[1]} BHK`; chips.push(`${m[1]} BHK`); if (!category) category = 'real-estate'; text = text.replace(m[0], ' '); }

  // --- price ranges ---
  m = text.match(BETWEEN_RE);
  if (m && m[1] && m[3]) {
    const unitA = m[2] || m[4];
    const unitB = m[4] || m[2];
    const a = money(m[1], unitA);
    const b = money(m[3], unitB);
    if (a !== null && b !== null) {
      priceMin = String(Math.min(a, b));
      priceMax = String(Math.max(a, b));
      chips.push(`${inr(Math.min(a, b))}–${inr(Math.max(a, b))}`);
      text = text.replace(m[0], ' ');
    }
  }
  if (priceMax === undefined && priceMin === undefined) {
    m = text.match(RANGE_RE);
    if (m && m[1] && m[3]) {
      const unitA = m[2] || m[4];
      const unitB = m[4] || m[2];
      const a = money(m[1], unitA);
      const b = money(m[3], unitB);
      if (a !== null && b !== null) {
        priceMin = String(Math.min(a, b));
        priceMax = String(Math.max(a, b));
        chips.push(`${inr(Math.min(a, b))}–${inr(Math.max(a, b))}`);
        text = text.replace(m[0], ' ');
      }
    }
  }
  if (priceMax === undefined && priceMin === undefined) {
    m = text.match(MAX_RE);
    if (m) {
      const a = money(m[1], m[2]);
      if (a !== null) { priceMax = String(a); chips.push(`Under ${inr(a)}`); text = text.replace(m[0], ' '); }
    }
  }
  if (priceMax === undefined && priceMin === undefined) {
    m = text.match(MIN_RE);
    if (m) {
      const a = money(m[1], m[2]);
      if (a !== null) { priceMin = String(a); chips.push(`Above ${inr(a)}`); text = text.replace(m[0], ' '); }
    }
  }
  if (priceMax === undefined && priceMin === undefined) {
    m = text.match(AROUND_RE);
    if (m) {
      const a = money(m[1], m[2]);
      if (a !== null) {
        priceMin = String(Math.round(a * 0.85));
        priceMax = String(Math.round(a * 1.15));
        chips.push(`~${inr(a)}`);
        text = text.replace(m[0], ' ');
      }
    }
  }
  if (priceMax === undefined && priceMin === undefined && has(text, 'free')) {
    priceMax = '0';
    chips.push('Free');
    text = cut(text, 'free');
  }

  // --- category (longest synonym first) ---
  if (!category) {
    for (const { word, category: cat } of CATEGORY_WORD_LIST) {
      if (has(text, word)) { category = cat; text = cut(text, word); break; }
    }
  }
  // infer category from an unambiguous brand
  if (!category && details.brand) category = BRAND_CATEGORY[details.brand];

  // --- location (aliases + SELL_LOCATIONS, longest first) ---
  for (const key of LOCATION_ALIAS_KEYS) {
    if (has(text, key)) {
      location = LOCATION_ALIASES[key] ?? (SELL_LOCATIONS.find((l) => l.toLowerCase() === key) ?? undefined);
      if (location) { chips.push(location); text = cut(text, key); }
      break;
    }
  }

  // category chip
  if (category) {
    const label = SELL_CATEGORIES.find((c) => c.value === category)?.label;
    if (label) chips.unshift(label);
  }

  const structured =
    category !== undefined ||
    location !== undefined ||
    priceMin !== undefined ||
    priceMax !== undefined ||
    condition !== undefined ||
    Object.keys(details).length > 0;
  if (!structured) return null;

  // residual keywords: strip filler/intent words
  let search = text
    .replace(/\b(in|at|for|with|and|or|the|an?|of|near|nearby|me|my|want|wanted|need|needed|looking|buy|buying|sell|selling|urgent|urgently|good|condition|best|cheap|cheaper|affordable|budget|price|under|below|above|over|between|to|from|around|about|approx|rs|inr|less|than|more|max|min|upto|up|model|driver|driven)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (search.length < 2) search = '';

  return { category, location, priceMin, priceMax, condition, details, chips, search };
}

// Gate: should NL filtering engage at all for this input?
// Plain short keywords ("apple", "honda city", "sofa") must keep working as
// classic text search — the AI layer only takes over for sentence-like queries
// that carry concrete filters (price / condition / km / bhk) or 3+ words.
export function isNLSearchQuery(query: string, parsed: NLFilters | null): boolean {
  if (!parsed) return false;
  const q = query.trim();
  if (q.split(/\s+/).length >= 3) return true;
  const hasHardFilter =
    parsed.priceMin !== undefined ||
    parsed.priceMax !== undefined ||
    parsed.condition !== undefined ||
    parsed.details.kmsDriven !== undefined ||
    parsed.details.bhk !== undefined;
  return hasHardFilter;
}
