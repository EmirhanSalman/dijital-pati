import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Bell, CheckCheck } from 'lucide-react-native';
import { useAuth } from '../_layout';
import { BRAND } from '../../lib/brand';
import {
  fetchUserNotifications,
  formatNotificationDate,
  markAllNotificationsRead,
  markNotificationRead,
  notificationTypeLabel,
  openNotificationTarget,
  type AppNotification,
} from '../../lib/notifications';

export default function NotificationsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    if (!userId) {
      setItems([]);
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const rows = await fetchUserNotifications(userId);
      setItems(rows);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Bildirimler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const unreadCount = items.filter((n) => !n.is_read).length;

  const handleMarkAllRead = async () => {
    if (!userId || unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await markAllNotificationsRead(userId);
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'İşlem başarısız.');
    } finally {
      setMarkingAll(false);
    }
  };

  const handlePress = async (notification: AppNotification) => {
    if (!userId) return;
    try {
      if (!notification.is_read) {
        await markNotificationRead(notification.id, userId);
        setItems((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
        );
      }
      await openNotificationTarget(notification, router);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Bildirim açılamadı.');
    }
  };

  if (loading && items.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={BRAND.primary} />
        <Text style={styles.loadingText}>Bildirimler yükleniyor...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND.primary} />
      }
    >
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Bell color={BRAND.primary} size={22} />
          <Text style={styles.headerTitle}>Bildirimler</Text>
          {unreadCount > 0 ? (
            <View style={styles.unreadPill}>
              <Text style={styles.unreadPillText}>{unreadCount}</Text>
            </View>
          ) : null}
        </View>
        {unreadCount > 0 ? (
          <Pressable
            style={({ pressed }) => [styles.markAllBtn, pressed && { opacity: 0.85 }]}
            onPress={handleMarkAllRead}
            disabled={markingAll}
          >
            {markingAll ? (
              <ActivityIndicator size="small" color={BRAND.primary} />
            ) : (
              <>
                <CheckCheck color={BRAND.primary} size={16} />
                <Text style={styles.markAllText}>Tümünü okundu işaretle</Text>
              </>
            )}
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={load}>
            <Text style={styles.retry}>Tekrar dene</Text>
          </Pressable>
        </View>
      ) : null}

      {items.length === 0 && !error ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyTitle}>Henüz bildiriminiz yok.</Text>
          <Text style={styles.emptySub}>
            QR tarama, kayıp ilanı ve forum etkinliklerinde bildirimler burada görünür.
          </Text>
        </View>
      ) : null}

      {items.map((item) => (
        <Pressable
          key={item.id}
          style={({ pressed }) => [
            styles.card,
            !item.is_read && styles.cardUnread,
            pressed && styles.pressed,
          ]}
          onPress={() => handlePress(item)}
        >
          <View style={styles.cardTop}>
            <Text style={styles.typeLabel}>{notificationTypeLabel(item.type)}</Text>
            <Text style={styles.date}>{formatNotificationDate(item.created_at)}</Text>
          </View>
          <Text style={[styles.message, !item.is_read && styles.messageUnread]}>{item.message}</Text>
          {!item.is_read ? <View style={styles.dot} /> : null}
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BRAND.background },
  container: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BRAND.background },
  loadingText: { marginTop: 12, fontSize: 14, color: BRAND.muted },
  headerRow: { marginBottom: 16 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: BRAND.navy },
  unreadPill: {
    backgroundColor: BRAND.primary,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadPillText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  markAllText: { fontSize: 13, fontWeight: '600', color: BRAND.primary },
  errorBox: {
    backgroundColor: BRAND.dangerBg,
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  errorText: { color: BRAND.danger, marginBottom: 8 },
  retry: { color: BRAND.primary, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 20 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: BRAND.navy, marginBottom: 8 },
  emptySub: { fontSize: 14, color: BRAND.muted, textAlign: 'center', lineHeight: 22 },
  card: {
    backgroundColor: BRAND.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: BRAND.border,
    position: 'relative',
  },
  cardUnread: { borderColor: BRAND.primaryMid, backgroundColor: BRAND.primaryBg },
  pressed: { opacity: 0.9 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, gap: 8 },
  typeLabel: { fontSize: 12, fontWeight: '700', color: BRAND.primary, flex: 1 },
  date: { fontSize: 11, color: BRAND.muted },
  message: { fontSize: 15, color: BRAND.foreground, lineHeight: 22, paddingRight: 12 },
  messageUnread: { fontWeight: '600' },
  dot: {
    position: 'absolute',
    top: 14,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BRAND.primary,
  },
});
