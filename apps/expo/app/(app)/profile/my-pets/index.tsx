import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useAuth } from '../../../_layout';
import { BRAND } from '../../../../lib/brand';
import { fetchOwnPets, resolveImageUri, type OwnedPet } from '../../../../lib/pets-owner';
import { getPetLostBadgeStyle, isLostPet } from '../../../../lib/pet-status';
import { PetQrLinkActions } from '../../../../components/PetQrLinkActions';
import { openWebCreatePetRegistration, promptWebCreatePetRegistration } from '../../../../lib/web-create-pet';

export default function MyPetsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [pets, setPets] = useState<OwnedPet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setPets([]);
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const rows = await fetchOwnPets(userId);
      setPets(rows);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Liste yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading && pets.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={BRAND.primary} />
        <Text style={styles.muted}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND.primary} />
        }
      >
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={load}>
              <Text style={styles.retry}>Tekrar dene</Text>
            </Pressable>
          </View>
        ) : null}

        {pets.length === 0 && !error ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🐾</Text>
            <Text style={styles.emptyTitle}>Henüz evcil hayvanınız yok.</Text>
            <Text style={styles.emptySub}>
              Blockchain tabanlı kayıt oluşturmak için web sitesine geçebilirsiniz.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.emptyBtn, pressed && { opacity: 0.9 }]}
              onPress={() => void openWebCreatePetRegistration()}
            >
              <Text style={styles.emptyBtnText}>Web&apos;de Evcil Hayvan Kaydet</Text>
            </Pressable>
          </View>
        ) : null}

        {pets.map((pet) => {
          const lost = isLostPet(pet);
          const badge = getPetLostBadgeStyle(lost);
          const imageUri = resolveImageUri(pet.image_url);

          return (
            <View key={String(pet.id)} style={styles.cardWrap}>
              <Pressable
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}
                onPress={() =>
                  router.push({
                    pathname: '/(app)/profile/my-pets/[id]/edit',
                    params: { id: String(pet.id) },
                  })
                }
              >
                <View style={styles.cardLeft}>
                  {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.thumb} />
                  ) : (
                    <View style={styles.thumbPlaceholder}>
                      <Text style={styles.thumbEmoji}>🐾</Text>
                    </View>
                  )}
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.name}>{pet.name || 'İsimsiz'}</Text>
                  <Text style={styles.meta}>
                    {[pet.species, pet.breed].filter(Boolean).join(' · ') || '—'}
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
                </View>
              </Pressable>
              <View style={styles.qrRow}>
                <PetQrLinkActions tokenId={pet.token_id} petName={pet.name} compact />
              </View>
            </View>
          );
        })}
      </ScrollView>

      <Pressable
        style={({ pressed }) => [styles.fab, pressed && { opacity: 0.9 }]}
        onPress={promptWebCreatePetRegistration}
      >
        <Plus color="#fff" size={22} strokeWidth={2.5} />
        <Text style={styles.fabText}>Yeni Evcil Hayvan Kaydet</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BRAND.background },
  container: { padding: 16, paddingBottom: 100 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BRAND.background },
  muted: { marginTop: 12, color: BRAND.muted },
  errorBox: {
    backgroundColor: BRAND.dangerBg,
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  errorText: { color: BRAND.danger, marginBottom: 8 },
  retry: { color: BRAND.primary, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: BRAND.navy, marginBottom: 6 },
  emptySub: {
    fontSize: 14,
    color: BRAND.muted,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  emptyBtn: {
    backgroundColor: BRAND.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  emptyBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cardWrap: {
    backgroundColor: BRAND.surface,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: BRAND.border,
    overflow: 'hidden',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  qrRow: { paddingHorizontal: 12, paddingBottom: 12 },
  pressed: { opacity: 0.88 },
  cardLeft: { marginRight: 12 },
  thumb: { width: 56, height: 56, borderRadius: 12 },
  thumbPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: BRAND.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbEmoji: { fontSize: 26 },
  cardBody: { flex: 1 },
  name: { fontSize: 17, fontWeight: '700', color: BRAND.foreground },
  meta: { fontSize: 13, color: BRAND.muted, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  fab: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: BRAND.primary,
    borderRadius: 14,
    paddingVertical: 16,
  },
  fabText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
