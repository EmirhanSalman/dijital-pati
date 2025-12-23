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

      // Call mintPet function - it returns the tokenId directly
      const tx = await contract.mintPet(ipfsUri, contactInfo);
      
      // Method 1: Try to get tokenId from the transaction return value (most reliable)
      let mintedTokenId: string | null = null;
      
      try {
        // Wait for transaction to be mined
        const receipt = await tx.wait();
        
        // The mintPet function returns uint256 (tokenId), so we can get it from the receipt
        // However, ethers v6 doesn't directly expose return values in receipts
        // So we'll use event parsing as the primary method
        
        // Method 2: Parse PetMinted event from logs (most reliable for event-based contracts)
        const iface = new ethers.Interface(DigitalPatiABI.abi);
        
        // Find PetMinted event in the receipt logs
        const petMintedEvent = receipt.logs.find((log: any) => {
          try {
            const parsed = iface.parseLog(log);
            return parsed && parsed.name === "PetMinted";
          } catch {
            return false;
          }
        });
        
        if (petMintedEvent) {
          try {
            const parsed = iface.parseLog(petMintedEvent);
            if (parsed && parsed.name === "PetMinted") {
              // tokenId is the first indexed parameter
              mintedTokenId = parsed.args[0].toString();
              console.log("✅ Token ID extracted from PetMinted event:", mintedTokenId);
            }
          } catch (parseError) {
            console.error("Error parsing PetMinted event:", parseError);
          }
        }
        
        // Method 3: Fallback - manually decode using event signature
        if (!mintedTokenId) {
          const eventTopic = ethers.id("PetMinted(uint256,address)");
          
          for (const log of receipt.logs) {
            if (log.topics && log.topics[0] === eventTopic) {
              try {
                const decoded = iface.decodeEventLog("PetMinted", log.data, log.topics);
                mintedTokenId = decoded.tokenId.toString();
                console.log("✅ Token ID extracted from manual event decoding:", mintedTokenId);
                break;
              } catch (e) {
                console.error("Error decoding event manually:", e);
              }
            }
          }
        }
        
        // Method 4: Last resort - try to call the contract's return value
        // Note: This won't work directly, but we can query the contract state
        if (!mintedTokenId) {
          console.warn("⚠️ Could not extract tokenId from events. Attempting alternative method...");
          
          // Try to get the latest token ID by checking the contract's totalSupply or similar
          // This is a fallback and may not work for all contracts
          try {
            // If the contract has a way to get the latest token, use it
            // For now, we'll log the receipt for debugging
            console.log("Transaction receipt:", {
              transactionHash: receipt.hash,
              blockNumber: receipt.blockNumber,
              logs: receipt.logs.length,
              logDetails: receipt.logs.map((log: any) => ({
                address: log.address,
                topics: log.topics,
                data: log.data,
              })),
            });
          } catch (queryError) {
            console.error("Error querying contract state:", queryError);
          }
        }
        
        if (!mintedTokenId) {
          // Log detailed error information for debugging
          console.error("❌ Failed to extract tokenId. Receipt details:", {
            transactionHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            logsCount: receipt.logs.length,
            contractAddress: CONTRACT_ADDRESS,
            expectedEvent: "PetMinted(uint256,address)",
            allLogs: receipt.logs.map((log: any, index: number) => ({
              index,
              address: log.address,
              topics: log.topics,
              data: log.data,
            })),
          });
          
          throw new Error(
            "Token ID alınamadı. İşlem başarılı olabilir, ancak token ID tespit edilemedi. " +
            "Lütfen blockchain explorer'da işlemi kontrol edin: " + receipt.hash
          );
        }
      } catch (receiptError: any) {
        // If receipt.wait() fails, the transaction might have reverted
        if (receiptError.receipt) {
          console.error("Transaction reverted. Receipt:", receiptError.receipt);
        }
        throw receiptError;
      }

      setTokenId(mintedTokenId);
      setStatus("success");
      console.log("✅ Mint successful! Token ID:", mintedTokenId);
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

