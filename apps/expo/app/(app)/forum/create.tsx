import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../_layout';
import { supabase } from '../../../lib/supabase';
import {
  pickImageUri,
  uploadImage,
  buildForumImagePath,
  slugifyTitle,
} from '../../../lib/storage';

const BRAND = {
  primary: '#6366F1',
  primaryBg: '#EEF2FF',
  navy: '#1A2744',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  foreground: '#090E1A',
  muted: '#64748B',
  border: '#E2E8F0',
};

export default function CreateForumPostScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Genel');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handlePickImage = async () => {
    const uri = await pickImageUri();
    if (uri) setImageUri(uri);
  };

  const handleSubmit = async () => {
    if (!userId) {
      Alert.alert('Giriş gerekli', 'Konu açmak için giriş yapmalısınız.');
      return;
    }
    if (!title.trim() || !content.trim()) {
      Alert.alert('Eksik alan', 'Başlık ve içerik zorunludur.');
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl: string | null = null;
      if (imageUri) {
        imageUrl = await uploadImage(imageUri, 'forum', buildForumImagePath(userId));
      }

      const slug = `${slugifyTitle(title)}-${Date.now()}`;
      const { error } = await supabase.from('forum_posts').insert({
        title: title.trim(),
        content: content.trim(),
        category,
        slug,
        user_id: userId,
        ...(imageUrl ? { image_url: imageUrl } : {}),
      });

      if (error) {
        if (__DEV__) {
          console.warn('[forum/create] insert failed', error);
        }
        Alert.alert(
          'Kayıt hatası',
          'Forum gönderisi oluşturulamadı. Lütfen bağlantınızı kontrol edin.'
        );
        return;
      }

      Alert.alert('Başarılı', 'Konunuz yayınlandı!', [
        { text: 'Tamam', onPress: () => router.replace('/(app)/forum') },
      ]);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Konu oluşturulamadı.';
      Alert.alert('Hata', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Yeni Forum Konusu</Text>

        <Text style={styles.label}>Başlık</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Konu başlığı"
          placeholderTextColor={BRAND.muted}
        />

        <Text style={styles.label}>İçerik</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={content}
          onChangeText={setContent}
          placeholder="Paylaşmak istediğiniz bilgi..."
          placeholderTextColor={BRAND.muted}
          multiline
          textAlignVertical="top"
        />

        <Text style={styles.label}>Fotoğraf (isteğe bağlı)</Text>
        {imageUri ? (
          <View style={styles.previewWrap}>
            <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
            <Pressable style={styles.removePhoto} onPress={() => setImageUri(null)}>
              <Text style={styles.removePhotoText}>Kaldır</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.attachBtn} onPress={handlePickImage}>
            <Text style={styles.attachBtnText}>+ Optimize edilmiş fotoğraf ekle</Text>
          </Pressable>
        )}

        <Pressable
          style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.9 }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Yayınla</Text>
          )}
        </Pressable>

        <Pressable style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelText}>İptal</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: BRAND.background },
  container: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 22, fontWeight: '800', color: BRAND.navy, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: BRAND.muted, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: BRAND.surface,
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: BRAND.foreground,
  },
  textArea: { minHeight: 120 },
  attachBtn: {
    borderWidth: 1,
    borderColor: BRAND.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    backgroundColor: BRAND.primaryBg,
  },
  attachBtnText: { color: BRAND.primary, fontWeight: '600' },
  previewWrap: { borderRadius: 12, overflow: 'hidden', marginBottom: 8 },
  preview: { width: '100%', height: 180 },
  removePhoto: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  removePhotoText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  submitBtn: {
    backgroundColor: BRAND.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', marginTop: 14, padding: 8 },
  cancelText: { color: BRAND.muted, fontWeight: '600' },
});
