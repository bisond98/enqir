import { Suspense, lazy, useEffect, useState, type ComponentProps } from "react";

/**
 * MapLocationPickerLazy — drop-in lazy wrapper for MapLocationPicker.
 *
 * The real picker (react-leaflet + Leaflet, ~173 kB chunk) is fetched on
 * demand the first time the picker opens, instead of being bundled into
 * every page that has a location field (EnquiryWall, PostEnquiry,
 * Marketplace, CreateListing). Purely a loading optimization: all props
 * are forwarded unchanged, so behavior is identical. While loading, a
 * lightweight spinner shows inside the sheet frame area — the picker
 * itself keeps its own open/close state, so nothing renders unless
 * `open` is true.
 */

const MapLocationPicker = lazy(() =>
  import("./MapLocationPicker").then(m => ({ default: m.MapLocationPicker }))
);

type MapLocationPickerProps = ComponentProps<typeof MapLocationPicker>;

export const MapLocationPickerLazy = (props: MapLocationPickerProps) => {
  // Only mount the (lazy) picker when opened at least once; keeps closed
  // pickers from ever fetching the Leaflet chunk.
  const [hasOpened, setHasOpened] = useState(false);

  useEffect(() => {
    if (props.open) setHasOpened(true);
  }, [props.open]);

  if (!hasOpened) return null;

  return (
    <Suspense fallback={null}>
      <MapLocationPicker {...props} />
    </Suspense>
  );
};

export default MapLocationPickerLazy;
