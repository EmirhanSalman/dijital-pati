import { useState } from "react";
import { ethers } from "ethers";
import DigitalPatiABI from "@/utils/DigitalPatiABI.json";

// Get contract address from environment variable, with fallback for local development
const getContractAddress = (): string => {
  const address = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  if (!address) {
    console.warn("⚠️ NEXT_PUBLIC_CONTRACT_ADDRESS not set, using default local address");
    return "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  }
  return address;
};

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

      // Get contract address from environment variable
      const contractAddress = getContractAddress();
      console.log("📍 Using contract address:", contractAddress);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        contractAddress,
        DigitalPatiABI.abi,
        signer
      );

      setStatus("minting");

      // Get the user's address before minting (for fallback methods)
      const userAddress = await signer.getAddress();
      console.log("👤 User address:", userAddress);

      // Call mintPet function
      const tx = await contract.mintPet(ipfsUri, contactInfo);
      console.log("📤 Transaction sent:", tx.hash);
      
      let mintedTokenId: string | null = null;
      
      try {
        // Wait for transaction to be mined
        const receipt = await tx.wait();
        console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
        console.log("📋 Total logs in receipt:", receipt.logs.length);
        
        const iface = new ethers.Interface(DigitalPatiABI.abi);
        
        // Log all events found in the receipt for debugging
        console.log("🔍 Analyzing all events in receipt...");
        const allEvents: any[] = [];
        
        for (let i = 0; i < receipt.logs.length; i++) {
          const log = receipt.logs[i];
          
          // Only process logs from our contract
          const contractAddress = getContractAddress();
          if (log.address.toLowerCase() !== contractAddress.toLowerCase()) {
            continue;
          }
          
          try {
            const parsed = iface.parseLog(log);
            if (parsed) {
              allEvents.push({
                index: i,
                name: parsed.name,
                args: parsed.args.map((arg: any) => arg.toString()),
                topics: log.topics,
              });
              console.log(`  📌 Event ${i}: ${parsed.name}`, parsed.args);
            }
          } catch {
            // Not a contract event, might be a standard ERC-721 Transfer
            allEvents.push({
              index: i,
              name: "Unknown or ERC-721 Transfer",
              topics: log.topics,
              data: log.data,
            });
          }
        }
        
        console.log("📊 All events found:", JSON.stringify(allEvents, null, 2));
        
        // METHOD 1: Parse ERC-721 Transfer event (most reliable for ERC-721 mints)
        // Transfer event signature: Transfer(address indexed from, address indexed to, uint256 indexed tokenId)
        // When minting, 'from' is address(0), 'to' is the minter, 'tokenId' is in topics[3]
        const transferEventTopic = ethers.id("Transfer(address,address,uint256)");
        const zeroAddress = "0x0000000000000000000000000000000000000000";
        
        const contractAddress = getContractAddress();
        console.log("🔍 Looking for ERC-721 Transfer event...");
        console.log("  Expected Transfer topic:", transferEventTopic);
        console.log("  Contract address:", contractAddress);
        console.log("  User address:", userAddress);
        
        for (const log of receipt.logs) {
          // Only check logs from our contract
          if (log.address.toLowerCase() !== contractAddress.toLowerCase()) {
            continue;
          }
          
          // Check if this is a Transfer event (topics[0] is the event signature)
          if (log.topics && log.topics.length >= 4 && log.topics[0] === transferEventTopic) {
            // Check if this is a mint (from address is zero)
            const fromAddress = log.topics[1];
            const toAddress = log.topics[2];
            const tokenIdTopic = log.topics[3];
            
            console.log("  Found Transfer event:", {
              from: fromAddress,
              to: toAddress,
              tokenIdTopic: tokenIdTopic,
              isMint: fromAddress?.toLowerCase() === zeroAddress.toLowerCase(),
              toMatchesUser: toAddress?.toLowerCase() === userAddress.toLowerCase(),
            });
            
            if (fromAddress && fromAddress.toLowerCase() === zeroAddress.toLowerCase()) {
              // tokenId is in topics[3] (third indexed parameter, which is the 4th element)
              if (tokenIdTopic) {
                // Convert from hex to number
                try {
                  mintedTokenId = BigInt(tokenIdTopic).toString();
                  console.log("✅ Token ID extracted from ERC-721 Transfer event (mint):", mintedTokenId);
                  break;
                } catch (parseError) {
                  console.error("❌ Error parsing tokenId from Transfer event:", parseError);
                }
              }
            }
          }
        }
        
        // METHOD 2: Parse PetMinted custom event
        if (!mintedTokenId) {
          console.log("🔍 Looking for PetMinted custom event...");
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
              console.error("❌ Error parsing PetMinted event:", parseError);
            }
          }
        }
        
        // METHOD 3: Manual event decoding using event signature
        if (!mintedTokenId) {
          console.log("🔍 Trying manual event decoding...");
          const eventTopic = ethers.id("PetMinted(uint256,address)");
          
          for (const log of receipt.logs) {
            if (log.topics && log.topics[0] === eventTopic) {
              try {
                const decoded = iface.decodeEventLog("PetMinted", log.data, log.topics);
                mintedTokenId = decoded.tokenId.toString();
                console.log("✅ Token ID extracted from manual event decoding:", mintedTokenId);
                break;
              } catch (e) {
                console.error("❌ Error decoding event manually:", e);
              }
            }
          }
        }
        
        // METHOD 4: Fallback - Query contract state
        if (!mintedTokenId) {
          console.warn("⚠️ Could not extract tokenId from events. Trying contract state queries...");
          
          try {
            // Try to get totalSupply (if contract supports it)
            // This is a fallback: totalSupply() returns the count, so the latest token ID is totalSupply - 1
            try {
              if (typeof contract.totalSupply === "function") {
                const totalSupply = await contract.totalSupply();
                const totalSupplyBigInt = typeof totalSupply === "bigint" ? totalSupply : BigInt(totalSupply.toString());
                console.log("📊 Contract totalSupply:", totalSupplyBigInt.toString());
                
                if (totalSupplyBigInt > BigInt(0)) {
                  // The new token ID would be totalSupply - 1 (since tokens are 0-indexed)
                  // Example: If totalSupply is 9, the latest token ID is 8
                  mintedTokenId = (totalSupplyBigInt - BigInt(1)).toString();
                  console.log("✅ Token ID extracted from totalSupply() fallback:", mintedTokenId);
                  console.log("⚠️ Using fallback method - verify this matches the actual minted token ID");
                } else {
                  console.warn("⚠️ totalSupply() returned 0, cannot determine token ID");
                }
              } else {
                console.log("ℹ️ totalSupply() function not available in contract");
              }
            } catch (totalSupplyError: any) {
              console.log("ℹ️ totalSupply() not available or failed:", totalSupplyError.message);
            }
            
            // Try to get tokenOfOwnerByIndex (if contract supports it - requires ERC721Enumerable)
            if (!mintedTokenId) {
              try {
                if (typeof contract.tokenOfOwnerByIndex === "function") {
                  // Get the user's token count
                  const balance = await contract.balanceOf(userAddress);
                  const balanceBigInt = typeof balance === "bigint" ? balance : BigInt(balance.toString());
                  if (balanceBigInt > BigInt(0)) {
                    // Get the last token (most recently minted)
                    const lastTokenIndex = balanceBigInt - BigInt(1);
                    const tokenId = await contract.tokenOfOwnerByIndex(userAddress, lastTokenIndex);
                    mintedTokenId = tokenId.toString();
                    console.log("✅ Token ID extracted from tokenOfOwnerByIndex():", mintedTokenId);
                  }
                } else {
                  console.log("ℹ️ tokenOfOwnerByIndex() not available in contract");
                }
              } catch (tokenOfOwnerError: any) {
                console.log("ℹ️ tokenOfOwnerByIndex() failed:", tokenOfOwnerError.message);
              }
            }
            
            // Last resort: Try to find the token by checking balance before and after
            // This is less reliable but might work
            if (!mintedTokenId) {
              try {
                const balance = await contract.balanceOf(userAddress);
                const balanceBigInt = typeof balance === "bigint" ? balance : BigInt(balance.toString());
                console.log("ℹ️ User balance:", balanceBigInt.toString());
                // Note: We can't reliably determine which token was just minted this way
                // without knowing the previous balance, so we skip this method
              } catch (balanceError: any) {
                console.log("ℹ️ balanceOf() failed:", balanceError.message);
              }
            }
          } catch (queryError: any) {
            console.error("❌ Error querying contract state:", queryError);
          }
        }
        
        // Final check - if still no tokenId, log everything for debugging
        if (!mintedTokenId) {
          const contractAddress = getContractAddress();
          console.error("❌ Failed to extract tokenId. Full receipt details:", {
            transactionHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            blockHash: receipt.blockHash,
            from: receipt.from,
            to: receipt.to,
            contractAddress: contractAddress,
            logsCount: receipt.logs.length,
            allEvents: allEvents,
            allLogs: receipt.logs.map((log: any, index: number) => ({
              index,
              address: log.address,
              addressMatches: log.address.toLowerCase() === contractAddress.toLowerCase(),
              topics: log.topics,
              topicsCount: log.topics?.length || 0,
              data: log.data,
              dataLength: log.data?.length || 0,
            })),
          });
          
          throw new Error(
            `Token ID alınamadı. İşlem başarılı (Hash: ${receipt.hash}), ancak token ID tespit edilemedi. ` +
            `Lütfen blockchain explorer'da işlemi kontrol edin. ` +
            `Bulunan event sayısı: ${allEvents.length}`
          );
        }
      } catch (receiptError: any) {
        // If receipt.wait() fails, the transaction might have reverted
        if (receiptError.receipt) {
          console.error("❌ Transaction reverted. Receipt:", receiptError.receipt);
        }
        throw receiptError;
      }

      // Validate tokenId before returning
      if (!mintedTokenId || mintedTokenId === "null" || mintedTokenId === "undefined") {
        throw new Error("Token ID is invalid or missing. Cannot proceed with database save.");
      }

      // Log the exact tokenId that will be saved to database
      console.log("✅ Mint successful! Blockchain Token ID (will be saved to DB as token_id):", mintedTokenId);
      console.log("📝 Token ID type:", typeof mintedTokenId);
      console.log("📝 Token ID value:", JSON.stringify(mintedTokenId));

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

