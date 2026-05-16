import { ScrollView, View, Text, Pressable, StyleSheet, RefreshControl, Image } from 'react-native';
import { MotiView } from 'moti';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
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

const CATEGORY_COLORS: Record<string, string> = {
  Beslenme: '#22C55E',
  Tavsiye: '#3B82F6',
  Davranış: '#F59E0B',
  Veteriner: '#EF4444',
  Genel: '#6366F1',
};

export default function ForumScreen() {
  const router = useRouter();
  const [threads, setThreads] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchThreads() {
    const { data } = await supabase.from('forum_posts').select('*');
    if (data) setThreads(data);
  }

  useEffect(() => {
    fetchThreads();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchThreads();
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
        <Text style={styles.headerTitle}>Pati Forum 💬</Text>
        <Text style={styles.headerSub}>Toplulukla bilgi paylaş</Text>
      </MotiView>

      {threads.map((t, i) => (
        <MotiView
          key={t.id || i}
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', delay: i * 100, duration: 500 }}
        >
          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            onPress={() => {
              router.push({
                pathname: '/forum/[id]',
                params: { id: String(t.id) },
              });
            }}
          >
            <View style={styles.cardTop}>
              <Text style={styles.threadEmoji}>💬</Text>
              <View style={[styles.categoryBadge, { backgroundColor: `${CATEGORY_COLORS['Genel']}20` }]}>
                <Text style={[styles.categoryText, { color: CATEGORY_COLORS[t.category] ?? CATEGORY_COLORS.Genel }]}>
                  {t.category || 'Genel'}
                </Text>
              </View>
            </View>
            {t.image_url ? (
              <Image source={{ uri: t.image_url }} style={styles.threadImage} resizeMode="cover" />
            ) : null}
            <Text style={styles.threadTitle}>{t.title}</Text>
            <View style={styles.cardBottom}>
              <Text style={styles.author}>👤 Kullanıcı</Text>
              <Text style={styles.replies}>📅 {t.created_at ? new Date(t.created_at).toLocaleDateString() : 'Yakın zamanda'}</Text>
            </View>
          </Pressable>
        </MotiView>
      ))}

      <Pressable
        style={({ pressed }) => [styles.newPostBtn, pressed && styles.newPostBtnPressed]}
        onPress={() => router.push('/(app)/forum/create')}
      >
        <Text style={styles.newPostText}>+ Yeni Konu Aç</Text>
      </Pressable>
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
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  headerSub: { fontSize: 14, color: BRAND.primaryMid },
  card: {
    backgroundColor: BRAND.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: BRAND.border,
    shadowColor: BRAND.navy,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  threadEmoji: { fontSize: 22 },
  categoryBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  categoryText: { fontSize: 12, fontWeight: '700' },
  threadImage: {
    width: '100%',
    height: 140,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: BRAND.primaryBg,
  },
  threadTitle: { fontSize: 15, fontWeight: '600', color: BRAND.foreground, lineHeight: 22, marginBottom: 10 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  author: { fontSize: 13, color: BRAND.muted },
  replies: { fontSize: 13, color: BRAND.muted },
  newPostBtn: {
    backgroundColor: BRAND.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  newPostBtnPressed: { backgroundColor: '#4F46E5', opacity: 0.9 },
  newPostText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
