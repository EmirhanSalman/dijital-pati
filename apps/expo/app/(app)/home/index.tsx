import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { useRouter } from 'expo-router';

const CARDS = [
  { emoji: '🐾', label: 'Toplam Hayvan', value: '3', color: '#FF6B00' },
  { emoji: '✅', label: 'Aktif Görevler', value: '5', color: '#34C759' },
  { emoji: '🔔', label: 'Son Uyarılar', value: '2', color: '#FF3B30' },
  { emoji: '💉', label: 'Yaklaşan Aşı', value: '1', color: '#007AFF' },
];

const QUICK_ACTIONS = [
  { emoji: '🔍', label: 'Kayıp İlanları', description: 'Kayıp & bulunan hayvanlar', route: '/(app)/lost-pets', color: '#FF6B00' },
  { emoji: '💬', label: 'Pati Forum', description: 'Toplulukla bilgi paylaş', route: '/(app)/forum', color: '#007AFF' },
  { emoji: '📰', label: 'Haberler', description: 'Güncel ipuçları & haberler', route: '/(app)/news', color: '#34C759' },
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
            onPress={() => router.push(action.route as any)}
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
  screen: { flex: 1, backgroundColor: '#F2F2F7' },
  container: { padding: 20, paddingBottom: 40 },
  greeting: { fontSize: 28, fontWeight: '800', color: '#1C1C1E', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#8E8E93', marginBottom: 20 },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  summaryCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderTopWidth: 4,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardEmoji: { fontSize: 24, marginBottom: 6 },
  cardValue: { fontSize: 30, fontWeight: '800', marginBottom: 2 },
  cardLabel: { fontSize: 12, color: '#8E8E93' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E', marginBottom: 12 },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  pressed: { opacity: 0.8 },
  actionIconCircle: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  actionEmoji: { fontSize: 24 },
  actionText: { flex: 1 },
  actionLabel: { fontSize: 16, fontWeight: '700', color: '#1C1C1E', marginBottom: 2 },
  actionDesc: { fontSize: 13, color: '#8E8E93' },
  chevron: { fontSize: 26, fontWeight: '300' },
  recentCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  activityItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  activityDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#FF6B00', marginRight: 10,
  },
  activityText: { fontSize: 14, color: '#3C3C43', flex: 1 },
});
