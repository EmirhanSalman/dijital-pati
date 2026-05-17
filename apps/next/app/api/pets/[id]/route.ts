import { NextResponse } from "next/server";
import { createClient, getPetById } from "@/lib/supabase/server";
import { getPublicPetByQrIdentifier } from "@/lib/pets/public-access";
import { publicDtoToPetCardShape } from "@/lib/pets/public-dto";

// Force dynamic rendering to always fetch latest data
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Get pet by ID API endpoint
 * GET /api/pets/[id]
 * Authenticated: RLS-scoped full row (owners / lost / QR policies).
 * Anonymous: service role + sanitized public DTO only.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const pet = await getPetById(id);
      if (!pet) {
        return NextResponse.json({ error: "Pet not found" }, { status: 404 });
      }
      return NextResponse.json(pet);
    }

    const publicPet = await getPublicPetByQrIdentifier(id);
    if (!publicPet) {
      return NextResponse.json({ error: "Pet not found" }, { status: 404 });
    }

    return NextResponse.json(publicDtoToPetCardShape(publicPet));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch pet";
    console.error("Get pet by ID API error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
