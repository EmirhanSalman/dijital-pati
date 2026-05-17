/**
 * Supabase Image Loader for Next.js Image Optimization
 * 
 * This loader bypasses Vercel's image optimization and uses Supabase's
 * built-in image transformation API instead. This fixes the
 * INVALID_IMAGE_OPTIMIZE_REQUEST (400) error on Vercel.
 * 
 * Supabase Image Transformation API:
 * https://[project-ref].supabase.co/storage/v1/object/public/[bucket]/[path]?width=...&quality=...&resize=...
 */

interface LoaderParams {
  src: string;
  width: number;
  quality?: number;
}

function appendTransformParams(url: string, width: number, quality: number): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("width", String(width));
    parsed.searchParams.set("quality", String(quality));
    return parsed.toString();
  } catch {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}width=${width}&quality=${quality}`;
  }
}

export default function supabaseLoader({ src, width, quality = 75 }: LoaderParams): string {
  // Local / static paths: append width so Next.js loader contract is satisfied
  if (src.startsWith("/")) {
    return appendTransformParams(src, width, quality);
  }

  if (/^ipfs:\/\//i.test(src)) {
    console.warn("[supabaseLoader] ipfs:// passed to Image loader — resolve before render:", src);
    return appendTransformParams(src, width, quality);
  }

  // If src is already a full URL (starts with http:// or https://)
  if (src.startsWith('http://') || src.startsWith('https://')) {
    // Check if it's a Supabase URL
    if (src.includes('supabase.co') && src.includes('/storage/v1/object/public/')) {
      // It's already a Supabase storage URL, just add transformation params
      const url = new URL(src);
      url.searchParams.set('width', width.toString());
      url.searchParams.set('quality', quality.toString());
      url.searchParams.set('resize', 'contain');
      return url.toString();
    }
    
    // External URLs (IPFS gateway, Unsplash, …): include width so Next.js loader contract is satisfied
    return appendTransformParams(src, width, quality);
  }

  // For relative paths, construct the full Supabase storage URL
  const supabaseStorageUrl = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  let baseUrl: string;

  if (supabaseStorageUrl) {
    // Use NEXT_PUBLIC_SUPABASE_STORAGE_URL if available
    baseUrl = supabaseStorageUrl.replace(/\/$/, ''); // Remove trailing slash
  } else if (supabaseUrl) {
    // Fallback: construct from NEXT_PUBLIC_SUPABASE_URL
    try {
      const url = new URL(supabaseUrl);
      baseUrl = `${url.origin}/storage/v1/object/public`;
    } catch (error) {
      console.error('Invalid NEXT_PUBLIC_SUPABASE_URL:', error);
      // Fallback: return src as-is if URL parsing fails
      return src;
    }
  } else {
    console.warn('NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_STORAGE_URL not set');
    return src;
  }

  // Clean the path: remove leading slash to avoid double slashes
  const cleanPath = src.startsWith('/') ? src.slice(1) : src;

  // Construct the full URL with transformation parameters
  const url = new URL(`${baseUrl}/${cleanPath}`);
  url.searchParams.set('width', width.toString());
  url.searchParams.set('quality', quality.toString());
  url.searchParams.set('resize', 'contain');

  return url.toString();
}


