import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { buildApproximateGeoDto } from "@/lib/map/approximate-geo";
import { getMapLostPetsData } from "@/lib/pets/map-public";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

/**
 * GET /api/map/lost-pets
 * Public read-only map data (service role server-side, sanitized DTO).
 * No owner_id, wallet, or contact fields.
 */
export async function GET() {
  try {
    const headerList = await headers();
    const approximateGeo = buildApproximateGeoDto(headerList);
    const { pets, scans } = await getMapLostPetsData();
    return NextResponse.json({ pets, scans, approximateGeo }, { headers: NO_STORE });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Harita verileri yüklenemedi.";
    console.error("GET /api/map/lost-pets error:", error);
    return NextResponse.json({ error: message }, { status: 500, headers: NO_STORE });
  }
}
