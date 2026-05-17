import { createServiceRoleClient } from "@/lib/supabase/admin";
import { isValidMapCoordinates } from "@/lib/pets/coordinates";

/** Safe fields for public map API — no owner/contact/wallet. */
export const MAP_LOST_PET_SELECT =
  "id, token_id, name, breed, image_url, city, is_lost, latitude, longitude, location_lat, location_lng";

export type MapLostPetDto = {
  id: string;
  token_id: string;
  name: string;
  breed: string;
  image_url: string;
  city: string | null;
  is_lost: boolean;
  latitude: number | null;
  longitude: number | null;
  location_lat: number | null;
  location_lng: number | null;
};

export type MapScanDto = {
  id: string;
  pet_id: string;
  latitude: number;
  longitude: number;
  scanned_at: string;
};

function rowToMapLostPet(row: Record<string, unknown>): MapLostPetDto {
  return {
    id: String(row.id ?? ""),
    token_id: row.token_id != null ? String(row.token_id) : "",
    name: typeof row.name === "string" ? row.name : "",
    breed: typeof row.breed === "string" ? row.breed : "",
    image_url: typeof row.image_url === "string" ? row.image_url : "",
    city: typeof row.city === "string" ? row.city : null,
    is_lost: Boolean(row.is_lost),
    latitude: row.latitude != null ? Number(row.latitude) : null,
    longitude: row.longitude != null ? Number(row.longitude) : null,
    location_lat: row.location_lat != null ? Number(row.location_lat) : null,
    location_lng: row.location_lng != null ? Number(row.location_lng) : null,
  };
}

function rowToMapScan(row: Record<string, unknown>): MapScanDto | null {
  const lat = Number(row.latitude);
  const lng = Number(row.longitude);
  if (!isValidMapCoordinates(lat, lng)) return null;
  if (row.id == null || row.pet_id == null) return null;
  const scannedAt = row.scanned_at ?? row.created_at;
  if (!scannedAt) return null;
  return {
    id: String(row.id),
    pet_id: String(row.pet_id),
    latitude: lat,
    longitude: lng,
    scanned_at: String(scannedAt),
  };
}

/**
 * Server-only map payload: lost pets + their scan trail points.
 * Service role; response is sanitized DTO (no private profile fields).
 */
export async function getMapLostPetsData(): Promise<{
  pets: MapLostPetDto[];
  scans: MapScanDto[];
}> {
  const admin = createServiceRoleClient();

  const { data: petsData, error: petsError } = await admin
    .from("pets")
    .select(MAP_LOST_PET_SELECT)
    .eq("is_lost", true);

  if (petsError) {
    console.error("[map-public] pets error:", petsError);
    throw new Error("Kayıp hayvan verileri alınamadı.");
  }

  const pets = (petsData ?? []).map((row) =>
    rowToMapLostPet(row as Record<string, unknown>)
  );

  const petDbIds = pets
    .map((p) => Number(p.id))
    .filter((id) => Number.isFinite(id));

  if (petDbIds.length === 0) {
    return { pets, scans: [] };
  }

  const { data: scansData, error: scansError } = await admin
    .from("pet_scans")
    .select("id, pet_id, latitude, longitude, scanned_at")
    .in("pet_id", petDbIds)
    .order("scanned_at", { ascending: true });

  if (scansError) {
    console.error("[map-public] pet_scans error:", scansError);
    throw new Error("Görülme kayıtları alınamadı.");
  }

  const scans = (scansData ?? [])
    .map((row) => rowToMapScan(row as Record<string, unknown>))
    .filter((row): row is MapScanDto => row !== null);

  if (process.env.NODE_ENV === "development") {
    console.log("[map-public]", { lostPets: pets.length, scans: scans.length });
  }

  return { pets, scans };
}
