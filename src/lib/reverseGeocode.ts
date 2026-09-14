import type { MapLocationAddress } from "@/types/mapLocation";

function buildReverseUrl(lat: number, lng: number): string {
  const q = `format=jsonv2&lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lng))}`;
  // Dev: Vite proxies to Nominatim with a valid User-Agent. Prod: direct (Nominatim allows browser CORS for API).
  if (import.meta.env.DEV) {
    return `/api/nominatim/reverse?${q}`;
  }
  return `https://nominatim.openstreetmap.org/reverse?${q}`;
}

function pickAddressField(
  addr: Record<string, string | undefined> | undefined,
  keys: string[]
): string | null {
  if (!addr) return null;
  for (const k of keys) {
    const v = addr[k];
    if (v && String(v).trim()) return String(v).trim();
  }
  return null;
}

/** Reverse-geocode lat/lng into city/state/country/formatted_address. */
export async function reverseGeocodeToMapLocation(lat: number, lng: number): Promise<MapLocationAddress> {
  const url = buildReverseUrl(lat, lng);
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Accept-Language": "en",
    },
  });
  if (!res.ok) {
    throw new Error(`Geocoding failed (${res.status})`);
  }
  const data = (await res.json()) as {
    display_name?: string;
    address?: Record<string, string | undefined>;
  };
  const addr = data.address;
  const city =
    pickAddressField(addr, ["city", "town", "village", "hamlet", "municipality", "suburb"]) ??
    null;
  const state = pickAddressField(addr, ["state", "region", "province"]) ?? null;
  const country = pickAddressField(addr, ["country"]) ?? null;
  const formatted = (data.display_name && data.display_name.trim()) || null;

  return {
    latitude: lat,
    longitude: lng,
    city,
    state,
    country,
    formatted_address: formatted,
  };
}

export interface PlaceSearchResult {
  label: string;
  lat: number;
  lng: number;
}

function buildSearchUrl(query: string): string {
  const q = `format=jsonv2&addressdetails=0&limit=5&q=${encodeURIComponent(query)}`;
  // Dev: Vite proxies to Nominatim with a valid User-Agent. Prod: direct (Nominatim allows browser CORS for API).
  if (import.meta.env.DEV) {
    return `/api/nominatim/search?${q}`;
  }
  return `https://nominatim.openstreetmap.org/search?${q}`;
}

/** Forward-geocode a free-text place query into up to 5 candidate locations. */
export async function searchPlaces(query: string): Promise<PlaceSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const url = buildSearchUrl(trimmed);
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Accept-Language": "en",
    },
  });
  if (!res.ok) {
    throw new Error(`Place search failed (${res.status})`);
  }
  const data = (await res.json()) as Array<{
    display_name?: string;
    lat?: string;
    lon?: string;
  }>;
  return data
    .map((row) => ({
      label: (row.display_name || "").trim(),
      lat: Number(row.lat),
      lng: Number(row.lon),
    }))
    .filter((r) => r.label && Number.isFinite(r.lat) && Number.isFinite(r.lng));
}
