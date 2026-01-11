/**
 * Image URL Resolution Utility
 * Standardizes image URL handling for Supabase, IPFS, and other sources
 */

export type ImageSourceType = 'supabase' | 'ipfs' | 'unsplash';

/**
 * Resolves image URLs based on the source type
 * @param path - The image path (can be relative, IPFS hash, or full URL)
 * @param type - The source type: 'supabase', 'ipfs', or 'unsplash'
 * @returns The fully resolved HTTP/HTTPS URL
 */
export function resolveImageUrl(path: string, type: ImageSourceType): string {
  if (!path) {
    return '';
  }

  // If already a full HTTP/HTTPS URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  switch (type) {
    case 'ipfs': {
      // Handle ipfs:// protocol
      if (path.startsWith('ipfs://')) {
        const ipfsHash = path.replace('ipfs://', '').replace(/^\/+/, ''); // Remove protocol and leading slashes
        return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
      }
      
      // If it's just a hash (CID), assume it's IPFS
      // IPFS hashes typically start with Qm (CIDv0) or are base58/base32 encoded
      if (path.match(/^[Qm][A-Za-z0-9]{43}$/) || path.length === 46) {
        return `https://gateway.pinata.cloud/ipfs/${path}`;
      }
      
      // Fallback: treat as IPFS hash anyway
      return `https://gateway.pinata.cloud/ipfs/${path}`;
    }

    case 'supabase': {
      // If already a full URL, return as is (don't append Supabase base URL)
      if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
      }
      
      const supabaseStorageUrl = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL;
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      
      // If NEXT_PUBLIC_SUPABASE_STORAGE_URL is set, use it
      if (supabaseStorageUrl) {
        // Remove leading slash from path if present
        const cleanPath = path.startsWith('/') ? path.slice(1) : path;
        return `${supabaseStorageUrl.replace(/\/$/, '')}/${cleanPath}`;
      }
      
      // Fallback: construct from NEXT_PUBLIC_SUPABASE_URL
      if (supabaseUrl) {
        try {
          const url = new URL(supabaseUrl);
          const cleanPath = path.startsWith('/') ? path.slice(1) : path;
          return `${url.origin}/storage/v1/object/public/${cleanPath}`;
        } catch (error) {
          console.error('Invalid NEXT_PUBLIC_SUPABASE_URL:', error);
          return path; // Return as-is if URL parsing fails
        }
      }
      
      // If no env vars, return path as-is (might cause issues, but better than crashing)
      console.warn('NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_STORAGE_URL not set');
      return path;
    }

    case 'unsplash': {
      // Unsplash URLs should already be full URLs, but handle relative paths
      if (path.startsWith('/')) {
        return `https://images.unsplash.com${path}`;
      }
      return path;
    }

    default: {
      return path;
    }
  }
}

/**
 * Generates a blur data URL placeholder for images
 * Creates a tiny 1x1 pixel data URL with a light gray color
 */
export function generateBlurDataURL(color: string = '#e5e7eb'): string {
  // Create a 1x1 pixel base64 encoded image
  const svg = `
    <svg width="1" height="1" xmlns="http://www.w3.org/2000/svg">
      <rect width="1" height="1" fill="${color}"/>
    </svg>
  `.trim();
  
  // Use browser-compatible base64 encoding
  let base64: string;
  if (typeof window !== 'undefined' && window.btoa) {
    // Browser environment
    base64 = window.btoa(unescape(encodeURIComponent(svg)));
  } else if (typeof Buffer !== 'undefined') {
    // Node.js environment
    base64 = Buffer.from(svg).toString('base64');
  } else {
    // Fallback: use a simple data URL without base64
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }
  
  return `data:image/svg+xml;base64,${base64}`;
}

