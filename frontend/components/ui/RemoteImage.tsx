"use client";

import Image, { ImageProps } from "next/image";
import { resolveImageUrl, generateBlurDataURL, type ImageSourceType } from "@/lib/image-utils";
import { useState } from "react";

export interface RemoteImageProps extends Omit<ImageProps, "src"> {
  /**
   * The image source path (can be relative, IPFS hash, or full URL)
   */
  src: string;
  /**
   * The source type: 'supabase', 'ipfs', or 'unsplash'
   * If not provided, will attempt to auto-detect based on the src
   */
  type?: ImageSourceType;
  /**
   * Custom blur data URL for the placeholder
   * If not provided, a default gray placeholder will be generated
   */
  blurDataURL?: string;
  /**
   * Whether to show a placeholder while loading
   * @default true
   */
  showPlaceholder?: boolean;
}

/**
 * RemoteImage Component
 * 
 * A wrapper around Next.js Image component that standardizes image URL handling
 * for Supabase storage, IPFS (Pinata), and other external sources.
 * 
 * @example
 * ```tsx
 * // Supabase image
 * <RemoteImage 
 *   src="pet-images/image.jpg" 
 *   type="supabase" 
 *   alt="Pet image"
 *   width={400}
 *   height={300}
 * />
 * 
 * // IPFS image
 * <RemoteImage 
 *   src="ipfs://QmHash..." 
 *   type="ipfs" 
 *   alt="IPFS image"
 *   fill
 * />
 * ```
 */
export default function RemoteImage({
  src,
  type,
  blurDataURL,
  showPlaceholder = true,
  alt,
  ...imageProps
}: RemoteImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Auto-detect type if not provided
  const detectedType: ImageSourceType = type || (() => {
    if (src.startsWith('ipfs://') || src.match(/^[Qm][A-Za-z0-9]{43}$/)) {
      return 'ipfs';
    }
    if (src.includes('supabase.co') || src.includes('/storage/v1/object/public/')) {
      return 'supabase';
    }
    if (src.includes('unsplash.com')) {
      return 'unsplash';
    }
    // Default to supabase for relative paths (common case)
    return 'supabase';
  })();

  // Resolve the image URL based on type
  const resolvedUrl = resolveImageUrl(src, detectedType);

  // Generate blur placeholder if not provided and showPlaceholder is true
  const defaultBlurDataURL = showPlaceholder && !blurDataURL 
    ? generateBlurDataURL() 
    : blurDataURL;

  // Handle image load
  const handleLoad = () => {
    setIsLoading(false);
  };

  // Handle image error
  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // If there's an error and no fallback, show a placeholder
  if (hasError && !resolvedUrl) {
    return (
      <div 
        className="bg-gray-200 flex items-center justify-center"
        style={{
          width: imageProps.width || '100%',
          height: imageProps.height || '100%',
        }}
      >
        <span className="text-gray-400 text-sm">Image not available</span>
      </div>
    );
  }

  return (
    <Image
      src={resolvedUrl || src}
      alt={alt || ''}
      onLoad={handleLoad}
      onError={handleError}
      blurDataURL={defaultBlurDataURL}
      placeholder={showPlaceholder && defaultBlurDataURL ? "blur" : "empty"}
      {...imageProps}
    />
  );
}

