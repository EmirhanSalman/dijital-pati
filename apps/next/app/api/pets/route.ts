import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserPets } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

function normalizePetRow(row: Record<string, unknown>): Record<string, unknown> {
  return {
    ...row,
    is_lost: row.is_lost === true || row.is_lost === "true",
  };
}

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
      const rows = (data ?? []).map((row) =>
        normalizePetRow(row as Record<string, unknown>)
      );
      if (process.env.NODE_ENV === "development") {
        console.log("[api/pets] owner_id list", {
          count: rows.length,
          pets: rows.map((p) => ({
            name: p.name,
            token_id: p.token_id,
            is_lost: p.is_lost,
          })),
        });
      }
      return NextResponse.json(rows, { headers: NO_STORE });
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
    return NextResponse.json(
      pets.map((p) => normalizePetRow(p as unknown as Record<string, unknown>)),
      { headers: NO_STORE }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch pets";
    console.error("Get pets API error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
