import { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MotiView } from 'moti';
import { useAuth } from '../../_layout';
import { useFocusEffect, useRouter } from 'expo-router';
import { Camera } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import { pickImageUri, uploadImage, buildAvatarPath } from '../../../lib/storage';

const BRAND = {
  primary:    '#6366F1',
  primaryBg:  '#EEF2FF',
  navy:       '#1A2744',
  background: '#F8FAFC',
  surface:    '#FFFFFF',
  foreground: '#090E1A',
  muted:      '#64748B',
  border:     '#E2E8F0',
  danger:     '#EF4444',
  dangerBg:   '#FEF2F2',
};

type ProfileAction = {
  emoji: string;
  label: string;
  description: string;
  comingSoon?: boolean;
  route?: string;
};

type ProfileRow = {
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

const ACTIONS: ProfileAction[] = [
  {
    emoji: '✏️',
    label: 'Profili Düzenle',
    description: 'Ad, soyad ve bilgileri güncelle',
    route: '/(app)/profile/edit',
  },
  { emoji: '🔒', label: 'Gizlilik', description: 'Hesap güvenlik ayarları', comingSoon: true },
  { emoji: '🔔', label: 'Bildirim Ayarları', description: 'Push ve hatırlatma tercihleri', route: '/(app)/settings' },
  {
    emoji: '🐾',
    label: 'Evcil Hayvanlarım',
    description: 'Kayıtlı evcil hayvanlarınız',
    route: '/(app)/profile/my-pets',
  },
  { emoji: '❓', label: 'Destek', description: 'Yardım merkezi ve SSS', comingSoon: true },
];

function YakindaBadge() {
  return (
    <View style={styles.yakindaBadge}>
      <Text style={styles.yakindaText}>Yakında</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const router = useRouter();
  const userId = session?.user?.id;
  const userEmail = session?.user?.email ?? 'Giriş yapılmadı';

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('profiles')
      .select('full_name, username, avatar_url')
      .eq('id', userId)
      .maybeSingle();
    if (data) setProfile(data);
  }, [userId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const displayName =
    profile?.full_name || profile?.username || userEmail.split('@')[0] || 'Kullanıcı';

  const handleAvatarPress = async () => {
    if (!userId) {
      Alert.alert('Giriş gerekli', 'Profil fotoğrafı yüklemek için giriş yapın.');
      return;
    }

    const uri = await pickImageUri();
    if (!uri) return;

    setUploadingAvatar(true);
    try {
      const publicUrl = await uploadImage(uri, 'avatars', buildAvatarPath(userId));
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (error) throw new Error(error.message);

      setProfile((prev) => ({ ...prev, avatar_url: publicUrl, full_name: prev?.full_name ?? null, username: prev?.username ?? null }));
      Alert.alert('Başarılı', 'Profil fotoğrafınız güncellendi.');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Yükleme başarısız.';
      Alert.alert('Hata', message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSignOut = () => {
    signOut();
    router.replace('/(auth)');
  };

  const handleActionPress = (action: ProfileAction) => {
    if (action.comingSoon || !action.route) return;
    if (__DEV__) {
      console.log('[Profile] navigate', action.label, '→', action.route);
    }
    router.push(action.route as Parameters<typeof router.push>[0]);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <MotiView
        from={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 14, delay: 50 }}
        style={styles.header}
      >
        <Pressable
          style={styles.avatarPressable}
          onPress={handleAvatarPress}
          disabled={uploadingAvatar}
        >
          <View style={styles.avatarCircle}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarEmoji}>😊</Text>
            )}
            {uploadingAvatar ? (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator color="#fff" />
              </View>
            ) : (
              <View style={styles.avatarBadge}>
                <Camera color="#fff" size={14} strokeWidth={2.5} />
              </View>
            )}
          </View>
        </Pressable>
        <Text style={styles.avatarHint}>Fotoğrafı değiştirmek için dokunun</Text>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.email}>{userEmail}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Premium Üye</Text>
        </View>
      </MotiView>

      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', delay: 250, duration: 600 }}
        style={styles.card}
        pointerEvents="box-none"
      >
        {ACTIONS.map((action, i) => (
          <View key={action.label}>
            <Pressable
              style={({ pressed }) => [
                styles.actionRow,
                action.comingSoon && styles.disabledRow,
                pressed && !action.comingSoon && styles.pressed,
              ]}
              onPress={() => handleActionPress(action)}
              disabled={action.comingSoon}
              accessibilityRole="button"
              accessibilityState={{ disabled: !!action.comingSoon }}
            >
              <Text style={styles.actionEmoji}>{action.emoji}</Text>
              <View style={styles.actionText}>
                <Text style={[styles.actionLabel, action.comingSoon && styles.disabledLabel]}>
                  {action.label}
                </Text>
                <Text style={styles.actionDesc}>{action.description}</Text>
              </View>
              {action.comingSoon ? (
                <YakindaBadge />
              ) : (
                <Text style={styles.chevron}>›</Text>
              )}
            </Pressable>
            {i < ACTIONS.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </MotiView>

      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', delay: 400, duration: 600 }}
      >
        <Pressable
          style={({ pressed }) => [styles.signOutBtn, pressed && { opacity: 0.7 }]}
          onPress={handleSignOut}
        >
          <Text style={styles.signOutText}>Çıkış Yap</Text>
        </Pressable>
      </MotiView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BRAND.background },
  container: { padding: 20, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 28 },
  avatarPressable: { marginBottom: 6 },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: BRAND.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: BRAND.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  avatarImage: { width: 100, height: 100 },
  avatarEmoji: { fontSize: 48 },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 39, 68, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: BRAND.navy,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarHint: { fontSize: 12, color: BRAND.muted, marginBottom: 10 },
  name: { fontSize: 22, fontWeight: '800', color: BRAND.foreground, marginBottom: 4 },
  email: { fontSize: 14, color: BRAND.muted, marginBottom: 10 },
  badge: {
    backgroundColor: BRAND.primaryBg,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { fontSize: 13, fontWeight: '600', color: BRAND.primary },
  card: {
    backgroundColor: BRAND.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BRAND.border,
    shadowColor: BRAND.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  disabledRow: { opacity: 0.65 },
  pressed: { backgroundColor: '#F8FAFC' },
  actionEmoji: { fontSize: 22, marginRight: 14 },
  actionText: { flex: 1 },
  actionLabel: { fontSize: 16, fontWeight: '600', color: BRAND.foreground, marginBottom: 2 },
  disabledLabel: { color: BRAND.muted },
  actionDesc: { fontSize: 13, color: BRAND.muted },
  chevron: { fontSize: 22, color: BRAND.muted, fontWeight: '300' },
  yakindaBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  yakindaText: { fontSize: 10, fontWeight: '700', color: '#D97706' },
  divider: { height: 1, backgroundColor: BRAND.border, marginLeft: 52 },
  signOutBtn: {
    backgroundColor: BRAND.dangerBg,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  signOutText: { fontSize: 16, fontWeight: '700', color: BRAND.danger },
});
