"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, PawPrint, CheckCircle, AlertTriangle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Pet } from "@/lib/supabase/server";

export default function ProfilePetsTab() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserPets();
  }, []);

  const fetchUserPets = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setError("Giriş yapmanız gerekiyor.");
        setLoading(false);
        return;
      }

      // Fetch pets directly from Supabase using owner_id (more reliable than wallet_address)
      const { data: petsData, error: petsError } = await supabase
        .from("pets")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (petsError) {
        console.error("Fetch pets error:", petsError);
        
        // If table doesn't exist, return empty array
        if (petsError.code === "42P01") {
          setPets([]);
          setLoading(false);
          return;
        }
        
        throw new Error(petsError.message || "Petler yüklenemedi.");
      }

      setPets(petsData || []);
    } catch (err: any) {
      console.error("Fetch pets error:", err);
      setError(err.message || "Petler yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-2">
        <CardContent className="pt-6 text-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Petleriniz yükleniyor...</p>
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
          <Button onClick={fetchUserPets} variant="outline">
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
          <PawPrint className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">Henüz Pet'iniz Yok</h3>
          <p className="text-muted-foreground mb-6">
            İlk evcil hayvan NFT'nizi oluşturmak için oluştur sayfasına gidin.
          </p>
          <Button variant="outline" asChild>
            <Link href="/create-pet">
              <PawPrint className="mr-2 h-4 w-4" />
              Pet Oluştur
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {pets.length} pet bulundu
        </p>
        <Button variant="outline" size="sm" onClick={fetchUserPets}>
          Yenile
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pets.map((pet) => {
          // Get real pet name - prioritize database name
          const petName = pet.name && pet.name.trim() && !pet.name.startsWith("Pati #") 
            ? pet.name 
            : `Pati #${pet.token_id}`;

          return (
            <Card key={pet.id || pet.token_id} className="border-2 hover:border-primary/50 transition-colors">
              <div className="relative h-48 w-full overflow-hidden rounded-t-lg bg-gray-100">
                <Image
                  src={pet.image_url}
                  alt={petName}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div
                  className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                    pet.is_lost
                      ? "bg-red-500 text-white animate-pulse"
                      : "bg-green-500 text-white"
                  }`}
                >
                  {pet.is_lost ? (
                    <>
                      <AlertTriangle className="h-3 w-3" />
                      KAYIP
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-3 w-3" />
                      GÜVENDE
                    </>
                  )}
                </div>
              </div>
              <CardContent className="pt-4">
                <h3 className="font-bold text-lg mb-2">{petName}</h3>
                <p className="text-sm text-gray-600 mb-1">
                  {pet.breed && <span className="font-medium">Tür: {pet.breed}</span>}
                </p>
                <p className="text-xs text-muted-foreground mb-4">ID: #{pet.token_id}</p>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/pet/${pet.token_id}`}>Detayları Gör</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

