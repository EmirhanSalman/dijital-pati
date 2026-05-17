import { ISPARTA_CENTER, type LatLng } from "@/lib/pets/map-coords";
import type { ApproximateGeoDto } from "@/lib/map/approximate-geo";

export type MapViewCommand =
  | { mode: "center"; center: LatLng; zoom: number }
  | { mode: "fit"; coordinates: LatLng[]; maxZoom?: number };

const EARTH_RADIUS_KM = 6371;
const NEARBY_RADIUS_KM = 120;
const CLUSTER_RADIUS_KM = 75;
/** Above this span, avoid global auto-fit on initial load. */
const GLOBAL_SPREAD_KM = 150;

export function haversineDistanceKm(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function getMaxSpreadKm(coordinates: LatLng[]): number {
  if (coordinates.length < 2) return 0;
  let max = 0;
  for (let i = 0; i < coordinates.length; i++) {
    for (let j = i + 1; j < coordinates.length; j++) {
      max = Math.max(max, haversineDistanceKm(coordinates[i], coordinates[j]));
    }
  }
  return max;
}

export function arePetsGloballySpread(
  coordinates: LatLng[],
  thresholdKm = GLOBAL_SPREAD_KM
): boolean {
  return getMaxSpreadKm(coordinates) > thresholdKm;
}

/** Seed with most neighbors within CLUSTER_RADIUS_KM. */
export function findDensestClusterCenter(coordinates: LatLng[]): LatLng {
  if (coordinates.length === 0) return ISPARTA_CENTER;
  if (coordinates.length === 1) return coordinates[0];

  let best = coordinates[0];
  let bestCount = 0;
  for (const candidate of coordinates) {
    const count = coordinates.filter(
      (p) => haversineDistanceKm(candidate, p) <= CLUSTER_RADIUS_KM
    ).length;
    if (count > bestCount) {
      bestCount = count;
      best = candidate;
    }
  }
  return best;
}

export function resolveFocusCenter(
  petCoordinates: LatLng[],
  approximateGeo: ApproximateGeoDto | null | undefined
): LatLng {
  if (
    approximateGeo?.latitude != null &&
    approximateGeo?.longitude != null &&
    Number.isFinite(approximateGeo.latitude) &&
    Number.isFinite(approximateGeo.longitude)
  ) {
    return {
      latitude: approximateGeo.latitude,
      longitude: approximateGeo.longitude,
    };
  }
  if (petCoordinates.length > 0) {
    return findDensestClusterCenter(petCoordinates);
  }
  return ISPARTA_CENTER;
}

export function filterCoordinatesNear(
  coordinates: LatLng[],
  center: LatLng,
  radiusKm = NEARBY_RADIUS_KM
): LatLng[] {
  return coordinates.filter((p) => haversineDistanceKm(center, p) <= radiusKm);
}

/** Initial load: regional focus, never worldwide fit-all. */
export function computeInitialMapView(
  petCoordinates: LatLng[],
  approximateGeo: ApproximateGeoDto | null | undefined
): MapViewCommand {
  const center = resolveFocusCenter(petCoordinates, approximateGeo);
  const nearby = filterCoordinatesNear(petCoordinates, center);

  if (nearby.length >= 2) {
    return { mode: "fit", coordinates: nearby, maxZoom: 13 };
  }
  if (nearby.length === 1) {
    return { mode: "center", center: nearby[0], zoom: 13 };
  }
  if (petCoordinates.length >= 2 && !arePetsGloballySpread(petCoordinates)) {
    return { mode: "fit", coordinates: petCoordinates, maxZoom: 12 };
  }
  const zoom = approximateGeo?.latitude != null ? 11 : 10;
  return { mode: "center", center, zoom };
}

export function computeShowAllMapView(coordinates: LatLng[]): MapViewCommand {
  const valid = coordinates.filter(
    (c) => Number.isFinite(c.latitude) && Number.isFinite(c.longitude)
  );
  if (valid.length === 0) {
    return { mode: "center", center: ISPARTA_CENTER, zoom: 10 };
  }
  if (valid.length === 1) {
    return { mode: "center", center: valid[0], zoom: 12 };
  }
  return { mode: "fit", coordinates: valid };
}

export function computeUserLocationMapView(userLocation: LatLng): MapViewCommand {
  return { mode: "center", center: userLocation, zoom: 14 };
}

export function sortByDistanceFrom<T extends LatLng>(
  items: T[],
  center: LatLng
): (T & { distanceKm: number })[] {
  return items
    .map((item) => ({
      ...item,
      distanceKm: haversineDistanceKm(center, item),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
