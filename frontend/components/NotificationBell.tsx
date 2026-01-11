"use client";

import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from "@/app/actions/notifications";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/lib/supabase/server";
import { X } from "lucide-react";

interface NotificationBellProps {
  notifications: Notification[];
}

export default function NotificationBell({ notifications: initialNotifications }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localNotifications, setLocalNotifications] = useState(initialNotifications);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const subscriptionRef = useRef<any>(null);

  const unreadCount = localNotifications.filter((n) => !n.is_read).length;

  // Bildirimleri çek
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLocalNotifications([]);
        return;
      }

      const { data: notifications, error } = await supabase
        .from("notifications")
        .select("id, user_id, type, message, link, is_read, metadata, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Fetch notifications error:", error);
        return;
      }

      if (notifications) {
        setLocalNotifications(
          notifications.map((notif) => ({
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

  // Realtime subscription kur
  useEffect(() => {
    let mounted = true;
    let channel: ReturnType<typeof createClient>['channel'] | null = null;
    let supabaseInstance: ReturnType<typeof createClient> | null = null;

    const setupRealtimeSubscription = async () => {
      supabaseInstance = createClient();
      const {
        data: { user },
      } = await supabaseInstance.auth.getUser();

      if (!user || !mounted) {
        return;
      }

      // Mevcut subscription'ı temizle
      if (subscriptionRef.current) {
        try {
          await subscriptionRef.current.unsubscribe();
          if (supabaseInstance) {
            await supabaseInstance.removeChannel(subscriptionRef.current);
          }
        } catch (error) {
          console.error("Error unsubscribing from previous channel:", error);
        }
        subscriptionRef.current = null;
      }

      // Yeni subscription oluştur
      if (!supabaseInstance || !mounted) return;

      channel = supabaseInstance
        .channel(`notifications:${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log("Notification change:", payload);
            // Bildirimler değiştiğinde yeniden çek
            if (mounted) {
              fetchNotifications();
            }
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            console.log("Realtime subscription aktif");
          }
        });

      // Store channel in ref only if still mounted
      if (mounted && channel) {
        subscriptionRef.current = channel;
      } else {
        // If unmounted during setup, clean up immediately
        if (channel && supabaseInstance) {
          try {
            await channel.unsubscribe();
            await supabaseInstance.removeChannel(channel);
          } catch (error) {
            console.error("Error cleaning up channel after unmount:", error);
          }
        }
      }
    };

    setupRealtimeSubscription();

    // Cleanup function - properly unsubscribe and remove channel
    return () => {
      mounted = false;
      
      // Cleanup subscription synchronously where possible
      if (subscriptionRef.current) {
        const channelToCleanup = subscriptionRef.current;
        subscriptionRef.current = null;
        
        // Unsubscribe and remove channel (fire and forget in cleanup)
        channelToCleanup
          .unsubscribe()
          .then(() => {
            if (supabaseInstance) {
              return supabaseInstance.removeChannel(channelToCleanup);
            }
          })
          .catch((error) => {
            console.error("Error cleaning up subscription:", error);
          });
      }
    };
  }, []);

  // İlk yüklemede bildirimleri çek
  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      // Okundu olarak işaretle
      const result = await markNotificationAsRead(notification.id);
      if (result.success) {
        setLocalNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, is_read: true } : n
          )
        );
      } else {
        // Hata durumunda logla
        console.error('handleNotificationClick - markNotificationAsRead failed:', result.error);
        // Hata olsa bile UI'ı güncelle (optimistic update)
        // Ama kullanıcıya hata mesajı göster
        alert(result.error || 'Bildirim okundu olarak işaretlenemedi.');
      }
    }

    setIsOpen(false);
    
    // Linke git
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const handleMarkAllAsRead = async () => {
    const result = await markAllNotificationsAsRead();
    if (result.success) {
      setLocalNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
    } else {
      // Hata durumunda logla
      console.error('handleMarkAllAsRead - markAllNotificationsAsRead failed:', result.error);
      alert(result.error || 'Bildirimler okundu olarak işaretlenemedi.');
    }
  };

  const handleDeleteNotification = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation(); // Bildirime tıklama olayını engelle
    
    if (!window.confirm('Bu bildirimi silmek istediğinizden emin misiniz?')) {
      return;
    }

    const result = await deleteNotification(notificationId);
    if (result.success) {
      setLocalNotifications((prev) =>
        prev.filter((n) => n.id !== notificationId)
      );
    } else {
      console.error('handleDeleteNotification - deleteNotification failed:', result.error);
      alert(result.error || 'Bildirim silinemedi.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Az önce";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} dakika önce`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} saat önce`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} gün önce`;
    
    return date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
    });
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'reply':
        return '💬';
      case 'lost_pet_found':
        return '🐾';
      case 'mention':
        return '👤';
      case 'contact_request':
        return '🐾';
      case 'location_alert':
        return '📍';
      default:
        return '🔔';
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

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-4 w-4 bg-destructive rounded-full text-[10px] text-white flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Bildirimler</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="h-8 text-xs"
              >
                Tümünü Okundu İşaretle
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="h-[400px]">
          {localNotifications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📭</div>
              <h4 className="font-semibold text-lg mb-2">Henüz bildiriminiz yok</h4>
              <p className="text-sm text-muted-foreground">
                Yeni bildirimler geldiğinde buradan görebilirsiniz
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {localNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "w-full p-4 text-left hover:bg-accent transition-colors relative group cursor-pointer",
                    !notification.is_read && "bg-primary/5"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm",
                        !notification.is_read && "font-semibold"
                      )}>
                        {formatNotificationMessage(notification)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(notification.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!notification.is_read && (
                        <div className="h-2 w-2 bg-primary rounded-full mt-1" />
                      )}
                      <button
                        onClick={(e) => handleDeleteNotification(e, notification.id)}
                        className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 hover:text-destructive rounded"
                        title="Bildirimi sil"
                      >
                        <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        {localNotifications.length > 0 && (
          <div className="p-4 border-t">
            <Link
              href="/notifications"
              className="text-sm text-primary hover:underline text-center block"
              onClick={() => setIsOpen(false)}
            >
              Tüm Bildirimleri Gör
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

