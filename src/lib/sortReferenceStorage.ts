import type { SortReferenceLocation } from "@/types/mapLocation";
import { SORT_REFERENCE_STORAGE_KEY } from "@/types/mapLocation";

export function loadSortReferenceLocation(): SortReferenceLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SORT_REFERENCE_STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<SortReferenceLocation>;
    if (
      typeof p.lat === "number" &&
      typeof p.lng === "number" &&
      Number.isFinite(p.lat) &&
      Number.isFinite(p.lng)
    ) {
      return {
        lat: p.lat,
        lng: p.lng,
        formatted_address: p.formatted_address ?? undefined,
      };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function saveSortReferenceLocation(loc: SortReferenceLocation): void {
  try {
    localStorage.setItem(SORT_REFERENCE_STORAGE_KEY, JSON.stringify(loc));
  } catch {
    /* ignore */
  }
}

export function clearSortReferenceLocation(): void {
  try {
    localStorage.removeItem(SORT_REFERENCE_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
