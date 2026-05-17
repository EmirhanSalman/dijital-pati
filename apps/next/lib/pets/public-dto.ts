/**
 * Safe fields for anonymous web visitors (lost list, lost detail, public QR).
 * Never expose owner_id, wallet, or contact fields through these DTOs.
 */

export const PUBLIC_PET_SELECT =
  "id, token_id, name, breed, description, image_url, city, district, is_lost, latitude, longitude, location_lat, location_lng, created_at, updated_at, lost_reported_at";

export type PublicPetDto = {
  id: string;
  token_id: string;
  name: string;
  breed: string;
  description: string | null;
  image_url: string;
  is_lost: boolean;
  city: string | null;
  district: string | null;
  created_at: string;
  updated_at?: string | null;
  lost_reported_at?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  location_lat?: number | null;
  location_lng?: number | null;
};

export function rowToPublicPetDto(row: Record<string, unknown>): PublicPetDto {
  return {
    id: String(row.id ?? ""),
    token_id: row.token_id != null ? String(row.token_id) : "",
    name: typeof row.name === "string" ? row.name : "",
    breed: typeof row.breed === "string" ? row.breed : "",
    description: typeof row.description === "string" ? row.description : null,
    image_url: typeof row.image_url === "string" ? row.image_url : "",
    is_lost: Boolean(row.is_lost),
    city: typeof row.city === "string" ? row.city : null,
    district: typeof row.district === "string" ? row.district : null,
    created_at: typeof row.created_at === "string" ? row.created_at : "",
    updated_at: typeof row.updated_at === "string" ? row.updated_at : null,
    lost_reported_at:
      typeof row.lost_reported_at === "string" ? row.lost_reported_at : null,
    latitude: row.latitude != null ? Number(row.latitude) : null,
    longitude: row.longitude != null ? Number(row.longitude) : null,
    location_lat: row.location_lat != null ? Number(row.location_lat) : null,
    location_lng: row.location_lng != null ? Number(row.location_lng) : null,
  };
}

/** Shape expected by PetCard / list UI — no private fields. */
export function publicDtoToPetCardShape(dto: PublicPetDto) {
  return {
    ...dto,
    owner_address: "",
    owner_id: null,
    contact_info: null,
    contact_phone: null,
    contact_email: null,
  };
}
