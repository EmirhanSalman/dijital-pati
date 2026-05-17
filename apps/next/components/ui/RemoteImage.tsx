"use client";

import Image, { ImageProps } from "next/image";
import { generateBlurDataURL } from "@/lib/image-utils";
import { shouldUnoptimizeImageUrl, safeImageSrc } from "@/lib/image-display";
import { resolvePetImageUrl } from "@/lib/pets/resolve-pet-image-url";
import { useState } from "react";

export interface RemoteImageProps extends Omit<ImageProps, "src"> {
  src: string;
  blurDataURL?: string;
  showPlaceholder?: boolean;
  /** Dev warning label when resolver is bypassed */
  resolveContext?: string;
}

export default function RemoteImage({
  src,
  blurDataURL,
  showPlaceholder = true,
  alt,
  resolveContext = "RemoteImage",
  ...imageProps
}: RemoteImageProps) {
  const [hasError, setHasError] = useState(false);

  const resolvedUrl = resolvePetImageUrl(src, resolveContext);
  const displaySrc = safeImageSrc(resolvedUrl);
  const unoptimized = shouldUnoptimizeImageUrl(displaySrc || src);

  const defaultBlurDataURL =
    showPlaceholder && !blurDataURL ? generateBlurDataURL() : blurDataURL;

  if (hasError || !displaySrc) {
    return (
      <div
        className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground text-sm"
        style={{
          width: imageProps.width || "100%",
          height: imageProps.height || "100%",
        }}
      >
        Görsel yok
      </div>
    );
  }

  return (
    <Image
      src={displaySrc}
      alt={alt || ""}
      unoptimized={unoptimized}
      onError={() => setHasError(true)}
      blurDataURL={unoptimized ? undefined : defaultBlurDataURL}
      placeholder={
        unoptimized || !showPlaceholder || !defaultBlurDataURL ? "empty" : "blur"
      }
      {...imageProps}
    />
  );
}
