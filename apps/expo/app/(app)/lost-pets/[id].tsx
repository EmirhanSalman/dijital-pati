import {
  ScrollView, View, Text, StyleSheet, Image,
  Pressable, ActivityIndicator, Alert, Linking,
} from 'react-native';
import { MotiView } from 'moti';
import { useState, useEffect, useCallback } from 'react';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { HeaderBackButton } from '@react-navigation/elements';
import { Camera } from 'lucide-react-native';
import * as Location from 'expo-location';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';
import { pickImageUri, uploadImage, buildPetImagePath } from '../../../lib/storage';
import { navigatePetDetailBack, normalizeParam } from '../../../lib/navigation';
import { getPetLostBadgeStyle, isLostPet } from '../../../lib/pet-status';
import { formatPetLocationDisplay } from '../../../lib/pet-location';
import { getPetContactChannels } from '../../../lib/pet-contact';
import { isValidMapCoordinates } from '../../../lib/pet-coordinates';
import { markOwnPetAsFound, markOwnPetAsLost } from '../../../lib/pets-owner';

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

export default function PetDetailScreen() {
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const petDbId = normalizeParam(id);
  const router = useRouter();

  const handleBack = useCallback(
    () => navigatePetDetailBack(router, from),
    [router, from]
  );
  const { session } = useAuth();

  const headerBack = useCallback(
    (props: { tintColor?: string }) => (
      <HeaderBackButton {...props} onPress={handleBack} />
    ),
    [handleBack]
  );
  const [pet, setPet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [markingFound, setMarkingFound] = useState(false);
  const [markingLost, setMarkingLost] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPet(null);
    setError(null);
    setLoading(true);
  }, [petDbId]);

  const fetchPet = useCallback(async () => {
    if (!petDbId) {
      setError('Hayvan bulunamadı.');
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from('pets')
      .select('*')
      .eq('id', petDbId)
      .single();
    if (fetchError || !data) {
      setError('Bu hayvan kaydı bulunamadı.');
      setPet(null);
    } else {
      if (__DEV__) {
        console.log('[LostPets] detail loaded', {
          id: petDbId,
          name: data.name,
          token_id: data.token_id,
        });
      }
      setPet(data);
      setError(null);
    }
    setLoading(false);
  }, [petDbId]);

  useEffect(() => {
    fetchPet();
  }, [fetchPet]);

  useFocusEffect(
    useCallback(() => {
      fetchPet();
    }, [fetchPet])
  );

  const stackOptions = {
    title: 'Hayvan Detayı' as const,
    headerBackTitle: 'Kayıplar' as const,
    headerBackVisible: true,
    headerLeft: headerBack,
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={stackOptions} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </>
    );
  }

  if (error || !pet) {
    return (
      <>
        <Stack.Screen options={stackOptions} />
        <View style={styles.centered}>
        <Text style={styles.errorEmoji}>🐾</Text>
        <Text style={styles.errorTitle}>Kayıt Bulunamadı</Text>
        <Text style={styles.errorSub}>{error || 'Bu hayvan mevcut değil.'}</Text>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.8 }]}
          onPress={handleBack}
        >
          <Text style={styles.backBtnText}>← Geri Dön</Text>
        </Pressable>
        </View>
      </>
    );
  }

  const imageUri = pet.image_url?.replace('ipfs://', 'https://ipfs.io/ipfs/');
  const lost = isLostPet(pet);
  const status = getPetLostBadgeStyle(lost);
  const locationText = formatPetLocationDisplay(pet);
  const isOwner = Boolean(session?.user?.id && pet.owner_id === session.user.id);

  const handleMarkLost = () => {
    const userId = session?.user?.id;
    if (!userId || !petDbId || !isOwner) return;

    Alert.alert(
      'Kayıp olarak işaretle',
      'Son görüldüğü konum olarak cihazınızın mevcut konumu kullanılacak. Devam etmek istiyor musunuz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Konumumu kullan',
          onPress: async () => {
            setMarkingLost(true);
            try {
              const { status } = await Location.requestForegroundPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Konum gerekli', 'Kayıp ilanı için konum izni verin.');
                return;
              }
              const pos = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
              });
              const { latitude, longitude } = pos.coords;
              if (!isValidMapCoordinates(latitude, longitude)) {
                Alert.alert('Konum gerekli', 'Kayıp bildirimi için geçerli bir konum alınamadı.');
                return;
              }
              await markOwnPetAsLost(petDbId, userId, { latitude, longitude });
              await fetchPet();
              Alert.alert('Başarılı', 'Hayvan kayıp olarak işaretlendi.');
            } catch (e: unknown) {
              Alert.alert('Hata', e instanceof Error ? e.message : 'Güncellenemedi.');
            } finally {
              setMarkingLost(false);
            }
          },
        },
      ]
    );
  };

  const handleUpdatePhoto = async () => {
    const userId = session?.user?.id;
    if (!userId || !petDbId) {
      Alert.alert('Giriş gerekli', 'Fotoğraf yüklemek için giriş yapın.');
      return;
    }
    if (!isOwner) {
      Alert.alert('Yetkisiz', 'Yalnızca hayvan sahibi fotoğrafı güncelleyebilir.');
      return;
    }

    const localUri = await pickImageUri();
    if (!localUri) return;

    setUploadingPhoto(true);
    try {
      const publicUrl = await uploadImage(localUri, 'pets', buildPetImagePath(userId, petDbId));
      const { error: updateError } = await supabase
        .from('pets')
        .update({ image_url: publicUrl })
        .eq('id', petDbId);

      if (updateError) throw new Error(updateError.message);

      setPet((prev: typeof pet) => ({ ...prev, image_url: publicUrl }));
      Alert.alert('Başarılı', 'Hayvan fotoğrafı güncellendi.');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Fotoğraf yüklenemedi.';
      Alert.alert('Hata', message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const contact = getPetContactChannels(pet);

  const handleCallOwner = () => {
    if (!contact.phone) return;
    const tel = contact.phone.replace(/\s/g, '');
    Linking.openURL(`tel:${tel}`).catch(() => {
      Alert.alert('Hata', 'Arama başlatılamadı.');
    });
  };

  const handleEmailOwner = () => {
    if (!contact.email) return;
    Linking.openURL(`mailto:${encodeURIComponent(contact.email)}`).catch(() => {
      Alert.alert('Hata', 'E-posta uygulaması açılamadı.');
    });
  };

  const handleMarkFound = () => {
    const userId = session?.user?.id;
    if (!userId || !petDbId || !isOwner) return;

    Alert.alert(
      'Bulundu Olarak İşaretle',
      'Bu hayvanı bulundu olarak işaretlemek istiyor musunuz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Evet, bulundu',
          onPress: async () => {
            setMarkingFound(true);
            try {
              await markOwnPetAsFound(petDbId, userId);
              Alert.alert('Başarılı', 'Hayvan güvende olarak işaretlendi.', [
                { text: 'Tamam', onPress: () => handleBack() },
              ]);
            } catch (e: unknown) {
              Alert.alert('Hata', e instanceof Error ? e.message : 'Güncellenemedi.');
            } finally {
              setMarkingFound(false);
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen options={stackOptions} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      {/* Hero Image / Avatar */}
      <MotiView
        from={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'timing', duration: 400 }}
        style={styles.heroCard}
      >
        <Pressable onPress={handleUpdatePhoto} disabled={uploadingPhoto || !isOwner}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Text style={styles.heroEmoji}>🐾</Text>
            </View>
          )}
          {isOwner ? (
            <View style={styles.photoEditBadge}>
              {uploadingPhoto ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Camera color="#fff" size={16} strokeWidth={2.5} />
                  <Text style={styles.photoEditText}>Fotoğrafı güncelle</Text>
                </>
              )}
            </View>
          ) : null}
        </Pressable>

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
        <Text style={styles.descBody}>{locationText}</Text>
      </MotiView>

      {isOwner && !lost ? (
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', delay: 400, duration: 400 }}
          style={styles.actionCard}
        >
          <Text style={styles.ownerActionHint}>
            Kayıp ilanı için konum izni gerekir; mevcut konumunuz kaydedilir.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.lostBtn, pressed && { opacity: 0.9 }, markingLost && styles.disabled]}
            onPress={handleMarkLost}
            disabled={markingLost}
          >
            {markingLost ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.lostBtnText}>Kayıp Olarak İşaretle</Text>
            )}
          </Pressable>
        </MotiView>
      ) : null}

      {isOwner && lost ? (
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', delay: 400, duration: 400 }}
          style={styles.actionCard}
        >
          <Pressable
            style={({ pressed }) => [styles.foundBtn, pressed && { opacity: 0.9 }, markingFound && styles.disabled]}
            onPress={handleMarkFound}
            disabled={markingFound}
          >
            {markingFound ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.foundBtnText}>Bulundu Olarak İşaretle</Text>
            )}
          </Pressable>
        </MotiView>
      ) : null}

      {!isOwner ? (
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', delay: 400, duration: 400 }}
          style={styles.actionCard}
        >
          <Text style={styles.descTitle}>Sahibiyle iletişim</Text>
          {contact.hasAny ? (
            <>
              {contact.phone ? (
                <Pressable
                  style={({ pressed }) => [styles.contactBtn, pressed && { opacity: 0.9 }]}
                  onPress={handleCallOwner}
                >
                  <Text style={styles.contactBtnText}>Sahibiyle İletişime Geç — Ara</Text>
                  <Text style={styles.contactSub}>{contact.phone}</Text>
                </Pressable>
              ) : null}
              {contact.email ? (
                <Pressable
                  style={({ pressed }) => [styles.contactBtnOutline, pressed && { opacity: 0.9 }]}
                  onPress={handleEmailOwner}
                >
                  <Text style={styles.contactBtnOutlineText}>E-posta Gönder</Text>
                  <Text style={styles.contactSub}>{contact.email}</Text>
                </Pressable>
              ) : null}
              {contact.legacy && !contact.phone && !contact.email ? (
                <Pressable
                  style={({ pressed }) => [styles.contactBtn, pressed && { opacity: 0.9 }]}
                  onPress={() => Alert.alert('İletişim', contact.legacy!)}
                >
                  <Text style={styles.contactBtnText}>Sahibiyle İletişime Geç</Text>
                  <Text style={styles.contactSub}>{contact.legacy}</Text>
                </Pressable>
              ) : null}
            </>
          ) : (
            <Text style={styles.noContact}>İletişim bilgisi bulunamadı.</Text>
          )}
        </MotiView>
      ) : null}
    </ScrollView>
    </>
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
  photoEditBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(26, 39, 68, 0.75)',
    paddingVertical: 10,
    borderRadius: 12,
  },
  photoEditText: { color: '#fff', fontSize: 13, fontWeight: '600' },

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

  actionCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  ownerActionHint: { fontSize: 13, color: C.muted, lineHeight: 18, marginBottom: 12 },
  lostBtn: {
    backgroundColor: C.danger,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  lostBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  foundBtn: {
    backgroundColor: C.success,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  foundBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  contactBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  contactBtnText: { color: '#fff', fontSize: 15, fontWeight: '700', textAlign: 'center' },
  contactSub: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 4, textAlign: 'center' },
  contactBtnOutline: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: C.primary,
    backgroundColor: C.primaryBg,
  },
  contactBtnOutlineText: { color: C.primary, fontSize: 15, fontWeight: '700', textAlign: 'center' },
  noContact: { fontSize: 14, color: C.muted, marginTop: 8, lineHeight: 20 },
  disabled: { opacity: 0.7 },

  // ── Back button ──
  backBtn: {
    backgroundColor: C.primary, borderRadius: 14,
    paddingVertical: 15, alignItems: 'center',
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  backBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
