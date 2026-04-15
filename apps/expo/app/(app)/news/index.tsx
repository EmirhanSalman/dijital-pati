import { ScrollView, View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { MotiView } from 'moti';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export default function NewsScreen() {
  const [news, setNews] = useState<any[]>([]);

  useEffect(() => {
    async function fetchNews() {
      const { data, error } = await supabase.from('news').select('*');
      if (data) setNews(data);
    }
    fetchNews();
  }, []);

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

      {news.map((item, i) => (
        <MotiView
          key={item.id || i}
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', delay: i * 110, duration: 500 }}
        >
          <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
            <View style={[styles.colorBar, { backgroundColor: '#FF6B00' }]} />
            <View style={styles.cardContent}>
              <View style={styles.cardTop}>
                {item.image_url ? (
                  <Image source={{ uri: item.image_url }} style={{ width: 24, height: 24, borderRadius: 12 }} />
                ) : (
                  <Text style={styles.cardEmoji}>📰</Text>
                )}
                <View style={[styles.categoryBadge, { backgroundColor: `#FF6B0018` }]}>
                  <Text style={[styles.categoryText, { color: '#FF6B00' }]}>Haber</Text>
                </View>
                <Text style={styles.readTime}>📅 {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Yeni'}</Text>
              </View>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.excerpt} numberOfLines={2}>{item.content}</Text>
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
