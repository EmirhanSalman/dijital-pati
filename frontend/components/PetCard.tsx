"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import ContactOwnerModal from "@/components/ContactOwnerModal";
import type { Pet } from "@/lib/supabase/server";

interface PetCardProps {
  pet: Pet;
}

export default function PetCard({ pet }: PetCardProps) {
  // Pet adını belirle
  const petName = pet.name && pet.name.trim() && !pet.name.startsWith("Pati #") 
    ? pet.name 
    : `Pati #${pet.token_id}`;

  // İletişim bilgilerini kontrol et
  const hasContactInfo = !!(pet.contact_phone || pet.contact_email || pet.contact_info);

  return (
    <Card className="border-2 hover:border-destructive/50 transition-colors overflow-hidden">
      <div className="relative h-64 w-full bg-gray-100">
        <Image
          src={pet.image_url}
          alt={petName}
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
        <h3 className="font-bold text-lg mb-2">{petName}</h3>
        {pet.breed && (
          <p className="text-sm text-gray-600 mb-1">
            <span className="font-medium">Tür: {pet.breed}</span>
          </p>
        )}
        <p className="text-xs text-muted-foreground mb-4">ID: #{pet.token_id}</p>

        <div className="flex gap-2">
          {hasContactInfo && (
            <ContactOwnerModal pet={pet} />
          )}
          <Button variant="outline" className={hasContactInfo ? "flex-1" : "w-full"} asChild>
            <Link href={`/pet/${pet.token_id}`}>
              Detayları Gör
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

