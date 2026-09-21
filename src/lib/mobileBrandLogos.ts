// Mobile brand logo resolver — resolves mobile brand names to free CDN-hosted logos.
//
// Source: Simple Icons via cdn.simpleicons.org — brand marks (SVG).
//   https://cdn.simpleicons.org/<slug>
//
// MOBILE_MISSING lists brands verified absent from the CDN; those get no logo
// (callers fall back to whatever they render without one).

/** Verified monochrome brand marks on Simple Icons. */
const MONO: Record<string, string> = {
  'apple': 'apple',
  'asus': 'asus',
  'google': 'google',
  'honor': 'honor',
  'jio': 'jio',
  'lenovo': 'lenovo',
  'motorola': 'motorola',
  'nokia': 'nokia',
  'nothing': 'nothing',
  'oneplus': 'oneplus',
  'oppo': 'oppo',
  'samsung': 'samsung',
  'vivo': 'vivo',
  'xiaomi': 'xiaomi',
};

/** Verified missing on the CDN — resolve to null immediately. */
const MOBILE_MISSING = new Set([
  'infinix',
  'iqoo',
  'itel',
  'karbonn',
  'lava',
  'micromax',
  'realme',
  'redmi',
  'tecno',
]);

/**
 * Returns a logo URL for a mobile brand, or null when no logo is available.
 */
export function getMobileBrandLogoUrl(brand: string | null | undefined): string | null {
  if (!brand) return null;
  const key = brand.trim().toLowerCase();
  if (!key || key === 'other' || MOBILE_MISSING.has(key)) return null;

  const mono = MONO[key];
  if (mono) return `https://cdn.simpleicons.org/${mono}`;

  return null;
}
