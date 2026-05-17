import { createServiceRoleClient } from "@/lib/supabase/admin";
import { isValidMapCoordinates } from "@/lib/pets/coordinates";
import { getPublicPetByQrIdentifier } from "@/lib/pets/public-access";
import { isDuplicateRecentScan } from "@/lib/pets/scan-dedup";

export type PublicPetScanResult =
  | {
      ok: true;
      duplicate: boolean;
      message: string;
      petName: string;
      token_id: string;
      scanId?: string;
    }
  | { ok: false; status: number; error: string };

/**
 * Anonymous / public QR sighting — inserts pet_scans only.
 * Never updates pets.latitude / pets.longitude / is_lost.
 */
export async function insertPublicPetScan(
  tokenId: string,
  latitude: number,
  longitude: number
): Promise<PublicPetScanResult> {
  const slug = String(tokenId).trim();
  if (!slug) {
    return { ok: false, status: 400, error: "token_id gerekli." };
  }

  if (!isValidMapCoordinates(latitude, longitude)) {
    return {
      ok: false,
      status: 400,
      error: "Geçerli bir konum gerekli (enlem -90…90, boylam -180…180).",
    };
  }

  const pet = await getPublicPetByQrIdentifier(slug);
  if (!pet) {
    return { ok: false, status: 404, error: "Hayvan bulunamadı." };
  }

  if (!pet.is_lost) {
    return {
      ok: false,
      status: 400,
      error: "Bu evcil hayvan şu anda kayıp olarak görünmüyor.",
    };
  }

  const petDbId = Number(pet.id);
  if (!Number.isFinite(petDbId)) {
    return { ok: false, status: 500, error: "Geçersiz hayvan kaydı." };
  }

  const admin = createServiceRoleClient();

  const { data: latest } = await admin
    .from("pet_scans")
    .select("latitude, longitude, scanned_at")
    .eq("pet_id", petDbId)
    .order("scanned_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (
    latest &&
    isDuplicateRecentScan(latitude, longitude, {
      latitude: Number(latest.latitude),
      longitude: Number(latest.longitude),
      scanned_at: String(latest.scanned_at),
    })
  ) {
    if (process.env.NODE_ENV === "development") {
      console.log("[public-pet-scan] duplicate skipped", {
        token_id: slug,
        pet_id: petDbId,
        name: pet.name,
      });
    }
    return {
      ok: true,
      duplicate: true,
      message: "Bu konum az önce bildirildi.",
      petName: pet.name?.trim() || `Pati #${pet.token_id}`,
      token_id: pet.token_id,
    };
  }

  const { data: inserted, error } = await admin
    .from("pet_scans")
    .insert({
      pet_id: petDbId,
      latitude,
      longitude,
      scanned_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    console.error("[public-pet-scan] insert error:", error);
    return { ok: false, status: 500, error: "Konum kaydedilemedi." };
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[public-pet-scan] inserted", {
      token_id: slug,
      pet_id: petDbId,
      name: pet.name,
      scan_id: inserted?.id,
    });
  }

  return {
    ok: true,
    duplicate: false,
    message:
      "Konum bildiriminiz kaydedildi. Sahibine yardımcı olduğunuz için teşekkürler.",
    petName: pet.name?.trim() || `Pati #${pet.token_id}`,
    token_id: pet.token_id,
    scanId: inserted?.id,
  };
}
