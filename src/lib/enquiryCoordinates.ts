export function getEnquiryCoordinates(enquiry: {
  latitude?: unknown;
  longitude?: unknown;
}): { lat: number; lng: number } | null {
  const lat = Number(enquiry.latitude);
  const lng = Number(enquiry.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}
