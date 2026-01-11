"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import Image from "next/image";
import type { Pet } from "@/lib/supabase/server";
import { getGatewayUrl } from "@/utils/ipfs";
import ContactOwnerModal from "@/components/ContactOwnerModal";

interface PetCardProps {
  pet: Pet;
}

export default function PetCard({ pet }: PetCardProps) {
  const [isLoading, setIsLoading] = useState(true);

  // Pet adını belirle
  const petName = pet.name && pet.name.trim() && !pet.name.startsWith("Pati #") 
    ? pet.name 
    : `Pati #${pet.token_id}`;

  // İletişim bilgilerini kontrol et
  const hasContactInfo = !!(pet.contact_phone || pet.contact_email || pet.contact_info);

  // Pet ID'yi belirle (fallback ile)
  const petId = pet.id || pet.token_id;

  // Debug: Log pet ID to verify we have it
  console.log('PetCard - Pet ID:', petId, 'pet.id:', pet.id, 'pet.token_id:', pet.token_id);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  return (
    <Card className="border-2 hover:border-destructive/50 transition-colors overflow-hidden">
      <div className="relative h-64 w-full bg-gray-100 aspect-[4/3]">
        {/* Loading Skeleton */}
        {isLoading && (
          <div className="absolute inset-0 animate-pulse bg-gray-200 z-10 pointer-events-none" />
        )}
        <Image
          src={getGatewayUrl(pet.image_url || "")}
          alt={petName}
          fill
          className={`object-cover transition-opacity duration-300 ${
            isLoading ? "opacity-0" : "opacity-100"
          }`}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onLoad={handleImageLoad}
        />
        <div className="absolute top-3 right-3 z-20">
          <Badge
            variant="destructive"
            className="px-3 py-1 text-sm font-bold animate-pulse"
          >
            <AlertTriangle className="h-4 w-4 mr-1 inline" />
            KAYIP
          </Badge>
        </div>
      </div>
      <CardContent className="pt-4 relative z-10">
        <h3 className="font-bold text-lg mb-2">{petName}</h3>
        {pet.breed && (
          <p className="text-sm text-gray-600 mb-1">
            <span className="font-medium">Tür: {pet.breed}</span>
          </p>
        )}
        <p className="text-xs text-muted-foreground mb-4">ID: #{pet.token_id}</p>

        <div className="flex gap-2">
          {hasContactInfo && (
            <ContactOwnerModal
              pet={pet}
              trigger={
                <Button 
                  variant="outline" 
                  className="flex-1"
                >
                  İletişime Geç
                </Button>
              }
            />
          )}
          <Button 
            variant="outline" 
            className={hasContactInfo ? "flex-1" : "w-full"} 
            asChild
          >
            <Link href={`/pet/${petId}`}>
              Detayları Gör
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

