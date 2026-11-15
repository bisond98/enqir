// Audio brand logo resolver — resolves headphone / earphone / speaker brand
// names to free CDN-hosted logos, the same way the car, mobile and sneaker
// resolvers work.
//
// Source: Simple Icons via cdn.simpleicons.org — brand marks (SVG).
//   https://cdn.simpleicons.org/<slug>
//
// AUDIO_MISSING lists brands verified absent from the CDN; those get no logo
// (the chip then renders as plain text, exactly like an unlisted car brand).

/** Brand marks verified live on the CDN (each one returns 200). Anything else
 *  resolves to null so the chip shows the brand name without a broken image —
 *  the same behaviour as an unlisted car brand. */
const SLUGS: Record<string, string> = {
  'apple': 'apple',
  'samsung': 'samsung',
  'sony': 'sony',
  'jbl': 'jbl',
  'bose': 'bose',
  'sennheiser': 'sennheiser',
  'beats': 'beats',
  'oneplus': 'oneplus',
  'oppo': 'oppo',
  'vivo': 'vivo',
  'google': 'google',
  'nothing': 'nothing',
  'honor': 'honor',
  'xiaomi': 'xiaomi',
  'redmi': 'xiaomi',
  'denon': 'denon',
  'sonos': 'sonos',
  'boat': 'boat',
  'audio-technica': 'audiotechnica',
};

/** Brands confirmed to have no Simple Icons mark — no request is attempted. */
const MISSING = new Set([
  'boult',
  'ptron',
  'mivi',
  'wings',
  'truke',
  'gizmore',
  'ultima',
  'ambrane',
  'crossbeats',
  'ubon',
  'tagg',
  'nu republic',
  'loops',
  'hitage',
  'digitek',
  'intex',
  'iball',
  'f&d',
  'aroma',
  'black cat',
  'lavender',
  'oraimo',
  '1more',
  'cca',
  'homepod',
  'devialet',
  'jabra',
  'anker',
  'amazon',
  'soundcore',
  'philips',
  'realme',
  'marshall',
  'skullcandy',
  'akg',
  'yamaha',
  'shure',
  'focal',
  'klipsch',
  'technics',
  'edifier',
  'baseus',
  'ugreen',
  'tribit',
  'tronsmart',
  'earfun',
  'soundpeats',
  'tozo',
  'moondrop',
  'kz',
  'hifiman',
  'fire-boltt',
  'zebronics',
  'portronics',
  'saregama',
  'bang & olufsen',
  'harman kardon',
  'bowers & wilkins',
]);

/**
 * Returns a logo URL for an audio brand, or null when no logo is available.
 */
export function getAudioBrandLogoUrl(brand: string | null | undefined): string | null {
  if (!brand) return null;
  const key = brand.trim().toLowerCase();
  if (!key || key === 'other' || MISSING.has(key)) return null;

  const slug = SLUGS[key];
  if (slug) return `https://cdn.simpleicons.org/${slug}`;

  return null;
}
