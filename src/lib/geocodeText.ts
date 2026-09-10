// Forward-geocode a free-text location (e.g. "Delhi", "wadgaon, Wardha") into
// lat/lng using Nominatim — the same service the map picker uses for reverse
// geocoding. Results are cached in-memory (per session) so repeated filters
// don't spam the API. Requests are serialized with a small delay to respect
// Nominatim's usage policy (max 1 request/second).

export type TextCoords = { lat: number; lng: number };

const cache = new Map<string, TextCoords | null>();
let lastRequestAt = 0;

function throttleDelay(): number {
  const now = Date.now();
  const elapsed = now - lastRequestAt;
  const MIN_GAP_MS = 1100;
  if (elapsed >= MIN_GAP_MS) {
    lastRequestAt = now;
    return 0;
  }
  lastRequestAt = now + (MIN_GAP_MS - elapsed);
  return MIN_GAP_MS - elapsed;
}

function buildSearchUrl(text: string): string {
  const q = `format=json&limit=1&q=${encodeURIComponent(text)}`;
  if (import.meta.env.DEV) {
    return `/api/nominatim/search?${q}`;
  }
  return `https://nominatim.openstreetmap.org/search?${q}`;
}

export function getCachedTextCoords(text: string): TextCoords | null | undefined {
  const key = text.trim().toLowerCase();
  if (!key) return null;
  return cache.get(key);
}

export async function geocodeLocationText(text: string): Promise<TextCoords | null> {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const key = trimmed.toLowerCase();
  if (cache.has(key)) return cache.get(key)!;

  const delay = throttleDelay();
  if (delay > 0) await new Promise((r) => setTimeout(r, delay));

  try {
    const res = await fetch(buildSearchUrl(trimmed), {
      headers: { Accept: 'application/json', 'Accept-Language': 'en' },
    });
    if (!res.ok) {
      cache.set(key, null);
      return null;
    }
    const data = (await res.json()) as Array<{ lat?: string; lon?: string }>;
    const hit = data?.[0];
    const lat = Number(hit?.lat);
    const lng = Number(hit?.lon);
    const coords =
      Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
    cache.set(key, coords);
    return coords;
  } catch {
    // Don't cache network failures — retry next time
    return null;
  }
}
