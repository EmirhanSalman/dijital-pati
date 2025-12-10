import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import PetCard from "@/components/PetCard";
import LostPetsFilter from "@/components/LostPetsFilter";
import { Suspense } from "react";
import type { Pet } from "@/lib/supabase/server";

interface LostPetsPageProps {
  searchParams: Promise<{ city?: string; district?: string }>;
}

export default async function LostPetsPage({ searchParams }: LostPetsPageProps) {
  const supabase = await createClient();
  const params = await searchParams;

  // Supabase'den kayıp pet'leri çek (is_lost=true, updated_at veya created_at azalan sırada)
  let query = supabase
    .from("pets")
    .select("*")
    .eq("is_lost", true);

  // Filtreleme: city ve district
  if (params.city) {
    query = query.ilike("city", `%${params.city}%`);
  }
  if (params.district) {
    query = query.ilike("district", `%${params.district}%`);
  }

  // Sıralama
  query = query
    .order("updated_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false }); // İkinci sıralama kriteri

  const { data: lostPets, error } = await query;

  // Hata durumunda boş array döndür
  if (error) {
    console.error("Lost pets fetch error:", JSON.stringify(error, null, 2));
    // Eğer pets tablosu yoksa boş array döndür
    if (error.code === "42P01") {
      return (
        <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="mb-8 text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Kayıp Dostlarımız
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Kaybolan evcil hayvanları görüntüleyin ve sahiplerine ulaşın. 
                Birlikte daha güçlüyüz!
              </p>
            </div>
            <Card className="max-w-md mx-auto border-2">
              <CardContent className="pt-6 text-center py-12">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  Şükürler olsun, şu an tüm dostlarımız güvende! 🎉
                </h3>
                <p className="text-muted-foreground">
                  Henüz kayıp ilanı bulunmamaktadır.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }
  }

  const pets: Pet[] = lostPets || [];

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
          {pets.length > 0 && (
            <Badge variant="destructive" className="mt-4 text-lg px-4 py-2">
              {pets.length} Kayıp İlan
            </Badge>
          )}
        </div>

        {/* Filtre Alanı */}
        <Suspense fallback={<div className="mb-6">Filtre yükleniyor...</div>}>
          <LostPetsFilter />
        </Suspense>

        {/* İlanlar */}
        {pets.length === 0 ? (
          <Card className="max-w-md mx-auto border-2">
            <CardContent className="pt-6 text-center py-12">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                Şükürler olsun, şu an tüm dostlarımız güvende! 🎉
              </h3>
              <p className="text-muted-foreground">
                Henüz kayıp ilanı bulunmamaktadır. Tüm evcil hayvanlar güvenli bir şekilde sahiplerinin yanında.
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
          <p className="text-sm text-muted-foreground mb-4">
            Bir evcil hayvan bulduysanız, lütfen sahibine ulaşın veya{" "}
            <a href="/contact" className="text-primary hover:underline">
              bizimle iletişime geçin
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
