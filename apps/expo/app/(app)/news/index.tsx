import { ScrollView, View, Text, Pressable, StyleSheet, Image, Alert, RefreshControl } from 'react-native';
import { MotiView } from 'moti';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

// ─── Web-Extracted Brand Colors ───────────────────────────────────
const BRAND = {
  primary: '#6366F1',       // Indigo-500 (web scrollbar/accent)
  primaryBg: '#EEF2FF',     // Indigo-50
  primaryMid: '#C7D2FE',    // Indigo-200
  navy: '#1A2744',          // Web --primary
  background: '#F8FAFC',    // Slate-50
  surface: '#FFFFFF',
  foreground: '#090E1A',    // Web --foreground
  muted: '#64748B',         // Web --muted-foreground
  border: '#E2E8F0',        // Web --border
};

export default function NewsScreen() {
  const [news, setNews] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchNews() {
    const { data } = await supabase.from('news').select('*');
    if (data) setNews(data);
  }

  useEffect(() => {
    fetchNews();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchNews();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#6366F1']}
          tintColor="#6366F1"
        />
      }
    >
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
          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            onPress={() => {
              console.log('News item pressed:', item.id, item.title);
              Alert.alert('Haber Detayı', `"${item.title}" haberine gidiliyor...`);
            }}
          >
            <View style={[styles.colorBar, { backgroundColor: BRAND.primary }]} />
            <View style={styles.cardContent}>
              <View style={styles.cardTop}>
                {item.image_url ? (
                  <Image source={{ uri: item.image_url.replace('ipfs://', 'https://ipfs.io/ipfs/') }} style={{ width: 24, height: 24, borderRadius: 12 }} />
                ) : (
                  <Text style={styles.cardEmoji}>📰</Text>
                )}
                <View style={[styles.categoryBadge, { backgroundColor: BRAND.primaryBg }]}>
                  <Text style={[styles.categoryText, { color: BRAND.primary }]}>Haber</Text>
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
  screen: { flex: 1, backgroundColor: BRAND.background },
  container: { padding: 16, paddingBottom: 40 },
  header: {
    backgroundColor: BRAND.primary,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4 },
  headerSub: { fontSize: 13, color: BRAND.primaryMid },
  card: {
    backgroundColor: BRAND.surface,
    borderRadius: 14,
    flexDirection: 'row',
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BRAND.border,
    shadowColor: BRAND.navy,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  colorBar: { width: 5 },
  cardContent: { flex: 1, padding: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  cardEmoji: { fontSize: 18 },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  categoryText: { fontSize: 12, fontWeight: '700' },
  readTime: { fontSize: 12, color: '#94A3B8', marginLeft: 'auto' },
  title: { fontSize: 15, fontWeight: '700', color: BRAND.foreground, lineHeight: 22, marginBottom: 6 },
  excerpt: { fontSize: 13, color: BRAND.muted, lineHeight: 20 },
});
