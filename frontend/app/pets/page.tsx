import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PetCard from "@/components/PetCard";
import FilterBar from "@/components/pets/FilterBar";
import { Suspense } from "react";
import { getPets } from "@/lib/supabase/server";
import type { Pet } from "@/lib/supabase/server";
import { PawPrint } from "lucide-react";

interface PetsPageProps {
  searchParams: Promise<{
    query?: string;
    type?: string;
    city?: string;
    sort?: string;
  }>;
}

export default async function PetsPage({ searchParams }: PetsPageProps) {
  const params = await searchParams;

  // Filtrelenmiş pet'leri getir
  const pets = await getPets({
    query: params.query,
    type: params.type,
    city: params.city,
    sort: params.sort || "newest",
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Başlık */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 flex items-center justify-center gap-3">
            <PawPrint className="h-10 w-10 text-primary" />
            Evcil Hayvanlar
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Platformdaki tüm evcil hayvanları keşfedin, arayın ve filtreleyin.
          </p>
          {pets.length > 0 && (
            <Badge variant="default" className="mt-4 text-lg px-4 py-2">
              {pets.length} Evcil Hayvan
            </Badge>
          )}
        </div>

        {/* Filtre Bar */}
        <Suspense fallback={<div className="mb-6">Filtre yükleniyor...</div>}>
          <FilterBar />
        </Suspense>

        {/* Pet Listesi */}
        {pets.length === 0 ? (
          <Card className="max-w-md mx-auto border-2">
            <CardContent className="pt-6 text-center py-12">
              <PawPrint className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">
                {params.query || params.type || params.city
                  ? "Filtrelere uygun evcil hayvan bulunamadı"
                  : "Henüz evcil hayvan kaydı yok"}
              </h3>
              <p className="text-muted-foreground">
                {params.query || params.type || params.city
                  ? "Farklı filtreler deneyebilir veya arama terimini değiştirebilirsiniz."
                  : "İlk evcil hayvan kaydını oluşturmak için oluştur sayfasına gidin."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pets.map((pet) => (
              <PetCard key={pet.id || pet.token_id} pet={pet} />
            ))}
          </div>
        )}

        {/* Alt Bilgi */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            Evcil hayvanınızı kaydetmek için{" "}
            <a href="/create-pet" className="text-primary hover:underline font-medium">
              buraya tıklayın
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

