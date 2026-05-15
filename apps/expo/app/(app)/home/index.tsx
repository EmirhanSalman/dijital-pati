import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { useRouter } from 'expo-router';

// ─── Web-Extracted Brand Colors ───────────────────────────────────
// Source: apps/next/app/globals.css (shadcn slate theme)
// --primary: 222.2 47.4% 11.2%     → #1A2744  (navy)
// --primary-foreground: 210 40% 98% → #F8FAFC
// --secondary: 210 40% 96.1%        → #F1F5F9  (slate-100)
// --muted-foreground: 215.4 16.3% 46.9% → #64748B
// --border: 214.3 31.8% 91.4%       → #E2E8F0
// Brand accent (scrollbar/ring):     #6366F1  (indigo-500)
const BRAND = {
  primary: '#6366F1',       // Indigo-500 — web brand accent
  primaryDark: '#4F46E5',   // Indigo-600
  primaryBg: '#EEF2FF',     // Indigo-50
  navy: '#1A2744',          // Web --primary (dark navy)
  background: '#F8FAFC',    // Slate-50
  surface: '#FFFFFF',
  foreground: '#090E1A',    // Web --foreground
  muted: '#64748B',         // Slate-500
  border: '#E2E8F0',        // Slate-200
  success: '#22C55E',
  danger: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
};

const CARDS = [
  { emoji: '🐾', label: 'Toplam Hayvan', value: '3', color: BRAND.primary },
  { emoji: '✅', label: 'Aktif Görevler', value: '5', color: BRAND.success },
  { emoji: '🔔', label: 'Son Uyarılar', value: '2', color: BRAND.danger },
  { emoji: '💉', label: 'Yaklaşan Aşı', value: '1', color: BRAND.info },
];

const QUICK_ACTIONS = [
  { emoji: '🔍', label: 'Kayıp İlanları', description: 'Kayıp & bulunan hayvanlar', route: '/(app)/lost-pets', color: BRAND.primary },
  { emoji: '💬', label: 'Pati Forum', description: 'Toplulukla bilgi paylaş', route: '/(app)/forum', color: BRAND.info },
  { emoji: '📰', label: 'Haberler', description: 'Güncel ipuçları & haberler', route: '/(app)/news', color: BRAND.success },
];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.greeting}>Merhaba 👋</Text>
      <Text style={styles.subtitle}>Bugün nelere bakacaksın?</Text>

      {/* Summary Cards */}
      <View style={styles.cardGrid}>
        {CARDS.map((card, i) => (
          <MotiView
            key={card.label}
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', delay: i * 100, duration: 500 }}
            style={[styles.summaryCard, { borderTopColor: card.color }]}
          >
            <Text style={styles.cardEmoji}>{card.emoji}</Text>
            <Text style={[styles.cardValue, { color: card.color }]}>{card.value}</Text>
            <Text style={styles.cardLabel}>{card.label}</Text>
          </MotiView>
        ))}
      </View>

      {/* Quick Actions */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', delay: 450, duration: 500 }}
      >
        <Text style={styles.sectionTitle}>Hızlı Erişim</Text>
        {QUICK_ACTIONS.map((action) => (
          <Pressable
            key={action.route}
            style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}
            onPress={() => {
              console.log('Quick action pressed:', action.route);
              router.push(action.route as any);
            }}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: `${action.color}18` }]}>
              <Text style={styles.actionEmoji}>{action.emoji}</Text>
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionLabel}>{action.label}</Text>
              <Text style={styles.actionDesc}>{action.description}</Text>
            </View>
            <Text style={[styles.chevron, { color: action.color }]}>›</Text>
          </Pressable>
        ))}
      </MotiView>

      {/* Recent Activity */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', delay: 600, duration: 500 }}
        style={styles.recentCard}
      >
        <Text style={styles.sectionTitle}>Son Aktiviteler</Text>
        {['Buddy aşısı güncellendi', "Luna'nın randevusu oluşturuldu", 'Max için yeni diyet planı'].map((item, i) => (
          <View key={i} style={styles.activityItem}>
            <View style={styles.activityDot} />
            <Text style={styles.activityText}>{item}</Text>
          </View>
        ))}
      </MotiView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BRAND.background },
  container: { padding: 20, paddingBottom: 40 },
  greeting: { fontSize: 28, fontWeight: '800', color: BRAND.foreground, marginBottom: 4 },
  subtitle: { fontSize: 16, color: BRAND.muted, marginBottom: 20 },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  summaryCard: {
    width: '47%',
    backgroundColor: BRAND.surface,
    borderRadius: 14,
    borderTopWidth: 4,
    padding: 14,
    borderWidth: 1,
    borderColor: BRAND.border,
    shadowColor: BRAND.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardEmoji: { fontSize: 24, marginBottom: 6 },
  cardValue: { fontSize: 30, fontWeight: '800', marginBottom: 2 },
  cardLabel: { fontSize: 12, color: BRAND.muted },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: BRAND.foreground, marginBottom: 12 },
  actionCard: {
    backgroundColor: BRAND.surface,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: BRAND.border,
    shadowColor: BRAND.navy,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  pressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },
  actionIconCircle: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  actionEmoji: { fontSize: 24 },
  actionText: { flex: 1 },
  actionLabel: { fontSize: 16, fontWeight: '700', color: BRAND.foreground, marginBottom: 2 },
  actionDesc: { fontSize: 13, color: BRAND.muted },
  chevron: { fontSize: 26, fontWeight: '300' },
  recentCard: {
    backgroundColor: BRAND.surface,
    borderRadius: 14,
    padding: 16,
    marginTop: 4,
    borderWidth: 1,
    borderColor: BRAND.border,
    shadowColor: BRAND.navy,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  activityItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  activityDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: BRAND.primary, marginRight: 10,
  },
  activityText: { fontSize: 14, color: BRAND.muted, flex: 1 },
});
