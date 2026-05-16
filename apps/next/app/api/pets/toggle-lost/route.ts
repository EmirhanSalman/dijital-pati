import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/supabase/server";
import {
  buildLostLocationUpdate,
  isValidMapCoordinates,
} from "@/lib/pets/coordinates";
import { deletePetScansForPet } from "@/lib/pets/qr-resolve";

function isUUID(str: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

function isNumeric(str: string): boolean {
  return /^\d+$/.test(str);
}

/**
 * Toggle pet lost status API endpoint
 * POST /api/pets/toggle-lost
 *
 * Marking lost requires latitude + longitude (last-seen map pin).
 * Marking found clears pet_scans (DB trigger also deletes scans).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tokenId, id, isLost, latitude, longitude } = body;

    const searchId = id || tokenId;
    if (!searchId) {
      return NextResponse.json(
        { error: "tokenId veya id gerekli" },
        { status: 400 }
      );
    }

    if (typeof isLost !== "boolean") {
      return NextResponse.json(
        { error: "isLost boolean olmalı" },
        { status: 400 }
      );
    }

    const searchIdStr = String(searchId);
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Giriş yapmanız gerekiyor." },
        { status: 401 }
      );
    }

    let query = supabase.from("pets").select("*");

    if (isUUID(searchIdStr)) {
      query = query.eq("id", searchIdStr);
    } else if (isNumeric(searchIdStr)) {
      query = query.eq("token_id", searchIdStr);
    } else {
      query = query.or(`id.eq.${searchIdStr},token_id.eq.${searchIdStr}`);
    }

    const { data: pet, error: fetchError } = await query.single();

    if (fetchError || !pet) {
      return NextResponse.json(
        { error: "Pet bulunamadı. Lütfen ID'yi kontrol edin." },
        { status: 404 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("wallet_address, role")
      .eq("id", user.id)
      .single();

    const userWalletAddress = profile?.wallet_address?.toLowerCase();
    const petOwnerId = pet.owner_id;
    const petOwnerAddress = pet.owner_address?.toLowerCase();
    const isAdmin = profile?.role === "admin";
    const isOwner =
      petOwnerId === user.id || petOwnerAddress === userWalletAddress;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        {
          error:
            "Bu işlem için yetkiniz yok. Sadece hayvan sahibi veya admin bu işlemi yapabilir.",
        },
        { status: 403 }
      );
    }

    if (isLost && !isValidMapCoordinates(latitude, longitude)) {
      return NextResponse.json(
        {
          error:
            "Kayıp bildirimi için son görülme konumu gereklidir (latitude ve longitude).",
        },
        { status: 400 }
      );
    }

    const updatePayload = isLost
      ? { is_lost: true, ...buildLostLocationUpdate({ latitude, longitude }) }
      : {
          is_lost: false,
          found_at: new Date().toISOString(),
        };

    const { error: updateError } = await supabase
      .from("pets")
      .update(updatePayload)
      .eq("id", pet.id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || "Durum güncellenemedi." },
        { status: 500 }
      );
    }

    if (!isLost) {
      const { error: scanDeleteError } = await deletePetScansForPet(
        supabase,
        Number(pet.id)
      );
      if (scanDeleteError) {
        console.error("pet_scans delete after found:", scanDeleteError);
      }
    }

    if (isLost && petOwnerId) {
      try {
        const petName =
          pet.name && pet.name.trim() && !pet.name.startsWith("Pati #")
            ? pet.name
            : `Pati #${pet.token_id}`;

        await createNotification({
          userId: petOwnerId,
          type: "system",
          message: `Kayıp ilanınız başarıyla oluşturuldu ve yayına alındı.`,
          link: `/pet/${pet.token_id}`,
          metadata: {
            pet_id: pet.id,
            token_id: pet.token_id,
            pet_name: petName,
            action: "lost_report_created",
          },
        });
      } catch (notificationError) {
        console.error("Bildirim oluşturma hatası:", notificationError);
      }
    }

    revalidatePath(`/pet/${pet.token_id}`);
    revalidatePath("/my-pets");
    revalidatePath("/lost-pets");

    return NextResponse.json({
      success: true,
      message: "Durum başarıyla güncellendi.",
      pet_id: pet.id,
      token_id: pet.token_id,
      is_lost: isLost,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to toggle status";
    console.error("Toggle lost status API error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Toggle lost status endpoint. Use POST method.",
    endpoint: "/api/pets/toggle-lost",
  });
}
