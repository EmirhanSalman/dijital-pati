import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, MapPin, Mail, User, Calendar, MessageSquare } from "lucide-react";
import Link from "next/link";

interface ContactMessage {
  id: string;
  created_at: string;
  pet_id: string | null;
  owner_id: string;
  sender_name: string;
  sender_phone: string;
  sender_email: string | null;
  message: string;
  location_latitude: number | null;
  location_longitude: number | null;
  location_link: string | null;
  is_read: boolean;
  pets?: {
    id: string;
    name: string;
    token_id: string;
  } | null;
}

export default async function MessageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Kullanıcı kontrolü
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Mesajı getir
  const { data: message, error } = await supabase
    .from("contact_messages")
    .select(
      `
      *,
      pets (
        id,
        name,
        token_id
      )
    `
    )
    .eq("id", id)
    .eq("owner_id", user.id) // Sadece kendi mesajlarını görebilir
    .single();

  if (error || !message) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Mesaj Bulunamadı
                </h2>
                <p className="text-gray-600 mb-6">
                  Bu mesajı görüntüleme yetkiniz yok veya mesaj mevcut değil.
                </p>
                <Button asChild>
                  <Link href="/notifications">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Bildirimlere Dön
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const messageData = message as ContactMessage;

  // Mesajı okundu olarak işaretle (eğer okunmamışsa)
  if (!messageData.is_read) {
    await supabase
      .from("contact_messages")
      .update({ is_read: true })
      .eq("id", id)
      .eq("owner_id", user.id);
  }

  // Tarih formatla
  const messageDate = new Date(messageData.created_at);
  const formattedDate = messageDate.toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Geri Dön Butonu */}
        <div className="mb-6">
          <Button variant="outline" asChild>
            <Link href="/notifications">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Geri Dön
            </Link>
          </Button>
        </div>

        {/* Mesaj Kartı */}
        <Card className="border-2 shadow-lg">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">İletişim Mesajı</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formattedDate}
                </CardDescription>
              </div>
              {messageData.pets && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">İlan</p>
                  <Link
                    href={`/pet/${messageData.pets.token_id}`}
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    {messageData.pets.name || `Pati #${messageData.pets.token_id}`}
                  </Link>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Gönderen Bilgileri */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Gönderen Bilgileri
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-700">Ad:</span>
                  <span className="text-gray-900">{messageData.sender_name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-600" />
                  <span className="font-medium text-gray-700">Telefon:</span>
                  <a
                    href={`tel:${messageData.sender_phone}`}
                    className="text-blue-600 hover:underline"
                  >
                    {messageData.sender_phone}
                  </a>
                </div>
                {messageData.sender_email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-600" />
                    <span className="font-medium text-gray-700">E-posta:</span>
                    <a
                      href={`mailto:${messageData.sender_email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {messageData.sender_email}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Mesaj İçeriği */}
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Mesaj
              </h3>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {messageData.message}
                </p>
              </div>
            </div>

            {/* Konum Bilgisi */}
            {messageData.location_link && (
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Konum Bilgisi
                </h3>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <p className="text-sm text-gray-700 mb-2">
                    Gönderen konum bilgisini paylaştı:
                  </p>
                  <Button asChild variant="outline" className="w-full sm:w-auto">
                    <a
                      href={messageData.location_link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MapPin className="mr-2 h-4 w-4" />
                      Haritada Görüntüle
                    </a>
                  </Button>
                  {messageData.location_latitude && messageData.location_longitude && (
                    <p className="text-xs text-gray-500 mt-2">
                      Koordinatlar: {messageData.location_latitude.toFixed(6)},{" "}
                      {messageData.location_longitude.toFixed(6)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Aksiyon Butonları */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              <Button
                asChild
                className="flex-1 bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <a href={`tel:${messageData.sender_phone}`}>
                  <Phone className="mr-2 h-5 w-5" />
                  Telefonla Ara
                </a>
              </Button>
              {messageData.sender_email && (
                <Button
                  asChild
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  <a href={`mailto:${messageData.sender_email}`}>
                    <Mail className="mr-2 h-5 w-5" />
                    E-posta Gönder
                  </a>
                </Button>
              )}
              {messageData.pets && (
                <Button
                  asChild
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  <Link href={`/pet/${messageData.pets.token_id}`}>
                    İlanı Görüntüle
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

