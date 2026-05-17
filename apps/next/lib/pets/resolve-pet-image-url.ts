import { getGatewayUrl } from "@/utils/ipfs";
import { resolveImageUrl } from "@/lib/image-utils";
import { warnUnresolvedIpfsUrl } from "@/lib/image-display";

const CID_PATTERN = /^(Qm[1-9A-HJ-NP-Za-km-z]{44,}|bafy[a-z0-9]+)/i;

/**
 * Resolve pet/blockchain image_url for display (storage path, IPFS, or full URL).
 * Never returns ipfs://.
 */
export function resolvePetImageUrl(
  imageUrl: string | null | undefined,
  context = "resolvePetImageUrl"
): string {
  const raw = (imageUrl ?? "").trim();
  if (!raw) return "";

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }

  if (/^ipfs:\/\//i.test(raw)) {
    const resolved = getGatewayUrl(raw);
    warnUnresolvedIpfsUrl(resolved, context);
    return resolved;
  }

  if (CID_PATTERN.test(raw) || raw.match(/^[Qm][A-Za-z0-9]{43}$/)) {
    return getGatewayUrl(raw);
  }

  const supabaseResolved = resolveImageUrl(raw, "supabase");
  if (
    supabaseResolved &&
    !supabaseResolved.startsWith("ipfs://") &&
    (supabaseResolved.startsWith("http") || supabaseResolved.startsWith("/"))
  ) {
    return supabaseResolved;
  }

  const ipfsResolved = resolveImageUrl(raw, "ipfs");
  warnUnresolvedIpfsUrl(ipfsResolved, context);
  return ipfsResolved.startsWith("ipfs://") ? getGatewayUrl(ipfsResolved) : ipfsResolved;
}
