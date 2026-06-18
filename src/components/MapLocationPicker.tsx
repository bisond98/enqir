import { useCallback, useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { Loader2, MapPin, Navigation } from "lucide-react";

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
import { reverseGeocodeToMapLocation } from "@/lib/reverseGeocode";
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

export type MapLocationPickerProps = {
  /** Called with WGS84 coordinates and structured address after confirm. */
  onSelect: (lat: number, lng: number, address: MapLocationAddress) => void;
  defaultLocation?: { lat: number; lng: number };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
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
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          setGeoError("Invalid coordinates from device. Pick on the map.");
          setGeoLoading(false);
          return;
        }
        setPosition([lat, lng]);
        setMapInstanceKey((k) => k + 1);
        setGeoLoading(false);
      },
      (err) => {
        setGeoLoading(false);
        setGeoError(geolocationErrorMessage(err.code, err.message));
      },
      {
        enableHighAccuracy: true,
        timeout: 25_000,
        maximumAge: 0,
      }
    );
  }, []);

  const handleConfirm = async () => {
    const [lat, lng] = position;
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
  };

  const mapBlock = (
    <div className="space-y-3">
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          className="w-full rounded-none border-2 border-black font-black min-h-[48px] shadow-[0_4px_0_0_rgba(0,0,0,0.2)] bg-white hover:bg-slate-50"
          onClick={handleUseMyLocation}
          disabled={geoLoading || confirming}
        >
          {geoLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />
              Getting your location…
            </>
          ) : (
            <>
              <Navigation className="mr-2 h-4 w-4 shrink-0" />
              Use my location
            </>
          )}
        </Button>
        {geoError ? <p className="text-[11px] sm:text-xs text-red-600 font-medium leading-snug">{geoError}</p> : null}
      </div>
      <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
        Or tap the map / drag the pin, then confirm. Location is only sent when you press “Use this location”.
      </p>
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-none border border-black bg-slate-100",
          "h-[min(52vh,420px)] sm:h-[360px]"
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
            <Marker position={position} draggable eventHandlers={{ dragend: onMarkerDragEnd }} />
          </MapContainer>
        ) : null}
      </div>
      {error ? <p className="text-xs text-red-600 font-medium">{error}</p> : null}
    </div>
  );

  const footer = (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3 pt-2">
      <Button
        type="button"
        variant="outline"
        className="rounded-none border-2 border-black shadow-[0_4px_0_0_rgba(0,0,0,0.25)] font-black min-h-[44px]"
        onClick={() => onOpenChange(false)}
        disabled={confirming}
      >
        Cancel
      </Button>
      <Button
        type="button"
        className="rounded-none border-2 border-black bg-blue-600 hover:bg-blue-700 text-white shadow-[0_4px_0_0_rgba(37,99,235,0.45)] font-black min-h-[44px]"
        onClick={handleConfirm}
        disabled={confirming}
      >
        {confirming ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Working…
          </>
        ) : (
          <>
            <MapPin className="mr-2 h-4 w-4" />
            Use this location
          </>
        )}
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="h-[90vh] max-h-[90vh] rounded-t-2xl border-t-2 border-black p-4 sm:p-5 flex flex-col gap-3 overflow-hidden"
        >
          <SheetHeader className="text-left space-y-1 pr-8">
            <SheetTitle className="text-base font-black tracking-tight">{title}</SheetTitle>
            <SheetDescription className="sr-only">
              Use my location or pick a point on the map, then confirm.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 min-h-0 overflow-y-auto">{mapBlock}</div>
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
