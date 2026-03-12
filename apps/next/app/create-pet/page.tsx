"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Wallet,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { connectWallet, getContract } from "@/utils/web3";
import { ethers } from "ethers";
import { CITIES as ALL_CITIES } from "@/constants/cities";
import { compressImage } from "@/utils/image-compression";

// Pet türleri (FilterBar ile aynı)
const PET_TYPES = [
  { value: "Kedi", label: "Kedi" },
  { value: "Köpek", label: "Köpek" },
  { value: "Kuş", label: "Kuş" },
  { value: "Diğer", label: "Diğer" },
];

// Şehirler (merkezi listeden, "all" hariç - create-pet sayfasında "Tümü" seçeneği yok)
const CITIES = ALL_CITIES.map((city: string) => ({ value: city, label: city }));

// Minimal ABI
const DIGITAL_PATI_ABI = [
  "function mintPet(string tokenURI, string contactInfo) public returns (uint256)",
  "event PetMinted(uint256 indexed tokenId, address owner)"
];

type Step = 'initial' | 'uploading' | 'minting' | 'saving' | 'success' | 'error';

export default function CreatePetPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [step, setStep] = useState<Step>("initial");
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    breed: "",
    description: "",
    phone: "",
    email: "",
    city: "",
    district: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [tokenId, setTokenId] = useState<string | null>(null);

  // Check for existing wallet connection on mount and get user email
  useEffect(() => {
    const checkWallet = async () => {
      if (typeof window.ethereum !== "undefined") {
        try {
          const { ethers } = await import("ethers");
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.listAccounts();
          if (accounts.length > 0) {
            setWalletAddress(accounts[0].address);
          }
        } catch (err) {
          console.log("No wallet connected");
        }
      }
    };
    
    const getUserEmail = async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        
        if (user?.email) {
          setFormData((prev) => ({ ...prev, email: user.email || "" }));
        }
      } catch (err) {
        console.log("Could not fetch user email");
      }
    };
    
    checkWallet();
    getUserEmail();
  }, []);

  // Wallet Connection (UI handler)
  const handleConnectWallet = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      if (typeof window.ethereum === "undefined") {
        throw new Error(
          "MetaMask veya başka bir Web3 cüzdanı bulunamadı. Lütfen MetaMask yükleyin."
        );
      }

      const { ethers } = await import("ethers");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);

      if (accounts.length === 0) {
        throw new Error("Cüzdan bağlantısı reddedildi.");
      }

      setWalletAddress(accounts[0]);
    } catch (err: any) {
      setError(err.message || "Cüzdan bağlantısı başarısız.");
      console.error("Wallet connection error:", err);
    } finally {
      setIsConnecting(false);
    }
  };

  // File Selection - Compress immediately before storing in state
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError("Geçersiz dosya formatı. Lütfen JPEG, PNG, WebP veya GIF formatında bir resim seçin.");
      return;
    }

    try {
      // Compress image BEFORE storing in state
      console.log("🔄 Compressing image on file selection...");
      const compressedFile = await compressImage(file);

      // Store compressed file in state
      setSelectedFile(compressedFile);
      const objectUrl = URL.createObjectURL(compressedFile);
      setPreviewUrl(objectUrl);
      setError(null);
    } catch (error: any) {
      console.error("❌ Image compression error:", error);
      setError("Resim sıkıştırılırken bir hata oluştu: " + (error.message || "Bilinmeyen hata"));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Geçersiz dosya formatı. Lütfen bir resim dosyası seçin.");
      return;
    }

    try {
      // Compress image BEFORE storing in state
      console.log("🔄 Compressing dropped image...");
      const compressedFile = await compressImage(file);

      // Store compressed file in state
      setSelectedFile(compressedFile);
      const objectUrl = URL.createObjectURL(compressedFile);
      setPreviewUrl(objectUrl);
      setError(null);
    } catch (error: any) {
      console.error("❌ Image compression error:", error);
      setError("Resim sıkıştırılırken bir hata oluştu: " + (error.message || "Bilinmeyen hata"));
    }
  };

  // Form Submit - Robust Web3 handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!walletAddress) {
      setError("Lütfen önce cüzdanınızı bağlayın.");
      return;
    }
    if (!selectedFile) {
      setError("Lütfen bir resim seçin.");
      return;
    }
    if (!formData.name || !formData.breed || (!formData.phone && !formData.email)) {
      setError("Lütfen tüm zorunlu alanları doldurun.");
      return;
    }

    try {
      // --- STEP 1: Upload Image to Pinata ---
      // Note: Image is already compressed in handleFileSelect/handleDrop
      setStep("uploading");
      const imageFormData = new FormData();
      imageFormData.append("image", selectedFile);

      const uploadResponse = await fetch("/api/pets/upload", {
        method: "POST",
        body: imageFormData,
      });

      if (!uploadResponse.ok) throw new Error("Resim yüklenemedi.");
      const uploadData = await uploadResponse.json();
      
      const ipfsHash = uploadData.ipfsHash || uploadData.IpfsHash;
      if (!ipfsHash) throw new Error("IPFS hash alınamadı.");

      const ipfsUri = `ipfs://${ipfsHash}`;
      const imageUrlForDb = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
      setImageUrl(imageUrlForDb);

      // --- STEP 3: Blockchain Transaction ---
      setStep("minting"); 
      
      // A. Connect & Get Contract
      const signer = await connectWallet();
      const contract = getContract(signer, DIGITAL_PATI_ABI);

      // B. Prepare Data
      const contactInfo = JSON.stringify({
        phone: formData.phone,
        email: formData.email,
        name: formData.name
      });

      // C. Send Transaction
      console.log("Minting pet...", { ipfsUri, contactInfo });
      const tx = await contract.mintPet(ipfsUri, contactInfo);
      console.log("Transaction sent:", tx.hash);

      // D. Wait for Transaction Receipt & Extract Token ID
      // Wait for 1 confirmation to ensure transaction is finalized
      console.log("⏳ Waiting for transaction confirmation...");
      const receipt = await tx.wait(1);
      console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
      
      // E. Parse Logs to find 'PetMinted' event
      let mintedTokenId: string | null = null;
      
      // Method 1: Try to parse PetMinted event from contract interface
      for (const log of receipt.logs) {
        try {
          const parsedLog = contract.interface.parseLog(log);
          if (parsedLog && parsedLog.name === 'PetMinted') {
            // PetMinted event: event PetMinted(uint256 indexed tokenId, address owner)
            // tokenId is the first indexed parameter (args[0])
            mintedTokenId = parsedLog.args[0].toString();
            console.log("✅ Found PetMinted event with tokenId:", mintedTokenId);
            break;
          }
        } catch (err) {
          // This log doesn't match our contract interface, continue
          continue;
        }
      }

      // Method 2: Fallback - Look for ERC721 Transfer event
      // Transfer(address indexed from, address indexed to, uint256 indexed tokenId)
      // The tokenId is in the third topic (index 2)
      if (!mintedTokenId) {
        console.log("⚠️ PetMinted event not found, trying Transfer event...");
        for (const log of receipt.logs) {
          try {
            // Transfer event signature: keccak256("Transfer(address,address,uint256)")
            // Topics: [eventSignature, from, to, tokenId]
            if (log.topics && log.topics.length >= 4) {
              // Check if this is a Transfer event (first topic should be Transfer signature)
              // Transfer(address,address,uint256) = 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
              const transferEventSignature = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
              if (log.topics[0] === transferEventSignature) {
                // tokenId is in topics[3] (index 2, but topics array is 0-indexed)
                const tokenIdHex = log.topics[3];
                if (tokenIdHex) {
                  mintedTokenId = BigInt(tokenIdHex).toString();
                  console.log("✅ Found Transfer event with tokenId:", mintedTokenId);
                  break;
                }
              }
            }
          } catch (err) {
            continue;
          }
        }
      }

      // Method 3: If still not found, log all logs for debugging
      if (!mintedTokenId) {
        console.warn("⚠️ Could not find tokenId in events. Logging all receipt logs for debugging...");
        console.log("All receipt logs:", receipt.logs.map((log: any, idx: number) => ({
          index: idx,
          address: log.address,
          topics: log.topics,
          data: log.data
        })));
      }

      if (!mintedTokenId) {
        // Fallback: Redirect to lost-pets list instead of throwing error
        console.error("❌ Could not parse TokenID from transaction logs");
        console.error("Transaction receipt:", receipt);
        setStep("error");
        setError("Pet başarıyla oluşturuldu ancak Token ID okunamadı. Lütfen profil sayfanızdan kontrol edin.");
        // Redirect to lost-pets list as fallback
        setTimeout(() => {
          router.push("/lost-pets");
        }, 3000);
        return;
      }

      console.log("✅ Minted Token ID (from blockchain):", mintedTokenId);
      setTokenId(mintedTokenId);

      // --- STEP 4: Save to Supabase ---
      setStep("saving");

      const saveResponse = await fetch("/api/pets/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenId: mintedTokenId,
          name: formData.name,
          breed: formData.breed,
          description: formData.description,
          imageUrl: imageUrlForDb,
          ownerAddress: walletAddress,
          phone: formData.phone || null,
          email: formData.email || null,
          city: formData.city || null,
          district: formData.district || null,
        }),
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json();
        throw new Error(errorData.error || "Veritabanına kaydedilemedi.");
      }

      const saveData = await saveResponse.json();
      const petId = saveData.data?.id;

      if (!petId) {
        console.warn("⚠️ Database ID not returned, but pet was saved. Using token ID for redirect.");
      }

      setStep("success");
      
      // Use blockchain token ID for redirection (source of truth)
      // The lost-pets detail page can handle both UUID and token_id
      const redirectId = mintedTokenId || petId;
      
      if (!redirectId) {
        // Ultimate fallback: redirect to lost-pets list
        console.error("❌ No valid ID for redirection, redirecting to list");
        setTimeout(() => {
          router.push("/lost-pets");
        }, 2000);
        return;
      }

      console.log("🔄 Redirecting to:", `/lost-pets/${redirectId}`);
      setTimeout(() => {
        router.push(`/lost-pets/${redirectId}`);
      }, 2000);

    } catch (err: any) {
      console.error("Process error:", err);
      setStep("error");
      
      if (err.code === 'ACTION_REJECTED' || err.code === 4001) {
        setError("İşlem cüzdanınızda reddedildi.");
      } else {
        setError(err.message || "İşlem sırasında bir hata oluştu.");
      }
    }
  };

  const getStepMessage = () => {
    switch (step) {
      case "uploading":
        return "Resim yükleniyor...";
      case "minting":
        return "NFT oluşturuluyor...";
      case "saving":
        return "Kaydediliyor...";
      case "success":
        return "Başarılı! Yönlendiriliyorsunuz...";
      case "error":
        return "Hata oluştu.";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-12 md:py-20">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Evcil Hayvan NFT'si Oluştur
          </h1>
          <p className="text-slate-400 text-lg">
            Blockchain üzerinde değiştirilemez bir kimlik kartı oluşturun
          </p>
        </motion.div>

        {/* Wallet Connection Card */}
        {!walletAddress && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6"
          >
            <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
              <CardContent className="pt-6 text-center">
                <Wallet className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Cüzdan Bağlantısı Gerekli
                </h3>
                <p className="text-slate-400 mb-6">
                  NFT oluşturmak için cüzdanınızı bağlamanız gerekiyor.
                </p>
                <Button
                  onClick={handleConnectWallet}
                  disabled={isConnecting}
                  size="lg"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Bağlanıyor...
                    </>
                  ) : (
                    <>
                      <Wallet className="mr-2 h-5 w-5" />
                      Cüzdan Bağla
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Connected Wallet Display */}
        {walletAddress && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="bg-green-500/10 border-green-500/30">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                    <div>
                      <p className="text-sm text-slate-400">Bağlı Cüzdan</p>
                      <p className="text-white font-mono text-sm">
                        {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Main Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-slate-800/50 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-white flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-blue-400" />
                Pet Bilgileri
              </CardTitle>
              <CardDescription className="text-slate-400">
                Evcil hayvanınızın bilgilerini girin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Image Upload */}
                <div>
                  <Label className="text-white mb-2 block">Pet Resmi *</Label>
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500/50 transition-colors bg-slate-900/50"
                  >
                    {previewUrl ? (
                      <div className="relative">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="max-h-64 mx-auto rounded-lg object-cover"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="mt-4"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                            setPreviewUrl(null);
                          }}
                        >
                          Değiştir
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <ImageIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-400 mb-2">
                          Resmi buraya sürükleyin veya tıklayın
                        </p>
                        <p className="text-sm text-slate-500">
                          PNG, JPG, WebP (Otomatik sıkıştırılacaktır)
                        </p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Pet Name */}
                <div>
                  <Label htmlFor="name" className="text-white">
                    Pet Adı *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => {
                      // Immediate update for input value (critical for UX)
                      setFormData((prev) => ({ ...prev, name: e.target.value }));
                    }}
                    className="bg-slate-900/50 border-white/10 text-white mt-2"
                    placeholder="Örn: Max, Bella..."
                    required
                  />
                </div>

                {/* Breed */}
                <div>
                  <Label htmlFor="breed" className="text-white">
                    Tür *
                  </Label>
                  <Select
                    value={formData.breed}
                    onValueChange={(value) =>
                      setFormData({ ...formData, breed: value })
                    }
                    required
                  >
                    <SelectTrigger className="bg-slate-900/50 border-white/10 text-white mt-2">
                      <SelectValue placeholder="Tür seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      {PET_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description" className="text-white">
                    Açıklama
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => {
                      // Immediate update for input value (critical for UX)
                      setFormData((prev) => ({ ...prev, description: e.target.value }));
                    }}
                    className="bg-slate-900/50 border-white/10 text-white mt-2"
                    placeholder="Evcil hayvanınız hakkında bilgiler..."
                    rows={4}
                  />
                </div>

                {/* Contact Info - Phone */}
                <div>
                  <Label htmlFor="phone" className="text-white">
                    Telefon Numarası
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => {
                      // Immediate update for input value (critical for UX)
                      setFormData((prev) => ({ ...prev, phone: e.target.value }));
                    }}
                    className="bg-slate-900/50 border-white/10 text-white mt-2"
                    placeholder="0555 123 45 67"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Kaybolma durumunda kullanılacak telefon numarası
                  </p>
                </div>

                {/* Contact Info - Email */}
                <div>
                  <Label htmlFor="email" className="text-white">
                    E-posta Adresi
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      // Immediate update for input value (critical for UX)
                      setFormData((prev) => ({ ...prev, email: e.target.value }));
                    }}
                    className="bg-slate-900/50 border-white/10 text-white mt-2"
                    placeholder="ornek@site.com"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Kaybolma durumunda kullanılacak e-posta adresi
                  </p>
                  <p className="text-xs text-yellow-400 mt-1">
                    * En az bir iletişim yöntemi (telefon veya e-posta) gereklidir
                  </p>
                </div>

                {/* Location Information */}
                <div className="pt-4 border-t border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Konum Bilgileri
                  </h3>
                  
                  {/* City */}
                  <div className="mb-4">
                    <Label htmlFor="city" className="text-white">
                      İl
                    </Label>
                    <Select
                      value={formData.city}
                      onValueChange={(value) =>
                        setFormData({ ...formData, city: value })
                      }
                    >
                      <SelectTrigger className="bg-slate-900/50 border-white/10 text-white mt-2">
                        <SelectValue placeholder="Şehir seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        {CITIES.map((city) => (
                          <SelectItem key={city.value} value={city.value}>
                            {city.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500 mt-1">
                      Kaybolma durumunda arama yapılacak şehir
                    </p>
                  </div>

                  {/* District */}
                  <div>
                    <Label htmlFor="district" className="text-white">
                      İlçe
                    </Label>
                    <Input
                      id="district"
                      value={formData.district}
                      onChange={(e) => {
                        // Immediate update for input value (critical for UX)
                        setFormData((prev) => ({ ...prev, district: e.target.value }));
                      }}
                      className="bg-slate-900/50 border-white/10 text-white mt-2"
                      placeholder="Örn: Kadıköy, Çankaya..."
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Kaybolma durumunda arama yapılacak ilçe
                    </p>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                    <AlertCircle className="h-5 w-5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Success Message */}
                {step === "success" && (
                  <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>NFT başarıyla oluşturuldu! Yönlendiriliyorsunuz...</span>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  disabled={
                    !walletAddress ||
                    (step !== "initial" && step !== "error") ||
                    !selectedFile ||
                    !formData.name ||
                    !formData.breed ||
                    (!formData.phone && !formData.email)
                  }
                >
                  {(step !== "initial" && step !== "success" && step !== "error") ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {getStepMessage()}
                    </>
                  ) : step === "success" ? (
                    <>
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      Başarılı!
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-5 w-5" />
                      NFT Oluştur ve Kaydet
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

