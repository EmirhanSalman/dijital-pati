import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle } from "lucide-react";
import PetCard from "@/components/PetCard";
import FilterBar from "@/components/pets/FilterBar";
import PaginationControls from "@/components/ui/PaginationControls";
import { Suspense } from "react";
import { getPets } from "@/lib/supabase/server";

interface LostPetsPageProps {
  searchParams: Promise<{
    query?: string;
    type?: string;
    city?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function LostPetsPage({ searchParams }: LostPetsPageProps) {
  const params = await searchParams;

  // Sayfa numarasını al (varsayılan: 1)
  const currentPage = params.page ? parseInt(params.page, 10) : 1;
  const limit = 12;

  // Filtrelenmiş kayıp pet'leri getir (sayfalama ile)
  const { pets, count } = await getPets(
    {
      query: params.query,
      type: params.type,
      city: params.city,
      sort: params.sort || "newest",
      isLost: true, // Sadece kayıp hayvanları getir
    },
    currentPage,
    limit
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Başlık */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 flex items-center justify-center gap-3">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            Kayıp Dostlarımız
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Kaybolan evcil hayvanları görüntüleyin ve sahiplerine ulaşın. 
            Birlikte daha güçlüyüz!
          </p>
          {count > 0 && (
            <Badge variant="destructive" className="mt-4 text-lg px-4 py-2">
              {count} Kayıp İlan
            </Badge>
          )}
        </div>

        {/* Filtre Bar */}
        <Suspense fallback={<div className="mb-6">Filtre yükleniyor...</div>}>
          <FilterBar />
        </Suspense>

        {/* İlanlar */}
        {pets.length === 0 ? (
          <Card className="max-w-md mx-auto border-2">
            <CardContent className="pt-6 text-center py-12">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {params.query || params.type || params.city
                  ? "Filtrelere uygun kayıp ilan bulunamadı"
                  : "Şükürler olsun, şu an tüm dostlarımız güvende! 🎉"}
              </h3>
              <p className="text-muted-foreground">
                {params.query || params.type || params.city
                  ? "Farklı filtreler deneyebilir veya arama terimini değiştirebilirsiniz."
                  : "Henüz kayıp ilanı bulunmamaktadır. Tüm evcil hayvanlar güvenli bir şekilde sahiplerinin yanında."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pets.map((pet) => (
                <PetCard key={pet.id || pet.token_id} pet={pet} />
              ))}
            </div>

            {/* Sayfalama Kontrolleri */}
            {count > 0 && (
              <PaginationControls
                totalCount={count}
                currentPage={currentPage}
                perPage={limit}
              />
            )}
          </>
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
