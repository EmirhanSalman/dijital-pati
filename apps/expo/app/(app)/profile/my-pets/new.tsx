import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ExternalLink } from 'lucide-react-native';
import { BRAND } from '../../../../lib/brand';
import { openWebCreatePetRegistration } from '../../../../lib/web-create-pet';

export default function NewPetRedirectScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.emoji}>⛓️</Text>
        <Text style={styles.title}>Blockchain Kaydı Web Üzerinden Yapılır</Text>
        <Text style={styles.description}>
          Yeni evcil hayvan kaydı blockchain üzerinde oluşturulduğu için web sitesine
          yönlendirileceksiniz. Kayıt tamamlandıktan sonra evcil hayvanınız mobil uygulamada
          Evcil Hayvanlarım bölümünde görünecektir.
        </Text>

        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
          onPress={() => void openWebCreatePetRegistration()}
        >
          <ExternalLink color="#fff" size={20} />
          <Text style={styles.primaryBtnText}>Web&apos;de Kayıt Oluştur</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.85 }]}
          onPress={() => router.back()}
        >
          <Text style={styles.secondaryBtnText}>Geri Dön</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BRAND.background },
  container: { padding: 20, paddingBottom: 40 },
  card: {
    backgroundColor: BRAND.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: BRAND.border,
  },
  emoji: { fontSize: 40, textAlign: 'center', marginBottom: 16 },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: BRAND.navy,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: BRAND.muted,
    textAlign: 'center',
    marginBottom: 24,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: BRAND.primary,
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 12,
  },
  primaryBtnPressed: { backgroundColor: '#4F46E5' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  secondaryBtnText: { color: BRAND.primary, fontSize: 15, fontWeight: '600' },
});
