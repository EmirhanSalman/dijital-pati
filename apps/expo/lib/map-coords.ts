/**
 * Map coordinate helpers — single source of truth for pet pin positions.
 *
 * Column priority (do not mix inconsistently):
 * 1. `latitude` / `longitude` — canonical map marker coordinates
 * 2. `location_lat` / `location_lng` — legacy / last-seen fallback only when (1) is missing or invalid
 */

export type Coordinates = { latitude: number; longitude: number };

export type LatLng = Coordinates;

export type PetMapCoordinateSource = 'canonical' | 'location_fallback';

export type PetMapCoordinateResult = Coordinates & {
  source: PetMapCoordinateSource;
};

const ISPARTA_CENTER = { latitude: 37.7648, longitude: 30.5566 };

/** ~220 m per 0.002° latitude at Isparta latitude */
const SPREAD_RADIUS_DEG = 0.0022;

export type PetLike = {
  id: string | number;
  /** Canonical map coordinates (always prefer these when valid). */
  latitude?: unknown;
  longitude?: unknown;
  /** Fallback when canonical pair is missing or invalid. */
  location_lat?: unknown;
  location_lng?: unknown;
};

export function parseCoordinate(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'string' ? parseFloat(value.trim()) : Number(value);
  if (!Number.isFinite(n)) return null;
  return n;
}

export function isValidCoordinates(lat: number, lng: number): boolean {
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
  if (lat === 0 && lng === 0) return false;
  return true;
}

function tryCoordinatePair(lat: unknown, lng: unknown): Coordinates | null {
  const latitude = parseCoordinate(lat);
  const longitude = parseCoordinate(lng);
  if (latitude == null || longitude == null) return null;
  if (!isValidCoordinates(latitude, longitude)) return null;
  return { latitude, longitude };
}

/**
 * Returns one validated coordinate pair for map rendering, or null.
 * Never returns NaN, partial pairs, or out-of-range values.
 */
export function getPetMapCoordinate(pet: PetLike): PetMapCoordinateResult | null {
  const canonical = tryCoordinatePair(pet.latitude, pet.longitude);
  if (canonical) {
    return { ...canonical, source: 'canonical' };
  }

  const locationFallback = tryCoordinatePair(pet.location_lat, pet.location_lng);
  if (locationFallback) {
    return { ...locationFallback, source: 'location_fallback' };
  }

  return null;
}

/** @deprecated Use getPetMapCoordinate — kept for imports that expect Coordinates only */
export function getPetCoordinates(pet: PetLike): Coordinates | null {
  return getPetMapCoordinate(pet);
}

export function isValidLatLng(
  c: Partial<LatLng> | null | undefined
): c is LatLng {
  if (c == null) return false;
  return (
    typeof c.latitude === 'number' &&
    typeof c.longitude === 'number' &&
    Number.isFinite(c.latitude) &&
    Number.isFinite(c.longitude) &&
    isValidCoordinates(c.latitude, c.longitude)
  );
}

export function filterValidLatLng(coords: LatLng[]): LatLng[] {
  return coords.filter(isValidLatLng);
}

/** Removes consecutive duplicate/near-duplicate points (avoids polyline / fit crashes). */
export function dedupeConsecutiveCoords(coords: LatLng[], epsilon = 0.00005): LatLng[] {
  const valid = filterValidLatLng(coords);
  if (valid.length === 0) return [];

  const out: LatLng[] = [valid[0]];
  for (let i = 1; i < valid.length; i++) {
    const prev = out[out.length - 1];
    const cur = valid[i];
    const dLat = Math.abs(cur.latitude - prev.latitude);
    const dLng = Math.abs(cur.longitude - prev.longitude);
    if (dLat > epsilon || dLng > epsilon) {
      out.push(cur);
    }
  }
  return out;
}

export type MapPetMarker<T extends PetLike = PetLike> = T & {
  latitude: number;
  longitude: number;
  mapLatitude: number;
  mapLongitude: number;
  coordSource: PetMapCoordinateSource;
};

/**
 * Builds red-pin markers. True position uses canonical/fallback pair;
 * display position may be offset slightly when pins stack at the same coordinate.
 */
export function buildMapPetMarkers<T extends PetLike>(pets: T[]): MapPetMarker<T>[] {
  const withCoords: MapPetMarker<T>[] = [];

  for (const pet of pets) {
    const resolved = getPetMapCoordinate(pet);
    if (!resolved) continue;

    const { latitude, longitude, source } = resolved;
    withCoords.push({
      ...pet,
      latitude,
      longitude,
      mapLatitude: latitude,
      mapLongitude: longitude,
      coordSource: source,
    });
  }

  const buckets = new Map<string, MapPetMarker<T>[]>();

  for (const marker of withCoords) {
    const key = `${marker.latitude.toFixed(4)},${marker.longitude.toFixed(4)}`;
    const list = buckets.get(key) ?? [];
    list.push(marker);
    buckets.set(key, list);
  }

  const result: MapPetMarker<T>[] = [];

  for (const group of buckets.values()) {
    const sorted = [...group].sort((a, b) => Number(a.id) - Number(b.id));

    if (sorted.length === 1) {
      result.push(sorted[0]);
      continue;
    }

    sorted.forEach((marker, index) => {
      const angle = (2 * Math.PI * index) / sorted.length;
      const ring = 1 + Math.floor(index / 8) * 0.45;
      const offset = SPREAD_RADIUS_DEG * ring;
      result.push({
        ...marker,
        mapLatitude: marker.latitude + Math.sin(angle) * offset,
        mapLongitude: marker.longitude + Math.cos(angle) * offset,
      });
    });
  }

  return result;
}

export function samePetId(
  a: string | number | null | undefined,
  b: string | number | null | undefined
): boolean {
  return String(a ?? '') === String(b ?? '');
}

export { ISPARTA_CENTER };
