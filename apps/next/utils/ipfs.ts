/**
 * Converts IPFS URLs to gateway URLs for fetching and display.
 * Never returns ipfs:// — browsers cannot load that scheme.
 */

function getGatewayBase(): string {
  const gatewayUrl =
    process.env.NEXT_PUBLIC_GATEWAY_URL || "https://gateway.pinata.cloud/ipfs/";
  return gatewayUrl.endsWith("/") ? gatewayUrl : `${gatewayUrl}/`;
}

/** CID or ipfs path (no protocol) → HTTPS gateway URL */
export function ipfsPathToGateway(ipfsPath: string): string {
  const clean = ipfsPath.replace(/^\/+/, "");
  if (!clean) return "";
  return `${getGatewayBase()}${clean}`;
}

const CID_PATTERN = /^(Qm[1-9A-HJ-NP-Za-km-z]{44,}|bafy[a-z0-9]+)/i;

/**
 * Converts IPFS URLs to gateway URLs.
 * - ipfs://CID → gateway/CID
 * - ipfs://CID/path → gateway/CID/path
 * - https:// → unchanged
 * - bare CID → gateway/CID
 */
export const getGatewayUrl = (url: string): string => {
  const trimmed = (url ?? "").trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  if (/^ipfs:\/\//i.test(trimmed)) {
    return ipfsPathToGateway(trimmed.replace(/^ipfs:\/\//i, ""));
  }

  if (CID_PATTERN.test(trimmed)) {
    return ipfsPathToGateway(trimmed);
  }

  return trimmed;
};

/**
 * Fetches from IPFS with fallback to alternative gateway if first attempt fails
 */
export const fetchFromIpfsWithFallback = async (
  url: string
): Promise<Response | null> => {
  const gatewayUrl = getGatewayUrl(url);
  if (!gatewayUrl.startsWith("http")) {
    return null;
  }

  try {
    const response = await fetch(gatewayUrl);
    if (response.ok) {
      return response;
    }
  } catch (e) {
    console.log("Primary gateway failed, trying fallback...", e);
  }

  const ipfsPath = url.replace(/^ipfs:\/\//i, "").replace(/^https?:\/\/[^/]+\/ipfs\//, "");
  if (!ipfsPath) return null;

  const fallbackUrl = `https://ipfs.io/ipfs/${ipfsPath.replace(/^\/+/, "")}`;
  try {
    return await fetch(fallbackUrl);
  } catch (e) {
    console.log("Fallback gateway also failed", e);
    return null;
  }
};
