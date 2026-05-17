import { NextRequest, NextResponse } from "next/server";
import { insertPublicPetScan } from "@/lib/pets/public-scan";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

/**
 * POST /api/pet-scans/public
 * Body: { token_id | qrToken, latitude, longitude }
 * Anonymous sighting — inserts pet_scans only (service role, server-side).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tokenId = body.token_id ?? body.qrToken ?? body.tokenId;
    const { latitude, longitude } = body;

    if (tokenId == null || latitude == null || longitude == null) {
      return NextResponse.json(
        { error: "token_id, latitude ve longitude gerekli." },
        { status: 400, headers: NO_STORE }
      );
    }

    const lat = typeof latitude === "string" ? parseFloat(latitude) : Number(latitude);
    const lng =
      typeof longitude === "string" ? parseFloat(longitude) : Number(longitude);

    const result = await insertPublicPetScan(String(tokenId), lat, lng);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status, headers: NO_STORE }
      );
    }

    return NextResponse.json(
      {
        success: true,
        duplicate: result.duplicate,
        message: result.message,
        pet_name: result.petName,
        token_id: result.token_id,
        scan_id: result.scanId,
      },
      { headers: NO_STORE }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "İstek işlenemedi.";
    console.error("POST /api/pet-scans/public error:", error);
    return NextResponse.json({ error: message }, { status: 500, headers: NO_STORE });
  }
}
