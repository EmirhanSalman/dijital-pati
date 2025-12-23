import { useState } from "react";
import { ethers } from "ethers";
import DigitalPatiABI from "@/utils/DigitalPatiABI.json";

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export type MintStatus = "idle" | "waiting-wallet" | "minting" | "saving-db" | "success" | "error";

export interface UseMintPetReturn {
  mint: (ipfsUri: string, contactInfo: string) => Promise<string | null>;
  status: MintStatus;
  error: string | null;
  tokenId: string | null;
}

export function useMintPet(): UseMintPetReturn {
  const [status, setStatus] = useState<MintStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [tokenId, setTokenId] = useState<string | null>(null);

  const mint = async (ipfsUri: string, contactInfo: string): Promise<string | null> => {
    setStatus("waiting-wallet");
    setError(null);
    setTokenId(null);

    try {
      if (typeof window.ethereum === "undefined") {
        throw new Error("MetaMask veya başka bir Web3 cüzdanı bulunamadı.");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        DigitalPatiABI.abi,
        signer
      );

      setStatus("minting");

      // Call mintPet function
      const tx = await contract.mintPet(ipfsUri, contactInfo);
      const receipt = await tx.wait();

      // Get tokenId from event
      const iface = new ethers.Interface(DigitalPatiABI.abi);
      const eventTopic = ethers.id("PetMinted(uint256,address)");
      
      let mintedTokenId: string | null = null;
      
      // Find the PetMinted event in the logs
      for (const log of receipt.logs) {
        if (log.topics[0] === eventTopic) {
          try {
            const decoded = iface.decodeEventLog("PetMinted", log.data, log.topics);
            mintedTokenId = decoded.tokenId.toString();
            break;
          } catch (e) {
            console.error("Error decoding event:", e);
          }
        }
      }

      if (!mintedTokenId) {
        throw new Error("Token ID alınamadı. Lütfen tekrar deneyin.");
      }

      setTokenId(mintedTokenId);
      setStatus("success");
      return mintedTokenId;
    } catch (err: any) {
      console.error("Mint error:", err);
      setStatus("error");
      
      if (err.code === 4001) {
        setError("İşlem cüzdanınızda reddedildi.");
      } else if (err.message?.includes("insufficient funds")) {
        setError("Yetersiz bakiye. Lütfen cüzdanınızı kontrol edin.");
      } else {
        setError(err.message || "NFT oluşturulurken bir hata oluştu.");
      }
      
      return null;
    }
  };

  return {
    mint,
    status,
    error,
    tokenId,
  };
}

