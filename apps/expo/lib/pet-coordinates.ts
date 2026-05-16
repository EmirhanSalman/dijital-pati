/** Map coordinate helpers (mirrors apps/next/lib/pets/coordinates.ts). */

export type MapCoordinates = { latitude: number; longitude: number };

export function parseCoord(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'string' ? parseFloat(value.trim()) : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function isValidMapCoordinates(latitude: unknown, longitude: unknown): boolean {
  const lat = parseCoord(latitude);
  const lng = parseCoord(longitude);
  if (lat == null || lng == null) return false;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
  if (lat === 0 && lng === 0) return false;
  return true;
}

export function buildLostLocationUpdate(coords: MapCoordinates) {
  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    location_lat: coords.latitude,
    location_lng: coords.longitude,
    lost_reported_at: new Date().toISOString(),
    found_at: null,
    is_lost: true,
  };
}

export function buildFoundUpdate() {
  return {
    is_lost: false,
    found_at: new Date().toISOString(),
  };
}
