"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { Lock, User } from "lucide-react";
import { ethers } from "ethers";
import {
  CheckCircle,
  AlertTriangle,
  Loader2,
  QrCode,
  Shield,
  MapPin,
} from "lucide-react";
import PetQrCard from "@/components/PetQrCard";
import dynamic from "next/dynamic";
import DigitalPatiABI from "@/utils/DigitalPatiABI.json";

// Lazy load ContactOwnerModal since it's only shown when needed (below the fold)
const ContactOwnerModal = dynamic(() => import("@/components/ContactOwnerModal"), {
  loading: () => null, // No loading state needed since it's in a modal
  ssr: false,
});
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { Pet } from "@/lib/supabase/server";
import { getContract, getReadOnlyProvider } from "@/utils/web3";
import { getGatewayUrl, fetchFromIpfsWithFallback } from "@/utils/ipfs";
import { resolvePetImageUrl } from "@/lib/pets/resolve-pet-image-url";
import ReportLostLocationDialog from "@/components/ReportLostLocationDialog";
import ReportPublicSightingDialog from "@/components/ReportPublicSightingDialog";
import { buildPetPublicUrl } from "@/lib/pet-public-url";

// Get contract address from environment variable, with fallback for local development
const getContractAddress = (): string => {
  const address = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  if (!address) {
    console.warn("⚠️ NEXT_PUBLIC_CONTRACT_ADDRESS not set, using default local address");
    return "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  }
  return address;
};

export default function PetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [petData, setPetData] = useState<Pet | null>(null);
  const [blockchainData, setBlockchainData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingFromBlockchain, setLoadingFromBlockchain] = useState(false);
  const [ownerAddress, setOwnerAddress] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [currentUserAddress, setCurrentUserAddress] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);
  const [lostDialogOpen, setLostDialogOpen] = useState(false);
  const [sightingDialogOpen, setSightingDialogOpen] = useState(false);
  const [sightingMessage, setSightingMessage] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [usedBlockchainFallback, setUsedBlockchainFallback] = useState(false);

  const checkOwnerStatus = useCallback(async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setIsLoggedIn(Boolean(user));

      if (user) {
        setCurrentUserId(user.id);

        const { data: profile } = await supabase
          .from("profiles")
          .select("wallet_address, role")
          .eq("id", user.id)
          .single();

        if (profile) {
          if (profile.wallet_address) {
            setCurrentUserAddress(profile.wallet_address.toLowerCase());
          }
          if (profile.role === "admin") {
            setIsAdmin(true);
          }
        }
      } else {
        setCurrentUserId(null);
        setCurrentUserAddress(null);
        setIsAdmin(false);
      }
    } catch (err) {
      console.log("Owner check error:", err);
    }
  }, []);

  useEffect(() => {
    if (id !== null && id !== undefined) {
      checkOwnerStatus();
      fetchPetData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    // Re-check owner status when currentUserAddress, ownerAddress, currentUserId, or petData changes
    if (petData) {
      // Check by owner_id (more reliable)
      if (currentUserId && petData.owner_id) {
        setIsOwner(currentUserId === petData.owner_id);
        return;
      }
      // Fallback to wallet address check
      if (currentUserAddress && ownerAddress) {
        setIsOwner(currentUserAddress === ownerAddress.toLowerCase());
      }
    } else if (currentUserAddress && ownerAddress) {
      // If petData is not available yet, use wallet address check
      setIsOwner(currentUserAddress === ownerAddress.toLowerCase());
    }
  }, [currentUserAddress, ownerAddress, currentUserId, petData]);

  const fetchPetData = async () => {
    try {
      setLoading(true);
      setUsedBlockchainFallback(false);
      setBlockchainData(null);
      setPetData(null);

      try {
        const response = await fetch(`/api/pets/${encodeURIComponent(id)}`, {
          cache: "no-store",
        });
        if (response.ok) {
          const supabasePet: Pet = await response.json();
          if (process.env.NODE_ENV === "development") {
            console.log("[pet-page] DB pet loaded", {
              token_id: id,
              name: supabasePet.name,
              is_lost: supabasePet.is_lost,
            });
          }
          setPetData(supabasePet);
          if (supabasePet.owner_address) {
            setOwnerAddress(supabasePet.owner_address);
          }
          setLoading(false);
          return;
        }
        if (response.status === 404) {
          if (process.env.NODE_ENV === "development") {
            console.log("[pet-page] DB miss, blockchain fallback", { token_id: id });
          }
          setError(null);
          setLoadingFromBlockchain(true);
        }
      } catch (supabaseError) {
        console.log("Database fetch failed, trying blockchain:", supabaseError);
        setLoadingFromBlockchain(true);
      }

      // Blockchain fallback only when no DB row exists
      setLoadingFromBlockchain(true);
      const contractAddress = getContractAddress();
      console.log("📍 Using contract address:", contractAddress);
      
      // Use getReadOnlyProvider which handles RPC URL fallback and error handling
      const provider = getReadOnlyProvider();
      const contract = getContract(provider, DigitalPatiABI.abi);

      const status = await contract.getPetStatus(id);
      const owner = await contract.ownerOf(id);
      const tokenURI = await contract.tokenURI(id);

      let finalName = `Pati #${id}`;
      let finalImage = tokenURI;

      // Fetch metadata with gateway fallback
      try {
        const res = await fetchFromIpfsWithFallback(tokenURI);
        if (res && res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const meta = await res.json();
            finalName = meta.name || finalName;
            // Convert image URL to gateway URL if it's an IPFS URL
            finalImage = resolvePetImageUrl(
              meta.image ? getGatewayUrl(meta.image) : getGatewayUrl(tokenURI),
              "pet-page/ipfs-meta"
            );
          }
        } else {
          // If metadata fetch fails, ensure image URL is converted to gateway URL
          finalImage = resolvePetImageUrl(getGatewayUrl(tokenURI), "pet-page/ipfs-fallback");
        }
      } catch (e) {
        console.log("Metadata okunamadı", e);
        finalImage = resolvePetImageUrl(getGatewayUrl(tokenURI), "pet-page/ipfs-error");
      }

      setUsedBlockchainFallback(true);
      setBlockchainData({
        id,
        name: finalName,
        image: resolvePetImageUrl(finalImage, "pet-page/blockchain-set"),
        isLost: status[0],
        contact: status[1],
      });
      setOwnerAddress(owner);
      setLoadingFromBlockchain(false);

      // Check if current user is owner
      if (currentUserAddress && owner.toLowerCase() === currentUserAddress) {
        setIsOwner(true);
      } else if (currentUserAddress) {
        setIsOwner(false);
      }
    } catch (err: any) {
      setLoadingFromBlockchain(false); // Stop loading indicator on error
      console.error("Fetch pet error:", err);
      const errorMessage = err.message || JSON.stringify(err);
      
      if (errorMessage.includes("ERC721NonexistentToken") || errorMessage.includes("nonexistent")) {
        setError(`⚠️ Bu ID (#${id}) henüz Blockchain'e kaydedilmemiş.`);
      } else if (
        err.code === "NETWORK_ERROR" || 
        errorMessage.includes("Connection refused") ||
        errorMessage.includes("ERR_CONNECTION_REFUSED") ||
        errorMessage.includes("127.0.0.1:8545")
      ) {
        setError(
          "🔌 Blockchain ağına bağlanılamadı. " +
          "Lütfen NEXT_PUBLIC_RPC_URL environment variable'ını kontrol edin. " +
          "Sepolia testnet için: https://rpc.sepolia.org veya bir Infura/Alchemy URL'i kullanın."
        );
      } else if (errorMessage.includes("NEXT_PUBLIC_RPC_URL")) {
        setError(errorMessage);
      } else {
        setError("Veri çekilirken bir hata oluştu: " + (err.shortMessage || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const postToggleLost = async (
    isLost: boolean,
    latitude?: number,
    longitude?: number
  ) => {
    if (!petData) throw new Error("Pet bilgisi bulunamadı.");

    const response = await fetch("/api/pets/toggle-lost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tokenId: petData.token_id,
        isLost,
        ...(isLost ? { latitude, longitude } : {}),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: Durum güncellenemedi.`);
    }

    const result = await response.json();
    if (result.error) throw new Error(result.error);
  };

  const handleToggleLostStatus = async () => {
    if (!petData) {
      setError("Pet bilgisi bulunamadı.");
      return;
    }

    if (!petData.is_lost) {
      setLostDialogOpen(true);
      return;
    }

    setToggling(true);
    setError(null);

    try {
      await postToggleLost(false);
      setPetData({ ...petData, is_lost: false });
      if (blockchainData) {
        setBlockchainData({ ...blockchainData, isLost: false });
      }
    } catch (err: unknown) {
      console.error("Toggle lost status error:", err);
      setError(
        err instanceof Error ? err.message : "Durum güncellenirken bir hata oluştu."
      );
    } finally {
      setToggling(false);
    }
  };

  const handleConfirmLostReport = async (latitude: number, longitude: number) => {
    if (!petData) return;
    setToggling(true);
    setError(null);
    try {
      await postToggleLost(true, latitude, longitude);
      setPetData({ ...petData, is_lost: true, latitude, longitude });
      if (blockchainData) {
        setBlockchainData({ ...blockchainData, isLost: true });
      }
      setLostDialogOpen(false);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Kayıp bildirimi oluşturulamadı."
      );
      throw err;
    } finally {
      setToggling(false);
    }
  };

  // Determine display data with proper name priority:
  // 1. Database name (pet.name) - Highest priority
  // 2. Blockchain/metadata name - Second priority
  // 3. Fallback to "Pati #ID" - Only if neither exists
  const getPetName = (): string => {
    if (petData?.name?.trim()) {
      return petData.name.trim();
    }
    if (usedBlockchainFallback && blockchainData?.name?.trim()) {
      return blockchainData.name.trim();
    }
    return `Pati #${petData?.token_id || id}`;
  };

  // Get contact info (prioritize separate phone/email, fallback to contact_info)
  const getContactPhone = (): string | null => {
    return petData?.contact_phone || null;
  };

  const getContactEmail = (): string | null => {
    return petData?.contact_email || null;
  };

  const dbIsLost = petData?.is_lost === true;

  const displayData = petData
    ? {
        id: petData.token_id,
        name: getPetName(),
        image: resolvePetImageUrl(petData.image_url, "pet-page/db"),
        isLost: dbIsLost,
        phone: getContactPhone(),
        email: getContactEmail(),
        contact: petData.contact_info || petData.contact_phone || petData.contact_email || "",
        breed: petData.breed,
        description: petData.description,
      }
    : blockchainData
    ? {
        ...blockchainData,
        name: getPetName(),
        image: resolvePetImageUrl(blockchainData.image, "pet-page/blockchain"),
        isLost: Boolean(blockchainData.isLost),
        phone: null,
        email: null,
      }
    : null;

  const hasContactInfo = Boolean(
    displayData?.phone || displayData?.email || displayData?.contact
  );

  if (loading || loadingFromBlockchain) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Loader2 className="animate-spin w-10 h-10 text-blue-600" />
        <p className="text-gray-500">
          {loadingFromBlockchain 
            ? "Pet veritabanında bulunamadı, blockchain'den yükleniyor..." 
            : "Veriler yükleniyor..."}
        </p>
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

  const qrSlug = petData?.token_id != null ? String(petData.token_id) : id;
  const petUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/pet/${qrSlug}`
      : buildPetPublicUrl(qrSlug);

  return (
    <>
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
                    petId={qrSlug}
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

                {/* Owner Actions - Admin veya Hayvan Sahibi görebilir */}
                {(isOwner || isAdmin) && (
                  <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-4">
                      {isAdmin && !isOwner ? "Yönetici Kontrolü" : "Sahip Kontrolü"}
                    </h3>
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
                        ? "Pet bulunduğunda bu butona tıklayın."
                        : "Pet kaybolduğunda bu butona tıklayın."}
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
                        Bu evcil hayvan kaybolmuş durumda. Görüldüğü konumu bildirerek sahibine
                        yardımcı olabilirsiniz (kırmızı pin — kayıp yeri — değişmez).
                      </p>

                      {sightingMessage ? (
                        <p className="text-sm font-medium text-green-800 bg-green-50 border border-green-200 rounded-lg p-3">
                          {sightingMessage}
                        </p>
                      ) : null}

                      <div className="space-y-3">
                        <Button
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 text-lg font-bold shadow-lg"
                          size="lg"
                          onClick={() => setSightingDialogOpen(true)}
                        >
                          <MapPin className="mr-2 h-5 w-5" />
                          Bu Hayvanı Gördüm — Konum Bildir
                        </Button>

                        {isLoggedIn && petData && hasContactInfo ? (
                          <ContactOwnerModal
                            pet={petData}
                            trigger={
                              <Button
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg font-bold shadow-lg"
                                size="lg"
                              >
                                Sahibiyle İletişime Geç
                              </Button>
                            }
                          />
                        ) : null}
                        {isLoggedIn && !hasContactInfo ? (
                          <p className="text-sm text-red-800">
                            İletişim bilgisi bulunamadı.
                          </p>
                        ) : null}
                        {!isLoggedIn ? (
                          <div className="space-y-3 text-center">
                            <p className="text-sm text-red-800 flex items-center justify-center gap-2">
                              <Lock className="h-4 w-4 shrink-0" />
                              Sahip iletişim bilgileri gizlilik için korunmaktadır.
                            </p>
                            <p className="text-sm font-medium text-red-900">
                              İletişim için lütfen giriş yapın.
                            </p>
                            <Button asChild className="w-full" size="lg">
                              <Link href="/login">
                                <User className="mr-2 h-4 w-4" />
                                Giriş Yap
                              </Link>
                            </Button>
                          </div>
                        ) : null}
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

      <ReportLostLocationDialog
        open={lostDialogOpen}
        onOpenChange={setLostDialogOpen}
        petName={getPetName()}
        loading={toggling}
        onConfirm={handleConfirmLostReport}
      />

      {petData?.token_id ? (
        <ReportPublicSightingDialog
          open={sightingDialogOpen}
          onOpenChange={setSightingDialogOpen}
          petName={getPetName()}
          tokenId={String(petData.token_id)}
          onSuccess={(msg) => setSightingMessage(msg)}
        />
      ) : null}
    </>
  );
}
