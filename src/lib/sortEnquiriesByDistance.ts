import { haversineKm } from "@/lib/haversine";

export function sortByDistanceWithUnknownsAtBottom<T extends { id: string }>(
  items: T[],
  refLat: number,
  refLng: number,
  mode: "nearest" | "farthest",
  getCoords: (item: T) => { lat: number; lng: number } | null,
  tieBreakOrder?: Map<string, number>
): T[] {
  const indexed = items.map((e, i) => ({ e, i }));
  indexed.sort((a, b) => {
    const ca = getCoords(a.e);
    const cb = getCoords(b.e);
    if (ca && !cb) return -1;
    if (!ca && cb) return 1;
    if (!ca && !cb) {
      const oa = tieBreakOrder?.get(a.e.id) ?? a.i;
      const ob = tieBreakOrder?.get(b.e.id) ?? b.i;
      return oa - ob;
    }
    if (ca && cb) {
      const da = haversineKm(refLat, refLng, ca.lat, ca.lng);
      const db = haversineKm(refLat, refLng, cb.lat, cb.lng);
      if (da !== db) {
        return mode === "nearest" ? da - db : db - da;
      }
    }
    const oa = tieBreakOrder?.get(a.e.id) ?? a.i;
    const ob = tieBreakOrder?.get(b.e.id) ?? b.i;
    return oa - ob;
  });
  return indexed.map((x) => x.e);
}
