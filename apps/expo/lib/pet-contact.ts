export type PetContactInfo = {
  contact_phone?: string | null;
  contact_email?: string | null;
  contact_info?: string | null;
};

export function getPetContactChannels(pet: PetContactInfo): {
  phone: string | null;
  email: string | null;
  legacy: string | null;
  hasAny: boolean;
} {
  const phone = pet.contact_phone?.trim() || null;
  const email = pet.contact_email?.trim() || null;
  const legacy = pet.contact_info?.trim() || null;
  return {
    phone,
    email,
    legacy,
    hasAny: Boolean(phone || email || legacy),
  };
}
