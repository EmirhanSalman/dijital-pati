import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { useAuth } from '../../_layout';
import { useRouter } from 'expo-router';

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

const ACTIONS: ProfileAction[] = [
  { emoji: '✏️', label: 'Profili Düzenle', description: 'Ad, soyad ve bilgileri güncelle', comingSoon: true },
  { emoji: '🔒', label: 'Gizlilik', description: 'Hesap güvenlik ayarları', comingSoon: true },
  { emoji: '🔔', label: 'Bildirimler', description: 'Hatırlatma ve uyarı tercihleri', route: '/(app)/notifications' },
  { emoji: '🐾', label: 'Evcil Hayvanlarım', description: 'Kayıtlı evcil hayvanlarınız', comingSoon: true },
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
  const { signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = () => {
    signOut();
    router.replace('/(auth)');
  };

  const handleActionPress = (action: ProfileAction) => {
    if (action.comingSoon) return;
    if (action.route) router.push(action.route as any);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <MotiView
        from={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 14, delay: 50 }}
        style={styles.header}
      >
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarEmoji}>😊</Text>
        </View>
        <Text style={styles.name}>Ahmet Kullanıcı</Text>
        <Text style={styles.email}>ahmet@digitalpati.app</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Premium Üye</Text>
        </View>
      </MotiView>

      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', delay: 250, duration: 600 }}
        style={styles.card}
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
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: BRAND.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: BRAND.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  avatarEmoji: { fontSize: 48 },
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
