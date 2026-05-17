import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Image,
  Switch,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Camera, Trash2 } from 'lucide-react-native';
import { useAuth } from '../../../../_layout';
import { supabase } from '../../../../../lib/supabase';
import { BRAND } from '../../../../../lib/brand';
import {
  fetchOwnPetById,
  deleteOwnPet,
  resolveImageUri,
  updateOwnPet,
} from '../../../../../lib/pets-owner';
import { buildPetTextFields, splitPetBreed } from '../../../../../lib/pet-form';
import {
  buildFoundUpdate,
  buildLostLocationUpdate,
  isValidMapCoordinates,
} from '../../../../../lib/pet-coordinates';
import { pickImageUri, uploadImage, buildPetImagePath } from '../../../../../lib/storage';
import { isLostPet } from '../../../../../lib/pet-status';
import { PetQrLinkActions } from '../../../../../components/PetQrLinkActions';

export default function EditPetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const savingRef = useRef(false);
  const initialLostRef = useRef(false);

  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [breed, setBreed] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [isLost, setIsLost] = useState(false);
  const [initialLost, setInitialLost] = useState(false);
  const [tokenId, setTokenId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [latInput, setLatInput] = useState('');
  const [lngInput, setLngInput] = useState('');

  const load = useCallback(async () => {
    if (!userId || !id) return;
    setLoading(true);
    setForbidden(false);
    try {
      const pet = await fetchOwnPetById(id, userId);
      if (!pet) {
        setForbidden(true);
        return;
      }
      setName(pet.name ?? '');
      const { type, breed: breedPart } = splitPetBreed(pet.breed);
      setSpecies(type || pet.species || '');
      setBreed(breedPart);
      setDescription(pet.description ?? '');
      setCity(pet.city ?? '');
      const lostFromDb = isLostPet(pet);
      initialLostRef.current = lostFromDb;
      setIsLost(lostFromDb);
      setInitialLost(lostFromDb);
      setTokenId(pet.token_id != null ? String(pet.token_id) : null);
      setImageUrl(pet.image_url ?? null);
      if (pet.latitude != null) setLatInput(String(pet.latitude));
      if (pet.longitude != null) setLngInput(String(pet.longitude));
    } catch (e: unknown) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'Yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [id, userId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUseMyLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Konum gerekli', 'Kayıp ilanı için konum izni verin.');
      return;
    }
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    setLatInput(String(pos.coords.latitude));
    setLngInput(String(pos.coords.longitude));
  };

  const handlePhoto = async () => {
    if (!userId || !id) return;
    const uri = await pickImageUri();
    if (!uri) return;
    setSaving(true);
    try {
      const publicUrl = await uploadImage(uri, 'pets', buildPetImagePath(userId, id));
      const { error } = await supabase
        .from('pets')
        .update({ image_url: publicUrl })
        .eq('id', id)
        .eq('owner_id', userId);
      if (error) throw new Error(error.message);
      setImageUrl(publicUrl);
      Alert.alert('Başarılı', 'Fotoğraf güncellendi.');
    } catch (e: unknown) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'Yükleme başarısız.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!userId || !id) return;
    if (savingRef.current || saving) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Eksik bilgi', 'Hayvan adı zorunludur.');
      return;
    }

    const baselineLost = initialLostRef.current;
    const didLostStatusChange = isLost !== baselineLost;
    const markingLost = didLostStatusChange && isLost;
    const markingFound = didLostStatusChange && !isLost;

    const updatePayload: Record<string, unknown> = buildPetTextFields(
      trimmedName,
      species,
      breed,
      description,
      city
    );

    if (markingLost) {
      const lat = parseFloat(latInput);
      const lng = parseFloat(lngInput);
      if (!isValidMapCoordinates(lat, lng)) {
        Alert.alert('Konum gerekli', 'Kayıp bildirimi için konum seçmeniz gerekiyor.');
        return;
      }
      Object.assign(updatePayload, buildLostLocationUpdate({ latitude: lat, longitude: lng }));
    } else if (markingFound) {
      Object.assign(updatePayload, buildFoundUpdate());
    }

    if (__DEV__) {
      console.log('[EditPet] save', {
        petId: Array.isArray(id) ? id[0] : id,
        userId,
        initialIsLost: baselineLost,
        toggleIsLost: isLost,
        didLostStatusChange,
        finalUpdatePayload: updatePayload,
      });
    }

    savingRef.current = true;
    setSaving(true);
    try {
      const petId = Array.isArray(id) ? id[0] : id;
      await updateOwnPet(petId, userId, updatePayload);

      Alert.alert('Başarılı', 'Bilgiler güncellendi.', [
        { text: 'Tamam', onPress: () => router.back() },
      ]);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Güncelleme başarısız.';
      if (__DEV__) console.warn('[EditPet] save failed', message);
      Alert.alert('Hata', message);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Evcil hayvanı sil',
      'Bu evcil hayvanı silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            if (!userId || !id) return;
            setSaving(true);
            try {
              await deleteOwnPet(id, userId);
              Alert.alert('Silindi', 'Kayıt kaldırıldı.', [
                { text: 'Tamam', onPress: () => router.replace('/(app)/profile/my-pets') },
              ]);
            } catch (e: unknown) {
              Alert.alert('Hata', e instanceof Error ? e.message : 'Silinemedi.');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={BRAND.primary} />
      </View>
    );
  }

  if (forbidden) {
    return (
      <View style={styles.centered}>
        <Text style={styles.forbiddenTitle}>Erişim reddedildi</Text>
        <Text style={styles.forbiddenSub}>Bu kayıt size ait değil veya bulunamadı.</Text>
        <Pressable style={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>Geri dön</Text>
        </Pressable>
      </View>
    );
  }

  const displayImage = resolveImageUri(imageUrl);
  /** Konum alanı yalnızca güvende → kayıp geçişinde gösterilir. */
  const showLostLocation = isLost && !initialLost;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Pressable style={styles.photoWrap} onPress={handlePhoto} disabled={saving}>
        {displayImage ? (
          <Image source={{ uri: displayImage }} style={styles.photo} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Camera color={BRAND.primary} size={28} />
          </View>
        )}
        <Text style={styles.photoHint}>Fotoğrafı değiştir</Text>
      </Pressable>

      <Text style={styles.qrSectionTitle}>QR künye linki</Text>
      <PetQrLinkActions tokenId={tokenId} petName={name} />
      {tokenId ? (
        <Text style={styles.tokenLine}>QR kimliği (token_id): #{tokenId}</Text>
      ) : null}
      <Text style={styles.idLine}>Veritabanı id: {id} (QR’da kullanılmaz)</Text>

      <Text style={styles.label}>Ad *</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor={BRAND.muted} />

      <Text style={styles.label}>Tür</Text>
      <TextInput style={styles.input} value={species} onChangeText={setSpecies} placeholderTextColor={BRAND.muted} />

      <Text style={styles.label}>Irk</Text>
      <TextInput style={styles.input} value={breed} onChangeText={setBreed} placeholderTextColor={BRAND.muted} />

      <Text style={styles.label}>Şehir</Text>
      <TextInput style={styles.input} value={city} onChangeText={setCity} placeholderTextColor={BRAND.muted} />

      <Text style={styles.label}>Açıklama</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={description}
        onChangeText={setDescription}
        multiline
        placeholderTextColor={BRAND.muted}
      />

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Kayıp ilanı</Text>
        <Switch
          value={isLost}
          onValueChange={setIsLost}
          trackColor={{ false: '#D1D5DB', true: BRAND.primary }}
          thumbColor="#fff"
        />
      </View>

      {showLostLocation ? (
        <View style={styles.lostBox}>
          <Text style={styles.lostTitle}>Son görülme konumu *</Text>
          <Pressable style={styles.locBtn} onPress={handleUseMyLocation}>
            <Text style={styles.locBtnText}>Konumumu kullan</Text>
          </Pressable>
          <TextInput
            style={styles.input}
            value={latInput}
            onChangeText={setLatInput}
            placeholder="Enlem (latitude)"
            keyboardType="decimal-pad"
            placeholderTextColor={BRAND.muted}
          />
          <TextInput
            style={[styles.input, { marginTop: 8 }]}
            value={lngInput}
            onChangeText={setLngInput}
            placeholder="Boylam (longitude)"
            keyboardType="decimal-pad"
            placeholderTextColor={BRAND.muted}
          />
        </View>
      ) : null}

      <Pressable
        style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.9 }, saving && styles.disabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <View style={styles.savingRow}>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.saveBtnText}>Kaydediliyor...</Text>
          </View>
        ) : (
          <Text style={styles.saveBtnText}>Kaydet</Text>
        )}
      </Pressable>

      <Pressable style={styles.deleteBtn} onPress={handleDelete} disabled={saving}>
        <Trash2 color={BRAND.danger} size={18} />
        <Text style={styles.deleteBtnText}>Evcil Hayvanı Sil</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BRAND.background },
  container: { padding: 20, paddingBottom: 48 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BRAND.background, padding: 24 },
  forbiddenTitle: { fontSize: 18, fontWeight: '700', color: BRAND.navy, marginBottom: 8 },
  forbiddenSub: { fontSize: 14, color: BRAND.muted, textAlign: 'center', marginBottom: 20 },
  backLink: { padding: 12 },
  backLinkText: { color: BRAND.primary, fontWeight: '700' },
  photoWrap: { alignItems: 'center', marginBottom: 16 },
  photo: { width: '100%', height: 180, borderRadius: 16 },
  photoPlaceholder: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    backgroundColor: BRAND.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoHint: { marginTop: 8, fontSize: 12, color: BRAND.muted },
  qrSectionTitle: { fontSize: 13, fontWeight: '700', color: BRAND.muted, marginBottom: 4 },
  tokenLine: { fontSize: 13, color: BRAND.primary, fontWeight: '600', marginBottom: 4, marginTop: 8 },
  idLine: { fontSize: 12, color: BRAND.muted, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '700', color: BRAND.muted, marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: BRAND.surface,
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: BRAND.foreground,
  },
  multiline: { minHeight: 88, textAlignVertical: 'top' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingVertical: 8,
  },
  switchLabel: { fontSize: 16, fontWeight: '600', color: BRAND.foreground },
  lostBox: {
    marginTop: 16,
    padding: 14,
    backgroundColor: BRAND.dangerBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  lostTitle: { fontSize: 14, fontWeight: '700', color: BRAND.danger, marginBottom: 10 },
  locBtn: {
    backgroundColor: BRAND.surface,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: BRAND.border,
  },
  locBtnText: { color: BRAND.primary, fontWeight: '700' },
  saveBtn: {
    marginTop: 28,
    backgroundColor: BRAND.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  savingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  deleteBtn: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: BRAND.dangerBg,
  },
  deleteBtnText: { color: BRAND.danger, fontWeight: '700', fontSize: 15 },
  disabled: { opacity: 0.7 },
});
