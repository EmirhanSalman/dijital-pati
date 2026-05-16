import { supabase } from './supabase';
import type { PetTextFields } from './pet-form';
import { splitPetBreed } from './pet-form';

export type OwnedPet = {
  id: number | string;
  token_id: string | null;
  name: string | null;
  breed: string | null;
  /** Derived from `breed` for list/detail UI (no separate DB column). */
  species: string | null;
  description: string | null;
  image_url: string | null;
  is_lost: boolean | null;
  owner_id: string | null;
  city: string | null;
  district: string | null;
  latitude?: number | null;
  longitude?: number | null;
  contact_phone?: string | null;
};

export function resolveImageUri(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.replace('ipfs://', 'https://ipfs.io/ipfs/');
}

/** Mobile-only pets: unique slug, never equals pets.id */
export async function generateUniqueAppTokenId(): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = `app-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const { data } = await supabase
      .from('pets')
      .select('id')
      .eq('token_id', candidate)
      .maybeSingle();
    if (!data) return candidate;
  }
  throw new Error('Benzersiz token_id oluşturulamadı. Lütfen tekrar deneyin.');
}

const OWN_PET_SELECT =
  'id, token_id, name, breed, description, image_url, is_lost, owner_id, city, district';

function mapOwnedPet(row: Record<string, unknown>): OwnedPet {
  const breed = (row.breed as string | null) ?? null;
  const { type } = splitPetBreed(breed);
  return { ...(row as OwnedPet), breed, species: type || null };
}

export async function fetchOwnPets(userId: string): Promise<OwnedPet[]> {
  const { data, error } = await supabase
    .from('pets')
    .select(OWN_PET_SELECT)
    .eq('owner_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapOwnedPet(row as Record<string, unknown>));
}

export async function fetchOwnPetById(
  petId: string,
  userId: string
): Promise<OwnedPet | null> {
  const { data, error } = await supabase
    .from('pets')
    .select(`${OWN_PET_SELECT}, latitude, longitude, contact_phone`)
    .eq('id', petId)
    .eq('owner_id', userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapOwnedPet(data as Record<string, unknown>) : null;
}

export async function updateOwnPet(
  petId: string | number,
  userId: string,
  fields: Record<string, unknown>
): Promise<void> {
  const { data, error } = await supabase
    .from('pets')
    .update(fields)
    .eq('id', petId)
    .eq('owner_id', userId)
    .select('id')
    .maybeSingle();

  if (error) {
    if (__DEV__) {
      console.warn('[updateOwnPet] supabase error', { petId, userId, fields, error });
    }
    throw new Error(error.message);
  }
  if (!data) {
    if (__DEV__) {
      console.warn('[updateOwnPet] no row updated', { petId, userId, fields });
    }
    throw new Error('Güncelleme yapılamadı. Kayıt bulunamadı veya yetkiniz yok.');
  }
}

export async function updateOwnPetText(
  petId: string | number,
  userId: string,
  text: PetTextFields
): Promise<void> {
  await updateOwnPet(petId, userId, text);
}

export async function deleteOwnPet(petId: string, userId: string): Promise<void> {
  const pet = await fetchOwnPetById(petId, userId);
  if (!pet) {
    throw new Error('Bu kayda erişim yetkiniz yok.');
  }

  const { error } = await supabase.from('pets').delete().eq('id', petId).eq('owner_id', userId);

  if (error) throw new Error(error.message);
}
