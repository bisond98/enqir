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
    map.flyTo([flyTarget.lat, flyTarget.lng], 15, { duration: 0.8 });
    onFlyDone();
  }, [flyTarget, map, onFlyDone]);
  return null;
}

/** Smoothly centers an existing map on a new position WITHOUT remounting it.
 *  Used for geolocation fixes so the map glides to the pin instead of
 *  being destroyed/recreated (which snapped the zoom and lost pan state). */
function MapCenterController({
  centerTarget,
  onDone,
}: {
  centerTarget: { lat: number; lng: number; nonce: number } | null;
  onDone: () => void;
}) {
  const map = useMap();
  useEffect(() => {
    if (!centerTarget) return;
    map.flyTo([centerTarget.lat, centerTarget.lng], 15, { duration: 0.9 });
    onDone();
  }, [centerTarget, map, onDone]);
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
  // Lets the async permission pre-check invoke the current attempt's denial
  // handler (the handler locals don't exist yet when the query is issued).
  const showPermissionDeniedRef = useRef<(() => void) | null>(null);
  // Cleans up an in-flight "Use my location" attempt (timers + GPS watcher)
  // and marks it finished so queued callbacks become no-ops.
  const geoCleanupRef = useRef<(() => void) | null>(null);
  const cancelGeoAttempt = useCallback(() => {
    geoCleanupRef.current?.();
    geoCleanupRef.current = null;
    setGeoLoading(false);
  }, []);
  // Lets the precision-upgrade watcher skip auto-confirm when the user has
  // already closed the picker (manually confirmed or cancelled).
  const openRef = useRef(open);
  useEffect(() => { openRef.current = open; }, [open]);
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number; nonce: number } | null>(null);
  // Geolocation fixes glide the existing map here instead of remounting it.
  const [centerTarget, setCenterTarget] = useState<{ lat: number; lng: number; nonce: number } | null>(null);
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
    cancelGeoAttempt(); // the user chose a place - stop the GPS attempt
    setPosition([r.lat, r.lng]);
    setError(null);
    setPlaceOpen(false);
    setPlaceSearching(false);
    setPlaceError(null);
    setPlaceResults([]);
    // Keep the chosen place visible inside the search input
    pickedLabelRef.current = r.label;      setPickedLabel(r.label);
    setPlaceQuery(r.label);
    setFlyTarget({ lat: r.lat, lng: r.lng, nonce: Date.now() });
  }, []);

  useEffect(() => {
    if (!open) {
      geoCleanupRef.current?.();
      geoCleanupRef.current = null;
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
      `${open ? "1" : "0"}`,
    [open]
  );

  const onMapClick = useCallback((lat: number, lng: number) => {
    cancelGeoAttempt(); // the user picked a point - stop the GPS attempt
    setPosition([lat, lng]);
    setError(null);
  }, []);

  const onMarkerDragEnd = useCallback((e: L.LeafletEvent) => {
    cancelGeoAttempt(); // the user moved the pin - stop the GPS attempt
    const m = e.target as L.Marker;
    const ll = m.getLatLng();
    setPosition([ll.lat, ll.lng]);
    setError(null);
  }, []);

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

  // Keep the latest doConfirm in a ref so the geolocation callbacks below always
  // invoke the current version (with fresh onSelect / pendingDistanceSort),
  // never a stale closure from an earlier render.
  const doConfirmRef = useRef(doConfirm);
  useEffect(() => {
    doConfirmRef.current = doConfirm;
  }, [doConfirm]);

  // Stage 3 fallback: approximate location from the user's public IP address.
  // Used when the browser's GPS/network geolocation fails entirely (common on
  // desktops without GPS and on networks that block Wi-Fi triangulation).
  const ipLocate = useCallback(async (): Promise<{ lat: number; lng: number } | null> => {
    const endpoints = [
      { url: "https://ipapi.co/json/", parse: (d: any) => ({ lat: Number(d.latitude), lng: Number(d.longitude) }) },
      { url: "https://ipwho.is/", parse: (d: any) => (d.success === false ? null : { lat: Number(d.latitude), lng: Number(d.longitude) }) },
      { url: "https://get.geojs.io/v1/ip/geo.json", parse: (d: any) => ({ lat: Number(d.latitude), lng: Number(d.longitude) }) },
    ];
    for (const ep of endpoints) {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 6_000);
        const res = await fetch(ep.url, { signal: ctrl.signal });
        clearTimeout(t);
        if (!res.ok) continue;
        const data = await res.json();
        const { lat, lng } = ep.parse(data);
        if (Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)) {
          return { lat, lng };
        }
      } catch {
        // Try the next provider
      }
    }
    return null;
  }, []);

  const handleUseMyLocation = useCallback(() => {
    // Cancel any attempt still in flight from a previous click.
    geoCleanupRef.current?.();
    geoCleanupRef.current = null;
    setGeoError(null);
    setError(null);

    // Hard blocks we can detect BEFORE asking: no geolocation support at all,
    // or an insecure context (geolocation requires https:// or localhost and
    // is silently denied — no permission prompt — over plain http).
    if (!navigator.geolocation) {
      setGeoError("Your browser does not support GPS location. Pick a point on the map instead.");
      return;
    }
    if (window.isSecureContext === false) {
      setGeoError("Location is blocked because this page is not on a secure connection. Open the app via https:// (or localhost during development), or pick a point on the map.");
      return;
    }

    setGeoLoading(true);

    // If the site's location permission is already remembered as DENIED, the
    // browser will not re-show the prompt — the request just fails silently.
    // Detect that up front so we can tell the user to unblock it in settings.
    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "geolocation" as PermissionName })
        .then((status) => {
          if (status.state === "denied") {
            showPermissionDeniedRef.current?.();
          }
        })
        .catch(() => {}); // Safari may not support this query — ignore
    }

    // ---- Attempt state -----------------------------------------------------
    // `finished` means this attempt is over: a street-level fix was confirmed,
    // permission was denied, nothing was found, or the user took over (map tap
    // / drag / search cancels us). Coarse results NEVER set it - they only
    // place a provisional pin, so a later precise fix can still take over and
    // auto-confirm. This is the core fix: the old code committed the FIRST
    // answer (often a village-level network/IP guess) as "your location".
    let finished = false;
    let gpsErrorCode = 0;
    let watchId: number | null = null;
    let best: { lat: number; lng: number; accuracy: number } | null = null;
    let approximatePlaced = false;

    // Only fixes at or below this accuracy (metres) are auto-confirmed.
    const PRECISION_MAX_ACCURACY = 50;

    // Declared up-front so cleanup can always clear them.
    let tEarly: ReturnType<typeof setTimeout> | undefined;
    let tFail: ReturnType<typeof setTimeout> | undefined;
    let t2: ReturnType<typeof setTimeout> | undefined;
    let tWatchEnd: ReturnType<typeof setTimeout> | undefined;

    const stopWatch = () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
    };

    const clearTimers = () => {
      clearTimeout(tEarly);
      clearTimeout(tFail);
      clearTimeout(t2);
      clearTimeout(tWatchEnd);
    };

    // Ends the attempt for good - queued GPS callbacks after this are no-ops.
    const cleanup = () => {
      finished = true;
      clearTimers();
      stopWatch();
      if (geoCleanupRef.current === cleanup) geoCleanupRef.current = null;
    };

    // Final commit - reached ONLY by street-level (precise) fixes.
    const commit = (lat: number, lng: number) => {
      if (finished) return;
      if (!openRef.current) { cleanup(); return; } // user already closed us
      finished = true;
      cleanup();
      setPosition([lat, lng]);
      setCenterTarget({ lat, lng, nonce: Date.now() });
      setGeoLoading(false);
      setGeoError(null);
      void doConfirmRef.current([lat, lng]);
    };

    // Background listener for a precise fix. Started immediately on click (not
    // only after a fallback) so the pin upgrades the moment GPS locks, and
    // auto-confirms once the fix is street-level.
    const startPrecisionWatch = () => {
      if (watchId !== null || finished || !navigator.geolocation) return;
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const c = pos.coords;
          if (finished || !Number.isFinite(c.latitude) || !Number.isFinite(c.longitude)) return;
          const acc = Number.isFinite(c.accuracy) ? c.accuracy : Number.MAX_SAFE_INTEGER;
          if (acc <= PRECISION_MAX_ACCURACY) {
            commit(c.latitude, c.longitude);
            return;
          }
          // Better, but still coarse: hold as provisional; if the approximate
          // pin is showing, glide it toward the better fix.
          if (!best || acc < best.accuracy) {
            best = { lat: c.latitude, lng: c.longitude, accuracy: acc };
            if (approximatePlaced) {
              setPosition([best.lat, best.lng]);
              setCenterTarget({ lat: best.lat, lng: best.lng, nonce: Date.now() });
            }
          }
        },
        () => {},
        { enableHighAccuracy: true, timeout: 30_000, maximumAge: 0 }
      );
      if (tWatchEnd === undefined) {
        tWatchEnd = setTimeout(() => {
          stopWatch();
          if (!finished && approximatePlaced) {
            setGeoError('Approximate location - drag the pin to fine-tune it, then tap "Use this location".');
          }
        }, 30_000);
      }
    };

    // Coarse results are only HELD as provisional, never confirmed on arrival:
    // a network fix can claim 30 m yet be streets off; an IP fix is city-level.
    const recordCoarse = (lat: number, lng: number, accuracy: number) => {
      if (finished) return;
      if (!best || accuracy < best.accuracy) best = { lat, lng, accuracy };
    };

    // Last resort: an approximate pin - kept OPEN and upgradeable, never
    // silently committed as "your location".
    const placeApproximate = () => {
      if (finished || approximatePlaced || !best) return;
      approximatePlaced = true;
      clearTimeout(tEarly);
      clearTimeout(tFail);
      setPosition([best.lat, best.lng]);
      setCenterTarget({ lat: best.lat, lng: best.lng, nonce: Date.now() });
      setGeoLoading(false);
      setGeoError(
        'Approximate location placed - still searching for a precise GPS fix. The pin will snap to your exact spot automatically. You can also drag it, then tap "Use this location".'
      );
      startPrecisionWatch();
    };

    const showPermissionDenied = () => {
      if (finished) return;
      cleanup();
      setGeoLoading(false);
      setGeoError(geolocationErrorMessage(1, ""));
    };
    showPermissionDeniedRef.current = showPermissionDenied;
    geoCleanupRef.current = cleanup;

    startPrecisionWatch();

    // Fallback schedule:
    //   8s - drop an approximate pin if we only have a coarse answer so far
    //        (still upgradeable, NOT confirmed)
    //  16s - absolute deadline (geolocation can hang entirely on some
    //        machines): approximate pin if we have one, real error otherwise
    tEarly = setTimeout(placeApproximate, 8_000);
    t2 = setTimeout(() => {
      if (finished) return;
      if (best) { placeApproximate(); return; }
      finished = true;
      cleanup();
      setGeoLoading(false);
      setGeoError(
        gpsErrorCode
          ? geolocationErrorMessage(gpsErrorCode, "Could not determine your location. Check your connection, or pick a point on the map.")
          : "Could not determine your location. Check your connection, or pick a point on the map."
      );
    }, 16_000);

    // Source 1: GPS - the accurate fix. Confirmed ONLY when street-level; a
    // coarse first answer is held as provisional instead of being committed.
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (finished) return;
          const c = pos.coords;
          if (!Number.isFinite(c.latitude) || !Number.isFinite(c.longitude)) return;
          const acc = Number.isFinite(c.accuracy) ? c.accuracy : Number.MAX_SAFE_INTEGER;
          if (acc <= PRECISION_MAX_ACCURACY) {
            commit(c.latitude, c.longitude);
          } else {
            recordCoarse(c.latitude, c.longitude, acc);
          }
        },
        (err) => {
          gpsErrorCode = err.code;
          if (err.code === 1) {
            // Permission denied: every other source will be denied too, and an
            // IP guess would hide the real problem. Surface it immediately.
            showPermissionDenied();
            return;
          }
          // GPS unavailable/timeout: if the network/IP fix already answered,
          // show an approximate pin quickly instead of spinning for 16s.
          tFail = setTimeout(() => { if (!finished && best) placeApproximate(); }, 3_000);
        },
        { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 }
      );

      // Source 2: network location - fast, coarse; held as a provisional result.
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const c = pos.coords;
          if (Number.isFinite(c.latitude) && Number.isFinite(c.longitude)) {
            recordCoarse(c.latitude, c.longitude, Number.isFinite(c.accuracy) ? c.accuracy : 800);
          }
        },
        () => {},
        { enableHighAccuracy: false, timeout: 8_000, maximumAge: 60_000 }
      );
    }

    // Source 3: IP-based location - always available, city/village-level
    // accuracy. Lowest-priority provisional result: only ever used to place an
    // approximate pin if nothing better answers; never confirmed on its own.
    (async () => {
      const loc = await ipLocate();
      if (finished) return;
      if (loc) recordCoarse(loc.lat, loc.lng, 20_000);
    })();

  }, [ipLocate]);
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

  const handleConfirm = async () => {
    await doConfirm(position);
  };

  const mapBlock = (
    <div className="flex flex-col space-y-2 sm:space-y-3 flex-1 min-h-0 sm:flex-none sm:block">
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          className="!w-full !h-14 sm:!h-16 !text-base !font-black !bg-green-600 hover:!bg-green-700 !text-white !rounded-2xl !border-[1.5px] !border-black !shadow-[0_5px_0_0_rgba(0,0,0,0.85)] active:!shadow-[0_1px_0_0_rgba(0,0,0,0.85)] active:!translate-y-[4px] !transition-all !duration-150 disabled:!opacity-50 !transform !relative !overflow-hidden group touch-manipulation select-none"
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
        {open ? (            <MapContainer
              key={mapKey}
              center={position}
              zoom={13}
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
            <MapCenterController centerTarget={centerTarget} onDone={() => setCenterTarget(null)} />
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
            className="rounded-[12px] h-12 sm:h-14 min-h-[48px] w-full pl-10 pr-9 text-base font-medium bg-white border-[1.5px] border-slate-200 shadow-[0_3px_0_0_rgba(0,0,0,0.14),0_0_11px_rgba(0,0,0,0.09),0_6px_14px_rgba(0,0,0,0.12)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.16),0_0_14px_rgba(0,0,0,0.11),0_8px_18px_rgba(0,0,0,0.14)] focus:outline-none focus-visible:outline-none focus-visible:border-black focus-visible:ring-3 focus-visible:ring-black/15 focus-visible:shadow-[0_4px_0_0_rgba(0,0,0,0.16),0_0_16px_rgba(0,0,0,0.13),0_8px_20px_rgba(0,0,0,0.16)] transition-all duration-200 placeholder:text-gray-900 placeholder:font-semibold placeholder:text-[11px] text-slate-900"
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
        className="!w-full !h-14 sm:!h-16 !text-base !font-black !bg-blue-600 hover:!bg-blue-700 !text-white !rounded-2xl !border-[1.5px] !border-black !shadow-[0_5px_0_0_rgba(0,0,0,0.85)] active:!shadow-[0_1px_0_0_rgba(0,0,0,0.85)] active:!translate-y-[4px] !transition-all !duration-150 disabled:!opacity-50 !transform !relative !overflow-hidden group touch-manipulation select-none"
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
          className="!z-[70] h-[92vh] max-h-[92vh] rounded-t-2xl border-t-2 border-black p-3 sm:p-5 flex flex-col gap-2 overflow-hidden pb-[calc(0.75rem+env(safe-area-inset-bottom))] [&>button:last-child]:!top-0 [&>button:last-child]:!right-2"
        >
          <SheetHeader className="text-left space-y-1 pr-8">
            <SheetTitle className="text-base font-semibold tracking-tight text-gray-900">{title}</SheetTitle>
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
      <DialogContent className="max-w-2xl w-[calc(100%-2rem)] sm:w-full border-2 border-black rounded-2xl p-4 sm:p-6 gap-3 [&>button:last-child]:!top-0 [&>button:last-child]:!right-2">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight">{title}</DialogTitle>
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
