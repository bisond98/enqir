import type { MapLocationAddress } from "@/types/mapLocation";

/** Human-readable line stored on `enquiry.location` (Firestore). */
export function formatMapLocationForFirestore(loc: MapLocationAddress): string {
  const line =
    loc.formatted_address?.trim() ||
    [loc.city, loc.state, loc.country].filter(Boolean).join(", ").trim();
  if (line) return line;
  return `${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}`;
}
