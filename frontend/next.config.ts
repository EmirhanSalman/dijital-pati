import type { NextConfig } from "next";

// Extract Supabase hostname from environment variable
const getSupabaseHostname = (): string => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL environment variable is required. Please add it to your .env.local file."
    );
  }
  try {
    const url = new URL(supabaseUrl);
    return url.hostname;
  } catch (error) {
    throw new Error(
      `Invalid NEXT_PUBLIC_SUPABASE_URL format: ${supabaseUrl}. Please ensure it's a valid URL.`
    );
  }
};

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "gateway.pinata.cloud",
      },
      {
        protocol: "https",
        hostname: "ipfs.io",
      },
      {
        protocol: "https",
        hostname: getSupabaseHostname(),
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;