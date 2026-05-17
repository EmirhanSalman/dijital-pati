import { NextResponse } from "next/server";
import { getPublicLostPetByIdentifier } from "@/lib/pets/public-access";

export const dynamic = "force-dynamic";

/**
 * Safe public lost-pet detail (no auth).
 * GET /api/lost-pets/public/[id]  — id = pets.id or token_id
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pet = await getPublicLostPetByIdentifier(id);

    if (!pet) {
      return NextResponse.json({ error: "Pet not found" }, { status: 404 });
    }

    return NextResponse.json(pet);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch pet";
    console.error("GET /api/lost-pets/public/[id] error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
