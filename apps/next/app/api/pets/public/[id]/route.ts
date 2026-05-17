import { NextResponse } from "next/server";
import { getPublicPetByQrIdentifier } from "@/lib/pets/public-access";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Safe public pet by QR slug (token_id). No auth required.
 * GET /api/pets/public/[id]
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pet = await getPublicPetByQrIdentifier(id);

    if (!pet) {
      return NextResponse.json({ error: "Pet not found" }, { status: 404 });
    }

    return NextResponse.json(pet);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch pet";
    console.error("GET /api/pets/public/[id] error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
