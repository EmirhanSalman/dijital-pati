"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, Loader2, AlertCircle, PawPrint } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import DigitalPatiABI from "@/utils/DigitalPatiABI.json";

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

interface Pet {
  id: number;
  name: string;
  image: string;
  isLost: boolean;
  contact: string;
}

export default function ProfilePetsTab() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");

  const connectWallet = async () => {
    try {
      // @ts-ignore
      if (!window.ethereum) {
        setError("MetaMask bulunamadı! Lütfen MetaMask'ı yükleyin.");
        return;
      }

      // @ts-ignore
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setWalletAddress(address);
      setWalletConnected(true);
      
      // Cüzdan bağlandığında hayvanları çek
      fetchUserPets(address, provider);
    } catch (err: any) {
      setError("Cüzdan bağlanırken hata: " + err.message);
    }
  };

  const fetchUserPets = async (userAddress: string, provider: any) => {
    setLoading(true);
    setError(null);
    const foundPets: Pet[] = [];
    const contract = new ethers.Contract(CONTRACT_ADDRESS, DigitalPatiABI.abi, provider);

    try {
      // MVP: İlk 20 ID'yi kontrol et
      for (let i = 0; i < 20; i++) {
        try {
          const owner = await contract.ownerOf(i);
          
          if (owner.toLowerCase() === userAddress.toLowerCase()) {
            const status = await contract.getPetStatus(i);
            const tokenURI = await contract.tokenURI(i);
            
            // Metadata çek
            let finalName = `Pati #${i}`;
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

            foundPets.push({
              id: i,
              name: finalName,
              image: finalImage,
              isLost: status[0],
              contact: status[1],
            });
          }
        } catch (err) {
          // Token yoksa döngüden çık
          break;
        }
      }
      
      setPets(foundPets);
    } catch (error: any) {
      setError("Hayvanlar çekilemedi: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!walletConnected) {
    return (
      <Card className="border-2">
        <CardContent className="pt-6 text-center py-12">
          <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Cüzdan Bağlanmamış</h3>
          <p className="text-muted-foreground mb-6">
            NFT'lerinizi görmek için cüzdanınızı bağlayın
          </p>
          <Button onClick={connectWallet}>
            <Wallet className="mr-2 h-4 w-4" />
            Cüzdan Bağla
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="border-2">
        <CardContent className="pt-6 text-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">NFT'ler yükleniyor...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-2">
        <CardContent className="pt-6 text-center py-12">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Hata</h3>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={connectWallet} variant="outline">
            Tekrar Dene
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (pets.length === 0) {
    return (
      <Card className="border-2">
        <CardContent className="pt-6 text-center py-12">
          <PawPrint className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Henüz NFT'niz yok</h3>
          <p className="text-muted-foreground mb-6">
            İlk evcil hayvan NFT'nizi oluşturmak için admin paneline gidin
          </p>
          <Button variant="outline" asChild>
            <Link href="/admin">Admin Paneli</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Cüzdan: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
        </p>
        <Button variant="outline" size="sm" onClick={connectWallet}>
          <Wallet className="mr-2 h-4 w-4" />
          Yenile
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pets.map((pet) => (
          <Card key={pet.id} className="border-2 hover:border-primary/50 transition-colors">
            <div className="relative h-48 w-full overflow-hidden rounded-t-lg bg-gray-100">
              <Image
                src={pet.image}
                alt={pet.name}
                fill
                className="object-cover"
              />
              <div
                className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold ${
                  pet.isLost
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-green-500 text-white"
                }`}
              >
                {pet.isLost ? "KAYIP" : "GÜVENDE"}
              </div>
            </div>
            <CardContent className="pt-4">
              <h3 className="font-bold text-lg mb-2">{pet.name}</h3>
              <p className="text-xs text-muted-foreground mb-4">ID: #{pet.id}</p>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/pet/${pet.id}`}>Detayları Gör</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

