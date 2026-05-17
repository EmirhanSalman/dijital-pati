import { NextRequest, NextResponse } from "next/server";
import { getPublicLostPets } from "@/lib/pets/public-access";

export const dynamic = "force-dynamic";

/**
 * Safe public lost-pets list (no auth). Service role + sanitized DTO only.
 * GET /api/lost-pets/public?query=&type=&city=&sort=&page=&limit=
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "12", 10) || 12)
    );

    const { pets, count } = await getPublicLostPets(
      {
        query: searchParams.get("query") ?? undefined,
        type: searchParams.get("type") ?? undefined,
        city: searchParams.get("city") ?? undefined,
        sort: searchParams.get("sort") ?? undefined,
      },
      page,
      limit
    );

    return NextResponse.json({ pets, count, page, limit });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch lost pets";
    console.error("GET /api/lost-pets/public error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
