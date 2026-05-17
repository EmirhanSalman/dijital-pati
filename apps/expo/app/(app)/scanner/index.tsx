import { useCallback, useEffect, useRef, useState } from 'react';
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
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ScanLine } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import { parseQrPayload } from '../../../lib/qr';
import { resolvePetByQrIdentifier } from '../../../lib/pet-qr-resolve';
import { runQrRegressionFixtures } from '../../../lib/pet-qr-resolve.logic';
import {
  checkMemoryCooldown,
  checkRecentPetScan,
} from '../../../lib/scanner-dedup';
import { logScan, logScannerLine } from '../../../lib/map-debug';

const BRAND = {
  primary: '#6366F1',
  navy: '#1A2744',
  surface: '#FFFFFF',
  muted: '#64748B',
  success: '#22C55E',
  successBg: '#F0FDF4',
};

export default function ScannerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [processing, setProcessing] = useState(false);
  const [scanCompleted, setScanCompleted] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isMountedRef = useRef(true);
  const isFocusedRef = useRef(false);
  const isProcessingScanRef = useRef(false);
  const scanCompletedRef = useRef(false);
  const lastScannedValueRef = useRef<string | null>(null);
  const lastScanTimeRef = useRef<number | null>(null);
  const unlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearUnlockTimer = useCallback(() => {
    if (unlockTimerRef.current) {
      clearTimeout(unlockTimerRef.current);
      unlockTimerRef.current = null;
    }
  }, []);

  const resetScanSession = useCallback(
    (reason: string) => {
      clearUnlockTimer();
      isProcessingScanRef.current = false;
      scanCompletedRef.current = false;
      if (isMountedRef.current) {
        setProcessing(false);
        setScanCompleted(false);
      }
      logScannerLine(`scan session reset (${reason})`);
    },
    [clearUnlockTimer]
  );

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearUnlockTimer();
      isFocusedRef.current = false;
      isProcessingScanRef.current = false;
      logScannerLine('scanner unmounted — camera released');
    };
  }, [clearUnlockTimer]);

  useFocusEffect(
    useCallback(() => {
      isFocusedRef.current = true;
      if (isMountedRef.current) setIsFocused(true);
      logScannerLine('scanner focused — camera may activate');

      resetScanSession('screen focused');

      return () => {
        isFocusedRef.current = false;
        isProcessingScanRef.current = true;
        if (isMountedRef.current) {
          setIsFocused(false);
          setProcessing(false);
        }
        clearUnlockTimer();
        logScannerLine('scanner unfocused — Kamera kapatıldı, tarama devre dışı');
      };
    }, [resetScanSession, clearUnlockTimer])
  );

  useEffect(() => {
    if (!__DEV__) return;
    const { ok, failures } = runQrRegressionFixtures();
    if (ok) {
      logScannerLine('QR regression fixtures: OK (Rıfkı /pet/6 → id=1 token_id)');
    } else {
      logScan('QR regression fixtures FAILED', failures);
    }
  }, []);

  const handleBack = () => {
    isFocusedRef.current = false;
    if (router.canGoBack()) router.back();
    else router.replace('/(app)/home');
  };

  const handleScanAgain = () => {
    resetScanSession('Tekrar okut');
  };

  const safeSetProcessing = useCallback((value: boolean) => {
    if (isMountedRef.current) setProcessing(value);
  }, []);

  const finishWithError = useCallback(() => {
    isProcessingScanRef.current = false;
    lastScannedValueRef.current = null;
    lastScanTimeRef.current = null;
    safeSetProcessing(false);
    unlockTimerRef.current = setTimeout(() => {
      if (!isFocusedRef.current || scanCompletedRef.current) return;
      isProcessingScanRef.current = false;
    }, 800);
  }, [safeSetProcessing]);

  const handleBarcodeScanned = useCallback(
    async ({ data }: { data: string }) => {
      if (!isFocusedRef.current) {
        logScannerLine('scan ignored: screen not focused');
        return;
      }

      if (scanCompletedRef.current) {
        logScannerLine('scan ignored: scan already completed');
        return;
      }

      if (isProcessingScanRef.current) {
        logScannerLine('scan ignored: already processing');
        return;
      }

      const parsed = parseQrPayload(data);
      const identifier = parsed.normalized;

      if (!identifier) {
        return;
      }

      const memoryCheck = checkMemoryCooldown(
        identifier,
        lastScannedValueRef.current,
        lastScanTimeRef.current
      );
      if (memoryCheck === 'cooldown') {
        logScannerLine('scan ignored: same QR cooldown (in-memory)');
        return;
      }

      isProcessingScanRef.current = true;
      lastScannedValueRef.current = identifier;
      lastScanTimeRef.current = Date.now();
      safeSetProcessing(true);
      clearUnlockTimer();

      logScannerLine(`QR raw data: ${parsed.raw}`);
      if (parsed.urlPath != null) {
        logScannerLine(`parsed URL path: /pet/${parsed.urlPath}`);
      }
      logScannerLine(`parsed identifier: ${parsed.identifier ?? '(invalid)'}`);
      logScannerLine(`normalized identifier: ${identifier}`);

      try {
        if (!isFocusedRef.current || !isMountedRef.current) {
          logScannerLine('scan aborted: lost focus during start');
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          logScan('insert blocked: no auth session');
          Alert.alert('Giriş gerekli', 'QR taraması kaydetmek için giriş yapmalısınız.');
          finishWithError();
          return;
        }

        const resolved = await resolvePetByQrIdentifier(identifier);
        if (resolved == null) {
          Alert.alert('Kayıt bulunamadı', 'QR koduna ait evcil hayvan bulunamadı.');
          finishWithError();
          return;
        }

        if (!isFocusedRef.current || !isMountedRef.current) {
          logScannerLine('scan aborted: lost focus after resolve');
          return;
        }

        const petDbId = resolved.id;

        if (
          __DEV__ &&
          resolved.method === 'legacy_id' &&
          String(petDbId) === identifier
        ) {
          logScannerLine(
            '⚠️ WRONG RESOLVE? legacy_id and pets.id equals QR slug — expected token_id for /pet/{token_id} URLs'
          );
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          logScan('location permission denied', status);
          Alert.alert(
            'Konum gerekli',
            'Görülme konumunu kaydetmek için konum izni vermeniz gerekiyor.'
          );
          finishWithError();
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const { latitude, longitude } = position.coords;

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          logScan('invalid GPS coords', { latitude, longitude });
          Alert.alert('Konum hatası', 'GPS koordinatları alınamadı. Lütfen tekrar deneyin.');
          finishWithError();
          return;
        }

        if (!isFocusedRef.current || !isMountedRef.current) {
          logScannerLine('scan aborted: lost focus before insert');
          return;
        }

        const dbDup = await checkRecentPetScan(petDbId, latitude, longitude);
        if (dbDup === 'duplicate') {
          logScannerLine('duplicate scan skipped (recent pet_scans row)');
          Alert.alert('Bilgi', 'Konum zaten kaydedildi.');
          scanCompletedRef.current = true;
          if (isMountedRef.current) setScanCompleted(true);
          safeSetProcessing(false);
          isProcessingScanRef.current = true;
          return;
        }

        const scannedAt = new Date().toISOString();
        logScannerLine(`inserting pet_scan for pet_id: ${petDbId}`);
        logScannerLine(`pet name: ${resolved.name ?? '(null)'}`);
        logScannerLine(`token_id: ${resolved.token_id ?? '(null)'}`);

        const { data: inserted, error } = await supabase
          .from('pet_scans')
          .insert({
            pet_id: petDbId,
            latitude,
            longitude,
            scanned_at: scannedAt,
          })
          .select('id, pet_id, latitude, longitude, scanned_at')
          .single();

        if (error) {
          logScan('pet_scans insert error', error);
          const rlsHint =
            error.code === '42501' || error.message?.toLowerCase().includes('policy');
          if (__DEV__) {
            console.warn('[scanner] pet_scans insert failed', {
              code: error.code,
              message: error.message,
              rlsHint,
            });
          }
          Alert.alert(
            'Kayıt hatası',
            rlsHint
              ? 'QR kaydı oluşturulamadı. Giriş yaptığınızdan emin olun ve tekrar deneyin.'
              : 'QR kaydı oluşturulamadı. Lütfen daha sonra tekrar deneyin.'
          );
          finishWithError();
          return;
        }

        logScannerLine('scan inserted successfully');
        logScan('pet_scans insert success', inserted);

        scanCompletedRef.current = true;
        isProcessingScanRef.current = true;
        if (isMountedRef.current) {
          setScanCompleted(true);
          setProcessing(false);
        }

        Alert.alert('Başarılı', 'Görülme konumu kaydedildi. Haritada yeşil pin olarak görünecek.', [
          {
            text: 'Haritada gör',
            onPress: () => {
              isFocusedRef.current = false;
              router.push({
                pathname: '/(app)/map',
                params: { selectPetId: String(petDbId) },
              });
            },
          },
          {
            text: 'Detay',
            onPress: () => {
              isFocusedRef.current = false;
              router.push({
                pathname: '/lost-pets/[id]',
                params: { id: String(petDbId), from: 'scanner' },
              });
            },
          },
          { text: 'Tamam', style: 'cancel' },
        ]);
      } catch (err) {
        logScan('unexpected scan error', err);
        Alert.alert('Hata', 'Tarama sırasında beklenmeyen bir hata oluştu.');
        finishWithError();
      }
    },
    [router, safeSetProcessing, finishWithError, clearUnlockTimer]
  );

  const cameraActive =
    isFocused && permission?.granted === true && !scanCompleted && !processing;

  const onBarcodeHandler = cameraActive ? handleBarcodeScanned : undefined;

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

  if (scanCompleted) {
    return (
      <View style={[styles.centered, styles.successScreen, { paddingTop: insets.top }]}>
        <Text style={styles.successEmoji}>✅</Text>
        <Text style={styles.successTitle}>Konum kaydedildi</Text>
        <Text style={styles.successBody}>Kamera kapatıldı. Haritada yeşil pin görünecek.</Text>
        <Pressable style={styles.primaryBtn} onPress={handleScanAgain}>
          <Text style={styles.primaryBtnText}>Tekrar okut</Text>
        </Pressable>
        <Pressable style={styles.secondaryBtn} onPress={handleBack}>
          <Text style={styles.secondaryBtnText}>Geri Dön</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {cameraActive ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={onBarcodeHandler}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.cameraPlaceholder]}>
          {!isFocused ? (
            <Text style={styles.placeholderText}>Kamera kapatıldı.</Text>
          ) : null}
        </View>
      )}

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
        <Text style={styles.hint}>
          {cameraActive ? 'DijitalPati künyesini çerçeveye hizalayın' : 'Kamera hazırlanıyor...'}
        </Text>
      </View>

      {processing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.processingText}>QR kod işleniyor...</Text>
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
  successScreen: { paddingHorizontal: 28 },
  successEmoji: { fontSize: 56, marginBottom: 16 },
  successTitle: { fontSize: 22, fontWeight: '800', color: BRAND.navy, marginBottom: 8 },
  successBody: {
    fontSize: 15,
    color: BRAND.muted,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  cameraPlaceholder: {
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: { color: '#94a3b8', fontSize: 15 },
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
    zIndex: 20,
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
    minWidth: 200,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryBtn: { padding: 12 },
  secondaryBtnText: { color: BRAND.muted, fontWeight: '600' },
});
