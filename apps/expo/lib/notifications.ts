import { Linking } from 'react-native';
import type { Router } from 'expo-router';
import { supabase } from './supabase';
import { buildPetPublicUrl, getPetPublicBaseUrl } from './pet-public-url';

export type AppNotification = {
  id: string;
  user_id: string;
  type: string;
  message: string;
  link: string | null;
  is_read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
};

const NOTIFICATION_SELECT =
  'id, user_id, type, message, link, is_read, metadata, created_at';

export function notificationTypeLabel(type: string): string {
  switch (type) {
    case 'lost_pet_found':
      return 'Kayıp ilanı';
    case 'location_alert':
      return 'Konum bildirimi';
    case 'reply':
      return 'Forum yanıtı';
    case 'contact':
    case 'contact_request':
      return 'İletişim';
    case 'mention':
      return 'Bahsetme';
    case 'system':
      return 'Sistem';
    default:
      return 'Bildirim';
  }
}

export function formatNotificationDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Az önce';
  if (diffMins < 60) return `${diffMins} dk önce`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} sa önce`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} gün önce`;
  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export async function fetchUserNotifications(userId: string): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select(NOTIFICATION_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    ...row,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    link: row.link ?? null,
  }));
}

export async function markNotificationRead(
  notificationId: string,
  userId: string
): Promise<void> {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Bildirim güncellenemedi.');
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throw new Error(error.message);
}

function metadataPetDbId(metadata: Record<string, unknown>): string | null {
  const raw = metadata.pet_id ?? metadata.petId;
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  return s;
}

/**
 * Opens notification target: in-app lost pet detail, external URL, or public pet page.
 */
export async function openNotificationTarget(
  notification: AppNotification,
  router: Router
): Promise<void> {
  const { link, metadata } = notification;

  if (link?.startsWith('http://') || link?.startsWith('https://')) {
    const can = await Linking.canOpenURL(link);
    if (can) {
      await Linking.openURL(link);
      return;
    }
  }

  const dbPetId = metadataPetDbId(metadata);
  if (dbPetId && /^\d+$/.test(dbPetId)) {
    router.push({
      pathname: '/(app)/lost-pets/[id]',
      params: { id: dbPetId },
    });
    return;
  }

  const petPath = link?.match(/\/pet\/([^/?#]+)/i)?.[1];
  if (petPath) {
    const publicUrl = buildPetPublicUrl(decodeURIComponent(petPath));
    await Linking.openURL(publicUrl);
    return;
  }

  if (link?.startsWith('/')) {
    const lostMatch = link.match(/\/lost-pets\/(\d+)/i);
    if (lostMatch?.[1]) {
      router.push({
        pathname: '/(app)/lost-pets/[id]',
        params: { id: lostMatch[1] },
      });
      return;
    }
    const publicUrl = `${getPetPublicBaseUrl()}${link}`;
    await Linking.openURL(publicUrl);
  }
}
