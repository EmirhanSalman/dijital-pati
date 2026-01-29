"use client";

import { useState, useEffect } from "react";
import { redirect } from "next/navigation";
import { Bell, X, Trash2, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { formatDateTimeTR } from "@/lib/utils/date";
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "@/app/actions/notifications";
import { useRouter } from "next/navigation";
import type { Notification } from "@/lib/supabase/server";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuthAndFetchNotifications();
  }, []);

  const checkAuthAndFetchNotifications = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        redirect("/login");
        return;
      }

      await fetchNotifications();
    } catch (error) {
      console.error("Auth check error:", error);
      redirect("/login");
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      const { data: notificationsData, error } = await supabase
        .from("notifications")
        .select("id, user_id, type, message, link, is_read, metadata, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Fetch notifications error:", error);
        return;
      }

      if (notificationsData) {
        setNotifications(
          notificationsData.map((notif) => ({
            id: notif.id,
            user_id: notif.user_id,
            type: notif.type as Notification["type"],
            message: notif.message,
            link: notif.link || null,
            is_read: notif.is_read,
            metadata: (notif.metadata as Record<string, any>) || {},
            created_at: notif.created_at,
          }))
        );
      }
    } catch (error) {
      console.error("Fetch notifications error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      const result = await markNotificationAsRead(notification.id);
      if (result.success) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, is_read: true } : n
          )
        );
      }
    }

    if (notification.link) {
      router.push(notification.link);
    }
  };

  const handleDeleteNotification = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();

    if (!window.confirm("Bu bildirimi silmek istediğinizden emin misiniz?")) {
      return;
    }

    setDeleting(notificationId);
    const result = await deleteNotification(notificationId);
    setDeleting(null);

    if (result.success) {
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } else {
      console.error("Delete notification error:", result.error);
      alert(result.error || "Bildirim silinemedi.");
    }
  };

  const handleMarkAllAsRead = async () => {
    setProcessing(true);
    const result = await markAllNotificationsAsRead();
    setProcessing(false);

    if (result.success) {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
    } else {
      console.error("Mark all as read error:", result.error);
      alert(result.error || "Bildirimler okundu olarak işaretlenemedi.");
    }
  };

  const handleDeleteAll = async () => {
    if (
      !window.confirm(
        "Tüm bildirimleri silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
      )
    ) {
      return;
    }

    setProcessing(true);
    const result = await deleteAllNotifications();
    setProcessing(false);

    if (result.success) {
      setNotifications([]);
    } else {
      console.error("Delete all notifications error:", result.error);
      alert(result.error || "Bildirimler silinemedi.");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Az önce";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} dakika önce`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} saat önce`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)} gün önce`;

    return formatDateTimeTR(date);
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "reply":
        return "💬";
      case "lost_pet_found":
        return "🐾";
      case "mention":
        return "👤";
      case "contact_request":
        return "🐾";
      case "location_alert":
        return "📍";
      default:
        return "🔔";
    }
  };

  const formatNotificationMessage = (notification: Notification) => {
    // contact_request tipindeki bildirimler için özel formatlama
    if (notification.type === 'contact_request' && notification.metadata) {
      // Önce display_pet_name, sonra pet_name, sonra pet_id, en son fallback
      const petName = notification.metadata.display_pet_name || 
                     notification.metadata.pet_name || 
                     (notification.metadata.pet_id ? `Pati #${notification.metadata.pet_id}` : null) ||
                     'küçük dostumuz';
      
      return (
        <>
          🐾 Müjde! Birisi <strong className="font-bold">{petName}</strong> dostumuzu buldu ve sizinle iletişime geçmek istiyor.
        </>
      );
    }

    // location_alert tipindeki bildirimler için özel formatlama
    if (notification.type === 'location_alert' && notification.metadata) {
      const petName = notification.metadata.pet_name || 
                     (notification.metadata.pet_id ? `Pati #${notification.metadata.pet_id}` : null) ||
                     'küçük dostumuz';
      
      return (
        <>
          🐾 DİKKAT! Biri <strong className="font-bold">{petName}</strong> ilanınız için konum bildirdi. Haritada görmek için tıklayın.
        </>
      );
    }

    // Diğer bildirimler için orijinal mesajı göster
    return notification.message;
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Bildirimler yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                Bildirimlerim
              </h1>
              <p className="text-lg text-muted-foreground">
                {notifications.length > 0
                  ? `${notifications.length} bildirim (${unreadCount} okunmamış)`
                  : "Henüz bildiriminiz yok"}
              </p>
            </div>
          </div>

          {notifications.length > 0 && (
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={processing || unreadCount === 0}
                className="flex items-center gap-2"
              >
                <CheckCheck className="h-4 w-4" />
                Tümünü Okundu İşaretle
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteAll}
                disabled={processing}
                className="flex items-center gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Tümünü Sil
              </Button>
            </div>
          )}
        </div>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Bildirimler
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">📭</div>
                <h4 className="font-semibold text-lg mb-2">
                  Henüz bildiriminiz yok
                </h4>
                <p className="text-sm text-muted-foreground">
                  Yeni bildirimler geldiğinde buradan görebilirsiniz
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={cn(
                        "w-full p-6 text-left hover:bg-accent transition-colors relative group cursor-pointer",
                        !notification.is_read && "bg-primary/5"
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <span className="text-2xl shrink-0">
                          {getNotificationIcon(notification.type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              "text-sm mb-2",
                              !notification.is_read && "font-semibold"
                            )}
                          >
                            {formatNotificationMessage(notification)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(notification.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {!notification.is_read && (
                            <div className="h-2 w-2 bg-primary rounded-full" />
                          )}
                          <button
                            onClick={(e) =>
                              handleDeleteNotification(e, notification.id)
                            }
                            disabled={deleting === notification.id}
                            className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-2 hover:bg-destructive/10 hover:text-destructive rounded"
                            title="Bildirimi sil"
                          >
                            {deleting === notification.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

