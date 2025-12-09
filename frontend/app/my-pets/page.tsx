"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, PawPrint, CheckCircle, AlertTriangle, ExternalLink, Heart, Shield } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Pet } from "@/lib/supabase/server";

export default function MyPetsPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    checkAuthAndFetchPets();
  }, []);

  const checkAuthAndFetchPets = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      // Get user profile to find wallet address
      const { data: profile } = await supabase
        .from("profiles")
        .select("wallet_address")
        .eq("id", user.id)
        .single();

      if (!profile?.wallet_address) {
        setError("Cüzdan adresi bulunamadı. Lütfen profilinize cüzdan adresinizi ekleyin.");
        setLoading(false);
        return;
      }

      setWalletAddress(profile.wallet_address);

      // Fetch pets from Supabase
      const response = await fetch(`/api/pets?owner=${encodeURIComponent(profile.wallet_address)}`);
      if (!response.ok) {
        throw new Error("Petler yüklenemedi.");
      }

      const data = await response.json();
      setPets(data);
    } catch (err: any) {
      console.error("Fetch pets error:", err);
      setError(err.message || "Petler yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLostStatus = async (tokenId: string, currentStatus: boolean) => {
    setToggling(tokenId);
    setError(null);
    try {
      const response = await fetch("/api/pets/toggle-lost", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tokenId,
          isLost: !currentStatus,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Durum güncellenemedi.");
      }

      // Update local state
      setPets((prevPets) =>
        prevPets.map((pet) =>
          pet.token_id === tokenId ? { ...pet, is_lost: !currentStatus } : pet
        )
      );
    } catch (err: any) {
      setError(err.message || "Durum güncellenirken bir hata oluştu.");
    } finally {
      setToggling(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Petleriniz yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalPets = pets.length;
  const safePets = pets.filter((pet) => !pet.is_lost).length;
  const lostPets = pets.filter((pet) => pet.is_lost).length;

  if (error && pets.length === 0) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
        <div className="container mx-auto px-4">
          <Card className="max-w-md mx-auto border-2 border-destructive">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Hata</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={checkAuthAndFetchPets} variant="outline">
                Tekrar Dene
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Evcil Hayvanlarım</h1>
          <p className="text-lg text-muted-foreground">
            NFT olarak kayıtlı evcil hayvanlarınız
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Statistics Cards */}
        {pets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Pets Card */}
            <Card className="border-2 hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Toplam Hayvan
                </CardTitle>
                <Heart className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{totalPets}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  NFT olarak kayıtlı
                </p>
              </CardContent>
            </Card>

            {/* Safe Pets Card */}
            <Card className="border-2 border-green-200 bg-green-50/50 hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Güvende
                </CardTitle>
                <Shield className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{safePets}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Aktif ve sağlıklı
                </p>
              </CardContent>
            </Card>

            {/* Lost Pets Card */}
            <Card className="border-2 border-red-200 bg-red-50/50 hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Kayıp
                </CardTitle>
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{lostPets}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {lostPets > 0 ? "Acil müdahale gerekiyor" : "Henüz kayıp yok"}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {pets.length === 0 ? (
          <Card className="border-2 max-w-2xl mx-auto">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl opacity-50 animate-pulse"></div>
                  <PawPrint className="h-20 w-20 text-blue-500 mx-auto relative" />
                </div>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-3">Henüz bir dost eklemedin</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Evcil hayvanınız için dijital bir kimlik oluşturun ve blockchain üzerinde güvence altına alın.
              </p>
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
                <Link href="/create-pet">
                  <PawPrint className="mr-2 h-5 w-5" />
                  Dost Ekle
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-2">Hayvanlarım</h2>
              <p className="text-muted-foreground">
                Aşağıdaki listede tüm evcil hayvanlarınızı görüntüleyebilir ve yönetebilirsiniz.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pets.map((pet) => (
              <Card key={pet.token_id} className="border-2 hover:shadow-lg transition-shadow overflow-hidden">
                <div className="relative h-56 w-full bg-gray-100">
                  <Image
                    src={pet.image_url}
                    alt={pet.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div
                    className={`absolute top-3 right-3 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 ${
                      pet.is_lost
                        ? "bg-red-600 text-white animate-pulse"
                        : "bg-green-500 text-white"
                    }`}
                  >
                    {pet.is_lost ? (
                      <>
                        <AlertTriangle className="h-4 w-4" />
                        KAYIP!
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Güvende
                      </>
                    )}
                  </div>
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{pet.name}</h3>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Tür:</span> {pet.breed}
                  </p>
                  <p className="text-xs text-gray-500 mb-4">ID: #{pet.token_id}</p>

                  <div className="space-y-2">
                    <Button
                      variant={pet.is_lost ? "default" : "destructive"}
                      className="w-full"
                      onClick={() => handleToggleLostStatus(pet.token_id, pet.is_lost)}
                      disabled={toggling === pet.token_id}
                    >
                      {toggling === pet.token_id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Güncelleniyor...
                        </>
                      ) : pet.is_lost ? (
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
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/pet/${pet.token_id}`}>
                        Detayları Gör
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

