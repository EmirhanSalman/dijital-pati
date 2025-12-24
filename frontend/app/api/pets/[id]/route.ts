import { NextResponse } from "next/server";
import { getPetById } from "@/lib/supabase/server";

// Force dynamic rendering to always fetch latest data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Get pet by ID API endpoint
 * GET /api/pets/[id]
 * Supports both UUID (Supabase id) and token_id (blockchain token ID)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Next.js 15+ için params bir Promise'dir
    const { id } = await params;
    
    // Debug log
    console.log("GET /api/pets/[id] - Requested ID:", id);

    // Use getPetById which handles both UUID and token_id automatically
    const pet = await getPetById(id);

    // Check if pet exists
    if (!pet) {
      console.log("GET /api/pets/[id] - Pet not found for ID:", id);
      return NextResponse.json(
        { error: "Pet not found" },
        { status: 404 }
      );
    }

    console.log("GET /api/pets/[id] - Pet found:", { id: pet.id, token_id: pet.token_id, name: pet.name });
    
    // Return pet data
    return NextResponse.json(pet);
  } catch (error: any) {
    console.error("Get pet by ID API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch pet" },
      { status: 500 }
    );
  }
}
