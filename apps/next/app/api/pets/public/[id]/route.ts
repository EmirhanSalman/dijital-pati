import { NextResponse } from "next/server";
import { getPublicPetByQrIdentifier } from "@/lib/pets/public-access";
import { publicDtoToPetCardShape } from "@/lib/pets/public-dto";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

/**
 * GET /api/pets/public/[id] — anonymous-safe DTO by token_id.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pet = await getPublicPetByQrIdentifier(id);

    if (!pet) {
      return NextResponse.json(
        { error: "Pet not found" },
        { status: 404, headers: NO_STORE }
      );
    }

    return NextResponse.json(publicDtoToPetCardShape(pet), { headers: NO_STORE });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch pet";
    console.error("GET /api/pets/public/[id] error:", error);
    return NextResponse.json({ error: message }, { status: 500, headers: NO_STORE });
  }
}
