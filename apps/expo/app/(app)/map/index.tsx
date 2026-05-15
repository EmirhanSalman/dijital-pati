import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import MapView, { Marker, Circle, Callout, Polyline, Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, MapPin, Search } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import { navigateScreenBack } from '../../../lib/navigation';
import {
  buildMapPetMarkers,
  samePetId,
  ISPARTA_CENTER,
  filterValidLatLng,
  dedupeConsecutiveCoords,
  isValidLatLng,
  type MapPetMarker,
  type PetLike,
  type LatLng,
} from '../../../lib/map-coords';
import { coordinatesFitKey, logMap } from '../../../lib/map-debug';

type PetRecord = PetLike & {
  name?: string | null;
  status?: string | null;
};

type ScanMarker = {
  id: string;
  pet_id: number | string;
  latitude: number;
  longitude: number;
  scanned_at: string;
};

const BRAND = {
  primary:    '#6366F1',
  primaryBg:  '#EEF2FF',
  navy:       '#1A2744',
  background: '#F8FAFC',
  surface:    '#FFFFFF',
  foreground: '#090E1A',
  muted:      '#64748B',
  border:     '#E2E8F0',
  danger:     '#EF4444',
  success:    '#22C55E',
};

const SEARCH_RADIUS_METERS = 500;

const CIRCLE_FILL = 'rgba(239, 68, 68, 0.06)';
const CIRCLE_STROKE = 'rgba(220, 38, 38, 0.28)';

const DEFAULT_REGION: Region = {
  latitude: ISPARTA_CENTER.latitude,
  longitude: ISPARTA_CENTER.longitude,
  latitudeDelta: 0.35,
  longitudeDelta: 0.35,
};

/** Minimum region span when fitting a single point (avoids extreme zoom). */
const MIN_REGION_DELTA = 0.06;

function normalizeScan(raw: Record<string, unknown>): ScanMarker | null {
  const lat = Number(raw.latitude);
  const lng = Number(raw.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (raw.id == null || raw.pet_id == null) return null;

  const scannedAt = raw.scanned_at ?? raw.created_at;
  if (!scannedAt) return null;

  const coord = { latitude: lat, longitude: lng };
  if (!isValidLatLng(coord)) return null;

  return {
    id: String(raw.id),
    pet_id: raw.pet_id as number | string,
    latitude: lat,
    longitude: lng,
    scanned_at: String(scannedAt),
  };
}

function safeFitMapToCoords(
  mapRef: React.RefObject<MapView | null>,
  coordinates: LatLng[],
  edgePadding: { top: number; right: number; bottom: number; left: number },
  animated: boolean,
  reason: string
) {
  const valid = filterValidLatLng(coordinates);
  if (!mapRef.current || valid.length === 0) {
    logMap(`fit skipped (${reason}): no valid coordinates`, { input: coordinates.length });
    return;
  }

  try {
    if (valid.length === 1) {
      const { latitude, longitude } = valid[0];
      mapRef.current.animateToRegion(
        {
          latitude,
          longitude,
          latitudeDelta: MIN_REGION_DELTA,
          longitudeDelta: MIN_REGION_DELTA,
        },
        animated ? 350 : 0
      );
      logMap(`fit region (${reason})`, { pointCount: 1 });
      return;
    }

    mapRef.current.fitToCoordinates(valid, { edgePadding, animated });
    logMap(`fitToCoordinates (${reason})`, { pointCount: valid.length });
  } catch (err) {
    logMap(`fit error (${reason})`, err);
  }
}

export default function MapScreen() {
  const router = useRouter();
  const { selectPetId } = useLocalSearchParams<{ selectPetId?: string }>();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const lastInitialFitKey = useRef('');

  const [pets, setPets] = useState<PetRecord[]>([]);
  const [scans, setScans] = useState<ScanMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedPetId, setSelectedPetId] = useState<string | number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const mapEdgePadding = useMemo(
    () => ({
      top: insets.top + 128,
      right: 52,
      bottom: Math.max(insets.bottom, 24) + 56,
      left: 52,
    }),
    [insets.top, insets.bottom]
  );

  const fetchMapData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    logMap('fetchMapData: start');

    const [petsRes, scansRes] = await Promise.all([
      supabase.from('pets').select('*'),
      supabase
        .from('pet_scans')
        .select('id, pet_id, latitude, longitude, scanned_at')
        .order('scanned_at', { ascending: true }),
    ]);

    if (petsRes.error) {
      logMap('pets fetch error', petsRes.error);
      setFetchError(petsRes.error.message);
    } else if (petsRes.data) {
      setPets(petsRes.data as PetRecord[]);
      logMap(`pets fetched: ${petsRes.data.length}`);
    }

    if (scansRes.error) {
      logMap('pet_scans fetch error', scansRes.error);
      setFetchError((prev) => prev ?? scansRes.error!.message);
      setScans([]);
    } else if (scansRes.data) {
      const normalized = scansRes.data
        .map((row) => normalizeScan(row as Record<string, unknown>))
        .filter((row): row is ScanMarker => row !== null);
      const skipped = scansRes.data.length - normalized.length;
      setScans(normalized);
      logMap(`pet_scans fetched: ${scansRes.data.length} raw, ${normalized.length} valid`, {
        skippedInvalid: skipped,
      });
    }

    setLoading(false);
    lastInitialFitKey.current = '';
    logMap('fetchMapData: done');
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchMapData();
    }, [fetchMapData])
  );

  useEffect(() => {
    if (selectPetId) {
      setSelectedPetId(selectPetId);
    }
  }, [selectPetId]);

  const markers = useMemo<MapPetMarker<PetRecord>[]>(
    () => buildMapPetMarkers(pets),
    [pets]
  );

  const filteredMarkers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return markers;
    return markers.filter((pet) => (pet.name ?? '').toLowerCase().includes(q));
  }, [markers, searchQuery]);

  const petsMissingCoords = pets.length - markers.length;

  const selectedPet = useMemo(
    () => filteredMarkers.find((pet) => samePetId(pet.id, selectedPetId)) ?? null,
    [filteredMarkers, selectedPetId]
  );

  const selectedPetScans = useMemo(() => {
    if (selectedPetId == null) return [];
    return scans
      .filter((scan) => samePetId(scan.pet_id, selectedPetId))
      .sort((a, b) => new Date(a.scanned_at).getTime() - new Date(b.scanned_at).getTime());
  }, [scans, selectedPetId]);

  /** Paw trail: canonical pet position → scans (chronological), validated & deduped */
  const pawTrailCoordinates = useMemo(() => {
    if (!selectedPet) return [];

    const raw: LatLng[] = [
      { latitude: selectedPet.latitude, longitude: selectedPet.longitude },
      ...selectedPetScans.map((s) => ({ latitude: s.latitude, longitude: s.longitude })),
    ];

    return dedupeConsecutiveCoords(raw);
  }, [selectedPet, selectedPetScans]);

  const showPawTrail = pawTrailCoordinates.length >= 2;

  const allVisibleCoordinates = useMemo<LatLng[]>(() => {
    const petCoords = filteredMarkers.map(({ mapLatitude, mapLongitude }) => ({
      latitude: mapLatitude,
      longitude: mapLongitude,
    }));
    const scanCoords = scans.map(({ latitude, longitude }) => ({ latitude, longitude }));
    return filterValidLatLng([...petCoords, ...scanCoords]);
  }, [filteredMarkers, scans]);

  const initialFitKey = useMemo(
    () => coordinatesFitKey(allVisibleCoordinates),
    [allVisibleCoordinates]
  );

  useEffect(() => {
    logMap('map state', {
      visiblePets: filteredMarkers.length,
      totalPets: pets.length,
      skippedInvalidCoords: petsMissingCoords,
      selectedPetId,
      selectedPetName: selectedPet?.name ?? null,
      selectedCoord: selectedPet
        ? {
            latitude: selectedPet.latitude,
            longitude: selectedPet.longitude,
            source: selectedPet.coordSource,
            usedFallback: selectedPet.coordSource === 'location_fallback',
          }
        : null,
      selectedScanCount: selectedPetScans.length,
      pawTrailPoints: pawTrailCoordinates.length,
    });
  }, [
    filteredMarkers.length,
    pets.length,
    petsMissingCoords,
    selectedPetId,
    selectedPet,
    selectedPetScans.length,
    pawTrailCoordinates.length,
  ]);

  /** Initial load only — do NOT re-fit on marker selection (keeps all red pins visible). */
  useEffect(() => {
    if (loading) return;
    if (!initialFitKey || initialFitKey === lastInitialFitKey.current) return;

    safeFitMapToCoords(
      mapRef,
      allVisibleCoordinates,
      mapEdgePadding,
      lastInitialFitKey.current !== '',
      'initial-load'
    );
    lastInitialFitKey.current = initialFitKey;
  }, [loading, initialFitKey, allVisibleCoordinates, mapEdgePadding]);

  const handleMarkerPress = useCallback(
    (petId: string | number) => {
      try {
        const pet = filteredMarkers.find((p) => samePetId(p.id, petId));
        logMap('marker pressed', {
          petId,
          name: pet?.name,
          canonical: pet
            ? { latitude: pet.latitude, longitude: pet.longitude, source: pet.coordSource }
            : null,
        });
        setSelectedPetId(petId);
      } catch (err) {
        logMap('marker press error', err);
      }
    },
    [filteredMarkers]
  );

  const handleBack = () => {
    navigateScreenBack(router, '/(app)/home');
  };

  return (
    <View style={styles.screen}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={DEFAULT_REGION}
        showsUserLocation
        showsMyLocationButton={Platform.OS === 'android'}
      >
        {/* All red pets — never filtered by selection; MapView children must not be wrapped in View */}
        {filteredMarkers.map((pet) => {
          if (!isValidLatLng({ latitude: pet.latitude, longitude: pet.longitude })) {
            return null;
          }
          if (!isValidLatLng({ latitude: pet.mapLatitude, longitude: pet.mapLongitude })) {
            return null;
          }

          const isSelected = samePetId(selectedPetId, pet.id);
          const scanCount = isSelected
            ? selectedPetScans.length
            : scans.filter((s) => samePetId(s.pet_id, pet.id)).length;

          return (
            <Circle
              key={`circle-${pet.id}`}
              center={{ latitude: pet.latitude, longitude: pet.longitude }}
              radius={SEARCH_RADIUS_METERS}
              fillColor={CIRCLE_FILL}
              strokeColor={CIRCLE_STROKE}
              strokeWidth={1}
              zIndex={isSelected ? 2 : 1}
            />
          );
        })}
        {filteredMarkers.map((pet) => {
          if (!isValidLatLng({ latitude: pet.mapLatitude, longitude: pet.mapLongitude })) {
            return null;
          }

          const isSelected = samePetId(selectedPetId, pet.id);
          const scanCount = isSelected
            ? selectedPetScans.length
            : scans.filter((s) => samePetId(s.pet_id, pet.id)).length;

          return (
            <Marker
              key={`marker-${pet.id}`}
              coordinate={{ latitude: pet.mapLatitude, longitude: pet.mapLongitude }}
              pinColor="red"
              zIndex={isSelected ? 4 : 3}
              onPress={() => handleMarkerPress(pet.id)}
            >
              <Callout onPress={() => handleMarkerPress(pet.id)}>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{pet.name || 'İsimsiz'}</Text>
                  <Text style={styles.calloutSub}>
                    {pet.status ? `${pet.status} · ` : ''}
                    {isSelected
                      ? `${scanCount} QR izi — pati rotası`
                      : scanCount > 0
                        ? `${scanCount} tarama · dokun`
                        : 'Dokun → QR izi'}
                  </Text>
                </View>
              </Callout>
            </Marker>
          );
        })}

        {showPawTrail && selectedPet ? (
          <Polyline
            key={`trail-${selectedPet.id}-${pawTrailCoordinates.length}`}
            coordinates={pawTrailCoordinates}
            strokeColor="#16A34A"
            strokeWidth={3}
            lineDashPattern={[12, 8]}
            zIndex={5}
          />
        ) : null}

        {selectedPetScans.map((scan, index) => {
          const coord = { latitude: scan.latitude, longitude: scan.longitude };
          if (!isValidLatLng(coord)) return null;

          return (
            <Marker
              key={`scan-${scan.id}`}
              coordinate={coord}
              pinColor="green"
              zIndex={10 + index}
            >
              <Callout>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>🐾 Görülme #{index + 1}</Text>
                  <Text style={styles.calloutSub}>
                    {new Date(scan.scanned_at).toLocaleString('tr-TR')}
                  </Text>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      <View style={[styles.overlay, { paddingTop: insets.top + 8 }]}>
        <View style={styles.topRow}>
          <Pressable
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            onPress={handleBack}
            hitSlop={8}
          >
            <ArrowLeft color={BRAND.navy} size={22} strokeWidth={2.5} />
          </Pressable>

          <View style={styles.searchBar}>
            <Search color={BRAND.muted} size={18} strokeWidth={2} />
            <TextInput
              style={styles.searchInput}
              placeholder="Hayvan ara..."
              placeholderTextColor={BRAND.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
          </View>
        </View>

        <View style={styles.legendRow}>
          <View style={styles.legendCard}>
            <MapPin color={BRAND.danger} size={16} strokeWidth={2.5} />
            <Text style={styles.legendText}>
              {loading
                ? 'Yükleniyor...'
                : `${filteredMarkers.length}/${pets.length} hayvan · ${scans.length} iz`}
            </Text>
          </View>
          {selectedPetId != null && (
            <View style={[styles.legendCard, styles.legendGreen]}>
              <MapPin color={BRAND.success} size={16} strokeWidth={2.5} />
              <Text style={styles.legendText}>{selectedPetScans.length} yeşil pin</Text>
            </View>
          )}
        </View>

        {fetchError ? (
          <View style={styles.hintBanner}>
            <Text style={styles.hintTitle}>Veri yüklenemedi</Text>
            <Text style={styles.hintBody}>{fetchError}</Text>
          </View>
        ) : null}

        {!loading && petsMissingCoords > 0 && (
          <View style={styles.hintBanner}>
            <Text style={styles.hintTitle}>Konumsuz kayıtlar atlandı</Text>
            <Text style={styles.hintBody}>
              {petsMissingCoords} hayvan için geçerli latitude/longitude veya location_lat/lng yok.
            </Text>
          </View>
        )}

        {!loading && markers.length === 0 && (
          <View style={styles.hintBanner}>
            <Text style={styles.hintTitle}>Haritada gösterilecek pin yok</Text>
            <Text style={styles.hintBody}>
              pets tablosuna geçerli koordinat ekleyin veya migrasyonu çalıştırın.
            </Text>
          </View>
        )}
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={BRAND.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BRAND.background },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: BRAND.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BRAND.border,
    shadowColor: BRAND.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  pressed: { opacity: 0.85 },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: BRAND.surface,
    borderWidth: 1,
    borderColor: BRAND.border,
    shadowColor: BRAND.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: BRAND.foreground,
    paddingVertical: 0,
  },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  legendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: BRAND.navy,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  legendGreen: { backgroundColor: '#166534' },
  legendText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  hintBanner: {
    backgroundColor: BRAND.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: BRAND.border,
    borderLeftWidth: 4,
    borderLeftColor: BRAND.primary,
  },
  hintTitle: { fontSize: 14, fontWeight: '700', color: BRAND.navy, marginBottom: 4 },
  hintBody: { fontSize: 12, color: BRAND.muted, lineHeight: 18 },
  callout: { minWidth: 140, padding: 4 },
  calloutTitle: { fontSize: 15, fontWeight: '700', color: BRAND.foreground, marginBottom: 4 },
  calloutSub: { fontSize: 12, color: BRAND.muted },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248, 250, 252, 0.35)',
  },
});
