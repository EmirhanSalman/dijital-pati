import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { useAuth } from '../../_layout';
import { useRouter } from 'expo-router';

const ACTIONS = [
  { emoji: '✏️', label: 'Profili Düzenle', description: 'Ad, soyad ve bilgileri güncelle' },
  { emoji: '🔒', label: 'Gizlilik', description: 'Hesap güvenlik ayarları' },
  { emoji: '🔔', label: 'Bildirimler', description: 'Hatırlatma ve uyarı tercihleri' },
  { emoji: '🐾', label: 'Evcil Hayvanlarım', description: '3 kayıtlı evcil hayvan' },
  { emoji: '❓', label: 'Destek', description: 'Yardım merkezi ve SSS' },
];

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = () => {
    signOut();
    router.replace('/(auth)');
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      {/* Avatar */}
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

      {/* Action List */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', delay: 250, duration: 600 }}
        style={styles.card}
      >
        {ACTIONS.map((action, i) => (
          <View key={action.label}>
            <Pressable style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}>
              <Text style={styles.actionEmoji}>{action.emoji}</Text>
              <View style={styles.actionText}>
                <Text style={styles.actionLabel}>{action.label}</Text>
                <Text style={styles.actionDesc}>{action.description}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
            {i < ACTIONS.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </MotiView>

      {/* Sign Out */}
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
  screen: { flex: 1, backgroundColor: '#F2F2F7' },
  container: { padding: 20, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 28 },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FF6B00',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  avatarEmoji: { fontSize: 48 },
  name: { fontSize: 22, fontWeight: '800', color: '#1C1C1E', marginBottom: 4 },
  email: { fontSize: 14, color: '#8E8E93', marginBottom: 10 },
  badge: {
    backgroundColor: '#FF6B0020',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { fontSize: 13, fontWeight: '600', color: '#FF6B00' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
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
  pressed: { backgroundColor: '#F9F9F9' },
  actionEmoji: { fontSize: 22, marginRight: 14 },
  actionText: { flex: 1 },
  actionLabel: { fontSize: 16, fontWeight: '600', color: '#1C1C1E', marginBottom: 2 },
  actionDesc: { fontSize: 13, color: '#8E8E93' },
  chevron: { fontSize: 22, color: '#C7C7CC', fontWeight: '300' },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginLeft: 52 },
  signOutBtn: {
    backgroundColor: '#FF3B3015',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  signOutText: { fontSize: 16, fontWeight: '700', color: '#FF3B30' },
});
