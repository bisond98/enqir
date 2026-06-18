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
