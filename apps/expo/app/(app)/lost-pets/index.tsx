import { ScrollView, View, Text, Pressable, StyleSheet, Image, Alert, RefreshControl } from 'react-native';
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
  background: '#F8FAFC',    // Slate-50 (web --background equivalent)
  surface: '#FFFFFF',
  foreground: '#090E1A',    // Web --foreground
  muted: '#64748B',         // Web --muted-foreground (slate-500)
  border: '#E2E8F0',        // Web --border
  danger: '#EF4444',
  dangerBg: '#FEF2F2',
};

export default function LostPetsScreen() {
  const [pets, setPets] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  async function fetchPets() {
    const { data } = await supabase.from('pets').select('*');
    if (data) setPets(data);
  }

  useEffect(() => {
    fetchPets();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchPets();
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
        style={styles.banner}
      >
        <Text style={styles.bannerTitle}>🔍 {pets.length} Aktif İlan</Text>
        <Text style={styles.bannerSub}>Bölgenizdeki kayıp hayvanlar</Text>
      </MotiView>

      {pets.map((pet, i) => (
        <MotiView
          key={pet.id || i}
          from={{ opacity: 0, translateX: -20 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ type: 'timing', delay: i * 100, duration: 500 }}
        >
          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            onPress={() => {
              console.log('Navigating to pet detail:', pet.id);
              router.push({
                pathname: '/lost-pets/[id]',
                params: { id: String(pet.id), from: 'list' },
              });
            }}
          >
            <View style={styles.cardLeft}>
              <View style={styles.emojiCircle}>
                {pet.image_url ? (
                  <Image source={{ uri: pet.image_url.replace('ipfs://', 'https://ipfs.io/ipfs/') }} style={styles.petImage} />
                ) : (
                  <Text style={styles.emoji}>🐾</Text>
                )}
              </View>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.petName}>{pet.name}</Text>
              <Text style={styles.petSpecies}>{pet.breed}</Text>
              <Text style={styles.petLocation}>📍 Bilinmiyor</Text>
            </View>
            <View style={styles.cardRight}>
              <Text style={styles.date}>Yakın zamanda</Text>
              <View style={styles.urgentBadge}>
                <Text style={styles.urgentText}>{pet.status || 'Kayıp'}</Text>
              </View>
            </View>
          </Pressable>
        </MotiView>
      ))}

      <Pressable
        style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
        onPress={() => {
          console.log('New lost pet listing pressed');
          Alert.alert('Yeni İlan', 'Yeni kayıp hayvan ilanı oluşturma ekranı açılıyor...');
        }}
      >
        <Text style={styles.addBtnText}>+ Yeni İlan Ver</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BRAND.background },
  container: { padding: 16, paddingBottom: 40 },
  banner: {
    backgroundColor: BRAND.primary,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  bannerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  bannerSub: { fontSize: 14, color: BRAND.primaryMid },
  card: {
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
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  cardLeft: { marginRight: 12 },
  emojiCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: BRAND.primaryBg, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  petImage: { width: 52, height: 52 },
  emoji: { fontSize: 26 },
  cardBody: { flex: 1 },
  petName: { fontSize: 17, fontWeight: '700', color: BRAND.foreground, marginBottom: 2 },
  petSpecies: { fontSize: 13, color: BRAND.muted, marginBottom: 4 },
  petLocation: { fontSize: 13, color: BRAND.muted },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  date: { fontSize: 12, color: '#94A3B8' },
  urgentBadge: { backgroundColor: BRAND.dangerBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  urgentText: { fontSize: 12, fontWeight: '600', color: BRAND.danger },
  addBtn: {
    backgroundColor: BRAND.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  addBtnPressed: { backgroundColor: '#4F46E5', opacity: 0.9 },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
