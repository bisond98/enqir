import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { Loader2, MapPin, Navigation, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { reverseGeocodeToMapLocation, searchPlaces, type PlaceSearchResult } from "@/lib/reverseGeocode";
import { cn } from "@/lib/utils";
import type { MapLocationAddress } from "@/types/mapLocation";

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

function MapClickHandler({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/** Imperatively flies the map when a search result is chosen. */
function MapFlyController({
  flyTarget,
  onFlyDone,
}: {
  flyTarget: { lat: number; lng: number; nonce: number } | null;
  onFlyDone: () => void;
}) {
  const map = useMap();
  useEffect(() => {
    if (!flyTarget) return;
    map.flyTo([flyTarget.lat, flyTarget.lng], 16, { duration: 0.8 });
    onFlyDone();
  }, [flyTarget, map, onFlyDone]);
  return null;
}

export type MapLocationPickerProps = {
  /** Called with WGS84 coordinates and structured address after confirm. */
  onSelect: (lat: number, lng: number, address: MapLocationAddress) => void;
  defaultLocation?: { lat: number; lng: number };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  /** When true, automatically requests the device location as soon as the picker opens. */
  autoLocate?: boolean;
};

const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 };

function geolocationErrorMessage(code: number, fallback: string): string {
  switch (code) {
    case 1:
      return "Permission denied. Enable location for this site in your browser settings, or pick a point on the map.";
    case 2:
      return "Position unavailable. Check GPS / network, or pick on the map.";
    case 3:
      return "Location request timed out. Try again or pick on the map.";
    default:
      return fallback || "Could not get your location.";
  }
}

export function MapLocationPicker({
  onSelect,
  defaultLocation,
  open,
  onOpenChange,
  title = "Choose location",
  autoLocate = false,
}: MapLocationPickerProps) {
  const isMobile = useIsMobile();
  const [position, setPosition] = useState<[number, number]>([
    defaultLocation?.lat ?? DEFAULT_CENTER.lat,
    defaultLocation?.lng ?? DEFAULT_CENTER.lng,
  ]);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [mapInstanceKey, setMapInstanceKey] = useState(0);

  // Place search inside the picker
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeResults, setPlaceResults] = useState<PlaceSearchResult[]>([]);
  const [placeSearching, setPlaceSearching] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [placeOpen, setPlaceOpen] = useState(false);
  const [pickedLabel, setPickedLabel] = useState<string | null>(null);
  const pickedLabelRef = useRef<string | null>(null);
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number; nonce: number } | null>(null);
  const searchSeqRef = useRef(0);

  // Reset place search whenever the picker opens/closes
  useEffect(() => {
    if (!open) {
      setPlaceQuery("");
      setPlaceResults([]);
      setPlaceSearching(false);
      setPlaceError(null);
      setPlaceOpen(false);
      setPickedLabel(null);
      pickedLabelRef.current = null;
      setFlyTarget(null);
    }
  }, [open]);

  // Debounced forward-geocode as the user types (600ms, respects Nominatim rate limits)
  useEffect(() => {
    const q = placeQuery.trim();
    // Skip the search triggered by programmatically filling the input with the picked label
    if (pickedLabelRef.current && q === pickedLabelRef.current.trim()) return;
    if (!open || q.length < 3) {
      setPlaceResults([]);
      setPlaceOpen(false);
      setPlaceError(null);
      setPlaceSearching(false);
      return;
    }
    const seq = ++searchSeqRef.current;
    setPlaceSearching(true);
    setPlaceError(null);
    const t = setTimeout(async () => {
      try {
        const results = await searchPlaces(q);
        if (seq !== searchSeqRef.current) return; // stale response
        setPlaceResults(results);
        setPlaceOpen(true);
        if (results.length === 0) setPlaceError(null);
      } catch {
        if (seq !== searchSeqRef.current) return;
        setPlaceResults([]);
        setPlaceError("Search failed — try again or pick on the map.");
      } finally {
        if (seq === searchSeqRef.current) setPlaceSearching(false);
      }
    }, 600);
    return () => clearTimeout(t);
  }, [placeQuery, open]);

  const handlePickPlace = useCallback((r: PlaceSearchResult) => {
    setPosition([r.lat, r.lng]);
    setError(null);
    setPlaceOpen(false);
    setPlaceSearching(false);
    setPlaceError(null);
    setPlaceResults([]);
    // Keep the chosen place visible inside the search input
    pickedLabelRef.current = r.label;
    setPickedLabel(r.label);
    setPlaceQuery(r.label);
    setFlyTarget({ lat: r.lat, lng: r.lng, nonce: Date.now() });
  }, []);

  useEffect(() => {
    if (!open) {
      setError(null);
      setConfirming(false);
      setGeoError(null);
      setGeoLoading(false);
      return;
    }
    setPosition([
      defaultLocation?.lat ?? DEFAULT_CENTER.lat,
      defaultLocation?.lng ?? DEFAULT_CENTER.lng,
    ]);
    setMapInstanceKey(0);
  }, [open, defaultLocation?.lat, defaultLocation?.lng]);

  const mapKey = useMemo(
    () =>
      `${open ? "1" : "0"}-${mapInstanceKey}-${position[0].toFixed(5)}-${position[1].toFixed(5)}-${defaultLocation?.lat ?? ""}-${defaultLocation?.lng ?? ""}`,
    [open, mapInstanceKey, position, defaultLocation?.lat, defaultLocation?.lng]
  );

  const onMapClick = useCallback((lat: number, lng: number) => {
    setPosition([lat, lng]);
    setError(null);
  }, []);

  const onMarkerDragEnd = useCallback((e: L.LeafletEvent) => {
    const m = e.target as L.Marker;
    const ll = m.getLatLng();
    setPosition([ll.lat, ll.lng]);
    setError(null);
  }, []);

  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError("Your browser does not support GPS location. Pick a point on the map instead.");
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    setError(null);

    // Two-stage request: GPS first (accurate but slow), then network location
    // (fast, works on Wi-Fi-only devices). Whichever answers first wins.
    let settled = false;
    const succeed = async (pos: GeolocationPosition) => {
      if (settled) return;
      settled = true;
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        setGeoError("Invalid coordinates from device. Pick on the map.");
        setGeoLoading(false);
        return;
      }
      setPosition([lat, lng]);
      setMapInstanceKey((k) => k + 1);
      // One-tap flow: drop the pin AND confirm immediately — no second button press.
      setGeoLoading(false);
      await doConfirm([lat, lng]);
    };
    const fail = (err: GeolocationPositionError) => {
      if (settled) return;
      settled = true;
      setGeoLoading(false);
      setGeoError(geolocationErrorMessage(err.code, err.message));
    };

    // Stage 1: high accuracy (GPS). Short timeout — if GPS is slow, stage 2 covers it.
    navigator.geolocation.getCurrentPosition(succeed, () => {
      // Stage 2: network-based location — much faster, works without GPS.
      navigator.geolocation.getCurrentPosition(
        succeed,
        fail,
        {
          enableHighAccuracy: false,
          timeout: 15_000,
          maximumAge: 300_000, // accept a position cached up to 5 min ago
        }
      );
    }, {
      enableHighAccuracy: true,
      timeout: 8_000,
      maximumAge: 30_000,
    });
  }, []);

  // Auto-request the device location when the picker opens with autoLocate enabled
  const autoLocateFiredRef = useRef(false);
  useEffect(() => {
    if (open && autoLocate && !autoLocateFiredRef.current) {
      autoLocateFiredRef.current = true;
      handleUseMyLocation();
    }
    if (!open) {
      autoLocateFiredRef.current = false;
    }
  }, [open, autoLocate, handleUseMyLocation]);

  // Shared confirm: reverse-geocode the given coords, emit selection, close.
  const doConfirm = useCallback(async (coords: [number, number]) => {
    const [lat, lng] = coords;
    setConfirming(true);
    setError(null);
    try {
      const address = await reverseGeocodeToMapLocation(lat, lng);
      onSelect(lat, lng, address);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not resolve address. Try again.");
    } finally {
      setConfirming(false);
    }
  }, [onSelect, onOpenChange]);

  const handleConfirm = async () => {
    await doConfirm(position);
  };

  const mapBlock = (
    <div className="flex flex-col space-y-2 sm:space-y-3 flex-1 min-h-0 sm:flex-none sm:block">
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          className="!w-full !h-14 sm:!h-16 !text-base !font-black !bg-green-600 hover:!bg-green-700 !text-white !rounded-2xl !border-[0.5px] !border-black !shadow-[0_8px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.15)] hover:!shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.15)] active:!shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] !transition-all !duration-200 disabled:!opacity-50 !transform hover:!scale-[1.02] active:!scale-[0.98] !relative !overflow-hidden group"
          onClick={handleUseMyLocation}
          disabled={geoLoading || confirming}
        >
          {/* Physical button depth effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-2xl pointer-events-none" />
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none rounded-2xl" />
          {geoLoading ? (
            <div className="flex items-center justify-center space-x-2 relative z-10">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <span className="text-white">Getting your location…</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2 relative z-10">
              <Navigation className="h-5 w-5" />
              <span className="text-white">Use my location</span>
            </div>
          )}
        </Button>
        {geoError ? <p className="text-[11px] sm:text-xs text-red-600 font-medium leading-snug">{geoError}</p> : null}
      </div>
      <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
        Or tap the map / drag the pin, then confirm.
      </p>      <div
        className={cn(
          "relative w-full overflow-hidden rounded-none border border-black bg-slate-100",
          "flex-1 min-h-[120px] sm:min-h-0 sm:flex-none sm:h-[360px]"
        )}
      >
        {open ? (
          <MapContainer
            key={mapKey}
            center={position}
            zoom={mapInstanceKey > 0 ? 16 : 13}
            className="h-full w-full z-0"
            scrollWheelZoom
            preferCanvas
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onPick={onMapClick} />
            <MapFlyController flyTarget={flyTarget} onFlyDone={() => setFlyTarget(null)} />
            <Marker position={position} draggable eventHandlers={{ dragend: onMarkerDragEnd }} />
          </MapContainer>
        ) : null}
      </div>
      {error ? <p className="text-xs text-red-600 font-medium">{error}</p> : null}
      {/* Place search — jump straight to a named location, just above the confirm button.
          Bottom margin only when the results dropdown is open, so there's no gap otherwise. */}
      <div className={cn("relative", (placeSearching || placeError || (placeOpen && placeResults.length > 0)) && "sm:mb-10")}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={placeQuery}
            onChange={(e) => setPlaceQuery(e.target.value)}
            onFocus={() => { if (placeResults.length > 0) setPlaceOpen(true); }}
            placeholder="Search for a place (e.g., MVP Colony, Visakhapatnam)…"
            autoComplete="off"
            className="w-full h-12 sm:h-14 pl-10 pr-9 rounded-2xl border-2 border-black bg-white text-sm sm:text-base font-black text-black placeholder:text-[10px] sm:placeholder:text-xs placeholder:font-medium placeholder:text-gray-400 focus:outline-none focus:!border-black focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 !shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] focus:!shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] !transition-all !duration-200 !transform focus:!scale-[0.98]"
          />
          {placeQuery && (
            <button
              type="button"
              onClick={() => { setPlaceQuery(""); setPlaceResults([]); setPlaceOpen(false); setPlaceError(null); setPickedLabel(null); pickedLabelRef.current = null; }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-100"
              aria-label="Clear place search"
            >
              <X className="h-3.5 w-3.5 text-gray-500" />
            </button>
          )}
        </div>
        {placeSearching && (
          <p className="absolute left-3 top-full mt-1 text-[11px] text-muted-foreground flex items-center gap-1.5 z-20">
            <Loader2 className="h-3 w-3 animate-spin" /> Searching places…
          </p>
        )}
        {placeError && (
          <p className="absolute left-3 top-full mt-1 text-[11px] text-red-600 font-medium z-20">{placeError}</p>
        )}
        {placeOpen && !placeSearching && placeResults.length > 0 && (
            <div className="scrollbar-none absolute z-20 left-0 right-0 bottom-full mb-1 sm:bottom-auto sm:top-full sm:mt-1 bg-white border-2 border-black rounded-none shadow-[0_6px_0_0_rgba(0,0,0,0.2)] max-h-44 sm:max-h-56 overflow-y-auto">
              {placeResults.map((r, i) => (
                <button
                  key={`${r.lat}-${r.lng}-${i}`}
                  type="button"
                  onClick={() => handlePickPlace(r)}
                  className="w-full flex items-start gap-2 px-3 py-2.5 text-left text-xs font-medium text-black hover:bg-blue-50 border-b border-slate-100 last:border-b-0"
                >
                  <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-red-500" />
                  <span className="leading-snug">{r.label}</span>
                </button>
              ))}
            </div>
        )}
      </div>
    </div>
  );

  const footer = (
    <div className="flex">
      <Button
        type="button"
        className="!w-full !h-14 sm:!h-16 !text-base !font-black !bg-blue-600 hover:!bg-blue-700 !text-white !rounded-2xl !border-[0.5px] !border-black !shadow-[0_8px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.15)] hover:!shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.15)] active:!shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] !transition-all !duration-200 disabled:!opacity-50 !transform hover:!scale-[1.02] active:!scale-[0.98] !relative !overflow-hidden group"
        onClick={handleConfirm}
        disabled={confirming}
      >
        {/* Physical button depth effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-2xl pointer-events-none" />
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none rounded-2xl" />
        {confirming ? (
          <div className="flex items-center justify-center space-x-2 relative z-10">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
            <span className="text-white">Working…</span>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2 relative z-10">
            <MapPin className="mr-1 h-5 w-5" />
            <span className="text-white">Use this location</span>
          </div>
        )}
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="!z-[70] h-[92vh] max-h-[92vh] rounded-t-2xl border-t-2 border-black p-3 sm:p-5 flex flex-col gap-2 overflow-hidden pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
        >
          <SheetHeader className="text-left space-y-1 pr-8">
            <SheetTitle className="text-base font-black tracking-tight">{title}</SheetTitle>
            <SheetDescription className="sr-only">
              Use my location or pick a point on the map, then confirm.
            </SheetDescription>
          </SheetHeader>
          <div className="scrollbar-none flex-1 min-h-0 flex flex-col overflow-y-auto">{mapBlock}</div>
          {footer}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[calc(100%-2rem)] sm:w-full border-2 border-black rounded-2xl p-4 sm:p-6 gap-3">
        <DialogHeader>
          <DialogTitle className="text-lg font-black">{title}</DialogTitle>
          <DialogDescription className="sr-only">
            Use my location or pick a point on the map, then confirm.
          </DialogDescription>
        </DialogHeader>
        {mapBlock}
        <DialogFooter className="gap-2 sm:gap-0">{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
