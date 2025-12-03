"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Wallet, Loader2, Save, Image as ImageIcon, RefreshCw, QrCode, Search, PawPrint, ExternalLink } from "lucide-react";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react"; 
import DigitalPatiABI from "../../utils/DigitalPatiABI.json";
import { CONTRACT_ADDRESS } from "../../utils/constants";
import { fetchAllPets, PetData } from "../../utils/fetchPets";
import PetCard from "../../components/PetCard";
import Link from "next/link";

export default function DashboardPage() {
  const [account, setAccount] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"my-pets" | "new-record" | "gallery">("my-pets");
  
  // --- TÜM PETLER (GALERİ) ---
  const [allPets, setAllPets] = useState<PetData[]>([]);
  const [galleryLoading, setGalleryLoading] = useState<boolean>(false);

  // --- FORM VERİLERİ ---
  const [petName, setPetName] = useState("");
  const [petContact, setPetContact] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  // --- KULLANICININ HAYVANLARI ---
  const [myPets, setMyPets] = useState<any[]>([]);

  // 1. CÜZDAN BAĞLAMA VE VERİ ÇEKME
  const connectWallet = async () => {
    try {
      // @ts-ignore
      if (!window.ethereum) throw new Error("MetaMask bulunamadı!");
      // @ts-ignore
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setAccount(address);
      
      // Cüzdan bağlandığı an hayvanları aramaya başla
      fetchMyPets(address, provider);
      // Galeriyi de yükle
      loadAllPets();

    } catch (err: any) {
      alert("Hata: " + err.message);
    }
  };

  // 2. TÜM PETLERİ ÇEK (GALERİ İÇİN)
  const loadAllPets = async () => {
    setGalleryLoading(true);
    try {
      const pets = await fetchAllPets();
      setAllPets(pets);
    } catch (error) {
      console.error("Petler yüklenemedi:", error);
      alert("Petler yüklenirken bir hata oluştu. Lütfen Hardhat node'unun çalıştığından emin olun.");
    } finally {
      setGalleryLoading(false);
    }
  };

  // 3. KULLANICININ HAYVANLARINI BUL (MVP İÇİN DÖNGÜ)
  const fetchMyPets = async (userAddress: string, provider: any) => {
    setLoading(true);
    const foundPets = [];
    const contract = new ethers.Contract(CONTRACT_ADDRESS, DigitalPatiABI.abi, provider);

    try {
        // MVP SINIRI: İlk 10 ID'yi kontrol edelim (Gerçek projede TheGraph kullanılır)
        for (let i = 0; i < 10; i++) {
            try {
                const owner = await contract.ownerOf(i);
                
                // Eğer bu ID'nin sahibi bağlanan cüzdan ise listeye ekle
                if (owner.toLowerCase() === userAddress.toLowerCase()) {
                    const status = await contract.getPetStatus(i);
                    const tokenURI = await contract.tokenURI(i);
                    
                    // Metadata çek
                    let finalImage = tokenURI;
                    try {
                        const res = await fetch(tokenURI);
                        const meta = await res.json();
                        finalImage = meta.image || tokenURI;
                    } catch (e) { console.log("Metadata okunamadı", e) }

                    foundPets.push({
                        id: i,
                        isLost: status[0],
                        contact: status[1],
                        image: finalImage
                    });
                }
            } catch (err) {
                // Bu ID henüz oluşturulmamışsa döngü hata verir, normaldir.
                // Hata verince döngüden çıkabiliriz çünkü sonraki ID'ler de yoktur.
                break;
            }
        }
        setMyPets(foundPets);
    } catch (error) {
        console.error("Hayvanlar çekilemedi:", error);
    } finally {
        setLoading(false);
    }
  };

  // 3. RESİM VE IPFS
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file)); 
    }
  };

  // Resim yükleme (IPFS)
  const uploadToPinata = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const metadata = JSON.stringify({ name: "DijitalPati-Image" });
    formData.append("pinataMetadata", metadata);
    const options = JSON.stringify({ cidVersion: 0 });
    formData.append("pinataOptions", options);

    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
          pinata_api_key: process.env.NEXT_PUBLIC_PINATA_API_KEY!,
          pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SECRET_KEY!,
      },
      body: formData,
    });
    if (!res.ok) throw new Error("Pinata Resim Yükleme Hatası");
    const resData = await res.json();
    return `https://gateway.pinata.cloud/ipfs/${resData.IpfsHash}`;
  };

  // Metadata JSON oluştur ve IPFS'e yükle
  const uploadMetadataToPinata = async (imageUrl: string, petName: string, contactInfo: string) => {
    const metadata = {
      name: `DijitalPati - ${petName}`,
      description: `Evcil hayvan kimlik kaydı: ${petName}`,
      image: imageUrl,
      attributes: [
        {
          trait_type: "İletişim",
          value: contactInfo
        },
        {
          trait_type: "Durum",
          value: "Güvende"
        }
      ]
    };

    const formData = new FormData();
    const blob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
    formData.append("file", blob, "metadata.json");
    
    const pinataMetadata = JSON.stringify({ name: `DijitalPati-Metadata-${petName}` });
    formData.append("pinataMetadata", pinataMetadata);
    const options = JSON.stringify({ cidVersion: 0 });
    formData.append("pinataOptions", options);

    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
          pinata_api_key: process.env.NEXT_PUBLIC_PINATA_API_KEY!,
          pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SECRET_KEY!,
      },
      body: formData,
    });
    
    if (!res.ok) throw new Error("Pinata Metadata Yükleme Hatası");
    const resData = await res.json();
    return `https://gateway.pinata.cloud/ipfs/${resData.IpfsHash}`;
  };

  // 4. MINT (KAYIT) - Blockchain'e NFT Oluştur
  const handleMint = async () => {
    if (!petName || !petContact || !selectedImage) {
      alert("Lütfen tüm alanları doldurun!"); 
      return;
    }
    
    setLoading(true);
    setStatus("📤 Resim IPFS'e yükleniyor...");

    try {
      // 1. Resmi IPFS'e yükle
      const imageUrl = await uploadToPinata(selectedImage);
      setStatus("📝 Metadata oluşturuluyor...");

      // 2. Metadata JSON oluştur ve IPFS'e yükle
      const metadataUrl = await uploadMetadataToPinata(imageUrl, petName, petContact);
      setStatus("⛓️ Blockchain işlemi başlatılıyor...");

      // 3. MetaMask provider'ı al
      // @ts-ignore
      if (!window.ethereum) {
        throw new Error("MetaMask bulunamadı! Lütfen MetaMask yükleyin.");
      }
      
      // @ts-ignore
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // 4. Contract instance oluştur
      const contract = new ethers.Contract(CONTRACT_ADDRESS, DigitalPatiABI.abi, signer);

      // 5. mintPet fonksiyonunu çağır (metadataUrl ve contactInfo gönder)
      setStatus("⏳ İşlem onayınızı bekliyor...");
      
      // Gas limit belirle (Hardhat local için)
      const tx = await contract.mintPet(metadataUrl, petContact, {
        gasLimit: 500000 // Hardhat local için yeterli
      });
      
      setStatus("⏳ İşlem blockchain'e yazılıyor...");
      const receipt = await tx.wait();
      
      // Token ID'yi almak için event'i parse et (ethers.js v6)
      let tokenId = null;
      try {
        // Receipt'ten event'leri parse et
        if (receipt.logs && receipt.logs.length > 0) {
          for (const log of receipt.logs) {
            try {
              const parsedLog = contract.interface.parseLog({
                topics: log.topics,
                data: log.data
              });
              
              if (parsedLog && parsedLog.name === "PetMinted") {
                tokenId = parsedLog.args.tokenId.toString();
                break;
              }
            } catch (e) {
              // Bu log başka bir event olabilir, devam et
              continue;
            }
          }
        }
      } catch (error) {
        console.warn("Event parse edilemedi (bu normal olabilir):", error);
        // Event parse edilemese bile işlem başarılı
      }

      setStatus("✅ NFT Başarıyla Oluşturuldu!");
      const successMessage = tokenId 
        ? `🎉 Başarılı! NFT'niz blockchain'e kaydedildi.\n\nToken ID: #${tokenId}\nİşlem Hash: ${tx.hash.slice(0, 10)}...`
        : `🎉 Başarılı! NFT'niz blockchain'e kaydedildi.\n\nİşlem Hash: ${tx.hash}`;
      alert(successMessage);
      
      // Listeyi güncelle ve sekmeyi değiştir
      fetchMyPets(account, provider);
      loadAllPets(); // Galeriyi de yenile
      setActiveTab("my-pets");
      
      // Formu temizle
      setPetName(""); 
      setPetContact(""); 
      setSelectedImage(null); 
      setPreviewUrl("");
      setStatus("");

    } catch (error: any) {
        console.error("Mint Hatası:", error);
        setStatus("❌ Hata: " + (error.message || "Bilinmeyen hata"));
        alert("Hata: " + (error.message || "NFT oluşturulamadı. Lütfen tekrar deneyin."));
    } finally {
      setLoading(false);
    }
  };

  // 5. DURUM DEĞİŞTİR (KAYIP/GÜVENDE)
  const toggleStatus = async (petId: number) => {
    try {
        setLoading(true);
        // @ts-ignore
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, DigitalPatiABI.abi, signer);

        const tx = await contract.toggleLostStatus(petId);
        await tx.wait();
        
        // Listeyi Yenile
        fetchMyPets(account, provider);
        alert("Durum güncellendi!");
    } catch (error: any) {
        alert("Hata: " + error.message);
    } finally {
        setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 text-center">
        <div className="bg-white p-10 rounded-3xl shadow-xl max-w-lg w-full">
            <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <PawPrint size={40} className="text-blue-600"/>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Hoş Geldiniz</h1>
            <p className="text-gray-500 mb-8">Evcil hayvanlarınızı yönetmek için cüzdanınızı bağlayın.</p>
            <button onClick={connectWallet} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2">
            <Wallet /> Cüzdan ile Giriş Yap
            </button>
            <Link href="/" className="block mt-6 text-gray-400 hover:text-blue-600">← Ana Sayfaya Dön</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Üst Bilgi */}
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Merhaba, Sahip 👋</h1>
                <p className="text-gray-500 text-sm">Cüzdan: {account.slice(0,6)}...{account.slice(-4)}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
                <button 
                    onClick={() => setActiveTab("my-pets")}
                    className={`px-6 py-2 rounded-full font-bold transition ${activeTab === "my-pets" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}
                >
                    🐾 Patilerim
                </button>
                <button 
                    onClick={() => setActiveTab("gallery")}
                    className={`px-6 py-2 rounded-full font-bold transition ${activeTab === "gallery" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}
                >
                    🖼️ Galeri
                </button>
                <button 
                    onClick={() => setActiveTab("new-record")}
                    className={`px-6 py-2 rounded-full font-bold transition ${activeTab === "new-record" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}
                >
                    + Yeni Ekle
                </button>
            </div>
        </div>

        {/* --- SEKME 1: PATİLERİM (LİSTE) --- */}
        {activeTab === "my-pets" && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
                {/* Yükleniyor mu? */}
                {loading && myPets.length === 0 && (
                    <div className="col-span-full text-center py-20 text-gray-400">
                        <Loader2 className="animate-spin mx-auto mb-2 w-8 h-8"/> Veriler Blockchain'den taranıyor...
                    </div>
                )}

                {/* Hiç Kayıt Yoksa */}
                {!loading && myPets.length === 0 && (
                    <div className="col-span-full bg-white p-12 rounded-3xl text-center shadow-sm">
                        <PawPrint className="w-16 h-16 text-gray-200 mx-auto mb-4"/>
                        <h3 className="text-xl font-bold text-gray-700">Henüz hiç patiniz yok</h3>
                        <p className="text-gray-400 mb-6">İlk dostunuzu kaydetmek için yukarıdaki "Yeni Ekle" butonuna basın.</p>
                        <button onClick={() => setActiveTab("new-record")} className="text-blue-600 font-bold hover:underline">Şimdi Kaydet</button>
                    </div>
                )}

                {/* Pati Kartları */}
                {myPets.map((pet) => (
                    <div key={pet.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
                        <div className="relative h-48 bg-gray-100">
                            <Image src={pet.image} alt="Pati" fill className="object-cover" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"/>
                            <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold text-white ${pet.isLost ? "bg-red-500 animate-pulse" : "bg-green-500"}`}>
                                {pet.isLost ? "KAYIP!" : "GÜVENDE"}
                            </div>
                        </div>
                        
                        <div className="p-5">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-800">Pati #{pet.id}</h3>
                                    <p className="text-xs text-gray-400">İletişim: {pet.contact}</p>
                                </div>
                                <Link href={`/pet/${pet.id}`} target="_blank" className="text-blue-500 hover:text-blue-700">
                                    <ExternalLink size={18}/>
                                </Link>
                            </div>

                            {/* QR Kod Alanı (Gizlenebilir/Açılabilir yapılabilir ama şimdilik açık kalsın) */}
                            <div className="bg-gray-50 p-3 rounded-xl flex items-center gap-3 mb-4">
                                <div className="bg-white p-1 rounded">
                                    <QRCodeSVG value={`${window.location.origin}/pet/${pet.id}`} size={40} />
                                </div>
                                <div className="text-xs text-gray-500">
                                    <p className="font-bold">QR Kimlik</p>
                                    <p>Tasmaya yapıştırılabilir</p>
                                </div>
                            </div>

                            <button 
                                onClick={() => toggleStatus(pet.id)} 
                                disabled={loading}
                                className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition ${pet.isLost ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-700 hover:bg-red-200"}`}
                            >
                                <RefreshCw size={16}/>
                                {pet.isLost ? "Güvende İşaretle" : "Kayıp Bildirimi Yap"}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* --- SEKME 2: GALERİ (TÜM PETLER) --- */}
        {activeTab === "gallery" && (
            <div className="animate-in fade-in duration-500">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">🖼️ Kayıtlı Dostlarım</h2>
                    <button
                        onClick={loadAllPets}
                        disabled={galleryLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={galleryLoading ? "animate-spin" : ""} />
                        Yenile
                    </button>
                </div>

                {/* Yükleniyor */}
                {galleryLoading && (
                    <div className="text-center py-20">
                        <Loader2 className="animate-spin mx-auto mb-4 w-12 h-12 text-blue-600" />
                        <p className="text-gray-500">Blockchain'den petler yükleniyor...</p>
                    </div>
                )}

                {/* Pet Listesi */}
                {!galleryLoading && allPets.length === 0 && (
                    <div className="bg-white p-12 rounded-3xl text-center shadow-sm">
                        <PawPrint className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-700 mb-2">Henüz hiç pet kaydedilmemiş</h3>
                        <p className="text-gray-400 mb-6">İlk pet'i kaydetmek için "Yeni Ekle" sekmesine gidin.</p>
                        <button 
                            onClick={() => setActiveTab("new-record")} 
                            className="text-blue-600 font-bold hover:underline"
                        >
                            Şimdi Kaydet
                        </button>
                    </div>
                )}

                {/* Pet Kartları Grid */}
                {!galleryLoading && allPets.length > 0 && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {allPets.map((pet) => (
                            <PetCard key={pet.id} pet={pet} />
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* --- SEKME 3: YENİ KAYIT --- */}
        {activeTab === "new-record" && (
            <div className="bg-white p-8 rounded-3xl shadow-sm max-w-2xl mx-auto animate-in slide-in-from-right-8 duration-300">
                 <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Save size={20} className="text-blue-600"/> Yeni Dost Kaydet
                 </h2>

                 <div className="space-y-6">
                    <div className="w-full h-64 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center relative bg-gray-50 group hover:bg-gray-100 transition cursor-pointer">
                        {previewUrl ? (
                            <Image src={previewUrl} alt="Önizleme" fill className="object-cover rounded-2xl" sizes="(max-width: 768px) 100vw, 768px"/>
                        ) : (
                            <div className="text-center text-gray-400"><ImageIcon className="mx-auto mb-2"/>Fotoğraf Seç</div>
                        )}
                        <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <input type="text" value={petName} onChange={(e) => setPetName(e.target.value)} placeholder="Hayvan Adı" className="p-3 border rounded-xl w-full" />
                        <input type="tel" value={petContact} onChange={(e) => setPetContact(e.target.value)} placeholder="İletişim No" className="p-3 border rounded-xl w-full" />
                    </div>
                    
                    {status && <div className="text-center text-blue-600 text-sm font-bold">{status}</div>}

                    <button onClick={handleMint} disabled={loading} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 flex justify-center gap-2">
                        {loading ? <Loader2 className="animate-spin" /> : "Blockchain'e Kaydet"}
                    </button>
                 </div>
            </div>
        )}

      </div>
    </div>
  );
}