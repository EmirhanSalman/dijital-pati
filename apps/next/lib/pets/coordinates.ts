/**
 * Canonical map coordinates for lost pets.
 * - latitude / longitude: primary (mobile map red pin)
 * - location_lat / location_lng: legacy mirror only
 */

export type MapCoordinates = { latitude: number; longitude: number };

export function parseCoord(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "string" ? parseFloat(value.trim()) : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function isValidMapCoordinates(
  latitude: unknown,
  longitude: unknown
): latitude is number {
  const lat = parseCoord(latitude);
  const lng = parseCoord(longitude);
  if (lat == null || lng == null) return false;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
  if (lat === 0 && lng === 0) return false;
  return true;
}

export function toMapCoordinates(
  latitude: unknown,
  longitude: unknown
): MapCoordinates | null {
  if (!isValidMapCoordinates(latitude, longitude)) return null;
  return { latitude: latitude as number, longitude: longitude as number };
}

/** DB update fields when reporting lost — keeps canonical + legacy in sync. */
export function buildLostLocationUpdate(coords: MapCoordinates) {
  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    location_lat: coords.latitude,
    location_lng: coords.longitude,
    lost_reported_at: new Date().toISOString(),
    found_at: null,
  };
}
