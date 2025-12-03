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

const convertIPFSToGateway = (ipfsUrl: string): string => {
  if (!ipfsUrl) return "";
  if (ipfsUrl.startsWith("ipfs://")) {
    return ipfsUrl.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
  }
  return ipfsUrl;
};

export const fetchAllPets = async (): Promise<PetData[]> => {
  try {
    // 1. Provider Oluştur
    // cache: "no-store" mantığı sunucu tarafı fetch'ler içindir, burada JsonRpcProvider tazedir.
    const provider = new ethers.JsonRpcProvider(LOCALHOST_RPC);
    
    // Ağın hazır olup olmadığını kontrol et (Opsiyonel güvenlik)
    try {
        await provider.getNetwork();
    } catch (e) {
        console.warn("Local Blockchain ağına bağlanılamadı.");
        return [];
    }

    const contract = new ethers.Contract(CONTRACT_ADDRESS, DigitalPatiABI.abi, provider);

    // 2. KRİTİK DÜZELTME: Toplam Sayıyı Kesin Olarak Öğren
    let totalSupply = 0;
    
    try {
      const supply = await contract.totalSupply();
      totalSupply = Number(supply);
    } catch (error) {
      console.error("totalSupply okunamadı. Olası sebepler: Yanlış Contract Adresi veya Boş Ağ.", error);
      // HATA VARSA ASLA 50 VARSAYMA! 0 DÖNDÜR VE ÇIK.
      return [];
    }

    if (totalSupply === 0) {
      return [];
    }

    console.log(`Blockchain üzerinde ${totalSupply} adet kayıt bulundu.`);

    const pets: PetData[] = [];

    // 3. Döngü
    for (let tokenId = 0; tokenId < totalSupply; tokenId++) {
      try {
        // a. Önce Token Var mı Kontrol Et (ownerOf en garantisidir)
        const owner = await contract.ownerOf(tokenId);
        
        // b. Token URI ve Durum Çek
        const tokenURI = await contract.tokenURI(tokenId);
        const petStatus = await contract.getPetStatus(tokenId); // [isLost, contactInfo]
        
        const isLost = petStatus[0];
        const contactInfo = petStatus[1];

        // c. Metadata Çek
        const gatewayURI = convertIPFSToGateway(tokenURI);
        let metadata = {
          name: `Pati #${tokenId}`,
          description: "Veri yükleniyor...",
          image: "",
        };

        try {
          const metaResponse = await fetch(gatewayURI);
          if (metaResponse.ok) {
            const json = await metaResponse.json();
            metadata = { ...metadata, ...json };
          }
        } catch (err) {
          console.warn(`Token ${tokenId} metadata JSON indirilemedi, varsayılanlar kullanılıyor.`);
        }

        pets.push({
          id: tokenId,
          name: metadata.name,
          description: metadata.description,
          image: convertIPFSToGateway(metadata.image),
          isLost: isLost,
          contactInfo: contactInfo,
          owner: owner,
          tokenURI: gatewayURI,
        });

      } catch (innerError) {
        // Eğer tek bir token hatalıysa (örn: yakılmışsa), sadece onu atla
        console.error(`Token ID ${tokenId} verisi alınırken hata oluştu, atlanıyor:`, innerError);
        continue;
      }
    }

    return pets;

  } catch (error) {
    console.error("Genel Fetch Hatası (Kritik):", error);
    // Tüm uygulama çökmesin diye boş dizi dön
    return [];
  }
};

export const fetchUserPets = async (userAddress: string): Promise<PetData[]> => {
  const allPets = await fetchAllPets();
  if (!userAddress) return [];
  return allPets.filter(pet => 
    pet.owner.toLowerCase() === userAddress.toLowerCase()
  );
};