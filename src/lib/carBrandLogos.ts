// Car brand logo resolver — resolves brand names to free CDN-hosted logos.
//
// Two sources are used:
//  1. vehiclespecs/brand-logos via jsDelivr — full-color brand logos (SVG).
//     https://cdn.jsdelivr.net/gh/vehiclespecs/brand-logos@main/<slug>-logo.svg
//  2. Simple Icons via cdn.simpleicons.org — monochrome brand marks (SVG).
//     https://cdn.simpleicons.org/<slug>
//
// BRAND_MISSING lists brands verified absent from BOTH sources; those get no
// logo (callers fall back to whatever they render without one).

const FULL_COLOR_BASE = 'https://cdn.jsdelivr.net/gh/vehiclespecs/brand-logos@main';

/** Verified full-color logos on jsDelivr (vehiclespecs/brand-logos). */
const FULL_COLOR: Record<string, string> = {
  'audi': 'audi',
  'bentley': 'bentley',
  'bmw': 'bmw',
  'citroën': 'citroen',
  'ferrari': 'ferrari',
  'fiat': 'fiat',
  'hyundai': 'hyundai',
  'isuzu': 'isuzu',
  'jaguar': 'jaguar',
  'jeep': 'jeep',
  'kia': 'kia',
  'lamborghini': 'lamborghini',
  'land rover': 'land-rover',
  'maruti suzuki': 'maruti',
  'mercedes-benz': 'mercedes-benz',
  'nissan': 'nissan',
  'opel': 'opel',
  'porsche': 'porsche',
  'renault': 'renault',
  'rolls-royce': 'rolls-royce',
  'skoda': 'skoda',
  'suzuki': 'suzuki',
  'toyota': 'toyota',
  'volkswagen': 'volkswagen',
  'volvo': 'volvo',
};

/** Verified monochrome marks on Simple Icons (used when #1 has no logo). */
const MONO: Record<string, string> = {
  'chevrolet': 'chevrolet',
  'ford': 'ford',
  'honda': 'honda',
  'mahindra': 'mahindra',
  'tata': 'tata',
  'ktm': 'ktm',
  // Motorcycle brands (verified on Simple Icons)
  'ducati': 'ducati',
  'suzuki': 'suzuki',
};

/** Verified missing on both CDNs — resolve to null immediately. */
const BRAND_MISSING = new Set([
  'datsun',
  'force',
  'hindustan motors',
  'lexus',
  'mg',
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
 * Prefers the full-color logo; falls back to the monochrome mark.
 */
export function getCarBrandLogoUrl(brand: string | null | undefined): string | null {
  if (!brand) return null;
  const key = brand.trim().toLowerCase();
  if (!key || key === 'other' || BRAND_MISSING.has(key)) return null;

  const full = FULL_COLOR[key];
  if (full) return `${FULL_COLOR_BASE}/${full}-logo.svg`;

  const mono = MONO[key];
  if (mono) return `https://cdn.simpleicons.org/${mono}`;

  return null;
}
