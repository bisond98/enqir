// Car brand logo resolver — resolves brand names to logo images.
//
// Car marques resolve to a locally stored mark in public/logos. Those files are
// the car-logos-dataset artwork cropped to its bounding box and normalised to a
// 160px height, so every logo fills the pill at the same visual size instead of
// floating small inside a padded canvas.
//
// Bike and other brands without a local file fall back to two free CDN sources:
//  1. vehiclespecs/brand-logos via jsDelivr — full-color brand logos (SVG).
//     https://cdn.jsdelivr.net/gh/vehiclespecs/brand-logos@main/<slug>-logo.svg
//  2. Simple Icons via cdn.simpleicons.org — monochrome brand marks (SVG).
//     https://cdn.simpleicons.org/<slug>
//
// BRAND_MISSING lists brands verified absent from ALL sources; those get no
// logo (callers fall back to whatever they render without one).

const LOCAL_BASE = '/logos';

/** Local trimmed logos: brand (lowercase) -> file name in public/logos. */
const LOCAL: Record<string, string> = {
  'ashok leyland': 'ashok-leyland',
  'aston martin': 'aston-martin',
  'audi': 'audi',
  'audi rs': 'audi-rs',
  'bentley': 'bentley',
  'bmw': 'bmw',
  'bmw m': 'bmw-m',
  'bharatbenz': 'bharatbenz',
  'byd': 'byd',
  'chevrolet': 'chevrolet',
  'citroën': 'citroen',
  'daewoo': 'daewoo',
  'daf': 'daf',
  'datsun': 'datsun',
  'eicher': 'eicher',
  'ferrari': 'ferrari',
  'fiat': 'fiat',
  'force': 'force',
  'ford': 'ford',
  'freightliner': 'freightliner',
  'hindustan motors': 'hindustan-motors',
  'hino': 'hino',
  'honda': 'honda',
  'hyundai': 'hyundai',
  'international': 'international',
  'isuzu': 'isuzu',
  'iveco': 'iveco',
  'jaguar': 'jaguar',
  'jeep': 'jeep',
  'kamaz': 'kamaz',
  'kenworth': 'kenworth',
  'kia': 'kia',
  'lamborghini': 'lamborghini',
  'land rover': 'land-rover',
  'lexus': 'lexus',
  'mack': 'mack',
  'mahindra': 'mahindra',
  'man': 'man',
  'maruti suzuki': 'maruti-suzuki',
  'maserati': 'maserati',
  'mclaren': 'mclaren',
  'mercedes-amg': 'mercedes-amg',
  'mercedes-benz': 'mercedes-benz',
  'mg': 'mg',
  'mini': 'mini',
  'mitsubishi': 'mitsubishi',
  'mitsubishi fuso': 'mitsubishi',
  'nissan': 'nissan',
  'opel': 'opel',
  'peugeot': 'peugeot',
  'peterbilt': 'peterbilt',
  'porsche': 'porsche',
  'premier': 'premier',
  'renault': 'renault',
  'scania': 'scania',
  'rolls-royce': 'rolls-royce',
  'san motors': 'san-motors',
  'skoda': 'skoda',
  'sml isuzu': 'isuzu',
  'tata': 'tata',
  'tesla': 'tesla',
  'toyota': 'toyota',
  'ud trucks': 'ud-trucks',
  'vinfast': 'vinfast',
  'volkswagen': 'volkswagen',
  'volvo': 'volvo',

  // Farm, construction and commercial makes
  'ace': 'ace',
  'altigreen': 'altigreen',
  'bajaj': 'bajaj',
  'bobcat': 'bobcat',
  'case': 'case',
  'claas': 'claas',
  'deutz-fahr': 'deutz-fahr',
  'doosan': 'doosan',
  'escorts': 'escorts',
  'etrio': 'etrio',
  'euler motors': 'euler-motors',
  'farmtrac': 'farmtrac',
  'hitachi': 'hitachi',
  'jbm auto': 'jbm-auto',
  'kobelco': 'kobelco',
  'komatsu': 'komatsu',
  'kubota': 'kubota',
  'liugong': 'liugong',
  'massey ferguson': 'massey-ferguson',
  'new holland': 'new-holland',
  'olectra': 'olectra',
  'piaggio': 'piaggio',
  'powertrac': 'powertrac',
  'sany': 'sany',
  'schwing stetter': 'schwing-stetter',
  'sonalika': 'sonalika',
  'swaraj': 'swaraj',
  'switch mobility': 'switch-mobility',
  'tafe': 'tafe',
  'takeuchi': 'takeuchi',
  'xcmg': 'xcmg',
  'yanmar': 'yanmar',
};

const FULL_COLOR_BASE = 'https://cdn.jsdelivr.net/gh/vehiclespecs/brand-logos@main';

/** Verified full-color logos on jsDelivr (vehiclespecs/brand-logos). */
const FULL_COLOR: Record<string, string> = {
  'suzuki': 'suzuki',
};

/** Verified monochrome marks on Simple Icons (used when nothing else has one). */
const MONO: Record<string, string> = {
  'caterpillar': 'caterpillar',
  'jcb': 'jcb',
  'john deere': 'johndeere',
  'ktm': 'ktm',
  // Motorcycle brands (verified on Simple Icons)
  'ducati': 'ducati',
  'suzuki': 'suzuki',
};

/** Verified missing on every CDN — resolve to null immediately. */
const BRAND_MISSING = new Set([
  // Motorcycle brands missing from both CDNs
  'ather',
  'bajaj',
  'benelli',
  'harley-davidson',
  'hero',
  'jawa',
  'kawasaki',
  'ola electric',
  'revolt',
  'royal enfield',
  'tvs',
  'um',
  'yezdi',
]);

/**
 * Returns a logo URL for a brand, or null when no logo is available.
 * Prefers the locally trimmed mark, then the CDN sources.
 */
export function getCarBrandLogoUrl(brand: string | null | undefined): string | null {
  if (!brand) return null;
  const key = brand.trim().toLowerCase();
  if (!key || key === 'other' || BRAND_MISSING.has(key)) return null;

  const local = LOCAL[key];
  if (local) return `${LOCAL_BASE}/${local}.png`;

  const full = FULL_COLOR[key];
  if (full) return `${FULL_COLOR_BASE}/${full}-logo.svg`;

  const mono = MONO[key];
  if (mono) return `https://cdn.simpleicons.org/${mono}`;

  return null;
}
