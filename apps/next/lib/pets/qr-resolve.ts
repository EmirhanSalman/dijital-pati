/**
 * QR identity: collars encode https://dijitalpati.com/pet/{token_id}
 * pet_scans.pet_id must always be pets.id (BIGINT), never token_id.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type PetQrResolveMethod = "token_id" | "legacy_id";

export type PetQrResolveResult = {
  id: number;
  token_id: string | null;
  name?: string | null;
  method: PetQrResolveMethod;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizeQrIdentifier(identifier: string): string {
  const trimmed = identifier.trim();
  if (!trimmed) return "";
  if (/^\d+$/.test(trimmed)) return String(Number(trimmed));
  return trimmed;
}

function buildTokenIdLookupCandidates(normalized: string): string[] {
  const out = new Set<string>();
  const base = normalizeQrIdentifier(normalized);
  if (!base) return [];
  out.add(base);
  out.add(normalized.trim());
  if (/^\d+$/.test(base)) out.add(String(Number(base)));
  return [...out];
}

/**
 * 1. token_id (canonical QR) — try all string/numeric variants
 * 2. legacy numeric pets.id only if no token_id match
 * 3. legacy UUID pets.id
 */
export async function resolvePetByQrIdentifier(
  supabase: SupabaseClient,
  identifier: string
): Promise<PetQrResolveResult | null> {
  const normalized = normalizeQrIdentifier(identifier);
  if (!normalized) return null;

  for (const candidate of buildTokenIdLookupCandidates(normalized)) {
    const { data: byToken } = await supabase
      .from("pets")
      .select("id, token_id, name")
      .eq("token_id", candidate)
      .maybeSingle();

    if (byToken?.id != null) {
      return {
        id: Number(byToken.id),
        token_id: byToken.token_id != null ? String(byToken.token_id) : null,
        name: byToken.name ?? null,
        method: "token_id",
      };
    }
  }

  if (/^\d+$/.test(normalized)) {
    const { data: byId } = await supabase
      .from("pets")
      .select("id, token_id, name")
      .eq("id", normalized)
      .maybeSingle();

    if (byId?.id != null) {
      return {
        id: Number(byId.id),
        token_id: byId.token_id != null ? String(byId.token_id) : null,
        name: byId.name ?? null,
        method: "legacy_id",
      };
    }
  }

  if (UUID_RE.test(normalized)) {
    const { data: byUuid } = await supabase
      .from("pets")
      .select("id, token_id, name")
      .eq("id", normalized)
      .maybeSingle();

    if (byUuid?.id != null) {
      return {
        id: Number(byUuid.id),
        token_id: byUuid.token_id != null ? String(byUuid.token_id) : null,
        name: byUuid.name ?? null,
        method: "legacy_id",
      };
    }
  }

  return null;
}

export async function deletePetScansForPet(
  supabase: SupabaseClient,
  petDbId: number
): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("pet_scans").delete().eq("pet_id", petDbId);
  return { error: error ? new Error(error.message) : null };
}
