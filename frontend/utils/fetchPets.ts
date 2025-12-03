import { ethers } from "ethers";
import DigitalPatiABI from "./DigitalPatiABI.json";
import { CONTRACT_ADDRESS, LOCALHOST_RPC } from "./constants";

export interface PetData {
  id: number;
  name: string;
  description: string;
  image: string;
  isLost: boolean;
  contactInfo: string;
  owner: string;
  tokenURI: string;
}

/**
 * IPFS URL'ini gateway URL'ine çevirir
 */
const convertIPFSToGateway = (ipfsUrl: string): string => {
  if (ipfsUrl.startsWith("ipfs://")) {
    return ipfsUrl.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
  }
  if (ipfsUrl.startsWith("https://ipfs.io/ipfs/")) {
    return ipfsUrl.replace("https://ipfs.io/ipfs/", "https://gateway.pinata.cloud/ipfs/");
  }
  return ipfsUrl;
};

/**
 * Blockchain'den tüm petleri çeker
 */
export const fetchAllPets = async (): Promise<PetData[]> => {
  try {
    // Provider oluştur (local network için)
    const provider = new ethers.JsonRpcProvider(LOCALHOST_RPC);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, DigitalPatiABI.abi, provider);

    // Toplam token sayısını al
    let totalSupply = 0;
    let useTotalSupply = false;
    
    try {
      const supply = await contract.totalSupply();
      totalSupply = Number(supply);
      useTotalSupply = true;
      
      // Eğer totalSupply 0 ise, hiç token yok demektir
      if (totalSupply === 0) {
        return [];
      }
    } catch (error: any) {
      // totalSupply() yoksa veya hata verirse, döngü ile kontrol et
      console.warn("totalSupply() fonksiyonu bulunamadı veya hata verdi, döngü ile kontrol ediliyor...", error?.message);
      useTotalSupply = false;
      // Fallback: 0'dan başlayarak kontrol et (max 50 token - daha güvenli limit)
      totalSupply = 50;
    }

    const pets: PetData[] = [];

    // Her token için veri çek
    let consecutiveErrors = 0; // Ardışık hata sayacı
    const maxConsecutiveErrors = 3; // 3 ardışık hata sonrası döngüden çık
    
    for (let tokenId = 0; tokenId < totalSupply; tokenId++) {
      try {
        // Token'ın sahibini kontrol et (yoksa hata verir)
        const owner = await contract.ownerOf(tokenId);
        consecutiveErrors = 0; // Başarılı, hatayı sıfırla
        
        // Token URI'yi al
        const tokenURI = await contract.tokenURI(tokenId);
        
        // Pet durumunu al
        const petStatus = await contract.getPetStatus(tokenId);
        const isLost = petStatus[0];
        const contactInfo = petStatus[1];

        // Metadata'yı IPFS'ten çek
        const gatewayURI = convertIPFSToGateway(tokenURI);
        let metadata = {
          name: `Pati #${tokenId}`,
          description: "Evcil hayvan kimlik kaydı",
          image: gatewayURI, // Fallback olarak tokenURI kullan
        };

        try {
          const metadataResponse = await fetch(gatewayURI);
          if (metadataResponse.ok) {
            metadata = await metadataResponse.json();
          }
        } catch (error) {
          console.warn(`Token ${tokenId} metadata çekilemedi:`, error);
        }

        // Image URL'ini düzelt
        const imageUrl = metadata.image 
          ? convertIPFSToGateway(metadata.image)
          : gatewayURI;

        pets.push({
          id: tokenId,
          name: metadata.name || `Pati #${tokenId}`,
          description: metadata.description || "Evcil hayvan kimlik kaydı",
          image: imageUrl,
          isLost,
          contactInfo,
          owner: owner,
          tokenURI: gatewayURI,
        });
      } catch (error: any) {
        // Token yoksa veya hata varsa kontrol et
        const errorMessage = error.message || error.toString() || "";
        const errorCode = error.code || "";
        
        consecutiveErrors++;
        
        // Token yoksa belirtileri
        const isTokenNotFound = 
          errorMessage.includes("ERC721NonexistentToken") || 
          errorMessage.includes("nonexistent token") ||
          errorMessage.includes("could not decode result data") ||
          errorCode === "BAD_DATA" ||
          errorMessage.includes("value=\"0x\"");
        
        if (isTokenNotFound) {
          // Eğer totalSupply kullanıyorsak ve token yoksa, bu normal (sonraki tokenler de yoktur)
          if (useTotalSupply) {
            break;
          }
          // Eğer totalSupply kullanmıyorsak, ardışık hataları kontrol et
          if (consecutiveErrors >= maxConsecutiveErrors) {
            // 3 ardışık token yok, döngüden çık
            break;
          }
        } else {
          // Beklenmeyen hata, log yaz ama devam et
          console.warn(`Token ${tokenId} beklenmeyen hata:`, errorMessage);
          if (consecutiveErrors >= maxConsecutiveErrors) {
            break;
          }
        }
      }
    }

    return pets;
  } catch (error) {
    console.error("Petler çekilirken hata:", error);
    throw error;
  }
};

/**
 * Belirli bir kullanıcının petlerini çeker
 */
export const fetchUserPets = async (userAddress: string): Promise<PetData[]> => {
  const allPets = await fetchAllPets();
  return allPets.filter(pet => 
    pet.owner.toLowerCase() === userAddress.toLowerCase()
  );
};

