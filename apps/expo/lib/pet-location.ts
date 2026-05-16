import { getPetMapCoordinate, type PetLike } from './map-coords';

/** Human-readable location for detail screens (canonical coords first). */
export function formatPetLocationDisplay(pet: PetLike & {
  last_seen_location?: string | null;
  city?: string | null;
  district?: string | null;
  address?: string | null;
}): string {
  const textParts = [pet.city, pet.district, pet.address, pet.last_seen_location]
    .filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
    .map((p) => p.trim());

  if (textParts.length > 0) {
    return [...new Set(textParts)].join(' · ');
  }

  const coords = getPetMapCoordinate(pet);
  if (coords) {
    return `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`;
  }

  return 'Konum belirtilmedi';
}
