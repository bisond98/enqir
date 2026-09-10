const NEAREST_RADIUS_STORAGE_KEY = "enquirywall_nearest_radius_km";

export const NEAREST_RADIUS_OPTIONS = [5, 10, 25] as const;

export function loadNearestRadiusKm(): number {
  if (typeof window === "undefined") return 10;
  try {
    const raw = window.localStorage.getItem(NEAREST_RADIUS_STORAGE_KEY);
    if (raw === null) return 10;
    const n = Number(raw);
    if (NEAREST_RADIUS_OPTIONS.includes(n as (typeof NEAREST_RADIUS_OPTIONS)[number])) {
      return n;
    }
  } catch {
    /* ignore */
  }
  return 10;
}

export function saveNearestRadiusKm(km: number): void {
  try {
    window.localStorage.setItem(NEAREST_RADIUS_STORAGE_KEY, String(km));
  } catch {
    /* ignore */
  }
}
