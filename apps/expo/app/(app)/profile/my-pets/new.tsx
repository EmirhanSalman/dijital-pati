import { useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Camera } from 'lucide-react-native';
import { useAuth } from '../../../_layout';
import { supabase } from '../../../../lib/supabase';
import { BRAND } from '../../../../lib/brand';
import { generateUniqueAppTokenId } from '../../../../lib/pets-owner';
import { formatPetBreed } from '../../../../lib/pet-form';
import { pickImageUri, uploadImage, buildPetImagePath } from '../../../../lib/storage';

export default function NewPetScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [breed, setBreed] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handlePickPhoto = async () => {
    const uri = await pickImageUri();
    if (uri) setLocalImageUri(uri);
  };

  const handleSave = async () => {
    if (!userId) {
      Alert.alert('Giriş gerekli', 'Oturum açmanız gerekiyor.');
      return;
    }
    const trimmedName = name.trim();
    const trimmedSpecies = species.trim();
    if (!trimmedName) {
      Alert.alert('Eksik bilgi', 'Hayvan adı zorunludur.');
      return;
    }
    if (!trimmedSpecies) {
      Alert.alert('Eksik bilgi', 'Tür (kedi, köpek vb.) zorunludur.');
      return;
    }

    setSaving(true);
    try {
      const tokenId = await generateUniqueAppTokenId();

      const insertPayload: Record<string, unknown> = {
        name: trimmedName,
        breed: formatPetBreed(trimmedSpecies, breed) || trimmedSpecies,
        description: description.trim() || null,
        token_id: tokenId,
        owner_id: userId,
        is_lost: false,
        image_url: '',
        owner_address: '',
      };

      if (city.trim()) {
        insertPayload.city = city.trim();
      }

      const { data: inserted, error } = await supabase
        .from('pets')
        .insert(insertPayload)
        .select('id')
        .single();

      if (error) throw new Error(error.message);

      let imageUrl = '';
      if (localImageUri && inserted?.id != null) {
        imageUrl = await uploadImage(localImageUri, 'pets', buildPetImagePath(userId, inserted.id));
        const { error: imgErr } = await supabase
          .from('pets')
          .update({ image_url: imageUrl })
          .eq('id', inserted.id)
          .eq('owner_id', userId);
        if (imgErr) throw new Error(imgErr.message);
      }

      Alert.alert('Başarılı', `${trimmedName} kaydedildi.`, [
        { text: 'Tamam', onPress: () => router.replace('/(app)/profile/my-pets') },
      ]);
    } catch (e: unknown) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'Kayıt başarısız.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Pressable style={styles.photoWrap} onPress={handlePickPhoto} disabled={saving}>
        {localImageUri ? (
          <Image source={{ uri: localImageUri }} style={styles.photo} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Camera color={BRAND.primary} size={28} />
            <Text style={styles.photoHint}>Fotoğraf ekle (isteğe bağlı)</Text>
          </View>
        )}
      </Pressable>

      <Text style={styles.label}>Ad *</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Örn. Pamuk" placeholderTextColor={BRAND.muted} />

      <Text style={styles.label}>Tür *</Text>
      <TextInput style={styles.input} value={species} onChangeText={setSpecies} placeholder="Kedi, Köpek..." placeholderTextColor={BRAND.muted} />

      <Text style={styles.label}>Irk</Text>
      <TextInput style={styles.input} value={breed} onChangeText={setBreed} placeholder="İsteğe bağlı" placeholderTextColor={BRAND.muted} />

      <Text style={styles.label}>Şehir</Text>
      <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="İsteğe bağlı" placeholderTextColor={BRAND.muted} />

      <Text style={styles.label}>Açıklama</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={description}
        onChangeText={setDescription}
        placeholder="İsteğe bağlı"
        placeholderTextColor={BRAND.muted}
        multiline
        numberOfLines={4}
      />

      <Text style={styles.note}>
        Yeni kayıtlar varsayılan olarak güvende listelenir ve haritada görünmez. Kayıp ilanı düzenleme
        ekranından açılabilir (konum gerekir).
      </Text>

      <Pressable
        style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.9 }, saving && styles.disabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Kaydet</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BRAND.background },
  container: { padding: 20, paddingBottom: 40 },
  photoWrap: { marginBottom: 20, alignItems: 'center' },
  photo: { width: '100%', height: 180, borderRadius: 16 },
  photoPlaceholder: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    backgroundColor: BRAND.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BRAND.border,
    borderStyle: 'dashed',
  },
  photoHint: { marginTop: 8, fontSize: 13, color: BRAND.muted },
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
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  note: { fontSize: 12, color: BRAND.muted, lineHeight: 18, marginTop: 16 },
  saveBtn: {
    marginTop: 24,
    backgroundColor: BRAND.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  disabled: { opacity: 0.7 },
});
