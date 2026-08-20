/** Optional map-backed location stored on enquiries and used by MapLocationPicker. */
export type MapLocationAddress = {
  latitude: number;
  longitude: number;
  city: string | null;
  state: string | null;
  country: string | null;
  formatted_address: string | null;
};

/** Reference point for “nearest / farthest” sorting (localStorage + in-memory). */
export type SortReferenceLocation = {
  lat: number;
  lng: number;
  formatted_address?: string | null;
};

export const SORT_REFERENCE_STORAGE_KEY = "enqir_sort_reference_location_v1";
