import {
  ScrollView, View, Text, StyleSheet, Image, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

const C = {
  primary: '#6366F1',
  navy: '#1A2744',
  background: '#F8FAFC',
  foreground: '#090E1A',
  muted: '#64748B',
  border: '#E2E8F0',
};

export default function ForumDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [thread, setThread] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) {
        setError('Konu bulunamadı.');
        setLoading(false);
        return;
      }
      const { data, error: fetchError } = await supabase
        .from('forum_posts')
        .select('*')
        .eq('id', id)
        .single();
      if (fetchError || !data) {
        setError('Bu konu bulunamadı veya erişim yok.');
      } else {
        setThread(data);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={styles.muted}>Yükleniyor...</Text>
      </View>
    );
  }

  if (error || !thread) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>{error ?? 'Konu bulunamadı'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{thread.category || 'Genel'}</Text>
      </View>
      {thread.image_url ? (
        <Image source={{ uri: thread.image_url }} style={styles.hero} resizeMode="cover" />
      ) : null}
      <Text style={styles.date}>
        {thread.created_at
          ? new Date(thread.created_at).toLocaleDateString('tr-TR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })
          : ''}
      </Text>
      <Text style={styles.title}>{thread.title}</Text>
      <Text style={styles.body}>{thread.content || 'İçerik yok.'}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  container: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: C.background },
  muted: { marginTop: 12, color: C.muted },
  errorTitle: { fontSize: 16, fontWeight: '600', color: C.navy, textAlign: 'center' },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: C.primary },
  hero: { width: '100%', height: 180, borderRadius: 14, marginBottom: 16, backgroundColor: C.border },
  date: { fontSize: 13, color: C.muted, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '800', color: C.foreground, marginBottom: 16, lineHeight: 30 },
  body: { fontSize: 16, color: C.foreground, lineHeight: 26 },
});
