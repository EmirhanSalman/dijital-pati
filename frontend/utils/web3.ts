import { ethers } from 'ethers';

// 1. Environment Configuration
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL;
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

// Default fallback RPC URL for Sepolia testnet (public node, no auth required)
const DEFAULT_RPC_URL = 'https://ethereum-sepolia-rpc.publicnode.com';

if (!RPC_URL) console.warn('⚠️ NEXT_PUBLIC_RPC_URL is missing. Using default public RPC node.');
if (!CONTRACT_ADDRESS) console.error('CRITICAL: NEXT_PUBLIC_CONTRACT_ADDRESS is missing.');

/**
 * Returns a read-only JsonRpcProvider for blockchain queries.
 * - Uses NEXT_PUBLIC_RPC_URL if configured, otherwise falls back to public Sepolia node
 * - Uses staticNetwork: true to prevent unnecessary network detection calls
 * - Handles potential BAD_DATA or 401 Unauthorized responses
 */
export const getReadOnlyProvider = (): ethers.JsonRpcProvider => {
  const rpcUrl = RPC_URL || DEFAULT_RPC_URL;
  
  // Create provider with staticNetwork option to prevent network detection errors
  const provider = new ethers.JsonRpcProvider(rpcUrl, 'sepolia', {
    staticNetwork: true,
  });

  // Wrap provider methods to handle errors gracefully
  const originalSend = provider.send.bind(provider);
  provider.send = async (method: string, params: Array<any>) => {
    try {
      return await originalSend(method, params);
    } catch (error: any) {
      // Handle specific error cases
      if (error?.code === 'BAD_DATA' || error?.statusCode === 401) {
        console.error('❌ RPC Error: Unauthorized or Bad Data', {
          rpcUrl: rpcUrl.replace(/\/\/.*@/, '//***@'), // Mask credentials in logs
          error: error.message,
          code: error.code,
          statusCode: error.statusCode,
        });
        throw new Error(
          `RPC connection error: ${error.message || 'Unauthorized or invalid response'}. ` +
          `Please check your NEXT_PUBLIC_RPC_URL configuration or try again later.`
        );
      }
      throw error;
    }
  };

  return provider;
};

/**
 * Returns a Web3 Provider.
 * - Prioritizes MetaMask (BrowserProvider) for interactions.
 * - Falls back to read-only provider if no wallet is present.
 */
export const getWeb3Provider = (): ethers.BrowserProvider | ethers.JsonRpcProvider => {
  // Use (window as any) to avoid TypeScript conflicts
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    return new ethers.BrowserProvider((window as any).ethereum);
  }
  
  // Use read-only provider as fallback
  return getReadOnlyProvider();
};

/**
 * Helper to get the Contract Instance
 */
export const getContract = (runner: ethers.ContractRunner, abi: any[]) => {
  if (!CONTRACT_ADDRESS) throw new Error('Contract address not configured.');
  return new ethers.Contract(CONTRACT_ADDRESS, abi, runner);
};

/**
 * Connect Wallet Function
 */
export const connectWallet = async (): Promise<ethers.JsonRpcSigner> => {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error('Lütfen MetaMask cüzdanınızı yükleyin.');
  }
  const provider = new ethers.BrowserProvider((window as any).ethereum);
  await provider.send("eth_requestAccounts", []);
  return await provider.getSigner();
};
