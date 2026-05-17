import { ScrollView, View, Text, Pressable, StyleSheet, Image, Alert, RefreshControl } from 'react-native';
import { MotiView } from 'moti';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useFocusEffect, type Href } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { getPetLostLabel } from '../../../lib/pet-status';
import { formatPetLocationDisplay } from '../../../lib/pet-location';

const BRAND = {
  primary: '#6366F1',
  primaryBg: '#EEF2FF',
  primaryMid: '#C7D2FE',
  navy: '#1A2744',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  foreground: '#090E1A',
  muted: '#64748B',
  border: '#E2E8F0',
  danger: '#EF4444',
  dangerBg: '#FEF2F2',
};

export default function LostPetsScreen() {
  const [pets, setPets] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchPets = useCallback(async () => {
    const { data } = await supabase
      .from('pets')
      .select('*')
      .eq('is_lost', true)
      .order('lost_reported_at', { ascending: false, nullsFirst: false });
    setPets(data ?? []);
  }, []);

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  useFocusEffect(
    useCallback(() => {
      fetchPets();
    }, [fetchPets])
  );

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

      {pets.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🐾</Text>
          <Text style={styles.emptyTitle}>Kayıp ilan yok</Text>
          <Text style={styles.emptySub}>Şu an aktif kayıp ilanı bulunmuyor.</Text>
        </View>
      ) : null}

      {pets.map((pet, i) => {
        const petDbId = String(pet.id);
        return (
        <MotiView
          key={petDbId}
          from={{ opacity: 0, translateX: -20 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ type: 'timing', delay: i * 100, duration: 500 }}
        >
          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            onPress={() => {
              if (__DEV__) {
                console.log('[LostPets] opening pet detail', {
                  id: petDbId,
                  name: pet.name,
                  token_id: pet.token_id,
                });
              }
              router.push(`/(app)/lost-pets/${petDbId}?from=list` as Href);
            }}
          >
            <View style={styles.cardLeft}>
              <View style={styles.emojiCircle}>
                {pet.image_url ? (
                  <Image
                    source={{ uri: pet.image_url.replace('ipfs://', 'https://ipfs.io/ipfs/') }}
                    style={styles.petImage}
                  />
                ) : (
                  <Text style={styles.emoji}>🐾</Text>
                )}
              </View>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.petName}>{pet.name}</Text>
              <Text style={styles.petSpecies}>{pet.breed || pet.species || '—'}</Text>
              <Text style={styles.petLocation} numberOfLines={1}>
                📍 {formatPetLocationDisplay(pet)}
              </Text>
            </View>
            <View style={styles.cardRight}>
              <Text style={styles.date}>Yakın zamanda</Text>
              <View style={styles.urgentBadge}>
                <Text style={styles.urgentText}>{getPetLostLabel(pet)}</Text>
              </View>
            </View>
          </Pressable>
        </MotiView>
        );
      })}

      <Pressable
        style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
        onPress={() => {
          Alert.alert('Yeni İlan', 'Kayıp ilanı web üzerinden veya yakında mobilde oluşturulabilir.');
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
  empty: { alignItems: 'center', paddingVertical: 32, marginBottom: 16 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: BRAND.navy, marginBottom: 6 },
  emptySub: { fontSize: 14, color: BRAND.muted, textAlign: 'center' },
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
