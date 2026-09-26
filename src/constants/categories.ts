// Single source of truth for categories across the app.
// Both the Sell form (CreateListing) and the Post Enquiry form (PostEnquiry)
// use this exact list — same categories, same count, same order.
// Main categories (Business / Personal / Service) always sit on top,
// followed by the most-used product categories.

export interface AppCategory {
  value: string;
  label: string;
}

export const APP_CATEGORIES: AppCategory[] = [
  // Main categories (always on top)
  { value: 'business', label: 'Business' },
  { value: 'personal', label: 'Personal' },
  { value: 'service', label: 'Service' },
  // Popular product categories
  { value: 'electronics', label: 'Electronics' },
  { value: 'mobiles', label: 'Mobiles' },
  { value: 'car', label: 'Car' },
  { value: 'bike', label: 'Motorcycle' },
  { value: 'laptops', label: 'Laptops' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'home', label: 'Home' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'vehicles', label: 'Vehicles' },
  // Everything else
  { value: 'agriculture-farming', label: 'Agriculture' },
  { value: 'antiques', label: 'Antiques' },
  { value: 'art', label: 'Art' },
  { value: 'baby-kids', label: 'Baby & Kids' },
  { value: 'bags-luggage', label: 'Bags & Luggage' },
  { value: 'books-publications', label: 'Books' },
  { value: 'beauty-products', label: 'Beauty' },
  { value: 'bicycles', label: 'Bicycles' },
  { value: 'childcare-family', label: 'Childcare' },
  { value: 'collectibles', label: 'Collectibles' },
  { value: 'construction-renovation', label: 'Construction' },
  { value: 'education-training', label: 'Education' },
  { value: 'entertainment-media', label: 'Entertainment' },
  { value: 'events-entertainment', label: 'Events' },
  { value: 'food-beverage', label: 'Food' },
  { value: 'gaming-recreation', label: 'Gaming' },
  { value: 'government-public', label: 'Government' },
  { value: 'health-beauty', label: 'Health' },
  { value: 'insurance-services', label: 'Insurance' },
  { value: 'jobs', label: 'Jobs' },
  { value: 'jewelry-accessories', label: 'Jewelry' },
  { value: 'legal-financial', label: 'Legal' },
  { value: 'marketing-advertising', label: 'Marketing' },
  { value: 'memorabilia', label: 'Memorabilia' },
  { value: 'musical-instruments', label: 'Musical Instruments' },
  { value: 'musical-accessories', label: 'Musical Accessories' },
  { value: 'musical-services', label: 'Musical Services' },
  { value: 'non-profit-charity', label: 'Non-Profit' },
  { value: 'office-supplies', label: 'Office Supplies' },
  { value: 'pets', label: 'Pets' },
  { value: 'photography-cameras', label: 'Photography & Cameras' },
  { value: 'fitness-gym-equipment', label: 'Fitness & Gym Equipment' },
  { value: 'garden-outdoor', label: 'Garden & Outdoor' },
  { value: 'kitchen-dining', label: 'Kitchen & Dining' },
  { value: 'raw-materials-industrial', label: 'Industrial' },
  { value: 'real-estate', label: 'Real Estate' },
  { value: 'real-estate-services', label: 'Real Estate Services' },
  { value: 'renewable-energy', label: 'Renewable Energy' },
  { value: 'cleaning-services', label: 'Cleaning Services' },
  { value: 'security-safety', label: 'Security' },
  { value: 'sneakers', label: 'Sneakers' },
  { value: 'souvenir', label: 'Souvenir' },
  { value: 'sports-outdoor', label: 'Sports' },
  { value: 'thrift', label: 'Thrift' },
  { value: 'technology', label: 'Technology' },
  { value: 'tools-equipment', label: 'Tools & Equipment' },
  { value: 'transportation-logistics', label: 'Transportation' },
  { value: 'travel-tourism', label: 'Travel' },
  { value: 'tutoring-lessons', label: 'Tutoring & Lessons' },
  { value: 'vintage', label: 'Vintage' },
  { value: 'waste-management', label: 'Waste Management' },
  { value: 'accommodations', label: 'Accommodations' },
  { value: 'wedding-events', label: 'Wedding' },
  { value: 'medical-equipment', label: 'Medical Equipment' },
  { value: 'appliances', label: 'Appliances' },
  { value: 'other', label: 'Other' },
];

// Accommodation subtypes — shown as a dropdown when the Accommodations
// category is selected in the Post Enquiry or Sell form.
// Stored on the doc as details.accommodationType (the value string).
export interface AccommodationSubtype {
  value: string;
  label: string;
}

export const ACCOMMODATION_SUBTYPES: AccommodationSubtype[] = [
  { value: 'campsite', label: 'Campsite / Eco-stay' },
  { value: 'cottage', label: 'Cottage' },
  { value: 'dormitory', label: 'Dormitory' },
  { value: 'flat-apartment', label: 'Flat / Apartment' },
  { value: 'guest-house', label: 'Guest House' },
  { value: 'homestay', label: 'Homestay' },
  { value: 'hostel', label: 'Hostel' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'house', label: 'House' },
  { value: 'lodging', label: 'Lodging' },
  { value: 'motel', label: 'Motel' },
  { value: 'pg', label: 'PG (Paying Guest)' },
  { value: 'private-room', label: 'Private Room' },
  { value: 'resort', label: 'Resort' },
  { value: 'service-apartment', label: 'Service Apartment' },
  { value: 'villa', label: 'Villa' },
];

// Shared-living subtypes where a gender preference is relevant — these get
// the gender selector (any / male / female / mixed) in the forms.
export const GENDER_RELEVANT_ACCOMMODATION_TYPES = new Set([
  'hostel',
  'dormitory',
  'pg',
  'lodging',
  'private-room',
]);

export const ACCOMMODATION_GENDER_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: 'male', label: 'Male only' },
  { value: 'female', label: 'Female only' },
  { value: 'mixed', label: 'Mixed' },
] as const;

// Repair / home-service types — shared by the Post Enquiry dropdown and the
// Sell form's repair-services detail fields so both stay in sync.
export const REPAIR_SERVICE_TYPES = [
  'AC repair & service',
  'Bike / scooter service',
  'Borewell drilling & repair',
  'Car detailing & wash',
  'Carpenter',
  'CCTV installation',
  'Chimney / hob repair',
  'Denting & painting (vehicle)',
  'Electrician',
  'EV charger installation',
  'False ceiling & gypsum work',
  'Fridge / Refrigerator repair',
  'Furniture assembly',
  'Geyser / water heater repair',
  'Home salon (beauty at home)',
  'Interior design & modular kitchen',
  'Inverter / battery service',
  'Laptop / Computer repair',
  'Laundry & ironing',
  'Locksmith',
  'Mechanic (vehicle)',
  'Mehndi artist',
  'Microwave / oven repair',
  'Mobile repair',
  'Movers & packers (local shifting)',
  'Painting',
  'Pest control',
  'Photography / videography',
  'Plastering & masonry',
  'Plumber',
  'Septic / sewage tank cleaning',
  'Solar panel installation & service',
  'Tailoring & stitching',
  'Tile & marble work',
  'TV repair',
  'Tyre repair & replacement',
  'Washing machine repair',
  'Water purifier (RO) service',
  'Water tank / well cleaning',
  'Welding & fabrication',
  'Woodwork / furniture making',
  'Other',
] as const;

// Categories where a New/Used condition makes no sense — properties, stays,
// pure services and perishables. The Sell form hides its condition selector
// for these and stores condition as empty.
export const NO_CONDITION_CATEGORIES = new Set([
  'real-estate',
  'service',
  'services',
  'pets',
  'accommodations',
  'food-beverage',
  'travel-tourism',
  'education-training',
  'tutoring-lessons',
  'wedding-events',
  'childcare-family',
  'health-beauty',
]);

// Legacy category values used by older posts in the database.
// Kept here so display/matching code can recognise them even though
// they no longer appear in the pickers.
export const LEGACY_CATEGORY_ALIASES: Record<string, string> = {
  'electronics-gadgets': 'electronics',
  'fashion-apparel': 'fashion',
  'home-furniture': 'home',
  'services': 'service',
  'repair-services': 'service',
  'automobile': 'vehicles',
};

// Category search synonyms — common words people type into category search
// that don't appear in the label ("shoes" → Sneakers, "phone" → Mobiles, ...).
// Shared by the Post Enquiry and Sell category pickers.
export const CATEGORY_SEARCH_SYNONYMS: Record<string, string[]> = {
  // Every repair/home-service type is a search keyword for Service, so typing
  // "plumber" or "ac repair" in the category search surfaces Service. Direct
  // category matches (e.g. "mobile" → Mobiles) still outrank it because label
  // matches score better than synonym matches in matchStrength().
  service: REPAIR_SERVICE_TYPES.filter(t => t !== 'Other').map(t => t.toLowerCase()),
  sneakers: ['shoe', 'shoes', 'footwear', 'trainers', 'sports shoes', 'running shoes'],
  fashion: ['clothes', 'clothing', 'apparel', 'dress', 'saree', 'sari', 'kurti', 'shirt', 'tshirt', 't-shirt', 'jeans', 'churidar', 'lehenga'],
  mobiles: ['phone', 'phones', 'smartphone', 'mobile phone', 'iphone', 'android', 'redmi', 'samsung phone', 'vivo', 'oppo', 'realme', 'oneplus'],
  laptops: ['computer', 'notebook', 'macbook', 'laptop', 'desktop', 'pc', 'imac'],
  electronics: ['tv', 'headphones', 'earphones', 'speaker', 'gadget', 'airpods', 'earbuds', 'headphone', 'smartwatch', 'smart watch', 'led tv', 'home theatre', 'soundbar', 'printer', 'projector'],
  bicycles: ['cycle', 'cycles', 'bicycle', 'bicycles', 'mtb', 'gear cycle'],
  car: ['vehicle', 'four wheeler', 'four-wheeler', '4 wheeler', '4-wheeler', 'car', 'cars', 'sedan', 'suv', 'hatchback'],
  vehicles: ['vehicle', 'vehicles', 'car', 'cars', 'four wheeler', 'four-wheeler', '4 wheeler', '4-wheeler', 'bike', 'motorcycle', 'two wheeler', 'auto rickshaw', 'autorickshaw', 'rikshaw', 'tempo', 'van', 'truck', 'lorry', 'bus', 'jeep', 'automobile', 'automobiles'],
  bike: ['motorcycle', 'motorcycles', 'motorbike', 'motorbikes', 'bike', 'bikes', 'scooter', 'scooters', 'two-wheeler', 'two wheeler', '2 wheeler', 'scooty', 'royal enfield', 'bullet', 'activa'],
  furniture: ['sofa', 'bed', 'table', 'chair', 'wardrobe', 'sofa set', 'dining table', 'mattress', 'study table', 'office chair', 'cot'],
  home: ['home appliance', 'household', 'interior', 'home decor', 'curtain', 'fan', 'cooler', 'home items'],
  'real-estate': ['flat', 'apartment', 'house', 'plot', 'land', 'property', 'stay', 'staying', 'lodge', 'hostel', 'motel', 'resort', 'homestay', 'guest house', 'pg', 'paying guest', 'room', 'accommodation', 'shop', 'commercial space', 'office space', 'godown', 'warehouse', 'showroom', 'building'],
  accommodations: ['stay', 'staying', 'lodge', 'lodging', 'hostel', 'motel', 'resort', 'homestay', 'villa', 'cottage', 'guest house', 'campsite', 'dormitory', 'pg', 'paying guest', 'service apartment', 'private room', 'room', 'hotel', 'accommodation', 'short stay', 'rent', 'room rent', 'hostel room', 'eco stay', 'farm stay'],
  appliances: ['fridge', 'refrigerator', 'washing machine', 'microwave', 'ac', 'air conditioner', 'inverter', 'water purifier', 'chimney', 'geyser'],
  'sports-outdoor': ['gym', 'fitness', 'cricket', 'badminton', 'football', 'bat', 'racket', 'skates', 'sports equipment'],
  'baby-kids': ['toys', 'stroller', 'pram', 'cradle', 'diaper', 'kids cycle', 'baby items', 'kids clothes'],
  pets: ['dog', 'cat', 'puppy', 'kitten', 'cow', 'goat', 'hen', 'bird', 'fish tank', 'aquarium', 'pet food'],
  'photography-cameras': ['dslr', 'camera lens', 'gopro', 'camera', 'tripod', 'drone'],
  'musical-instruments': ['guitar', 'piano', 'drums', 'keyboard', 'violin', 'flute', 'tabla', 'harmonium'],
  gaming: ['playstation', 'ps5', 'ps4', 'xbox', 'console'],
  jobs: ['job', 'vacancy', 'vacancies', 'hiring', 'naukri', 'recruitment', 'part time job', 'full time job', 'work', 'employment', 'staff needed'],
  'health-beauty': ['cosmetics', 'makeup', 'skincare', 'salon', 'parlour', 'beauty parlour', 'gym membership', 'wellness'],
  'beauty-products': ['cosmetics', 'makeup', 'skincare', 'salon', 'parlour', 'lipstick', 'perfume'],
  'fitness-gym-equipment': ['dumbbell', 'dumbbells', 'treadmill', 'gym setup', 'weights', 'barbell', 'exercise cycle', 'gym equipment'],
  'education-training': ['tuition', 'tuitions', 'tutor', 'classes', 'coaching', 'coaching centre', 'spoken english', 'training institute', 'study abroad'],
  'tutoring-lessons': ['tuition', 'tutor', 'classes', 'coaching', 'home tuition', 'online classes', 'spoken english', 'music teacher'],
  'cleaning-services': ['maid', 'house cleaning', 'housekeeping', 'deep cleaning', 'sofa cleaning', 'pest control'],
  'construction-renovation': ['builder', 'contractor', 'renovation', 'interior work', 'painting', 'civil work'],
  'events-entertainment': ['birthday', 'party', 'event management', 'stage', 'decorator', 'anchor', 'band'],
  'wedding-events': ['marriage', 'wedding hall', 'catering', 'wedding photographer', 'bridal makeup', 'mehndi'],
  'food-beverage': ['tiffin', 'catering', 'home food', 'bakery', 'cake', 'food delivery', 'breakfast', 'meals'],
  'transportation-logistics': ['movers', 'packers and movers', 'tempo', 'goods transport', 'shifting', 'logistics', 'delivery service', 'lorry', 'taxi', 'cab', 'cab service', 'taxi service'],
  'travel-tourism': ['tour package', 'taxi', 'cab', 'tempo traveller', 'travel agency', 'rental', 'trip'],
  'agriculture-farming': ['tractor', 'farm equipment', 'farming', 'livestock', 'poultry', 'seeds', 'fertilizer', 'coconut', 'rubber', 'arecanut'],
  'tools-equipment': ['drill machine', 'welding', 'generator', 'power tools', 'grinder', 'cutting machine'],
  'medical-equipment': ['wheelchair', 'hospital bed', 'oxygen cylinder', 'nebulizer', 'walker', 'bp monitor', 'glucometer'],
  'office-supplies': ['printer', 'xerox machine', 'office chair', 'office table', 'stationery', 'photocopier'],
  'raw-materials-industrial': ['industrial materials', 'raw materials', 'scrap', 'steel', 'cement'],
  'legal-financial': ['lawyer', 'advocate', 'chartered accountant', 'loan', 'tax filing'],
  'insurance-services': ['insurance', 'life insurance', 'term plan', 'policy'],
  'marketing-advertising': ['digital marketing', 'advertising', 'seo', 'social media marketing', 'branding'],
  'security-safety': ['cctv', 'security camera', 'security guard', 'alarm', 'door lock'],
  'renewable-energy': ['solar', 'solar panel', 'solar inverter', 'solar water heater'],
  'garden-outdoor': ['plants', 'garden tools', 'lawn', 'pots', 'seeds'],
  'kitchen-dining': ['cookware', 'mixie', 'mixer grinder', 'gas stove', 'induction', 'dining set', 'utensils'],
  'bags-luggage': ['bag', 'backpack', 'suitcase', 'trolley bag', 'travel bag', 'laptop bag'],
  'books-publications': ['book', 'books', 'textbook', 'novel', 'magazine', 'study material'],
  'jewelry-accessories': ['jewellery', 'gold', 'ring', 'necklace', 'chain', 'bangle', 'earring'],
  'childcare-family': ['babysitter', 'nanny', 'day care', 'daycare', 'elder care'],
  'entertainment-media': ['band', 'dj', 'orchestra', 'media', 'photography service'],
  'antiques': ['antique', 'vintage items', 'old coins', 'rare items'],
  'collectibles': ['coins', 'stamps', 'collectible', 'figurine'],
  'memorabilia': ['signed', 'autograph', 'memorabilia'],
  'vintage': ['vintage', 'retro', 'old items'],
  'thrift': ['second hand', 'used', 'pre owned', 'preowned'],
  'waste-management': ['scrap dealer', 'waste collection', 'recycling', 'garbage'],
  'government-public': ['government', 'public sector', 'psc'],
  'non-profit-charity': ['charity', 'ngo', 'donation', 'volunteer'],
  'technology': ['tech', 'software', 'app development', 'website', 'it services'],
  'business': ['business for sale', 'franchise', 'partnership', 'investor'],
  'art': ['painting', 'artwork', 'sketch', 'portrait'],
};

/**
 * Levenshtein edit distance, capped at `max` — returns `max + 1` once the
 * distance provably exceeds max, so it stays fast for short strings.
 */
function boundedLevenshtein(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const prev = new Array(b.length + 1).fill(0).map((_, i) => i);
  const curr = new Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    let rowMin = curr[0];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      rowMin = Math.min(rowMin, curr[j]);
    }
    if (rowMin > max) return max + 1;
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
}

/** Match strength for a query against a category's label / value / synonyms.
 * Lower is better: 0 = whole-word match on the label ("car" → Car),
 * 1 = whole-word match on value or a synonym, 2 = query starts the word
 * (only for 4+ letter queries, so "car" ≠ "care"), 3+ = fuzzy typo match.
 * -1 = no match. Used to rank categories so exact hits always come first. */
function matchStrength(c: AppCategory, q: string): number {
  const labelLower = c.label.toLowerCase();
  const labelWords = labelLower.split(/[^a-z0-9]+/).filter(Boolean);
  const synStrings = [
    c.value,
    ...(CATEGORY_SEARCH_SYNONYMS[c.value] ?? []),
  ];
  const otherWords = synStrings.flatMap(s => s.toLowerCase().split(/[^a-z0-9]+/)).filter(Boolean);

  if (labelWords.includes(q)) return 0;
  // Exact whole-word label hit ranks best, then a label word starting with
  // the query, then exact synonym hits (includes service-type keywords like
  // "plumber"), then phrase/prefix matches. Keeping direct category matches
  // ahead of service-keyword matches means "mobile" shows Mobiles first and
  // Service (via "Mobile repair") second.
  if (q.length >= 3 && labelWords.some(w => w.startsWith(q))) return 1;
  if (otherWords.includes(q)) return 2;
  // Multi-word synonyms/phrases: "four wheeler" should match the full phrase,
  // not just its individual words.
  if (q.includes(' ') && synStrings.some(s => s.toLowerCase().includes(q))) return 3;
  if (q.includes(' ') && labelLower.includes(q)) return 1;

  // Prefix matching from 3 letters on labels (so "agr" finds Agriculture),
  // but synonyms need 4+ letters (so "car" doesn't match "care"/"carpenter").
  if (q.length >= 4 && otherWords.some(w => w.startsWith(q))) return 4;
  return -1;
}

/**
 * Filter categories by a search query, matching label, value, and synonyms.
 * Used by the category pickers so words like "shoes" find Sneakers.
 *
 * Results are ranked by match strength (exact label match → synonym match →
 * prefix match), then padded with fuzzy near-matches and finally the three
 * main categories (Service / Business / Personal) as catch-alls so users
 * always have somewhere to post — e.g. "taxi" shows Travel, Transportation
 * AND Service.
 */
export function filterCategoriesBySearch<T extends AppCategory>(categories: T[], query: string, minResults = 3): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return categories;

  const scored: Array<{ c: T; s: number }> = [];
  for (const c of categories) {
    const s = matchStrength(c, q);
    if (s >= 0) scored.push({ c, s });
  }
  scored.sort((a, b) => a.s - b.s);
  const direct = scored.map(x => x.c);
  if (direct.length >= minResults) return direct;

  const chosen = new Set(direct.map(c => c.value));
  const result = [...direct];

  // Tier 2: fuzzy near-matches (typos / close spellings), only for queries of
  // 4+ chars, and only against words of 5+ chars so short words like "tax"
  // or "shop" don't fuzzy-match unrelated queries ("taxi", "shoe").
  if (q.length >= 4) {
    const threshold = Math.min(2, Math.floor(q.length / 4));
    const wordsOf = (c: AppCategory): string[] => {
      const words = c.label.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length >= 5);
      for (const syn of CATEGORY_SEARCH_SYNONYMS[c.value] ?? []) {
        words.push(...syn.split(/[^a-z0-9]+/).filter(w => w.length >= 5));
      }
      return words;
    };
    const fuzzy = categories
      .filter(c => !chosen.has(c.value))
      .map(c => {
        let best = Infinity;
        for (const w of wordsOf(c)) best = Math.min(best, boundedLevenshtein(q, w, threshold));
        return { c, best };
      })
      .filter(x => x.best <= threshold)
      .sort((a, b) => a.best - b.best);
    for (const f of fuzzy) {
      if (result.length >= minResults) break;
      chosen.add(f.c.value);
      result.push(f.c);
    }
  }

  // Tier 3: main categories as catch-alls so users always have a fallback.
  for (const mainValue of ['service', 'business', 'personal']) {
    if (result.length >= minResults) break;
    const main = categories.find(c => c.value === mainValue);
    if (main && !chosen.has(main.value)) {
      chosen.add(main.value);
      result.push(main);
    }
  }
  return result;
}
