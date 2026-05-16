/** Lost-state labels — `pets.is_lost` is the only source of truth (no `status` column). */

export function isLostPet(pet: { is_lost?: boolean | null }): boolean {
  return pet.is_lost === true;
}

export function getPetLostLabel(pet: { is_lost?: boolean | null }): string {
  return isLostPet(pet) ? 'Kayıp' : 'Güvende';
}

export function getPetLostBadgeStyle(isLost: boolean): {
  label: string;
  color: string;
  bg: string;
} {
  if (isLost) {
    return { label: 'Kayıp', color: '#EF4444', bg: '#FEF2F2' };
  }
  return { label: 'Güvende', color: '#22C55E', bg: '#F0FDF4' };
}
