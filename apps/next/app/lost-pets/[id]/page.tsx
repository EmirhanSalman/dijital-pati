import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, MapPin, User, Lock, Phone, Mail, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { getLostPetDetailForPage } from "@/lib/pets/public-access";
import RemoteImage from "@/components/ui/RemoteImage";
import { resolveImageUrl } from "@/lib/image-utils";
import { formatDateTR } from "@/lib/utils/date";

interface LostPetDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function LostPetDetailPage({ params }: LostPetDetailPageProps) {
  const { id } = await params;
  const result = await getLostPetDetailForPage(id);

  if (!result) {
    notFound();
  }

  const pet = result.pet;
  const isLoggedIn = result.mode === "authenticated";

  let ownerProfile: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null = null;

  if (isLoggedIn && result.pet.owner_id) {
    try {
      const supabase = await createClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url")
        .eq("id", result.pet.owner_id)
        .single();

      if (profile) {
        ownerProfile = profile;
      }
    } catch (error) {
      console.error("Owner profile fetch error:", error);
    }
  }

  const petName =
    pet.name && pet.name.trim() && !pet.name.startsWith("Pati #")
      ? pet.name
      : `Pati #${pet.token_id}`;

  const lastSeenDate = pet.updated_at
    ? formatDateTR(pet.updated_at, { year: "numeric", month: "long", day: "numeric" })
    : formatDateTR(pet.created_at, { year: "numeric", month: "long", day: "numeric" });

  const contactPhone =
    result.mode === "authenticated" ? result.pet.contact_phone : null;
  const contactEmail =
    result.mode === "authenticated" ? result.pet.contact_email : null;
  const hasContactInfo = !!(contactPhone || contactEmail);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Geri Dön Butonu */}
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/lost-pets">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Listeye Dön
            </Link>
          </Button>
        </div>

        {/* Ana İçerik - Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Sol Taraf - Pet Görseli */}
          <div className="relative w-full aspect-square rounded-lg overflow-hidden shadow-lg bg-gray-100">
            <RemoteImage
              src={pet.image_url || ""}
              alt={petName}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>

          {/* Sağ Taraf - Pet Bilgileri */}
          <div className="space-y-6">
            {/* Başlık ve Durum */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-4xl md:text-5xl font-bold text-foreground">{petName}</h1>
                <Badge variant="destructive" className="px-3 py-1 text-sm font-bold">
                  <AlertTriangle className="h-4 w-4 mr-1 inline" />
                  KAYIP
                </Badge>
              </div>

              {/* Temel Bilgiler */}
              <div className="space-y-3">
                {pet.breed && (
                  <div className="flex items-center gap-2 text-lg">
                    <span className="font-semibold">Tür:</span>
                    <span>{pet.breed}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Son Görülme: {lastSeenDate}</span>
                </div>

                {(pet.city || pet.district) && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {pet.city}
                      {pet.district && `, ${pet.district}`}
                    </span>
                  </div>
                )}

                <div className="text-xs text-muted-foreground pt-2">
                  ID: #{pet.token_id}
                </div>
              </div>
            </div>

            {/* Açıklama */}
            {pet.description && (
              <Card className="border-2">
                <CardHeader>
                  <CardTitle>Açıklama</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                    {pet.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Sahip Bilgileri - Privacy Logic */}
            <Card className={`border-2 ${!isLoggedIn ? 'bg-muted/50' : ''}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {!isLoggedIn && <Lock className="h-5 w-5" />}
                  Sahip Bilgileri
                </CardTitle>
                <CardDescription>
                  {isLoggedIn 
                    ? "Sahibin iletişim bilgileri" 
                    : "Giriş yaparak sahip bilgilerini görüntüleyebilirsiniz"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoggedIn ? (
                  <div className="space-y-4">
                    {ownerProfile && (
                      <div className="flex items-center gap-3">
                        {ownerProfile.avatar_url && (
                          <div className="relative w-12 h-12 rounded-full overflow-hidden">
                            <RemoteImage
                              src={ownerProfile.avatar_url}
                              alt={ownerProfile.full_name || ownerProfile.username || "Owner"}
                              fill
                              className="object-cover"
                              type="supabase"
                            />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold">
                            {ownerProfile.full_name || ownerProfile.username || "İsimsiz Kullanıcı"}
                          </p>
                          {ownerProfile.username && (
                            <p className="text-sm text-muted-foreground">@{ownerProfile.username}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {hasContactInfo && (
                      <div className="space-y-2 pt-2 border-t">
                        {contactPhone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <a 
                              href={`tel:${contactPhone}`}
                              className="text-primary hover:underline"
                            >
                              {contactPhone}
                            </a>
                          </div>
                        )}
                        {contactEmail && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <a 
                              href={`mailto:${contactEmail}`}
                              className="text-primary hover:underline"
                            >
                              {contactEmail}
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {!hasContactInfo && (
                      <p className="text-sm text-muted-foreground">
                        İletişim bilgisi bulunmamaktadır.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      {/* Blurred placeholder */}
                      <div className="blur-sm pointer-events-none select-none space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gray-300" />
                          <div>
                            <div className="h-4 w-24 bg-gray-300 rounded mb-2" />
                            <div className="h-3 w-16 bg-gray-200 rounded" />
                          </div>
                        </div>
                        <div className="space-y-2 pt-2 border-t border-gray-200">
                          <div className="h-4 w-32 bg-gray-200 rounded" />
                          <div className="h-4 w-40 bg-gray-200 rounded" />
                        </div>
                      </div>
                    </div>
                    <div className="text-center space-y-3 pt-4">
                      <p className="text-sm text-muted-foreground">
                        Sahip iletişim bilgileri gizlilik için korunmaktadır.
                      </p>
                      <p className="text-sm font-medium">
                        İletişim bilgilerini görmek için lütfen{" "}
                        <span className="text-primary font-semibold">giriş yapın</span>.
                      </p>
                      <Button asChild className="w-full">
                        <Link href="/login">
                          <User className="mr-2 h-4 w-4" />
                          Giriş Yap
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Alt Butonlar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="outline" asChild>
            <Link href="/lost-pets">
              Tüm Kayıp İlanlar
            </Link>
          </Button>
          <Button asChild>
            <Link href="/">
              Ana Sayfaya Dön
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

