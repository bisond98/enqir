// Sneaker brand logo resolver — resolves sneaker brand names to free CDN-hosted logos.
//
// Source: Simple Icons via cdn.simpleicons.org — brand marks (SVG).
//   https://cdn.simpleicons.org/<slug>
//
// SNEAKER_MISSING lists brands verified absent from the CDN; those get no logo
// (callers fall back to whatever they render without one).

/** Verified monochrome brand marks on Simple Icons. */
const MONO: Record<string, string> = {
  'adidas': 'adidas',
  'anta': 'anta',
  'asics': 'asics',
  'converse': 'converse',
  'fila': 'fila',
  'jordan': 'jordan',
  'li-ning': 'lining',
  'new balance': 'newbalance',
  'nike': 'nike',
  'puma': 'puma',
  'reebok': 'reebok',
  'under armour': 'underarmour',
  'vans': 'vans',
};

/** Verified missing on the CDN — resolve to null immediately. */
const SNEAKER_MISSING = new Set([
  'balenciaga',
  'bata',
  'brooks',
  'campus',
  'crocs',
  'hoka',
  'k-swiss',
  'lacoste',
  'merrell',
  'mizuno',
  'on running',
  'salomon',
  'saucony',
  'skechers',
  'sparx',
  'veja',
  'woodland',
  'yeezy',
  'yonex',
]);

/**
 * Returns a logo URL for a sneaker brand, or null when no logo is available.
 */
export function getSneakerBrandLogoUrl(brand: string | null | undefined): string | null {
  if (!brand) return null;
  const key = brand.trim().toLowerCase();
  if (!key || key === 'other' || SNEAKER_MISSING.has(key)) return null;

  const mono = MONO[key];
  if (mono) return `https://cdn.simpleicons.org/${mono}`;

  return null;
}
