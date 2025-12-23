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
import { useMintPet } from "@/hooks/useMintPet";
import { CITIES as ALL_CITIES } from "@/constants/cities";

// Pet türleri (FilterBar ile aynı)
const PET_TYPES = [
  { value: "Kedi", label: "Kedi" },
  { value: "Köpek", label: "Köpek" },
  { value: "Kuş", label: "Kuş" },
  { value: "Diğer", label: "Diğer" },
];

// Şehirler (merkezi listeden, "all" hariç - create-pet sayfasında "Tümü" seçeneği yok)
const CITIES = ALL_CITIES.map((city: string) => ({ value: city, label: city }));

type Step = "idle" | "uploading" | "saving" | "success" | "error";

export default function CreatePetPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mint, status: mintStatus, error: mintError, tokenId: mintedTokenId } = useMintPet();

  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [step, setStep] = useState<Step>("idle");
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

  // Wallet Connection
  const connectWallet = async () => {
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

  // File Selection - Optimized with immediate updates
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Immediate updates for file selection (critical for UX)
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      // Immediate updates for file selection (critical for UX)
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setError(null);
    }
  };

  // Form Submit - Optimized async handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!walletAddress) {
      setError("Lütfen önce cüzdanınızı bağlayın.");
      return;
    }

    if (!selectedFile) {
      setError("Lütfen bir resim seçin.");
      return;
    }

    // At least one contact method is required
    if (!formData.name || !formData.breed || (!formData.phone && !formData.email)) {
      setError("Lütfen tüm zorunlu alanları doldurun. En az bir iletişim yöntemi (telefon veya e-posta) gereklidir.");
      return;
    }

    try {
      // Step 1: Upload Image to Pinata (keep existing Pinata upload logic)
      setStep("uploading");
      const imageFormData = new FormData();
      imageFormData.append("image", selectedFile);

      const uploadResponse = await fetch("/api/pets/upload", {
        method: "POST",
        body: imageFormData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || "Resim yüklenemedi.");
      }

      const uploadData = await uploadResponse.json();
      // Get IPFS hash from Pinata upload response (assuming it returns ipfsHash or hash)
      const ipfsHash = uploadData.ipfsHash || uploadData.hash || uploadData.IpfsHash;
      
      if (!ipfsHash) {
        throw new Error("IPFS hash alınamadı. Lütfen tekrar deneyin.");
      }

      // Prepend ipfs:// to the hash
      const ipfsUri = `ipfs://${ipfsHash}`;
      
      // Store the image URL for database save (fallback to URL if provided)
      const imageUrlForDb = uploadData.url || `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
      setImageUrl(imageUrlForDb);

      // Step 2: Mint NFT using useMintPet hook
      // Combine phone and email for blockchain (backwards compatible)
      const contactInfo = `${formData.phone ? `Tel: ${formData.phone}` : ""}${formData.phone && formData.email ? " | " : ""}${formData.email ? `Email: ${formData.email}` : ""}`;

      const mintedTokenId = await mint(ipfsUri, contactInfo);

      if (!mintedTokenId) {
        // Error is already set by the hook
        setStep("error");
        return;
      }

      setTokenId(mintedTokenId);

      // Step 3: Save to Database
      setStep("saving");

      const saveResponse = await fetch("/api/pets/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
        let errorMessage = "Veritabanına kaydedilemedi";
        try {
          const errorData = await saveResponse.json();
          console.error("Database save error:", errorData);
          
          // Hata mesajını al
          if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.details?.message) {
            errorMessage = errorData.details.message;
          } else if (typeof errorData === "string") {
            errorMessage = errorData;
          }
          
          // Veritabanı hatası durumunda kullanıcıyı bilgilendir
          setError(`⚠️ NFT başarıyla oluşturuldu, ancak veritabanına kaydedilemedi: ${errorMessage}`);
        } catch (parseError) {
          console.error("Error parsing response:", parseError);
          setError(`⚠️ NFT başarıyla oluşturuldu, ancak veritabanına kaydedilemedi: ${errorMessage}`);
        }
        
        // Hata mesajını 5 saniye göster
        setTimeout(() => setError(null), 5000);
      }

      setStep("success");

      setStep("success");

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push(`/pet/${mintedTokenId}`);
      }, 2000);
    } catch (err: any) {
      console.error("Create pet error:", err);
      setStep("error");
      
      if (err.code === 4001) {
        setError("İşlem cüzdanınızda reddedildi.");
      } else if (err.message?.includes("insufficient funds")) {
        setError("Yetersiz bakiye. Lütfen cüzdanınızı kontrol edin.");
      } else {
        setError(err.message || "Pet oluşturulurken bir hata oluştu.");
      }
    }
  };

  const getStepMessage = () => {
    // Use mint status from hook if minting is in progress
    if (mintStatus === "waiting-wallet") {
      return "Cüzdan onayı bekleniyor...";
    }
    if (mintStatus === "minting") {
      return "NFT oluşturuluyor...";
    }

    // Use local step for upload and save
    switch (step) {
      case "uploading":
        return "Resim yükleniyor...";
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
                  onClick={connectWallet}
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
                          PNG, JPG, WebP (Max 10MB)
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
                {(error || mintError) && (
                  <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                    <AlertCircle className="h-5 w-5" />
                    <span>{mintError || error}</span>
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
                    (step !== "idle" && step !== "error") ||
                    (mintStatus !== "idle" && mintStatus !== "error") ||
                    !selectedFile ||
                    !formData.name ||
                    !formData.breed ||
                    (!formData.phone && !formData.email)
                  }
                >
                  {(step !== "idle" && step !== "success" && step !== "error") || 
                   (mintStatus !== "idle" && mintStatus !== "success" && mintStatus !== "error") ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {getStepMessage()}
                    </>
                  ) : step === "success" || mintStatus === "success" ? (
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

