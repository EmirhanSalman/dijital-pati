/**
 * Public pet page URL for QR collars (uses token_id, never pets.id).
 */

const DEFAULT_PUBLIC_BASE = "https://dijital-pati.vercel.app";

export function getPetPublicBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_PET_PUBLIC_BASE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return DEFAULT_PUBLIC_BASE;
}

export function buildPetPublicUrl(tokenId: string | number): string {
  const slug = String(tokenId).trim();
  return `${getPetPublicBaseUrl()}/pet/${encodeURIComponent(slug)}`;
}
