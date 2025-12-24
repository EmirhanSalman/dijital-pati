import { ethers } from 'ethers';

// 1. Environment Configuration
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL;
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

if (!RPC_URL) console.error('CRITICAL: NEXT_PUBLIC_RPC_URL is missing.');
if (!CONTRACT_ADDRESS) console.error('CRITICAL: NEXT_PUBLIC_CONTRACT_ADDRESS is missing.');

/**
 * Returns a Web3 Provider.
 * - Prioritizes MetaMask (BrowserProvider) for interactions.
 * - Throws an error if no wallet is present and RPC URL is not configured.
 */
export const getWeb3Provider = (): ethers.BrowserProvider | ethers.JsonRpcProvider => {
  // Use (window as any) to avoid TypeScript conflicts
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    return new ethers.BrowserProvider((window as any).ethereum);
  }
  
  // If no browser wallet and RPC URL is missing, throw descriptive error
  if (!RPC_URL) {
    throw new Error(
      'Web3 provider configuration error: NEXT_PUBLIC_RPC_URL environment variable is missing. ' +
      'Please configure your RPC URL in your environment variables. ' +
      'If you are using a browser wallet, please install and connect MetaMask.'
    );
  }
  
  return new ethers.JsonRpcProvider(RPC_URL);
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
