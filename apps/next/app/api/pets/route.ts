import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserPets } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ownerAddress = request.nextUrl.searchParams.get("owner");

    if (!ownerAddress) {
      const { data, error } = await supabase
        .from("pets")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        return NextResponse.json(
          { error: error.message || "Failed to fetch pets" },
          { status: 500 }
        );
      }
      return NextResponse.json(data ?? []);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("wallet_address")
      .eq("id", user.id)
      .maybeSingle();

    const wallet = profile?.wallet_address?.toLowerCase();
    if (!wallet || wallet !== ownerAddress.toLowerCase()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const pets = await getUserPets(ownerAddress);
    return NextResponse.json(pets);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch pets";
    console.error("Get pets API error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
