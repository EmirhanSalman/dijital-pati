/**
 * Web map coordinate helpers — mirrors apps/expo/lib/map-coords.ts semantics.
 * Red pin: pets.latitude / longitude (canonical), location_* fallback only.
 */

export type Coordinates = { latitude: number; longitude: number };
export type LatLng = Coordinates;

export type PetMapCoordinateSource = "canonical" | "location_fallback";

export type PetMapCoordinateResult = Coordinates & {
  source: PetMapCoordinateSource;
};

export type PetLike = {
  id: string | number;
  latitude?: unknown;
  longitude?: unknown;
  location_lat?: unknown;
  location_lng?: unknown;
};

export type PetLostLike = {
  is_lost?: boolean | null;
};

export const ISPARTA_CENTER = { latitude: 37.7648, longitude: 30.5566 };

const SPREAD_RADIUS_DEG = 0.0022;

export function isLostPet(pet: PetLostLike): boolean {
  return pet.is_lost === true;
}

export function parseCoordinate(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "string" ? parseFloat(value.trim()) : Number(value);
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

export function getPetMapCoordinate(pet: PetLike): PetMapCoordinateResult | null {
  const canonical = tryCoordinatePair(pet.latitude, pet.longitude);
  if (canonical) return { ...canonical, source: "canonical" };
  const locationFallback = tryCoordinatePair(pet.location_lat, pet.location_lng);
  if (locationFallback) return { ...locationFallback, source: "location_fallback" };
  return null;
}

export function isValidLatLng(c: Partial<LatLng> | null | undefined): c is LatLng {
  if (c == null) return false;
  return (
    typeof c.latitude === "number" &&
    typeof c.longitude === "number" &&
    Number.isFinite(c.latitude) &&
    Number.isFinite(c.longitude) &&
    isValidCoordinates(c.latitude, c.longitude)
  );
}

export function filterValidLatLng(coords: LatLng[]): LatLng[] {
  return coords.filter(isValidLatLng);
}

export function buildPawTrailCoordinates(
  pet: Pick<Coordinates, "latitude" | "longitude"> | null,
  scans: LatLng[]
): LatLng[] {
  if (!pet || scans.length === 0) return [];
  const petCoord = { latitude: pet.latitude, longitude: pet.longitude };
  if (!isValidLatLng(petCoord)) return [];

  const raw: LatLng[] = [petCoord, ...filterValidLatLng(scans)];
  if (raw.length < 2) return [];

  return dedupeConsecutiveCoords(raw);
}

export function filterScansForPetId<
  T extends { pet_id: string | number; latitude: number; longitude: number; scanned_at: string },
>(scans: T[], petId: string | number | null | undefined): T[] {
  if (petId == null || petId === "") return [];
  return scans
    .filter((scan) => samePetId(scan.pet_id, petId))
    .filter((scan) => isValidLatLng({ latitude: scan.latitude, longitude: scan.longitude }))
    .sort((a, b) => new Date(a.scanned_at).getTime() - new Date(b.scanned_at).getTime());
}

export function dedupeConsecutiveCoords(coords: LatLng[], epsilon = 0.00005): LatLng[] {
  const valid = filterValidLatLng(coords);
  if (valid.length === 0) return [];
  const out: LatLng[] = [valid[0]];
  for (let i = 1; i < valid.length; i++) {
    const prev = out[out.length - 1];
    const cur = valid[i];
    if (Math.abs(cur.latitude - prev.latitude) > epsilon || Math.abs(cur.longitude - prev.longitude) > epsilon) {
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
    const sorted = [...group].sort((a, b) => String(a.id).localeCompare(String(b.id)));
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
  return String(a ?? "") === String(b ?? "");
}

export function findMapPetById<T extends PetLike>(
  mapPets: MapPetMarker<T>[],
  petId: string | number | null | undefined
): MapPetMarker<T> | null {
  if (petId == null || petId === "") return null;
  return mapPets.find((p) => samePetId(p.id, petId)) ?? null;
}
