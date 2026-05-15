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
  type MapPetMarker,
  type PetLike,
} from '../../../lib/map-coords';

type PetRecord = PetLike & {
  name?: string | null;
  status?: string | null;
};

type PetScan = {
  id: string;
  pet_id: number | string;
  latitude: number;
  longitude: number;
  scanned_at: string;
};

type ScanMarker = PetScan;

type LatLng = { latitude: number; longitude: number };

function normalizeScan(raw: Record<string, unknown>): ScanMarker | null {
  const lat = Number(raw.latitude);
  const lng = Number(raw.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (raw.id == null || raw.pet_id == null) return null;

  const scannedAt = raw.scanned_at ?? raw.created_at;
  if (!scannedAt) return null;

  return {
    id: String(raw.id),
    pet_id: raw.pet_id as number | string,
    latitude: lat,
    longitude: lng,
    scanned_at: String(scannedAt),
  };
}

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

/** Soft danger radius — low fill, subtle stroke */
const CIRCLE_FILL = 'rgba(239, 68, 68, 0.08)';
const CIRCLE_STROKE = 'rgba(220, 38, 38, 0.35)';

const DEFAULT_REGION: Region = {
  latitude: ISPARTA_CENTER.latitude,
  longitude: ISPARTA_CENTER.longitude,
  latitudeDelta: 0.35,
  longitudeDelta: 0.35,
};

function fitMapToCoords(
  mapRef: React.RefObject<MapView | null>,
  coordinates: LatLng[],
  edgePadding: { top: number; right: number; bottom: number; left: number },
  animated: boolean
) {
  if (!mapRef.current || coordinates.length === 0) return;

  if (coordinates.length === 1) {
    const { latitude, longitude } = coordinates[0];
    mapRef.current.animateToRegion(
      {
        latitude,
        longitude,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      },
      animated ? 350 : 0
    );
    return;
  }

  mapRef.current.fitToCoordinates(coordinates, { edgePadding, animated });
}

export default function MapScreen() {
  const router = useRouter();
  const { selectPetId } = useLocalSearchParams<{ selectPetId?: string }>();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const hasInitialFit = useRef(false);

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

    const [petsRes, scansRes] = await Promise.all([
      supabase.from('pets').select('*'),
      supabase
        .from('pet_scans')
        .select('id, pet_id, latitude, longitude, scanned_at')
        .order('scanned_at', { ascending: true }),
    ]);

    if (petsRes.error) {
      console.error('pets fetch error:', petsRes.error);
      setFetchError(petsRes.error.message);
    } else if (petsRes.data) {
      setPets(petsRes.data as PetRecord[]);
    }

    if (scansRes.error) {
      console.error('pet_scans fetch error:', scansRes.error);
      setFetchError((prev) => prev ?? scansRes.error!.message);
      setScans([]);
    } else if (scansRes.data) {
      setScans(
        scansRes.data
          .map((row) => normalizeScan(row as Record<string, unknown>))
          .filter((row): row is ScanMarker => row !== null)
      );
    }

    setLoading(false);
    hasInitialFit.current = false;
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

  /** Virtual paw trail: red pin → scan₁ → scan₂ → … (chronological) */
  const pawTrailCoordinates = useMemo<LatLng[]>(() => {
    if (!selectedPet) return [];
    if (selectedPetScans.length === 0) return [];

    return [
      { latitude: selectedPet.latitude, longitude: selectedPet.longitude },
      ...selectedPetScans.map(({ latitude, longitude }) => ({ latitude, longitude })),
    ];
  }, [selectedPet, selectedPetScans]);

  const allVisibleCoordinates = useMemo<LatLng[]>(() => {
    const petCoords = filteredMarkers.map(({ mapLatitude, mapLongitude }) => ({
      latitude: mapLatitude,
      longitude: mapLongitude,
    }));
    const scanCoords = scans.map(({ latitude, longitude }) => ({ latitude, longitude }));
    return [...petCoords, ...scanCoords];
  }, [filteredMarkers, scans]);

  const selectionCoordinates = useMemo<LatLng[]>(() => {
    if (pawTrailCoordinates.length > 0) return pawTrailCoordinates;
    if (!selectedPet) return [];
    return [
      {
        latitude: selectedPet.mapLatitude,
        longitude: selectedPet.mapLongitude,
      },
    ];
  }, [pawTrailCoordinates, selectedPet]);

  const handleMarkerPress = (petId: string | number) => {
    setSelectedPetId(petId);
  };

  useEffect(() => {
    if (loading || selectedPetId != null) return;

    fitMapToCoords(mapRef, allVisibleCoordinates, mapEdgePadding, hasInitialFit.current);
    if (allVisibleCoordinates.length > 0) {
      hasInitialFit.current = true;
    }
  }, [loading, allVisibleCoordinates, mapEdgePadding, selectedPetId]);

  useEffect(() => {
    if (!selectedPet || selectionCoordinates.length === 0) return;
    fitMapToCoords(mapRef, selectionCoordinates, mapEdgePadding, true);
  }, [selectedPet, selectionCoordinates, mapEdgePadding]);

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
        {filteredMarkers.map((pet) => {
          const isSelected = samePetId(selectedPetId, pet.id);
          return (
            <Circle
              key={`circle-${pet.id}`}
              center={{ latitude: pet.latitude, longitude: pet.longitude }}
              radius={SEARCH_RADIUS_METERS}
              fillColor={CIRCLE_FILL}
              strokeColor={CIRCLE_STROKE}
              strokeWidth={1.5}
              zIndex={isSelected ? 2 : 1}
            />
          );
        })}

        {filteredMarkers.map((pet) => {
          const isSelected = samePetId(selectedPetId, pet.id);
          const scanCount = isSelected
            ? selectedPetScans.length
            : scans.filter((s) => samePetId(s.pet_id, pet.id)).length;

          return (
            <Marker
              key={`marker-${pet.id}`}
              coordinate={{ latitude: pet.mapLatitude, longitude: pet.mapLongitude }}
              pinColor="red"
              zIndex={isSelected ? 3 : 2}
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

        {selectedPet && pawTrailCoordinates.length > 1 && (
          <Polyline
            key={`trail-${selectedPet.id}`}
            coordinates={pawTrailCoordinates}
            strokeColor="#16A34A"
            strokeWidth={3}
            lineDashPattern={[12, 8]}
            zIndex={4}
          />
        )}

        {selectedPetScans.map((scan, index) => (
          <Marker
            key={`scan-${scan.id}`}
            coordinate={{ latitude: scan.latitude, longitude: scan.longitude }}
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
        ))}
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
              {petsMissingCoords} hayvanın koordinatı yok. spread_pets_isparta_coordinates.sql
              migrasyonunu çalıştırın.
            </Text>
          </View>
        )}

        {!loading && markers.length === 0 && (
          <View style={styles.hintBanner}>
            <Text style={styles.hintTitle}>Haritada gösterilecek pin yok</Text>
            <Text style={styles.hintBody}>
              pets tablosuna geçerli latitude/longitude ekleyin veya migrasyonu çalıştırın.
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
