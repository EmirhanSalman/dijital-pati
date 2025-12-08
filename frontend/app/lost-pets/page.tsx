"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Loader2, MapPin, Filter } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import DigitalPatiABI from "../../utils/DigitalPatiABI.json";

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

interface LostPet {
  id: number;
  name: string;
  image: string;
  contact: string;
}

export default function LostPetsPage() {
  const [lostPets, setLostPets] = useState<LostPet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLostPets();
  }, []);

  const fetchLostPets = async () => {
    setLoading(true);
    setError(null);

    try {
      // Blockchain'e bağlan (timeout ile)
      const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
      
      // Provider'ın bağlantısını test et
      try {
        await Promise.race([
          provider.getBlockNumber(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Bağlantı zaman aşımına uğradı")), 10000)
          )
        ]);
      } catch (connectionError: any) {
        throw new Error("Blockchain ağına bağlanılamadı. Lütfen tekrar deneyin.");
      }

      const contract = new ethers.Contract(CONTRACT_ADDRESS, DigitalPatiABI.abi, provider);

      // Toplam token sayısını al (eğer totalSupply fonksiyonu varsa)
      let totalSupply = 50; // Varsayılan limit
      try {
        const supply = await contract.totalSupply();
        totalSupply = Math.min(Number(supply), 100); // Maksimum 100 token kontrol et
      } catch {
        // totalSupply yoksa varsayılan 50 kullan
        console.warn("totalSupply fonksiyonu bulunamadı, varsayılan limit kullanılıyor");
      }

      // İlk N token ID'sini kontrol et
      const foundPets: LostPet[] = [];

      for (let i = 0; i < totalSupply; i++) {
        try {
          // Token'ın var olup olmadığını kontrol et
          const owner = await contract.ownerOf(i);
          
          // Durumu kontrol et
          const status = await contract.getPetStatus(i);
          const isLost = status[0] === true;
          
          // Sadece kayıp olanları filtrele
          if (isLost) {
            // TokenURI'yi al
            const tokenURI = await contract.tokenURI(i);
            
            // Metadata çek
            let finalName = `Pati #${i}`;
            let finalImage = tokenURI;
            
            try {
              // Timeout için AbortController kullan
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 saniye timeout
              
              const res = await fetch(tokenURI, { 
                signal: controller.signal
              });
              
              clearTimeout(timeoutId);
              
              if (res.ok) {
                const contentType = res.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                  const meta = await res.json();
                  finalName = meta.name || finalName;
                  finalImage = meta.image || tokenURI;
                }
              }
            } catch (metadataError) {
              // Metadata okunamazsa varsayılan değerleri kullan
              console.warn(`Token ${i} metadata okunamadı:`, metadataError);
            }

            foundPets.push({
              id: i,
              name: finalName,
              image: finalImage,
              contact: status[1] || "", // contactInfo
            });
          }
        } catch (tokenError: any) {
          // Token yoksa veya hata varsa devam et
          if (
            tokenError.message?.includes("ERC721NonexistentToken") ||
            tokenError.message?.includes("nonexistent") ||
            tokenError.message?.includes("invalid token ID")
          ) {
            // Token yok, bir sonrakine geç
            continue;
          }
          // Diğer hatalar için logla ama devam et
          console.warn(`Token ${i} için hata:`, tokenError.message);
        }
      }

      // Sonuçları filtrele (ek güvenlik için)
      const validPets = foundPets.filter(pet => pet.id !== undefined && pet.name);
      setLostPets(validPets);

      // Eğer hiç kayıp hayvan yoksa ve hata yoksa, bu normal bir durum
      if (validPets.length === 0 && !error) {
        // Boş liste normal bir durum, hata değil
      }
    } catch (err: any) {
      console.error("Lost pets fetch error:", err);
      const errorMessage = 
        err.message?.includes("bağlanılamadı") || 
        err.message?.includes("Connection refused") ||
        err.message?.includes("NETWORK_ERROR")
          ? "Blockchain ağına bağlanılamadı. Lütfen tekrar deneyin."
          : err.message || "Kayıp ilanları yüklenirken bir hata oluştu.";
      setError(errorMessage);
      setLostPets([]); // Hata durumunda listeyi temizle
    } finally {
      // Loading state'i mutlaka false yap
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Kayıp ilanları yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
        <div className="container mx-auto px-4">
          <Card className="max-w-md mx-auto border-2 border-destructive">
            <CardContent className="pt-6 text-center">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Hata</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchLostPets} variant="outline">
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
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Başlık */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Kayıp Dostlarımız
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Kaybolan evcil hayvanları görüntüleyin ve sahiplerine ulaşın. 
            Birlikte daha güçlüyüz!
          </p>
          {lostPets.length > 0 && (
            <Badge variant="destructive" className="mt-4 text-lg px-4 py-2">
              {lostPets.length} Kayıp İlan
            </Badge>
          )}
        </div>

        {/* İlanlar */}
        {lostPets.length === 0 ? (
          <Card className="max-w-md mx-auto border-2">
            <CardContent className="pt-6 text-center py-12">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Henüz Kayıp İlan Yok</h3>
              <p className="text-muted-foreground">
                Şu anda kayıp ilanı bulunmamaktadır. Tüm dostlarımız güvende!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lostPets.map((pet) => (
              <Card
                key={pet.id}
                className="border-2 hover:border-destructive/50 transition-colors overflow-hidden"
              >
                <div className="relative h-64 w-full bg-gray-100">
                  <Image
                    src={pet.image}
                    alt={pet.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute top-3 right-3">
                    <Badge
                      variant="destructive"
                      className="px-3 py-1 text-sm font-bold animate-pulse"
                    >
                      <AlertTriangle className="h-4 w-4 mr-1 inline" />
                      KAYIP
                    </Badge>
                  </div>
                </div>
                <CardContent className="pt-4">
                  <h3 className="font-bold text-lg mb-2">{pet.name}</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    ID: #{pet.id}
                  </p>
                  <div className="space-y-2 mb-4">
                    <p className="text-sm font-medium">İletişim:</p>
                    <a
                      href={`tel:${pet.contact}`}
                      className="text-primary hover:underline text-sm"
                    >
                      {pet.contact}
                    </a>
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/pet/${pet.id}`}>
                      Detayları Gör
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Alt Bilgi */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Bir evcil hayvan bulduysanız, lütfen sahibine ulaşın veya{" "}
            <Link href="/contact" className="text-primary hover:underline">
              bizimle iletişime geçin
            </Link>
            .
          </p>
          <Button variant="outline" asChild>
            <Link href="/">Ana Sayfaya Dön</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

