import { NextRequest, NextResponse } from "next/server";
import { uploadPetImage } from "@/app/actions/pets";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const result = await uploadPetImage(formData);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ url: result.url });
  } catch (error: any) {
    console.error("Upload API error:", error);
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}



