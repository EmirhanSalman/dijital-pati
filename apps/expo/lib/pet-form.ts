/** Maps Tür / Irk UI fields to the single `breed` column used in Supabase. */

const TYPE_SEP = ' · ';

export function formatPetBreed(type: string, breed: string): string | null {
  const t = type.trim();
  const b = breed.trim();
  if (t && b) return `${t}${TYPE_SEP}${b}`;
  return t || b || null;
}

export function splitPetBreed(breed: string | null | undefined): { type: string; breed: string } {
  if (!breed?.trim()) return { type: '', breed: '' };
  const idx = breed.indexOf(TYPE_SEP);
  if (idx >= 0) {
    return {
      type: breed.slice(0, idx).trim(),
      breed: breed.slice(idx + TYPE_SEP.length).trim(),
    };
  }
  return { type: breed.trim(), breed: '' };
}

export type PetTextFields = {
  name: string;
  breed: string | null;
  description: string | null;
  city: string | null;
};

export function buildPetTextFields(
  name: string,
  species: string,
  breed: string,
  description: string,
  city: string
): PetTextFields {
  return {
    name: name.trim(),
    breed: formatPetBreed(species, breed),
    description: description.trim() || null,
    city: city.trim() || null,
  };
}
