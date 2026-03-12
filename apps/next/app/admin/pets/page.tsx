import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import AdminDeleteButton from "@/components/admin/AdminDeleteButton";
import type { Pet } from "@/lib/supabase/server";

export default async function AdminPetsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const admin = await isAdmin();
  if (!admin) {
    redirect("/");
  }

  // Fetch all pets
  const { data: pets, error } = await supabase
    .from("pets")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Error fetching pets:", error);
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Başlık */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">İlan Yönetimi</h1>
              <p className="text-lg text-muted-foreground">
                Tüm ilanları görüntüleyin ve yönetin
              </p>
            </div>
            <Link href="/admin">
              <button className="text-sm text-muted-foreground hover:text-foreground">
                ← Admin Paneli
              </button>
            </Link>
          </div>
        </div>

        {/* İlan Listesi */}
        {!pets || pets.length === 0 ? (
          <Card className="border-2">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Henüz ilan bulunmamaktadır.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pets.map((pet: Pet) => {
              const petName =
                pet.name && pet.name.trim() && !pet.name.startsWith("Pati #")
                  ? pet.name
                  : `Pati #${pet.token_id}`;

              return (
                <Card key={pet.id} className="border-2 overflow-hidden">
                  <div className="relative h-48 w-full bg-gray-100">
                    <Image
                      src={pet.image_url}
                      alt={petName}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute top-3 right-3 flex gap-2">
                      {pet.is_lost && (
                        <Badge
                          variant="destructive"
                          className="px-3 py-1 text-sm font-bold"
                        >
                          KAYIP
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardContent className="pt-4">
                    <h3 className="font-bold text-lg mb-2">{petName}</h3>
                    {pet.breed && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Tür: {pet.breed}</span>
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mb-4">
                      ID: #{pet.token_id} | DB ID: {pet.id}
                    </p>
                    <div className="flex gap-2 items-center justify-between">
                      <Link href={`/pet/${pet.id}`}>
                        <button className="text-sm text-primary hover:underline">
                          Detayları Gör
                        </button>
                      </Link>
                      <AdminDeleteButton petId={pet.id} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}



