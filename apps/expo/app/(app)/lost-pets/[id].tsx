import {
  ScrollView, View, Text, StyleSheet, Image,
  Pressable, ActivityIndicator,
} from 'react-native';
import { MotiView } from 'moti';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';

const C = {
  primary:    '#6366F1',
  primaryBg:  '#EEF2FF',
  primaryMid: '#C7D2FE',
  navy:       '#1A2744',
  foreground: '#090E1A',
  muted:      '#64748B',
  border:     '#E2E8F0',
  surface:    '#FFFFFF',
  background: '#F8FAFC',
  danger:     '#EF4444',
  dangerBg:   '#FEF2F2',
  success:    '#22C55E',
  successBg:  '#F0FDF4',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  kayip:  { label: 'Kayıp', color: C.danger,  bg: C.dangerBg  },
  bulundu:{ label: 'Bulundu', color: C.success, bg: C.successBg },
  default:{ label: 'Kayıp', color: C.danger,  bg: C.dangerBg  },
};

function goBack(router: ReturnType<typeof useRouter>) {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/lost-pets');
  }
}

export default function PetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [pet, setPet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPet() {
      if (!id) { setError('Hayvan bulunamadı.'); setLoading(false); return; }
      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('id', id)
        .single();
      if (error || !data) {
        setError('Bu hayvan kaydı bulunamadı.');
      } else {
        setPet(data);
      }
      setLoading(false);
    }
    fetchPet();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  if (error || !pet) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorEmoji}>🐾</Text>
        <Text style={styles.errorTitle}>Kayıt Bulunamadı</Text>
        <Text style={styles.errorSub}>{error || 'Bu hayvan mevcut değil.'}</Text>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.8 }]}
          onPress={() => goBack(router)}
        >
          <Text style={styles.backBtnText}>← Geri Dön</Text>
        </Pressable>
      </View>
    );
  }

  const imageUri = pet.image_url?.replace('ipfs://', 'https://ipfs.io/ipfs/');
  const statusKey = (pet.status || 'kayip').toLowerCase();
  const status = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.default;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      {/* Hero Image / Avatar */}
      <MotiView
        from={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'timing', duration: 400 }}
        style={styles.heroCard}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.heroImage} resizeMode="cover" />
        ) : (
          <View style={styles.heroPlaceholder}>
            <Text style={styles.heroEmoji}>🐾</Text>
          </View>
        )}

        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </MotiView>

      {/* Info Card */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', delay: 150, duration: 400 }}
        style={styles.infoCard}
      >
        <Text style={styles.petName}>{pet.name || 'İsimsiz'}</Text>
        {pet.breed ? <Text style={styles.petBreed}>{pet.breed}</Text> : null}

        <View style={styles.metaRow}>
          {pet.species ? (
            <View style={styles.metaChip}>
              <Text style={styles.metaChipText}>🐶 {pet.species}</Text>
            </View>
          ) : null}
          {pet.age ? (
            <View style={styles.metaChip}>
              <Text style={styles.metaChipText}>🎂 {pet.age} yaşında</Text>
            </View>
          ) : null}
          {pet.gender ? (
            <View style={styles.metaChip}>
              <Text style={styles.metaChipText}>{pet.gender === 'male' ? '♂️ Erkek' : '♀️ Dişi'}</Text>
            </View>
          ) : null}
        </View>
      </MotiView>

      {/* Description Card */}
      {pet.description ? (
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', delay: 250, duration: 400 }}
          style={styles.descCard}
        >
          <Text style={styles.descTitle}>Açıklama</Text>
          <Text style={styles.descBody}>{pet.description}</Text>
        </MotiView>
      ) : null}

      {/* Location */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', delay: 350, duration: 400 }}
        style={styles.locationCard}
      >
        <Text style={styles.descTitle}>📍 Son Görüldüğü Yer</Text>
        <Text style={styles.descBody}>{pet.last_seen_location || 'Konum belirtilmedi'}</Text>
      </MotiView>

      {/* Back Button */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing', delay: 450, duration: 400 }}
      >
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.85 }]}
          onPress={() => goBack(router)}
        >
          <Text style={styles.backBtnText}>← Listeye Dön</Text>
        </Pressable>
      </MotiView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  container: { padding: 16, paddingBottom: 48 },

  centered: {
    flex: 1, backgroundColor: C.background,
    alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  loadingText: { marginTop: 12, fontSize: 14, color: C.muted },
  errorEmoji: { fontSize: 56, marginBottom: 16 },
  errorTitle: { fontSize: 20, fontWeight: '700', color: C.navy, marginBottom: 8 },
  errorSub: { fontSize: 14, color: C.muted, textAlign: 'center', marginBottom: 24 },

  // ── Hero ──
  heroCard: {
    borderRadius: 20, overflow: 'hidden',
    marginBottom: 14, position: 'relative',
    borderWidth: 1, borderColor: C.border,
    shadowColor: C.navy, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  heroImage: { width: '100%', height: 260 },
  heroPlaceholder: {
    width: '100%', height: 260,
    backgroundColor: C.primaryBg,
    alignItems: 'center', justifyContent: 'center',
  },
  heroEmoji: { fontSize: 80 },
  statusBadge: {
    position: 'absolute', top: 14, right: 14,
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: { fontSize: 13, fontWeight: '700' },

  // ── Info ──
  infoCard: {
    backgroundColor: C.surface, borderRadius: 16,
    padding: 18, marginBottom: 12,
    borderWidth: 1, borderColor: C.border,
    shadowColor: C.navy, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  petName: { fontSize: 26, fontWeight: '800', color: C.foreground, marginBottom: 4 },
  petBreed: { fontSize: 16, color: C.muted, marginBottom: 12 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaChip: {
    backgroundColor: C.primaryBg, paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20,
  },
  metaChipText: { fontSize: 13, color: C.primary, fontWeight: '600' },

  // ── Description / Location ──
  descCard: {
    backgroundColor: C.surface, borderRadius: 16,
    padding: 18, marginBottom: 12,
    borderWidth: 1, borderColor: C.border,
    shadowColor: C.navy, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  locationCard: {
    backgroundColor: C.surface, borderRadius: 16,
    padding: 18, marginBottom: 16,
    borderWidth: 1, borderColor: C.border,
    shadowColor: C.navy, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  descTitle: { fontSize: 13, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  descBody: { fontSize: 15, color: C.foreground, lineHeight: 22 },

  // ── Back button ──
  backBtn: {
    backgroundColor: C.primary, borderRadius: 14,
    paddingVertical: 15, alignItems: 'center',
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  backBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
