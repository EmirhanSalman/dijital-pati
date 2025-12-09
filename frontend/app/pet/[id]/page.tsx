"use client";

import { useState, useEffect, use } from "react";
import { ethers } from "ethers";
import {
  Phone,
  CheckCircle,
  AlertTriangle,
  Loader2,
  MapPin,
  QrCode,
  Shield,
  ExternalLink,
  Mail,
} from "lucide-react";
import PetFoundButton from "@/components/PetFoundButton";
import PetQrCard from "@/components/PetQrCard";
import DigitalPatiABI from "@/utils/DigitalPatiABI.json";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { Pet } from "@/lib/supabase/server";

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export default function PetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [petData, setPetData] = useState<Pet | null>(null);
  const [blockchainData, setBlockchainData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ownerAddress, setOwnerAddress] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [currentUserAddress, setCurrentUserAddress] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (id !== null && id !== undefined) {
      checkOwnerStatus();
      fetchPetData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    // Re-check owner status when currentUserAddress or ownerAddress changes
    if (currentUserAddress && ownerAddress) {
      setIsOwner(currentUserAddress === ownerAddress.toLowerCase());
    }
  }, [currentUserAddress, ownerAddress]);

  const checkOwnerStatus = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("wallet_address")
          .eq("id", user.id)
          .single();

        if (profile?.wallet_address) {
          setCurrentUserAddress(profile.wallet_address.toLowerCase());
        }
      }
    } catch (err) {
      console.log("Owner check error:", err);
    }
  };

  const fetchPetData = async () => {
    try {
      setLoading(true);

      // Try to fetch from Supabase first
      try {
        const response = await fetch(`/api/pets/${id}`);
        if (response.ok) {
          const supabasePet: Pet = await response.json();
          setPetData(supabasePet);
          setOwnerAddress(supabasePet.owner_address);
          
          // Check if current user is owner (wait for currentUserAddress to be set)
          if (currentUserAddress && supabasePet.owner_address.toLowerCase() === currentUserAddress) {
            setIsOwner(true);
          } else if (currentUserAddress) {
            setIsOwner(false);
          }

          setLoading(false);
          return;
        }
      } catch (supabaseError) {
        console.log("Supabase fetch failed, trying blockchain:", supabaseError);
      }

      // Fallback to blockchain
      const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
      const contract = new ethers.Contract(CONTRACT_ADDRESS, DigitalPatiABI.abi, provider);

      const status = await contract.getPetStatus(id);
      const owner = await contract.ownerOf(id);
      const tokenURI = await contract.tokenURI(id);

      let finalName = `Pati #${id}`;
      let finalImage = tokenURI;

      try {
        const res = await fetch(tokenURI);
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const meta = await res.json();
            finalName = meta.name || finalName;
            finalImage = meta.image || tokenURI;
          }
        }
      } catch (e) {
        console.log("Metadata okunamadı", e);
      }

      setBlockchainData({
        id,
        name: finalName,
        image: finalImage,
        isLost: status[0],
        contact: status[1],
      });
      setOwnerAddress(owner);

      // Check if current user is owner
      if (currentUserAddress && owner.toLowerCase() === currentUserAddress) {
        setIsOwner(true);
      } else if (currentUserAddress) {
        setIsOwner(false);
      }
    } catch (err: any) {
      console.error("Fetch pet error:", err);
      const errorMessage = err.message || JSON.stringify(err);
      
      if (errorMessage.includes("ERC721NonexistentToken") || errorMessage.includes("nonexistent")) {
        setError(`⚠️ Bu ID (#${id}) henüz Blockchain'e kaydedilmemiş.`);
      } else if (err.code === "NETWORK_ERROR" || errorMessage.includes("Connection refused")) {
        setError("🔌 Blockchain ağına bağlanılamadı.");
      } else {
        setError("Veri çekilirken bir hata oluştu: " + (err.shortMessage || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLostStatus = async () => {
    if (!petData) {
      setError("Pet bilgisi bulunamadı.");
      return;
    }

    setToggling(true);
    setError(null);

    try {
      const response = await fetch("/api/pets/toggle-lost", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tokenId: petData.token_id,
          isLost: !petData.is_lost,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Durum güncellenemedi.`);
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      // Update local state
      setPetData({ ...petData, is_lost: !petData.is_lost });
      
      // If blockchain data exists, update it too
      if (blockchainData) {
        setBlockchainData({ ...blockchainData, isLost: !blockchainData.isLost });
      }
    } catch (err: any) {
      console.error("Toggle lost status error:", err);
      setError(err.message || "Durum güncellenirken bir hata oluştu.");
    } finally {
      setToggling(false);
    }
  };

  // Determine display data with proper name priority:
  // 1. Database name (pet.name) - Highest priority
  // 2. Blockchain/metadata name - Second priority
  // 3. Fallback to "Pati #ID" - Only if neither exists
  const getPetName = (): string => {
    // Priority 1: Database name
    if (petData?.name && petData.name.trim() && petData.name !== `Pati #${petData.token_id}`) {
      return petData.name;
    }
    
    // Priority 2: Blockchain/metadata name
    if (blockchainData?.name && blockchainData.name.trim() && blockchainData.name !== `Pati #${id}`) {
      return blockchainData.name;
    }
    
    // Priority 3: Fallback to ID-based name
    return `Pati #${petData?.token_id || id}`;
  };

  // Get contact info (prioritize separate phone/email, fallback to contact_info)
  const getContactPhone = (): string | null => {
    return petData?.contact_phone || null;
  };

  const getContactEmail = (): string | null => {
    return petData?.contact_email || null;
  };

  const displayData = petData
    ? {
        id: petData.token_id,
        name: getPetName(),
        image: petData.image_url,
        isLost: petData.is_lost,
        phone: getContactPhone(),
        email: getContactEmail(),
        contact: petData.contact_info || petData.contact_phone || petData.contact_email || "", // Fallback
        breed: petData.breed,
        description: petData.description,
      }
    : blockchainData
    ? {
        ...blockchainData,
        name: getPetName(),
        phone: null,
        email: null,
      }
    : null;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Loader2 className="animate-spin w-10 h-10 text-blue-600" />
        <p className="text-gray-500">Veriler yükleniyor...</p>
      </div>
    );
  }

  if (error || !displayData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Bir Sorun Var</h2>
        <div className="text-red-600 bg-red-50 p-4 rounded-xl border border-red-100 max-w-md break-words">
          {error || "Pet bulunamadı."}
        </div>
      </div>
    );
  }

  const petUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/pet/${id}`
      : `https://dijitalpati.com/pet/${id}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - QR Code */}
          <div className="space-y-6">
            {/* QR Code Card */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  QR Kod
                </CardTitle>
                <CardDescription>
                  Bu QR kodu tarayarak bu sayfaya erişilebilir
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full" style={{ aspectRatio: "1", minHeight: "400px" }}>
                  <PetQrCard
                    petId={id}
                    petImage={displayData.image}
                    petUrl={petUrl}
                    isLost={displayData.isLost}
                    petName={displayData.name}
                    className="w-full h-full"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Details */}
          <div className="space-y-6">
            {/* Pet Info */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-3xl">{displayData.name}</CardTitle>
                <CardDescription>
                  {displayData.breed ? `${displayData.breed} • ` : ""}ID: #{displayData.id}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {displayData.description && (
                  <div>
                    <h3 className="font-semibold mb-2">Açıklama</h3>
                    <p className="text-muted-foreground">{displayData.description}</p>
                  </div>
                )}

                {/* Owner Actions */}
                {isOwner && (
                  <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-4">Sahip Kontrolü</h3>
                    <Button
                      variant={displayData.isLost ? "default" : "destructive"}
                      className={`w-full ${!displayData.isLost ? "bg-rose-500 hover:bg-rose-600" : ""}`}
                      onClick={handleToggleLostStatus}
                      disabled={toggling}
                    >
                      {toggling ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Güncelleniyor...
                        </>
                      ) : displayData.isLost ? (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Bulundu Olarak İşaretle
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="mr-2 h-4 w-4" />
                          Kayıp Bildir
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      {displayData.isLost
                        ? "Pet'iniz bulunduğunda bu butona tıklayın."
                        : "Pet'iniz kaybolduğunda bu butona tıklayın."}
                    </p>
                  </div>
                )}

                {/* Public View - Lost Pet Alert */}
                {!isOwner && displayData.isLost && (
                  <div className="pt-4 border-t">
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 space-y-4">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                        <h3 className="text-xl font-bold text-red-800">
                          BU EVCİL HAYVAN KAYIP!
                        </h3>
                      </div>
                      <p className="text-red-700">
                        Bu evcil hayvan kaybolmuş durumda. Eğer bu hayvanı gördüyseniz, lütfen
                        aşağıdaki butona tıklayarak konumunuzu paylaşın.
                      </p>

                      <div className="space-y-2">
                        {/* Phone Button */}
                        {displayData.phone && (
                          <a
                            href={`tel:${displayData.phone}`}
                            className="bg-rose-500 text-white w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-rose-600 transition"
                          >
                            <Phone className="h-5 w-5" /> Ara: {displayData.phone}
                          </a>
                        )}
                        
                        {/* Email Button */}
                        {displayData.email && (
                          <a
                            href={`mailto:${displayData.email}`}
                            className="bg-blue-500 text-white w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-600 transition"
                          >
                            <Mail className="h-5 w-5" /> Mail Gönder: {displayData.email}
                          </a>
                        )}
                        
                        {/* Fallback for old contact_info */}
                        {!displayData.phone && !displayData.email && displayData.contact && (
                          <a
                            href={displayData.contact.includes("@") ? `mailto:${displayData.contact}` : `tel:${displayData.contact}`}
                            className="bg-rose-500 text-white w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-rose-600 transition"
                          >
                            {displayData.contact.includes("@") ? (
                              <>
                                <Mail className="h-5 w-5" /> {displayData.contact}
                              </>
                            ) : (
                              <>
                                <Phone className="h-5 w-5" /> {displayData.contact}
                              </>
                            )}
                          </a>
                        )}
                        
                        <PetFoundButton petId={id} ownerAddress={ownerAddress} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Public View - Safe Pet */}
                {!isOwner && !displayData.isLost && (
                  <div className="pt-4 border-t">
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                        <h3 className="text-lg font-bold text-green-800">Güvende</h3>
                      </div>
                      <p className="text-green-700 text-sm">
                        Bu evcil hayvanın sahibi tarafından herhangi bir kayıp bildirimi
                        yapılmamıştır.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>


            {/* Blockchain Info */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4" />
                  Blockchain Doğrulaması
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    <span className="font-medium">Token ID:</span> #{displayData.id}
                  </p>
                  {ownerAddress && (
                    <p>
                      <span className="font-medium">Sahip:</span>{" "}
                      {ownerAddress.slice(0, 6)}...{ownerAddress.slice(-4)}
                    </p>
                  )}
                  <p>
                    <span className="font-medium">Durum:</span>{" "}
                    {displayData.isLost ? "Kayıp" : "Güvende"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
