import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { markNotificationAsRead } from "@/app/actions/notifications";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, Mail, MapPin, ExternalLink } from "lucide-react";
import type { Notification } from "@/lib/supabase/server";
import { formatDateTimeTR } from "@/lib/utils/date";

interface NotificationDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function NotificationDetailPage({ params }: NotificationDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  
  // Check authentication
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  // Fetch notification
  const { data: notification, error: notificationError } = await supabase
    .from("notifications")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (notificationError || !notification) {
    notFound();
  }

  // Mark notification as read if not already read
  if (!notification.is_read) {
    await markNotificationAsRead(id);
  }

  // Parse metadata for contact notifications
  const metadata = notification.metadata as Record<string, any> || {};
  const isContactNotification = notification.type === "contact";

  // Extract contact notification data
  const senderEmail = isContactNotification ? metadata.sender_email : null;
  const message = isContactNotification ? metadata.message : notification.message;
  const petName = isContactNotification ? metadata.pet_name : null;
  const latitude = isContactNotification ? metadata.latitude : null;
  const longitude = isContactNotification ? metadata.longitude : null;
  const petId = isContactNotification ? metadata.pet_id : null;

  // Create Google Maps link if coordinates exist
  const googleMapsLink = latitude && longitude
    ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
    : null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/notifications" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Geri Dön
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Bildirim Detayı</h1>
          <p className="text-lg text-muted-foreground">
            {formatDateTimeTR(notification.created_at)}
          </p>
        </div>

        {/* Contact Notification Content */}
        {isContactNotification && (
          <div className="space-y-6">
            {/* Success Banner */}
            {petName && (
              <Card className="border-2 border-green-500 bg-green-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">🎉</div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-green-800 mb-1">
                        MÜJDE! {petName} Bulunmuş Olabilir!
                      </h2>
                      <p className="text-green-700">
                        Birisi {petName} hakkında bilgi paylaştı. Detayları aşağıda inceleyebilirsiniz.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pet Name Card */}
            {petName && (
              <Card className="border-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl flex items-center gap-3">
                      <span className="text-3xl">🐾</span>
                      {petName}
                    </CardTitle>
                    <Badge variant="destructive" className="text-sm">
                      Kayıp İlanı
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            )}

            {/* Sender Email Card */}
            {senderEmail && (
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Gönderen Bilgileri
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg">
                    <strong>E-posta:</strong>{" "}
                    <a
                      href={`mailto:${senderEmail}`}
                      className="text-primary hover:underline"
                    >
                      {senderEmail}
                    </a>
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Message Card */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Mesaj</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base leading-relaxed whitespace-pre-wrap">{message}</p>
              </CardContent>
            </Card>

            {/* Location Card */}
            {googleMapsLink && latitude && longitude && (
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Konum Bilgisi
                  </CardTitle>
                  <CardDescription>
                    Gönderen tarafından paylaşılan konum
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">Koordinatlar</p>
                      <p className="text-base font-mono">
                        {latitude.toFixed(6)}, {longitude.toFixed(6)}
                      </p>
                    </div>
                    <div className="flex items-end">
                      <Button asChild className="w-full sm:w-auto">
                        <a
                          href={googleMapsLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Haritada Aç
                        </a>
                      </Button>
                    </div>
                  </div>
                  {/* Embedded Google Maps - Only show if API key is available */}
                  {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
                    <div className="w-full h-96 rounded-lg overflow-hidden border">
                      <iframe
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        src={`https://www.google.com/maps/embed/v1/view?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&center=${latitude},${longitude}&zoom=15`}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Non-contact Notification Content */}
        {!isContactNotification && (
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Bildirim İçeriği</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base leading-relaxed">{notification.message}</p>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <Button asChild variant="outline">
            <Link href="/notifications">Bildirimlerime Dön</Link>
          </Button>
          {isContactNotification && petId && (
            <Button asChild>
              <Link href={`/pet/${petId}`}>İlanı Görüntüle</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

