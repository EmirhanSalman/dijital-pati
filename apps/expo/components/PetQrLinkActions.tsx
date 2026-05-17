import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { BRAND } from '../lib/brand';
import { buildPetPublicUrl } from '../lib/pet-public-url';
import { copyPetPublicUrl, sharePetPublicUrl } from '../lib/pet-qr-share';

type Props = {
  tokenId: string | number | null | undefined;
  petName?: string | null;
  compact?: boolean;
};

export function PetQrLinkActions({ tokenId, petName, compact }: Props) {
  if (tokenId == null || String(tokenId).trim() === '') {
    return <Text style={styles.missing}>QR kimliği bulunamadı.</Text>;
  }

  const slug = String(tokenId).trim();
  const url = buildPetPublicUrl(slug);

  const onCopy = async () => {
    try {
      await copyPetPublicUrl(slug);
    } catch (e: unknown) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'Kopyalanamadı.');
    }
  };

  const onShare = async () => {
    try {
      await sharePetPublicUrl(slug, petName);
    } catch {
      /* user cancelled share */
    }
  };

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      {!compact ? <Text style={styles.url} numberOfLines={2}>{url}</Text> : null}
      <View style={styles.row}>
        <Pressable style={({ pressed }) => [styles.btn, styles.btnOutline, pressed && styles.pressed]} onPress={onCopy}>
          <Text style={styles.btnOutlineText}>QR Linkini Kopyala</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && styles.pressed]} onPress={onShare}>
          <Text style={styles.btnPrimaryText}>Paylaş</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 8, marginBottom: 4 },
  wrapCompact: { marginTop: 4, marginBottom: 0 },
  url: { fontSize: 12, color: BRAND.muted, marginBottom: 10, lineHeight: 18 },
  row: { flexDirection: 'row', gap: 8 },
  btn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnOutline: {
    borderWidth: 1,
    borderColor: BRAND.border,
    backgroundColor: BRAND.surface,
  },
  btnOutlineText: { fontSize: 13, fontWeight: '700', color: BRAND.primary },
  btnPrimary: { backgroundColor: BRAND.primary },
  btnPrimaryText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  pressed: { opacity: 0.88 },
  missing: { fontSize: 13, color: BRAND.muted, fontStyle: 'italic' },
});
