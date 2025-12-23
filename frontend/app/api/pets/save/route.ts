import { NextRequest, NextResponse } from "next/server";
import { savePetToDatabase } from "@/app/actions/pets";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.tokenId || !body.name || !body.breed || !body.imageUrl || !body.ownerAddress) {
      return NextResponse.json(
        { error: "Eksik alanlar: tokenId, name, breed, imageUrl ve ownerAddress gerekli." },
        { status: 400 }
      );
    }

    // Validate tokenId explicitly - it MUST come from blockchain receipt
    const tokenIdString = String(body.tokenId).trim();
    if (!tokenIdString || tokenIdString === "null" || tokenIdString === "undefined") {
      console.error("❌ API: Invalid tokenId in request:", body.tokenId);
      return NextResponse.json(
        { error: "Geçersiz tokenId. Token ID blockchain receipt'ten gelmelidir." },
        { status: 400 }
      );
    }

    console.log("📥 API: Saving pet with token_id from blockchain:", tokenIdString);
    console.log("📋 Request body tokenId:", body.tokenId, "→ Normalized:", tokenIdString);

    // At least one contact method is required
    if (!body.phone && !body.email && !body.contactInfo) {
      return NextResponse.json(
        { error: "En az bir iletişim yöntemi (telefon veya e-posta) gereklidir." },
        { status: 400 }
      );
    }

    const result = await savePetToDatabase(body);

    if (result.error) {
      // Veritabanı hatası için 500, diğer hatalar için 400
      const statusCode = result.error.includes("Veritabanı Hatası") ? 500 : 400;
      return NextResponse.json({ error: result.error }, { status: statusCode });
    }

    return NextResponse.json({ success: true, message: result.message });
  } catch (error: any) {
    console.error("Save API Error:", error);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      stack: error?.stack,
    });
    
    // Error objesini düzgün serialize et
    const errorMessage = error?.message || "Pet kaydedilirken bir hata oluştu.";
    const errorDetails = {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
    };

    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails,
      },
      { status: 500 }
    );
  }
}

