import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/supabase/server";

/**
 * UUID format kontrolü
 */
function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Sayısal değer kontrolü
 */
function isNumeric(str: string): boolean {
  return /^\d+$/.test(str);
}

/**
 * Toggle pet lost status API endpoint
 * POST /api/pets/toggle-lost
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tokenId, id, isLost } = body;

    // Debug log
    console.log("API Request - Body:", JSON.stringify(body));
    console.log("API Request - tokenId:", tokenId, "id:", id, "isLost:", isLost);

    // Validate input - tokenId veya id'den biri olmalı
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
    console.log("Aranan ID:", searchIdStr);

    // Supabase client oluştur
    const supabase = await createClient();
    
    // Kullanıcı kontrolü
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Giriş yapmanız gerekiyor." },
        { status: 401 }
      );
    }

    // Esnek sorgu: UUID ise id, sayısal ise token_id sütununda ara
    let query = supabase.from("pets").select("*");

    if (isUUID(searchIdStr)) {
      console.log("UUID formatında - id sütununda aranıyor");
      query = query.eq("id", searchIdStr);
    } else if (isNumeric(searchIdStr)) {
      console.log("Sayısal format - token_id sütununda aranıyor");
      query = query.eq("token_id", searchIdStr);
    } else {
      // Her iki sütunda da ara (fallback)
      console.log("Karışık format - her iki sütunda aranıyor");
      query = query.or(`id.eq.${searchIdStr},token_id.eq.${searchIdStr}`);
    }

    const { data: pet, error: fetchError } = await query.single();

    if (fetchError || !pet) {
      console.error("Pet bulunamadı - Error:", fetchError);
      return NextResponse.json(
        { error: "Pet bulunamadı. Lütfen ID'yi kontrol edin." },
        { status: 404 }
      );
    }

    console.log("Pet bulundu:", { id: pet.id, token_id: pet.token_id, name: pet.name });

    // Yetki kontrolü: Admin veya Pet Owner olmalı
    const { data: profile } = await supabase
      .from("profiles")
      .select("wallet_address, role")
      .eq("id", user.id)
      .single();

    const userWalletAddress = profile?.wallet_address?.toLowerCase();
    const petOwnerId = pet.owner_id;
    const petOwnerAddress = pet.owner_address?.toLowerCase();
    const isAdmin = profile?.role === "admin";
    const isOwner = petOwnerId === user.id || petOwnerAddress === userWalletAddress;

    // Admin veya Owner kontrolü
    if (!isAdmin && !isOwner) {
      console.error("Yetki hatası - User:", user.id, "Pet Owner:", petOwnerId, "Is Admin:", isAdmin, "Is Owner:", isOwner);
      return NextResponse.json(
        { error: "Bu işlem için yetkiniz yok. Sadece hayvan sahibi veya admin bu işlemi yapabilir." },
        { status: 403 }
      );
    }

    // Durumu güncelle
    const { error: updateError } = await supabase
      .from("pets")
      .update({ is_lost: isLost })
      .eq("id", pet.id);

    if (updateError) {
      console.error("Güncelleme hatası:", updateError);
      return NextResponse.json(
        { error: updateError.message || "Durum güncellenemedi." },
        { status: 500 }
      );
    }

    console.log("Durum başarıyla güncellendi:", { pet_id: pet.id, is_lost: isLost });

    // Eğer kayıp ilanı oluşturulduysa (isLost = true) ve pet sahibi varsa bildirim gönder
    if (isLost && petOwnerId) {
      try {
        const petName = pet.name && pet.name.trim() && !pet.name.startsWith("Pati #") 
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
            action: "lost_report_created"
          }
        });
      } catch (notificationError) {
        // Bildirim hatası işlemi durdurmaz, sadece logla
        console.error("Bildirim oluşturma hatası:", notificationError);
      }
    }

    // Cache'i yenile
    revalidatePath(`/pet/${pet.token_id}`);
    revalidatePath("/my-pets");

    return NextResponse.json({ 
      success: true, 
      message: "Durum başarıyla güncellendi.",
      pet_id: pet.id,
      token_id: pet.token_id,
      is_lost: isLost
    });
  } catch (error: any) {
    console.error("Toggle lost status API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to toggle status" },
      { status: 500 }
    );
  }
}

// Optional: Add GET method for debugging
export async function GET() {
  return NextResponse.json({ 
    message: "Toggle lost status endpoint. Use POST method.",
    endpoint: "/api/pets/toggle-lost"
  });
}
