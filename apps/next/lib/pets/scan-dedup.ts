/** Duplicate sighting guard (mirrors apps/expo/lib/scanner-dedup.ts). */

export const DB_RECENT_SCAN_SECONDS = 30;
const NEARBY_METERS = 75;

function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export type RecentScanRow = {
  latitude: number;
  longitude: number;
  scanned_at: string;
};

export function isDuplicateRecentScan(
  latitude: number,
  longitude: number,
  latest: RecentScanRow | null
): boolean {
  if (!latest?.scanned_at) return false;

  const ageMs = Date.now() - new Date(latest.scanned_at).getTime();
  if (ageMs > DB_RECENT_SCAN_SECONDS * 1000) return false;

  const lat = Number(latest.latitude);
  const lng = Number(latest.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return true;

  return haversineMeters(latitude, longitude, lat, lng) <= NEARBY_METERS;
}
