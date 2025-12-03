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
    try {
      totalSupply = Number(await contract.totalSupply());
    } catch (error) {
      console.warn("totalSupply() fonksiyonu bulunamadı, döngü ile kontrol ediliyor...");
      // Fallback: 0'dan başlayarak kontrol et (max 100 token)
      totalSupply = 100;
    }

    const pets: PetData[] = [];

    // Her token için veri çek
    for (let tokenId = 0; tokenId < totalSupply; tokenId++) {
      try {
        // Token'ın sahibini kontrol et (yoksa hata verir)
        const owner = await contract.ownerOf(tokenId);
        
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
        // Token yoksa veya hata varsa döngüden çık
        if (error.message?.includes("ERC721NonexistentToken") || 
            error.message?.includes("nonexistent token")) {
          // Bu token yok, döngüden çıkabiliriz
          break;
        }
        // Diğer hatalar için devam et
        console.warn(`Token ${tokenId} okunamadı:`, error.message);
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

