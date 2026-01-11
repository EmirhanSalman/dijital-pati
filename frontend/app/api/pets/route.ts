import { NextRequest, NextResponse } from "next/server";
import { getUserPets } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ownerAddress = searchParams.get("owner");

    if (!ownerAddress) {
      return NextResponse.json({ error: "Owner address required" }, { status: 400 });
    }

    const pets = await getUserPets(ownerAddress);
    return NextResponse.json(pets);
  } catch (error: any) {
    console.error("Get pets API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch pets" },
      { status: 500 }
    );
  }
}




