/**
 * Converts IPFS URLs to gateway URLs for fetching
 * - If URL starts with 'ipfs://', converts to gateway URL
 * - If URL already starts with 'http', returns as is
 * - Uses NEXT_PUBLIC_GATEWAY_URL or defaults to dweb.link (stable and fast)
 */
export const getGatewayUrl = (url: string): string => {
  // If already an HTTP URL, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // If IPFS URL, convert to gateway URL
  if (url.startsWith('ipfs://')) {
    const ipfsHash = url.replace('ipfs://', '');
    // Use NEXT_PUBLIC_GATEWAY_URL if configured, otherwise use dweb.link
    const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://dweb.link/ipfs/';
    // Ensure gateway URL ends with /
    const baseUrl = gatewayUrl.endsWith('/') ? gatewayUrl : `${gatewayUrl}/`;
    // Form URL correctly: https://dweb.link/ipfs/CID
    return `${baseUrl}${ipfsHash}`;
  }

  // If neither, return as is (might be a relative path or other format)
  return url;
};

/**
 * Fetches from IPFS with fallback to alternative gateway if first attempt fails
 */
export const fetchFromIpfsWithFallback = async (url: string): Promise<Response | null> => {
  // If already HTTP URL, fetch directly
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      return await fetch(url);
    } catch (e) {
      return null;
    }
  }

  // If IPFS URL, try primary gateway first, then fallback
  if (url.startsWith('ipfs://')) {
    const ipfsHash = url.replace('ipfs://', '');
    
    // Primary gateway: dweb.link
    const primaryGateway = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://dweb.link/ipfs/';
    const primaryUrl = `${primaryGateway.endsWith('/') ? primaryGateway : `${primaryGateway}/`}${ipfsHash}`;
    
    try {
      const response = await fetch(primaryUrl);
      if (response.ok) {
        return response;
      }
    } catch (e) {
      console.log('Primary gateway failed, trying fallback...', e);
    }

    // Fallback gateway: ipfs.io
    const fallbackGateway = 'https://ipfs.io/ipfs/';
    const fallbackUrl = `${fallbackGateway}${ipfsHash}`;
    
    try {
      return await fetch(fallbackUrl);
    } catch (e) {
      console.log('Fallback gateway also failed', e);
      return null;
    }
  }

  return null;
};

