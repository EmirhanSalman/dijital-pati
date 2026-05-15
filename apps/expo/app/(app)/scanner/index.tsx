import { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ScanLine } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import { parsePetIdFromQr } from '../../../lib/qr';

const BRAND = {
  primary: '#6366F1',
  navy: '#1A2744',
  surface: '#FFFFFF',
  muted: '#64748B',
  success: '#22C55E',
};

async function resolvePetDbId(identifier: string): Promise<number | null> {
  const asNumber = Number(identifier);
  if (Number.isFinite(asNumber)) {
    const { data } = await supabase.from('pets').select('id').eq('id', asNumber).maybeSingle();
    if (data?.id != null) return Number(data.id);
  }

  const { data: byToken } = await supabase
    .from('pets')
    .select('id')
    .eq('token_id', identifier)
    .maybeSingle();
  if (byToken?.id != null) return Number(byToken.id);

  const { data: byId } = await supabase.from('pets').select('id').eq('id', identifier).maybeSingle();
  if (byId?.id != null) return Number(byId.id);

  return null;
}

export default function ScannerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [processing, setProcessing] = useState(false);
  const scanLock = useRef(false);

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(app)/home');
  };

  const handleBarcodeScanned = useCallback(
    async ({ data }: { data: string }) => {
      if (scanLock.current || processing) return;

      const identifier = parsePetIdFromQr(data);
      if (!identifier) {
        Alert.alert('Geçersiz QR', 'Bu kod DijitalPati künyesi değil.');
        return;
      }

      scanLock.current = true;
      setProcessing(true);

      try {
        const petDbId = await resolvePetDbId(identifier);
        if (petDbId == null) {
          Alert.alert('Kayıt bulunamadı', 'QR koduna ait evcil hayvan bulunamadı.');
          return;
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Konum gerekli',
            'Görülme konumunu kaydetmek için konum izni vermeniz gerekiyor.'
          );
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const { latitude, longitude } = position.coords;
        const { error } = await supabase.from('pet_scans').insert({
          pet_id: petDbId,
          latitude,
          longitude,
          scanned_at: new Date().toISOString(),
        });

        if (error) {
          console.error('pet_scans insert error:', error);
          Alert.alert(
            'Kayıt hatası',
            error.message.includes('pet_scans')
              ? 'pet_scans tablosu bulunamadı. create_pet_scans_table.sql migrasyonunu çalıştırın.'
              : 'Konum kaydedilemedi. Lütfen tekrar deneyin.'
          );
          return;
        }

        Alert.alert('Başarılı', 'Görülme konumu haritaya kaydedildi.', [
          {
            text: 'Tamam',
            onPress: () =>
              router.replace({
                pathname: '/lost-pets/[id]',
                params: { id: String(petDbId) },
              }),
          },
        ]);
      } finally {
        setProcessing(false);
        setTimeout(() => {
          scanLock.current = false;
        }, 2500);
      }
    },
    [processing, router]
  );

  if (!permission) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={BRAND.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top, paddingHorizontal: 24 }]}>
        <Text style={styles.permissionTitle}>Kamera izni gerekli</Text>
        <Text style={styles.permissionBody}>
          Evcil hayvan künyesindeki QR kodu okutmak için kamera erişimine izin verin.
        </Text>
        <Pressable style={styles.primaryBtn} onPress={requestPermission}>
          <Text style={styles.primaryBtnText}>İzin Ver</Text>
        </Pressable>
        <Pressable style={styles.secondaryBtn} onPress={handleBack}>
          <Text style={styles.secondaryBtnText}>Geri Dön</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={processing ? undefined : handleBarcodeScanned}
      />

      <View style={[styles.overlay, { paddingTop: insets.top + 8 }]}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.85 }]}
          onPress={handleBack}
        >
          <ArrowLeft color={BRAND.navy} size={22} strokeWidth={2.5} />
        </Pressable>
      </View>

      <View style={styles.frameWrap} pointerEvents="none">
        <View style={styles.scanFrame}>
          <ScanLine color="#FFFFFF" size={28} strokeWidth={2} style={styles.scanIcon} />
        </View>
        <Text style={styles.hint}>DijitalPati künyesini çerçeveye hizalayın</Text>
      </View>

      {processing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.processingText}>Konum kaydediliyor...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  centered: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: { position: 'absolute', top: 0, left: 16, zIndex: 10 },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: BRAND.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 260,
    height: 260,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.9)',
    backgroundColor: 'rgba(26, 39, 68, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanIcon: { opacity: 0.9 },
  hint: {
    marginTop: 20,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 39, 68, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  processingText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BRAND.navy,
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionBody: {
    fontSize: 14,
    color: BRAND.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  primaryBtn: {
    backgroundColor: BRAND.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 12,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryBtn: { padding: 12 },
  secondaryBtnText: { color: BRAND.muted, fontWeight: '600' },
});
