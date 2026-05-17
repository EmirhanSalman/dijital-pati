/**
 * Helpers for displaying remote pet/media images with Next.js Image.
 */

const IPFS_HOSTS = ["gateway.pinata.cloud", "ipfs.io", "cloudflare-ipfs.com"];

/** URLs that should bypass the custom loader / optimization (IPFS gateways, etc.). */
export function shouldUnoptimizeImageUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (/^ipfs:\/\//i.test(trimmed)) return true;
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return false;
  }
  try {
    const host = new URL(trimmed).hostname;
    return IPFS_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

/** Dev-only: catch any ipfs:// still reaching the DOM. */
export function warnUnresolvedIpfsUrl(
  resolved: string,
  context: string
): void {
  if (process.env.NODE_ENV !== "development") return;
  if (resolved.startsWith("ipfs://")) {
    console.warn(
      `[image] Unresolved ipfs:// URL after resolver (${context}):`,
      resolved
    );
  }
}

/** Safe src for <img> / next/image — never pass ipfs:// through. */
export function safeImageSrc(
  resolved: string,
  fallback = ""
): string {
  if (!resolved || resolved.startsWith("ipfs://")) {
    return fallback;
  }
  return resolved;
}
