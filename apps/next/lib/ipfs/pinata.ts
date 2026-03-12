/**
 * Pinata IPFS Upload Service
 * Handles file uploads to IPFS via Pinata API
 */

interface PinataResponse {
  IpfsHash?: string;
  ipfsHash?: string;
  hash?: string;
  PinSize?: number;
  Timestamp?: string;
  isDuplicate?: boolean;
}

interface PinataError {
  error?: {
    reason?: string;
    details?: string;
    message?: string;
  };
  message?: string;
}

/**
 * Uploads a file to IPFS via Pinata
 * @param file - The file to upload
 * @returns Object with ipfsHash and gateway URL
 */
export async function uploadToPinata(file: File): Promise<{
  ipfsHash: string;
  gatewayUrl: string;
  error?: never;
}> {
  // Check for required environment variables (using NEXT_PUBLIC_ prefix)
  const pinataApiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
  const pinataSecretKey = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;
  const pinataJwt = process.env.NEXT_PUBLIC_PINATA_JWT;
  const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL;

  console.log("🔵 Starting Pinata upload...");
  console.log("📋 File details:", {
    name: file.name,
    type: file.type,
    size: file.size,
    lastModified: new Date(file.lastModified).toISOString(),
  });

  // Validate environment variables
  if (!pinataJwt && (!pinataApiKey || !pinataSecretKey)) {
    const errorMsg =
      "Pinata credentials not found. Please set either NEXT_PUBLIC_PINATA_JWT or both NEXT_PUBLIC_PINATA_API_KEY and NEXT_PUBLIC_PINATA_SECRET_KEY in your environment variables.";
    console.error("❌", errorMsg);
    throw new Error(errorMsg);
  }

  // Validate file
  if (!file) {
    const errorMsg = "No file provided for upload.";
    console.error("❌", errorMsg);
    throw new Error(errorMsg);
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    const errorMsg = `Invalid file type: ${file.type}. Allowed types: ${allowedTypes.join(", ")}`;
    console.error("❌", errorMsg);
    throw new Error(errorMsg);
  }

  // Validate file size (max 100MB for Pinata free tier, adjust as needed)
  const maxSize = 100 * 1024 * 1024; // 100MB
  if (file.size > maxSize) {
    const errorMsg = `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${maxSize / 1024 / 1024}MB)`;
    console.error("❌", errorMsg);
    throw new Error(errorMsg);
  }

  try {
    // Create FormData
    const formData = new FormData();
    formData.append("file", file);

    // Add metadata (optional but recommended)
    const metadata = JSON.stringify({
      name: file.name,
      keyvalues: {
        uploadedAt: new Date().toISOString(),
        fileType: file.type,
      },
    });
    formData.append("pinataMetadata", metadata);

    // Add options (optional)
    const options = JSON.stringify({
      cidVersion: 1, // Use IPFS CIDv1
    });
    formData.append("pinataOptions", options);

    console.log("📤 Preparing request to Pinata API...");

    // Determine which authentication method to use
    const headers: HeadersInit = {};
    
    if (pinataJwt) {
      // Use JWT authentication (recommended)
      headers["Authorization"] = `Bearer ${pinataJwt}`;
      console.log("🔑 Using JWT authentication");
    } else if (pinataApiKey && pinataSecretKey) {
      // Use API key authentication (legacy)
      headers["pinata_api_key"] = pinataApiKey;
      headers["pinata_secret_api_key"] = pinataSecretKey;
      console.log("🔑 Using API key authentication");
    }

    // Make request to Pinata API
    const pinataUrl = "https://api.pinata.cloud/pinning/pinFileToIPFS";
    console.log("🌐 Sending request to:", pinataUrl);

    const response = await fetch(pinataUrl, {
      method: "POST",
      headers,
      body: formData,
    });

    console.log("📥 Response status:", response.status, response.statusText);

    // Parse response
    const responseData: PinataResponse | PinataError = await response.json();

    // Log full response for debugging
    console.log("📦 Full Pinata response:", JSON.stringify(responseData, null, 2));

    // Handle errors
    if (!response.ok) {
      const errorData = responseData as PinataError;
      const errorMessage =
        errorData.error?.reason ||
        errorData.error?.details ||
        errorData.error?.message ||
        errorData.message ||
        `Pinata API error: ${response.status} ${response.statusText}`;

      console.error("❌ Pinata upload failed:", {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        fullResponse: responseData,
      });

      throw new Error(`IPFS upload failed: ${errorMessage}`);
    }

    // Extract IPFS hash from response
    // Pinata can return the hash in different fields depending on API version
    const pinataData = responseData as PinataResponse;
    const ipfsHash =
      pinataData.IpfsHash || // Pinata API v1 format
      pinataData.ipfsHash || // Alternative format
      pinataData.hash; // Fallback

    if (!ipfsHash) {
      console.error("❌ IPFS hash not found in response:", responseData);
      throw new Error(
        "IPFS hash not found in Pinata response. Response structure: " +
          JSON.stringify(responseData)
      );
    }

    console.log("✅ Upload successful! IPFS Hash:", ipfsHash);

    // Construct gateway URL (use custom gateway if provided, otherwise default to Pinata)
    const finalGatewayUrl = gatewayUrl
      ? `${gatewayUrl.replace(/\/$/, "")}/${ipfsHash}` // Remove trailing slash if present
      : `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
    console.log("🔗 Gateway URL:", finalGatewayUrl);

    return {
      ipfsHash,
      gatewayUrl: finalGatewayUrl,
    };
  } catch (error: any) {
    // Enhanced error logging
    console.error("❌ Pinata upload error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause,
    });

    // Re-throw with more context if it's not already our error
    if (error.message && error.message.includes("IPFS")) {
      throw error;
    }

    throw new Error(
      `Failed to upload to IPFS: ${error.message || "Unknown error"}`
    );
  }
}

