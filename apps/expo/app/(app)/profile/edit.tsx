import { useCallback, useEffect, useState } from 'react';
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
import { useAuth } from '../../_layout';
import { supabase } from '../../../lib/supabase';
import { BRAND } from '../../../lib/brand';
import { pickImageUri, uploadImage, buildAvatarPath } from '../../../lib/storage';

type ProfileForm = {
  full_name: string;
  username: string;
  avatar_url: string | null;
};

export default function ProfileEditScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [form, setForm] = useState<ProfileForm>({ full_name: '', username: '', avatar_url: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, username, avatar_url')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      Alert.alert('Hata', error.message);
    } else if (data) {
      setForm({
        full_name: data.full_name ?? '',
        username: data.username ?? '',
        avatar_url: data.avatar_url ?? null,
      });
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAvatar = async () => {
    if (!userId) return;
    const uri = await pickImageUri();
    if (!uri) return;
    setUploadingAvatar(true);
    try {
      const publicUrl = await uploadImage(uri, 'avatars', buildAvatarPath(userId));
      setForm((f) => ({ ...f, avatar_url: publicUrl }));
    } catch (e: unknown) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'Fotoğraf yüklenemedi.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!userId) {
      Alert.alert('Giriş gerekli', 'Oturum açmanız gerekiyor.');
      return;
    }
    const fullName = form.full_name.trim();
    if (!fullName) {
      Alert.alert('Eksik bilgi', 'Ad soyad zorunludur.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        id: userId,
        full_name: fullName,
        username: form.username.trim() || null,
        avatar_url: form.avatar_url,
      };

      const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });

      if (error) throw new Error(error.message);

      Alert.alert('Başarılı', 'Profiliniz güncellendi.', [
        { text: 'Tamam', onPress: () => router.back() },
      ]);
    } catch (e: unknown) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'Kayıt başarısız.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={BRAND.primary} />
        <Text style={styles.muted}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.note}>
        Telefon ve şehir bilgisi evcil hayvan kartlarında (iletişim / konum) tutulur. Profilde ad
        soyad ve fotoğraf güncellenir.
      </Text>

      <Pressable style={styles.avatarWrap} onPress={handleAvatar} disabled={uploadingAvatar}>
        <View style={styles.avatarCircle}>
          {form.avatar_url ? (
            <Image source={{ uri: form.avatar_url }} style={styles.avatarImg} />
          ) : (
            <Text style={styles.avatarEmoji}>😊</Text>
          )}
          <View style={styles.avatarBadge}>
            {uploadingAvatar ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Camera color="#fff" size={14} />
            )}
          </View>
        </View>
        <Text style={styles.avatarHint}>Profil fotoğrafı</Text>
      </Pressable>

      <Text style={styles.label}>Ad Soyad *</Text>
      <TextInput
        style={styles.input}
        value={form.full_name}
        onChangeText={(t) => setForm((f) => ({ ...f, full_name: t }))}
        placeholder="Adınız soyadınız"
        placeholderTextColor={BRAND.muted}
      />

      <Text style={styles.label}>Kullanıcı adı</Text>
      <TextInput
        style={styles.input}
        value={form.username}
        onChangeText={(t) => setForm((f) => ({ ...f, username: t }))}
        placeholder="kullanici_adi"
        placeholderTextColor={BRAND.muted}
        autoCapitalize="none"
      />

      <Pressable
        style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.9 }, saving && styles.disabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveBtnText}>Kaydet</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BRAND.background },
  container: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BRAND.background },
  muted: { marginTop: 12, color: BRAND.muted },
  note: { fontSize: 13, color: BRAND.muted, lineHeight: 20, marginBottom: 20 },
  avatarWrap: { alignItems: 'center', marginBottom: 24 },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: BRAND.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: 96, height: 96 },
  avatarEmoji: { fontSize: 44 },
  avatarBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: BRAND.navy,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarHint: { marginTop: 8, fontSize: 12, color: BRAND.muted },
  label: { fontSize: 13, fontWeight: '700', color: BRAND.muted, marginBottom: 6, marginTop: 12 },
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
  saveBtn: {
    marginTop: 28,
    backgroundColor: BRAND.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  disabled: { opacity: 0.7 },
});
