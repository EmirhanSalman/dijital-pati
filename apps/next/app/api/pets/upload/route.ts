import { NextRequest, NextResponse } from "next/server";
import { uploadPetImage } from "@/app/actions/pets";

export async function POST(request: NextRequest) {
  try {
    console.log("📥 Upload API: Received request");
    
    const formData = await request.formData();
    const file = formData.get("image");
    
    if (!file) {
      console.error("❌ Upload API: No file in request");
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    console.log("📤 Upload API: Processing file upload...");
    const result = await uploadPetImage(formData);

    if (result.error) {
      console.error("❌ Upload API: Upload failed:", result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Return full result including IPFS hash if available
    const response = {
      url: result.url,
      // Include IPFS hash in all possible formats for compatibility
      ipfsHash: result.ipfsHash || result.hash || result.IpfsHash,
      hash: result.ipfsHash || result.hash || result.IpfsHash,
      IpfsHash: result.ipfsHash || result.hash || result.IpfsHash,
      message: result.message,
    };

    console.log("✅ Upload API: Upload successful", {
      hasIpfsHash: !!response.ipfsHash,
      url: response.url,
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("❌ Upload API error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    
    return NextResponse.json(
      {
        error: error.message || "Upload failed",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}



