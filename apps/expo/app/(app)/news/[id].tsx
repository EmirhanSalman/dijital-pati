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
  surface: '#FFFFFF',
  foreground: '#090E1A',
  muted: '#64748B',
  border: '#E2E8F0',
};

export default function NewsDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) {
        setError('Haber bulunamadı.');
        setLoading(false);
        return;
      }
      const { data, error: fetchError } = await supabase
        .from('news')
        .select('*')
        .eq('id', id)
        .single();
      if (fetchError || !data) {
        setError('Bu haber bulunamadı veya erişim yok.');
      } else {
        setItem(data);
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

  if (error || !item) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>{error ?? 'Haber bulunamadı'}</Text>
      </View>
    );
  }

  const imageUri = item.image_url?.replace('ipfs://', 'https://ipfs.io/ipfs/');

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.hero} resizeMode="cover" />
      ) : null}
      <Text style={styles.date}>
        {item.created_at
          ? new Date(item.created_at).toLocaleDateString('tr-TR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })
          : ''}
      </Text>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.body}>{item.content}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  container: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: C.background },
  muted: { marginTop: 12, color: C.muted },
  errorTitle: { fontSize: 16, fontWeight: '600', color: C.navy, textAlign: 'center' },
  hero: { width: '100%', height: 200, borderRadius: 14, marginBottom: 16, backgroundColor: C.border },
  date: { fontSize: 13, color: C.muted, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '800', color: C.foreground, marginBottom: 16, lineHeight: 30 },
  body: { fontSize: 16, color: C.foreground, lineHeight: 26 },
});
