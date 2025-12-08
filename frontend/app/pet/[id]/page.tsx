"use client";

import { useState, useEffect, use } from "react";
import { ethers } from "ethers";
import { Phone, CheckCircle, AlertTriangle, Loader2, MapPin } from "lucide-react";
import PetFoundButton from "@/components/PetFoundButton";
import DigitalPatiABI from "../../../utils/DigitalPatiABI.json";
import Image from "next/image";

// SENİN SÖZLEŞME ADRESİN
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export default function PetPage({ params }: { params: Promise<{ id: string }> }) {
  // Next.js 15+ için params bir Promise'dir, onu 'use' ile çözüyoruz
  const { id } = use(params);

  const [petData, setPetData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ownerAddress, setOwnerAddress] = useState<string | null>(null);

  useEffect(() => {
    // ID kontrolünü güçlendirdik: "0" stringi JavaScript'te bazen falsy karışıklığı yaratabilir
    if (id !== null && id !== undefined) {
      fetchPetData();
    }
  }, [id]);

  const fetchPetData = async () => {
    try {
      console.log(`🚀 İşlem Başlıyor... Hedef ID: ${id}`);
      
      // 1. Blockchain'e "Sadece Okuma" (Read-Only) modunda bağlan
      const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
      const contract = new ethers.Contract(CONTRACT_ADDRESS, DigitalPatiABI.abi, provider);

      // 2. Blockchain'den Durumu Çek
      console.log("📡 Blockchain'den durum soruluyor...");
      const status = await contract.getPetStatus(id);
      console.log("✅ Durum Geldi:", status);
      
      const isLost = status[0]; // status.isLost
      const contactInfo = status[1]; // status.contactInfo

      // 2.5. Owner address'i çek
      const owner = await contract.ownerOf(id);
      setOwnerAddress(owner);

      // 3. IPFS Linkini (TokenURI) Çek
      console.log("🔗 TokenURI (IPFS Linki) isteniyor...");
      const tokenURI = await contract.tokenURI(id);
      console.log("✅ TokenURI:", tokenURI);
      
      if (!tokenURI) {
        throw new Error("Blockchain'de bu ID için bir IPFS linki kayıtlı değil.");
      }

      // 4. Metadata veya Resim Kontrolü (HATA ÇÖZÜMÜ BURADA)
      // Varsayılan değerler: Eğer JSON yoksa, URI'nin kendisini resim olarak kabul et.
      let finalName = `Pati #${id}`;
      let finalImage = tokenURI;

      try {
        const response = await fetch(tokenURI);
        const contentType = response.headers.get("content-type");

        // Eğer gelen veri bir JSON ise (Metadata ise)
        if (contentType && contentType.includes("application/json")) {
            const metadata = await response.json();
            console.log("✅ Metadata JSON:", metadata);
            finalName = metadata.name || finalName;
            finalImage = metadata.image || finalImage;
        } else {
            // JSON değilse (muhtemelen doğrudan resimdir), olduğu gibi kullan
            console.warn("⚠️ TokenURI bir JSON dosyası değil, doğrudan resim dosyası olarak algılandı.");
        }
      } catch (parseError) {
        console.warn("Metadata okunamadı, varsayılan değerler kullanılıyor:", parseError);
      }

      setPetData({
        id: id,
        name: finalName,
        image: finalImage,
        isLost: isLost,
        contact: contactInfo
      });

    } catch (err: any) {
      console.error("❌ HATA OLUŞTU:", err);
      
      const errorMessage = err.message || JSON.stringify(err);
      
      // Özel Hata Mesajları
      if (errorMessage.includes("ERC721NonexistentToken") || errorMessage.includes("nonexistent token") || errorMessage.includes("revert")) {
        setError(`⚠️ Bu ID (#${id}) henüz Blockchain'e kaydedilmemiş. Lütfen Admin panelinden yeni bir kayıt oluşturun.`);
      } else if (err.code === "NETWORK_ERROR" || errorMessage.includes("NetworkError") || errorMessage.includes("Connection refused")) {
        setError("🔌 Blockchain ağına bağlanılamadı. 'npx hardhat node' terminalinin açık olduğundan emin olun.");
      } else {
        setError("Veri çekilirken bir hata oluştu: " + (err.shortMessage || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin w-10 h-10 text-blue-600"/>
        <p className="text-gray-500">Veriler Blockchain'den alınıyor...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Bir Sorun Var</h2>
        <div className="text-red-600 bg-red-50 p-4 rounded-xl border border-red-100 max-w-md break-words">
            {error}
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-md w-full">
        
        {/* Resim Alanı */}
        <div className="relative h-72 w-full bg-gray-200">
          {petData?.image ? (
            <Image 
              src={petData.image} 
              alt={petData.name} 
              fill 
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // HIZLANDIRMA: Ekran boyutuna göre resim boyutu ayarla
              priority // HIZLANDIRMA: Bu resmi öncelikli yükle (Bekletme)
              className="object-cover"
              onError={() => console.error("Resim yüklenemedi:", petData.image)} 
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">Resim Yok</div>
          )}
          
          {/* Durum Rozeti */}
          {petData && (
            <div className={`absolute top-4 right-4 px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 ${petData.isLost ? "bg-red-500 text-white animate-pulse" : "bg-green-500 text-white"}`}>
                {petData.isLost ? <><AlertTriangle size={20}/> KAYIP!</> : <><CheckCircle size={20}/> GÜVENDE</>}
            </div>
          )}
        </div>

        {/* Bilgiler */}
        {petData && (
        <div className="p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{petData.name}</h1>
          <p className="text-gray-400 text-sm mb-6">ID: #{petData.id}</p>

          {petData.isLost ? (
            <div className="bg-red-50 border-2 border-red-100 rounded-2xl p-6 mb-6">
              <h3 className="text-red-800 font-bold mb-2">SAHİBİNİN BİLGİLERİ</h3>
              <p className="text-gray-600 text-sm mb-4">Bu dostumuz kaybolmuş! Lütfen aşağıdaki numaradan sahibine ulaşın.</p>
              
              <a href={`tel:${petData.contact}`} className="bg-red-600 text-white w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition shadow-lg shadow-red-200 mb-4">
                <Phone /> {petData.contact}
              </a>
              
              {/* Bildirim Butonu */}
              <PetFoundButton petId={id} ownerAddress={ownerAddress} />
            </div>
          ) : (
            <div className="bg-green-50 border-2 border-green-100 rounded-2xl p-6 mb-6">
              <h3 className="text-green-800 font-bold flex items-center justify-center gap-2">
                <CheckCircle size={20}/> Durum: Güvende
              </h3>
              <p className="text-gray-600 text-sm mt-2">
                Bu evcil hayvanın sahibi tarafından herhangi bir kayıp bildirimi yapılmamıştır.
              </p>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-gray-400 text-xs mt-4">
             <MapPin size={12}/> DijitalPati Blockchain Koruması
          </div>
        </div>
        )}

      </div>
    </div>
  );
}