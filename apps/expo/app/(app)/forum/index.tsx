import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

const CATEGORY_COLORS: Record<string, string> = {
  Beslenme: '#34C759',
  Tavsiye: '#007AFF',
  Davranış: '#FF9500',
  Veteriner: '#FF3B30',
  Genel: '#8E8E93',
};

export default function ForumScreen() {
  const [threads, setThreads] = useState<any[]>([]);

  useEffect(() => {
    async function fetchThreads() {
      const { data, error } = await supabase.from('forum_posts').select('*');
      if (data) setThreads(data);
    }
    fetchThreads();
  }, []);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
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
          <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
            <View style={styles.cardTop}>
              <Text style={styles.threadEmoji}>💬</Text>
              <View style={[styles.categoryBadge, { backgroundColor: `${CATEGORY_COLORS['Genel']}20` }]}>
                <Text style={[styles.categoryText, { color: CATEGORY_COLORS['Genel'] }]}>Genel</Text>
              </View>
            </View>
            <Text style={styles.threadTitle}>{t.title}</Text>
            <View style={styles.cardBottom}>
              <Text style={styles.author}>👤 Kullanıcı</Text>
              <Text style={styles.replies}>📅 {t.created_at ? new Date(t.created_at).toLocaleDateString() : 'Yakın zamanda'}</Text>
            </View>
          </Pressable>
        </MotiView>
      ))}

      <Pressable style={styles.newPostBtn}>
        <Text style={styles.newPostText}>+ Yeni Konu Aç</Text>
      </Pressable>
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
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  headerSub: { fontSize: 14, color: '#FFE0CC' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  pressed: { opacity: 0.85 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  threadEmoji: { fontSize: 22 },
  categoryBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  categoryText: { fontSize: 12, fontWeight: '700' },
  threadTitle: { fontSize: 15, fontWeight: '600', color: '#1C1C1E', lineHeight: 22, marginBottom: 10 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  author: { fontSize: 13, color: '#8E8E93' },
  replies: { fontSize: 13, color: '#8E8E93' },
  newPostBtn: {
    backgroundColor: '#FF6B00', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 8,
  },
  newPostText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
