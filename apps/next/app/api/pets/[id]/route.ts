import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPetForQrApiResponse } from "@/lib/pets/public-access";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

/**
 * GET /api/pets/[id] — QR slug is pets.token_id.
 * Always resolves DB first (service role + public DTO). Blockchain is client-only fallback on 404.
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

    const payload = await getPetForQrApiResponse(id, user?.id ?? null);
    if (!payload) {
      return NextResponse.json(
        { error: "Pet not found" },
        { status: 404, headers: NO_STORE }
      );
    }

    return NextResponse.json(payload, { headers: NO_STORE });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch pet";
    console.error("Get pet by ID API error:", error);
    return NextResponse.json({ error: message }, { status: 500, headers: NO_STORE });
  }
}
