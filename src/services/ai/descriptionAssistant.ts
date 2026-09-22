/**
 * Local AI Description Assistant (no external API, zero cost, works offline).
 *
 * Used by the Post Enquiry form's "✨ Write it for me" button:
 * - generateDescription(): builds a clean, professional description from the
 *   info the user already filled (title, category, vehicle details, budget,
 *   location, condition fields like km/ownership/accidents/registration).
 * - improveDescription(): polishes a user-typed description (fixes casing,
 *   spacing, repeated words, adds missing structured details) and returns a
 *   suggestion the user can accept or reject. Never overwrites silently.
 *
 * Category-aware: car/vehicles/bike get rich vehicle sentences; other
 * categories get a tidy generic cleanup.
 */

export interface DescriptionInput {
  title?: string;
  category?: string; // primary category key, e.g. 'car' | 'vehicles' | 'bike' | 'mobiles' | ...
  categories?: string[]; // multi-select category keys
  budget?: string | number;
  location?: string;
  deadline?: Date | string | null;
  notes?: string;
  // Vehicle details captured by the form (cars/bikes)
  vehicleDetails?: {
    brand?: string;
    year?: string;
    variant?: string;
    transmission?: string;
    fuelType?: string;
  };
  // Condition fields captured in `details` for used vehicles
  conditionFields?: Record<string, string>; // e.g. { condition: 'Used', kmsDriven: '45000', ownership: 'First Owner', accidentHistory: 'No accidents', registrationState: 'KL — Kerala' }
  // Mobile details
  mobileDetails?: { brand?: string; ram?: string; memory?: string };
  // Real-estate extras
  estate?: { type?: string; dealType?: string; area?: string; unit?: string; bhk?: string };
  isJobEnquiry?: boolean;
}

const VEHICLE_CATEGORIES = ['car', 'vehicles', 'vehicle', 'automobile', 'bike', 'bikes', 'motorcycle', 'scooter'];

export const isVehicleCategory = (category?: string, categories?: string[]): boolean =>
  [category, ...(categories || [])].some((c) => c && VEHICLE_CATEGORIES.includes(c.toLowerCase()));

const titleCase = (s: string): string =>
  s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

const formatBudget = (budget?: string | number): string => {
  if (!budget && budget !== 0) return '';
  const n = typeof budget === 'string' ? Number(budget.replace(/[^0-9.]/g, '')) : budget;
  if (!n || Number.isNaN(n)) return typeof budget === 'string' ? budget : '';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(n % 10000000 === 0 ? 0 : 2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 2)} Lakh`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`;
  return `₹${n}`;
};

const KM_LABELS: Record<string, string> = {
  'no accidents': 'no accident history',
  'minor accidents': 'minor accident history (repaired)',
  'major accidents': 'major accident history (disclosed)',
};

/**
 * Build a professional description from structured form data.
 */
export const generateDescription = (input: DescriptionInput): string => {
  const parts: string[] = [];
  const wants = (input.title || '').trim();
  const condition = input.conditionFields || {};

  if (isVehicleCategory(input.category, input.categories)) {
    const v = input.vehicleDetails || {};
    const bits: string[] = [];
    if (v.year) bits.push(v.year);
    if (v.brand) bits.push(titleCase(v.brand));
    if (v.variant) bits.push(v.variant.trim());
    const veh = bits.join(' ');

    const cond = (condition.condition || '').toLowerCase();
    const opener = wants
      ? `Looking for ${/^[aeiou]/i.test(wants) ? 'an' : 'a'} ${wants.replace(/^(need|want|looking for)\s+/i, '')}`.trim()
      : veh
        ? `Looking for ${/^[aeiou]/i.test(veh) ? 'an' : 'a'} ${veh}`
        : 'Looking for a vehicle';

    let line1 = opener;
    if (veh && !wants) line1 += ` — ${v.year || ''}${v.year && v.brand ? ' ' : ''}${titleCase(v.brand || '')}`.trim();
    line1 += '.';
    parts.push(line1.replace(/\s+/g, ' '));

    const specBits: string[] = [];
    if (v.fuelType) specBits.push(`${v.fuelType.toLowerCase()} fuel`);
    if (v.transmission) specBits.push(`${v.transmission.toLowerCase()} transmission`);
    const km = condition.kmsDriven?.replace(/[^0-9]/g, '');
    if (km) specBits.push(`around ${Number(km).toLocaleString('en-IN')} km driven`);
    if (cond === 'used' || km) {
      if (condition.ownership) specBits.push(`${condition.ownership.toLowerCase()} owner`);
      if (condition.accidentHistory) specBits.push(KM_LABELS[condition.accidentHistory.toLowerCase()] || condition.accidentHistory.toLowerCase());
      if (condition.registrationState) specBits.push(`registered in ${condition.registrationState}`);
    }
    if (specBits.length) parts.push(`Prefer: ${specBits.join(', ')}.`);

    if (input.budget) parts.push(`Budget up to ${formatBudget(input.budget)}.`);
  } else if (input.mobileDetails && (input.mobileDetails.brand || input.mobileDetails.ram)) {
    const m = input.mobileDetails;
    const bits = [m.brand && titleCase(m.brand), m.ram && `${m.ram} RAM`, m.memory && m.memory].filter(Boolean).join(', ');
    parts.push(`Looking for ${/^[aeiou]/i.test(wants || bits) ? 'an' : 'a'} ${wants || bits}.`.replace(/\s+/g, ' '));
    if (input.budget) parts.push(`Budget up to ${formatBudget(input.budget)}.`);
  } else {
    parts.push(wants ? `Looking for: ${wants.replace(/^(need|want|looking for)\s+/i, '')}.` : 'Please describe your requirement below.');
  }

  if (input.location) parts.push(`Location: ${input.location}.`);

  if (input.deadline) {
    const d = typeof input.deadline === 'string' ? new Date(input.deadline) : input.deadline;
    if (!Number.isNaN(d.getTime())) {
      parts.push(`Needed by ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}.`);
    }
  }

  if (input.notes && input.notes.trim()) parts.push(input.notes.trim().replace(/\s+$/, ''));

  return parts.join(' ').replace(/\s{2,}/g, ' ').trim().slice(0, 497) + (parts.join(' ').length > 497 ? '...' : '');
};

/**
 * Clean up user-typed text: fix spacing/punctuation/casing, collapse repeated
 * words, capitalize sentences. Conservative — never invents facts.
 *
 * Grammar engine (local, no API): also fixes articles (a/an), capitalizes "i",
 * removes filler words, splits run-on sentences, and applies common
 * professional phrasing replacements. Safe, rule-based, never invents facts.
 */

// Common informal/incorrect phrases -> professional phrasing (case-insensitive, word-boundary)
const PHRASE_FIXES: [RegExp, string][] = [
  [/\bdo the needful\b/gi, 'take the necessary action'],
  [/\bkindly do the needful\b/gi, 'please take the necessary action'],
  [/\bpls?\b/gi, 'please'],
  [/\bplz\b/gi, 'please'],
  [/\bthx\b/gi, 'thanks'],
  [/\bu\b/g, 'you'],
  [/\bur\b/g, 'your'],
  [/\br\b/g, 'are'],
  [/\byrs\b/gi, 'years'],
  [/\bwanna\b/gi, 'want to'],
  [/\bgonna\b/gi, 'going to'],
  [/\bcuz\b/gi, 'because'],
  [/\bcos\b/gi, 'because'],
  [/\basap\b/gi, 'as soon as possible'],
  [/\bxd\b/gi, ''],
  [/\bcolleg\b/gi, 'college'],
  [/\bvi good\b/gi, 'very good'],
  [/\bmuch good\b/gi, 'good'],
  [/\bvery much good\b/gi, 'very good'],
  [/\bmore better\b/gi, 'better'],
  [/\bmost best\b/gi, 'best'],
  [/\breturn back\b/gi, 'return'],
  [/\brevert back\b/gi, 'reply'],
  [/\bdiscuss about\b/gi, 'discuss'],
  [/\bpassout\b/gi, 'graduate'],
  [/\bpassed out from\b/gi, 'graduated from'],
  [/\bin charge of\b/gi, 'in charge of'],
  [/\bgood in\b/gi, 'good at'],
  [/\bcope up with\b/gi, 'cope with'],
  [/\border for\b/gi, 'order'],
  [/\bdiscussing about\b/gi, 'discussing'],
  [/\bmyself +\b/gi, 'I am '], // "Myself Ravi" -> "I am Ravi" — common Indian-English intro
];

// Filler words to drop (with surrounding space cleanup after)
const FILLER_WORDS = ['basically', 'actually', 'literally', 'obviously', 'seriously', 'frankly', 'like i mean', 'you know', 'i mean like', 'matlab', 'means to say'];

// Words that start a sentence and are almost always followed by an article-less noun in this domain
const ARTICLE_FIX_NOUNS = ['car', 'bike', 'scooter', 'house', 'flat', 'apartment', 'phone', 'laptop', 'sofa', 'table', 'fridge', 'washing machine', ' AC ', 'television', 'TV', 'bicycle', 'camera', 'room', 'shop', 'office', 'service', 'driver', 'cook', 'teacher', 'tutor', 'plumber', 'electrician', 'job', 'candidate', 'machine', 'mattress', 'wardrobe', 'printer', 'monitor', 'heater', 'fan', 'chair'];

const applyArticleFixes = (t: string): string => {
  // a + vowel -> an (simple heuristic; ignore "a one", "a euro", "a uni")
  let out = t.replace(/\ba ([aeiou]\w*)/g, (m, w) => (/^(one|once|uni|use|user|eu|euro)/i.test(w) ? m : `an ${w}`));
  // "an + consonant" -> "a"
  out = out.replace(/\ban ([bcdfgjklmnpqrstvwxyz]\w*)/g, 'a $1');
  return out;
};

// Brand/model words that signal a product name (from shared brand lists + common models)
const PRODUCT_BRANDS = ['innova', 'swift', 'creta', 'fortuner', 'seltos', 'venue', 'brezza', 'baleno', 'wagonr', 'alto', 'city', 'amaze', 'verna', 'verna', 'i20', 'i10', 'nexon', 'punch', 'harrier', 'safari', 'thar', 'scorpio', 'xuv', 'bolero', 'pulsar', 'apache', 'splendor', 'passion', 'sh Activa'.toLowerCase(), 'sh activa', 'shine', 'fzs', 'r15', 'mt15', 'hunter', 'bullet', 'classic', 'iphone', 'galaxy', 'redmi', 'realme', 'poco', 'pixel', 'macbook', 'thinkpad', 'vivobook', 'pavilion', 'xuv700', 'carens', 'sonet', 'slavia', 'virtus', 'taigun', 'kushaq', 'ecosport', 'figo', 'freestyle', 'dsl', 'petrol' ];

const isBrandWord = (w: string): boolean => PRODUCT_BRANDS.includes(w.toLowerCase());

/**
 * Sentence restructuring for telegraphic/product-style fragments.
 * Turns keyword dumps into full sentences, e.g.:
 *   "looking innova black color" -> "Looking for an Innova in black colour."
 *   "want swift red 2020"       -> "Want a Swift in red, 2020 model."
 *   "need 2bhk near metro"      -> "Need a 2BHK near the metro."
 * Rule-based, conservative: only rewrites when the text looks like a fragment
 * (no verb phrase patterns it can't handle are touched).
 */
const restructureFragment = (t: string): string => {
  let s = t.trim();
  const lower = s.toLowerCase();

  // Already a full sentence? Don't over-edit.
  if (s.split(/\s+/).length > 14) return s;

  // Pattern 1: "looking [for] X" where X is a product fragment
  const lookingM = lower.match(/^(looking|searching|seeking)(\s+for)?\s+(.+)$/);
  if (lookingM) {
    const verb = lookingM[1].charAt(0).toUpperCase() + lookingM[1].slice(1);
    let rest = lookingM[3].trim();
    // Colour words -> "in <colour> colour"
    const COLOURS = ['black', 'white', 'red', 'blue', 'grey', 'gray', 'silver', 'golden', 'gold', 'brown', 'green', 'orange', 'yellow', 'maroon', 'beige', 'purple'];
    for (const c of COLOURS) {
      rest = rest.replace(new RegExp(`\\b${c}(\\s+(colou?r))\\b`, 'i'), `in ${c} colour`);
      rest = rest.replace(new RegExp(`\\b${c}\\b`, 'i'), `in ${c}`);
      break; // only first colour mention
    }
    // Year -> "2020 model"
    rest = rest.replace(/\b(19|20)\d{2}\b/, (m) => `${m} model`);
    // Brand word needs an article: "innova" -> "an Innova", "swift" -> "a Swift"
    const words = rest.split(/\s+/);
    if (words.length && isBrandWord(words[0])) {
      const art = /^[aeiou]/i.test(words[0]) ? 'an' : 'a';
      rest = `${art} ${words[0].charAt(0).toUpperCase() + words[0].slice(1)}${words.length > 1 ? ' ' + words.slice(1).join(' ') : ''}`;
    } else if (/^\d/.test(rest)) {
      // numeric fragment like "2bhk near metro" -> "a 2BHK near metro"
      rest = `a ${rest}`;
    }
    s = `${verb} for ${rest}`.replace(/\s{2,}/g, ' ').trim();
    if (!/[.!?]$/.test(s)) s += '.';
    return s;
  }

  // Pattern 2: "want/need X ..." fragment
  const wantM = lower.match(/^(want|needs?|wants?)\s+(.+)$/);
  if (wantM) {
    const verb = wantM[1].toLowerCase() === 'need' ? 'Need' : wantM[1].toLowerCase() === 'needs' ? 'Needs' : wantM[1].toLowerCase() === 'wants' ? 'Wants' : 'Want';
    let rest = wantM[2].trim();
    const COLOURS = ['black', 'white', 'red', 'blue', 'grey', 'gray', 'silver', 'golden', 'gold', 'brown', 'green', 'orange', 'yellow', 'maroon', 'beige', 'purple'];
    for (const c of COLOURS) {
      rest = rest.replace(new RegExp(`\\b${c}(\\s+colou?r)\\b`, 'i'), `in ${c} colour`);
      rest = rest.replace(new RegExp(`\\b${c}\\b`, 'i'), `in ${c}`);
      break;
    }
    rest = rest.replace(/\b(19|20)\d{2}\b/, (m) => `${m} model`);
    const words = rest.split(/\s+/);
    if (words.length && isBrandWord(words[0])) {
      const art = /^[aeiou]/i.test(words[0]) ? 'an' : 'a';
      rest = `${art} ${words[0].charAt(0).toUpperCase() + words[0].slice(1)}${words.length > 1 ? ' ' + words.slice(1).join(' ') : ''}`;
    } else if (/^\d/.test(rest)) {
      rest = `a ${rest}`;
    }
    s = `${verb} ${rest}`.replace(/\s{2,}/g, ' ').trim();
    if (!/[.!?]$/.test(s)) s += '.';
    return s;
  }

  return s;
};

export const cleanText = (raw: string): string => {
  let t = raw.replace(/\s+/g, ' ').trim();
  // Sentence restructuring for telegraphic fragments ("looking innova black color" -> "Looking for an Innova in black colour.")
  t = restructureFragment(t);
  // Collapse immediate repeated words ("car car" -> "car")
  t = t.replace(/\b(\w+)( \1\b)+/gi, '$1');
  // Professional phrase replacements
  for (const [re, rep] of PHRASE_FIXES) {
    t = t.replace(re, rep);
  }
  // Remove filler words
  for (const f of FILLER_WORDS) {
    t = t.replace(new RegExp(`\\b${f.replace(/ /g, '\\s+')}\\b[,]?\\s*`, 'gi'), '');
  }
  // "i" -> "I" always (standalone)
  t = t.replace(/\bi\b/g, 'I');
  // "i'm/i've/i'll" already capital handled by \bi\b? No: fix contractions too
  t = t.replace(/\bi(')(m|ve|ll|d)\b/g, (_m, ap, rest) => `I${ap}${rest}`);
  // Article fixes
  t = applyArticleFixes(t);
  // Space before punctuation, remove doubled punctuation (keep ellipses)
  t = t.replace(/\s+([,.!?;:])/g, '$1').replace(/([,.!?;:]){2,}/g, '$1');
  // Split very long run-ons at " and then ", " so that ", " but " when sentence > 30 words
  const words = t.split(' ');
  if (words.length > 30 && !/[.!?]/.test(t.slice(1))) {
    t = t.replace(/,? (and then|then|so|but) /gi, (m, c) => `. ${c.charAt(0).toUpperCase()}${c.slice(1)} `);
  }
  // Ensure sentence-ending punctuation
  if (t && !/[.!?]$/.test(t)) t += '.';
  // Capitalize first letter of sentences
  t = t.replace(/(^|[.!?]\s+)([a-z])/g, (_, p, c) => p + c.toUpperCase());
  // Tidy leftover double spaces
  t = t.replace(/\s{2,}/g, ' ').trim();
  return t;
};

export interface ImproveResult {
  suggestion: string;
  additions: string[]; // structured details the AI added that were missing from the typed text
}

/**
 * Improve a user-typed description: clean it, and append any structured info
 * the user filled in but didn't mention (vehicle specs, condition, budget,
 * location). Returned as a suggestion — caller shows Accept/Reject.
 */
export const improveDescription = (raw: string, input: DescriptionInput): ImproveResult => {
  const cleaned = cleanText(raw);
  const additions: string[] = [];
  const lower = cleaned.toLowerCase();
  const condition = input.conditionFields || {};

  const addIfMissing = (text: string, needle: string) => {
    if (!needle || lower.includes(needle.toLowerCase())) return;
    additions.push(text);
  };

  if (isVehicleCategory(input.category, input.categories)) {
    const v = input.vehicleDetails || {};
    const vehName = [v.year, v.brand && titleCase(v.brand), v.variant].filter(Boolean).join(' ');
    addIfMissing(vehName, vehName);
    if (v.fuelType) addIfMissing(`${v.fuelType.toLowerCase()} fuel`, v.fuelType.toLowerCase());
    if (v.transmission) addIfMissing(`${v.transmission.toLowerCase()} transmission`, v.transmission.toLowerCase());
    const km = condition.kmsDriven?.replace(/[^0-9]/g, '');
    if (km) addIfMissing(`around ${Number(km).toLocaleString('en-IN')} km driven`, 'km');
    if (condition.ownership) addIfMissing(`${condition.ownership.toLowerCase()} owner`, 'owner');
    if (condition.accidentHistory) addIfMissing(KM_LABELS[condition.accidentHistory.toLowerCase()] || condition.accidentHistory, 'accident');
    if (condition.registrationState) addIfMissing(`registered in ${condition.registrationState}`, condition.registrationState.split('—')[0].trim().toLowerCase());
  }

  if (input.budget) addIfMissing(`budget up to ${formatBudget(input.budget)}`, 'budget');
  if (input.location) addIfMissing(`located in ${input.location}`, input.location.toLowerCase().split(',')[0].trim());

  const suggestion = additions.length
    ? `${cleaned} ${additions.join(', ')}.`.replace(/\s{2,}/g, ' ')
    : cleaned;

  return { suggestion: suggestion.slice(0, 500), additions };
};

/**
 * Seller-side opener for response forms: turns the auto-filled response title
 * (the enquiry title, e.g. "2008 Hero Honda Splendor Plus") into a seller
 * voice opener — "I have a 2008 Hero Honda Splendor Plus available." — and
 * grammar-cleans any typed text the seller added. Used by the Respond form's
 * pen icon so empty/fragment text still reads like a seller, never a buyer.
 */
export const buildResponseDescription = (typed: string, responseTitle: string): string => {
  const wants = (responseTitle || '').trim().replace(/^(need|want|looking for)\s+/i, '');
  const article = /^[aeiou]/i.test(wants) ? 'an' : 'a';
  const opener = wants ? `I have ${article} ${wants} available.` : '';
  const cleanedTyped = typed.trim() ? cleanText(typed) : '';
  if (!opener) return cleanedTyped;
  if (!cleanedTyped) return opener;
  // Avoid duplicating the opener if the seller already wrote essentially that
  const lower = cleanedTyped.toLowerCase();
  if (lower.includes('i have') || lower.includes(wants.toLowerCase())) return cleanedTyped;
  return `${opener} ${cleanedTyped}`.replace(/\s{2,}/g, ' ').trim().slice(0, 500);
};
