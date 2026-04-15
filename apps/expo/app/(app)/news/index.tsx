import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { MotiView } from 'moti';

const NEWS = [
  {
    id: '1',
    category: 'Sağlık',
    title: 'Yaz aylarında evcil hayvanlar için 5 temel kural',
    excerpt: 'Sıcak havalarda evcil dostlarınızı nasıl korursunuz? Veterinerler açıklıyor.',
    readTime: '3 dk',
    emoji: '☀️',
    color: '#FF9500',
  },
  {
    id: '2',
    category: 'Beslenme',
    title: 'Kediler için ev yapımı mama tarifleri',
    excerpt: 'Doğal ve sağlıklı malzemelerle can dostunuza özel yemekler hazırlayın.',
    readTime: '5 dk',
    emoji: '🥗',
    color: '#34C759',
  },
  {
    id: '3',
    category: 'Eğitim',
    title: 'Köpeğinize 1 haftada 3 temel komut öğretin',
    excerpt: 'Pozitif pekiştirme yöntemiyle otur, yat ve gel komutları için adım adım rehber.',
    readTime: '7 dk',
    emoji: '🎓',
    color: '#007AFF',
  },
  {
    id: '4',
    category: 'Yasal',
    title: '2025 evcil hayvan sahipliği hakkınız',
    excerpt: 'Yeni yasa düzenlemeleri ile evcil hayvan sahiplerinin hakları genişledi.',
    readTime: '4 dk',
    emoji: '⚖️',
    color: '#5856D6',
  },
];

export default function NewsScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <MotiView
        from={{ opacity: 0, translateY: -10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 500 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Haberler & İpuçları 📰</Text>
        <Text style={styles.headerSub}>Evcil hayvan dünyasından güncel içerikler</Text>
      </MotiView>

      {NEWS.map((item, i) => (
        <MotiView
          key={item.id}
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', delay: i * 110, duration: 500 }}
        >
          <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
            <View style={[styles.colorBar, { backgroundColor: item.color }]} />
            <View style={styles.cardContent}>
              <View style={styles.cardTop}>
                <Text style={styles.cardEmoji}>{item.emoji}</Text>
                <View style={[styles.categoryBadge, { backgroundColor: `${item.color}18` }]}>
                  <Text style={[styles.categoryText, { color: item.color }]}>{item.category}</Text>
                </View>
                <Text style={styles.readTime}>⏱ {item.readTime}</Text>
              </View>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.excerpt} numberOfLines={2}>{item.excerpt}</Text>
            </View>
          </Pressable>
        </MotiView>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F2F2F7' },
  container: { padding: 16, paddingBottom: 40 },
  header: {
    backgroundColor: '#FF6B00',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4 },
  headerSub: { fontSize: 13, color: '#FFE0CC' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    flexDirection: 'row',
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  pressed: { opacity: 0.85 },
  colorBar: { width: 5 },
  cardContent: { flex: 1, padding: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  cardEmoji: { fontSize: 18 },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  categoryText: { fontSize: 12, fontWeight: '700' },
  readTime: { fontSize: 12, color: '#AEAEB2', marginLeft: 'auto' },
  title: { fontSize: 15, fontWeight: '700', color: '#1C1C1E', lineHeight: 22, marginBottom: 6 },
  excerpt: { fontSize: 13, color: '#636366', lineHeight: 20 },
});
