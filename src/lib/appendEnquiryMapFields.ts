import type { MapLocationAddress } from "@/types/mapLocation";

/** Mutates `enquiryData` with optional map fields (Firestore-safe). */
export function assignOptionalMapLocationFields(
  enquiryData: Record<string, unknown>,
  loc: MapLocationAddress | null
): void {
  if (!loc) return;
  enquiryData.latitude = loc.latitude;
  enquiryData.longitude = loc.longitude;
  enquiryData.city = loc.city ?? null;
  enquiryData.state = loc.state ?? null;
  enquiryData.country = loc.country ?? null;
  enquiryData.formatted_address = loc.formatted_address ?? null;
}
