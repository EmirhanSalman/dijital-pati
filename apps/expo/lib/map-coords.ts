/**
 * Map coordinate helpers — parsing DB values and spreading stacked pins.
 */

export type Coordinates = { latitude: number; longitude: number };

const ISPARTA_CENTER = { latitude: 37.7648, longitude: 30.5566 };

/** ~220 m per 0.002° latitude at Isparta latitude */
const SPREAD_RADIUS_DEG = 0.0022;

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

export type PetLike = {
  id: string | number;
  latitude?: unknown;
  longitude?: unknown;
  last_seen_latitude?: unknown;
  last_seen_longitude?: unknown;
};

/** Prefer primary latitude/longitude; fall back to last_seen_* columns. */
export function getPetCoordinates(pet: PetLike): Coordinates | null {
  let lat = parseCoordinate(pet.latitude);
  let lng = parseCoordinate(pet.longitude);

  if (lat == null || lng == null) {
    lat = parseCoordinate(pet.last_seen_latitude);
    lng = parseCoordinate(pet.last_seen_longitude);
  }

  if (lat == null || lng == null) return null;
  if (!isValidCoordinates(lat, lng)) return null;

  return { latitude: lat, longitude: lng };
}

export type MapPetMarker<T extends PetLike = PetLike> = T & {
  latitude: number;
  longitude: number;
  mapLatitude: number;
  mapLongitude: number;
};

/**
 * Pets stacked on the same point (e.g. shared migration default) get a small
 * ring offset so every red pin remains tappable. Circles use true coordinates.
 */
export function buildMapPetMarkers<T extends PetLike>(pets: T[]): MapPetMarker<T>[] {
  const withCoords: MapPetMarker<T>[] = [];

  for (const pet of pets) {
    const coords = getPetCoordinates(pet);
    if (!coords) continue;
    withCoords.push({
      ...pet,
      ...coords,
      mapLatitude: coords.latitude,
      mapLongitude: coords.longitude,
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
    if (group.length === 1) {
      result.push(group[0]);
      continue;
    }

    group.forEach((marker, index) => {
      const angle = (2 * Math.PI * index) / group.length;
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
