export {};

declare global {
  interface Window {
    ethereum: any; // MetaMask veya diğer Web3 provider'ları için
  }
}

