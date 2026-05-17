import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import type { Pet } from "@/lib/supabase/server";
import { getPetById, getPets } from "@/lib/supabase/server";
import {
  PUBLIC_PET_SELECT,
  publicDtoToPetCardShape,
  rowToPublicPetDto,
  type PublicPetDto,
} from "@/lib/pets/public-dto";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type LostPetsListFilters = {
  query?: string;
  type?: string;
  city?: string;
  sort?: string;
};

function applyLostListFilters(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  filters?: LostPetsListFilters
) {
  if (filters?.query?.trim()) {
    const searchTerm = filters.query.trim();
    query = query.or(
      `name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
    );
  }
  if (filters?.type && filters.type !== "all") {
    query = query.eq("breed", filters.type);
  }
  if (filters?.city && filters.city !== "all") {
    query = query.ilike("city", `%${filters.city}%`);
  }
  if (filters?.sort === "oldest") {
    query = query.order("created_at", { ascending: true });
  } else {
    query = query
      .order("updated_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
  }
  return query;
}

export async function getPublicLostPets(
  filters: LostPetsListFilters | undefined,
  page: number,
  limit: number
): Promise<{ pets: Pet[]; count: number }> {
  const admin = createServiceRoleClient();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = admin
    .from("pets")
    .select(PUBLIC_PET_SELECT, { count: "exact" })
    .eq("is_lost", true);

  query = applyLostListFilters(query, filters);
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error("getPublicLostPets error:", error);
    return { pets: [], count: 0 };
  }

  const pets = (data ?? []).map((row) =>
    publicDtoToPetCardShape(rowToPublicPetDto(row as Record<string, unknown>))
  ) as Pet[];

  return { pets, count: count ?? 0 };
}

export async function getPublicLostPetByIdentifier(
  petId: string
): Promise<PublicPetDto | null> {
  const admin = createServiceRoleClient();
  let query = admin
    .from("pets")
    .select(PUBLIC_PET_SELECT)
    .eq("is_lost", true);

  if (UUID_RE.test(petId)) {
    query = query.eq("id", petId);
  } else {
    query = query.eq("token_id", petId);
  }

  let { data, error } = await query.maybeSingle();

  if (!data && /^\d+$/.test(petId)) {
    const byId = await admin
      .from("pets")
      .select(PUBLIC_PET_SELECT)
      .eq("is_lost", true)
      .eq("id", petId)
      .maybeSingle();
    data = byId.data;
    error = byId.error;
  }

  if (error || !data) {
    if (error) console.error("getPublicLostPetByIdentifier error:", error);
    return null;
  }

  return rowToPublicPetDto(data as Record<string, unknown>);
}

/** Public QR page: resolve by token_id (or legacy id), any lost/safe status. */
export async function getPublicPetByQrIdentifier(
  identifier: string
): Promise<PublicPetDto | null> {
  const admin = createServiceRoleClient();
  const trimmed = identifier.trim();
  if (!trimmed) return null;

  const tokenCandidates = new Set<string>([trimmed]);
  if (/^\d+$/.test(trimmed)) tokenCandidates.add(String(Number(trimmed)));

  for (const candidate of tokenCandidates) {
    const { data } = await admin
      .from("pets")
      .select(PUBLIC_PET_SELECT)
      .eq("token_id", candidate)
      .maybeSingle();

    if (data) {
      return rowToPublicPetDto(data as Record<string, unknown>);
    }
  }

  if (/^\d+$/.test(trimmed)) {
    const { data: byId } = await admin
      .from("pets")
      .select(PUBLIC_PET_SELECT)
      .eq("id", trimmed)
      .maybeSingle();

    if (byId) {
      return rowToPublicPetDto(byId as Record<string, unknown>);
    }
  }

  if (UUID_RE.test(trimmed)) {
    const { data: byUuid } = await admin
      .from("pets")
      .select(PUBLIC_PET_SELECT)
      .eq("id", trimmed)
      .maybeSingle();

    if (byUuid) {
      return rowToPublicPetDto(byUuid as Record<string, unknown>);
    }
  }

  return null;
}

export async function getLostPetsForPage(
  filters: LostPetsListFilters | undefined,
  page: number,
  limit: number
): Promise<{ pets: Pet[]; count: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return getPets({ ...filters, isLost: true }, page, limit);
  }

  return getPublicLostPets(filters, page, limit);
}

export type LostPetDetailForPage =
  | { mode: "authenticated"; pet: Pet }
  | { mode: "public"; pet: PublicPetDto };

export async function getLostPetDetailForPage(
  petId: string
): Promise<LostPetDetailForPage | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const pet = await getPetById(petId);
    if (!pet || !pet.is_lost) return null;
    return { mode: "authenticated", pet };
  }

  const pet = await getPublicLostPetByIdentifier(petId);
  if (!pet) return null;
  return { mode: "public", pet };
}
