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
import { useRouter } from 'expo-router';
import { ArrowLeft, MapPin, Search } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';

/**
 * Requires `latitude` and `longitude` on `pets` (see add_pets_map_coordinates.sql).
 * Pets without valid coordinates are skipped; the banner explains missing data.
 */
type PetRecord = {
  id: string | number;
  name?: string | null;
  status?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  last_seen_latitude?: number | string | null;
  last_seen_longitude?: number | string | null;
};

type PetMarker = PetRecord & {
  latitude: number;
  longitude: number;
};

type PetScan = {
  id: string;
  pet_id: number | string;
  latitude: number;
  longitude: number;
  scanned_at: string;
};

type ScanMarker = PetScan & {
  latitude: number;
  longitude: number;
};

function normalizeScan(raw: Record<string, unknown>): ScanMarker | null {
  const lat = Number(raw.latitude);
  const lng = Number(raw.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (raw.id == null || raw.pet_id == null || !raw.scanned_at) return null;
  return {
    id: String(raw.id),
    pet_id: raw.pet_id as number | string,
    latitude: lat,
    longitude: lng,
    scanned_at: String(raw.scanned_at),
  };
}

function samePetId(a: string | number | null | undefined, b: string | number | null | undefined) {
  return String(a ?? '') === String(b ?? '');
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

const DEFAULT_REGION: Region = {
  latitude: 41.0082,
  longitude: 28.9784,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

function getPetCoordinates(pet: PetRecord): { latitude: number; longitude: number } | null {
  const lat = pet.latitude ?? pet.last_seen_latitude;
  const lng = pet.longitude ?? pet.last_seen_longitude;
  if (lat == null || lng == null) return null;

  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;

  return { latitude, longitude };
}

export default function MapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  const [pets, setPets] = useState<PetRecord[]>([]);
  const [scans, setScans] = useState<ScanMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPetId, setSelectedPetId] = useState<string | number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMapData = useCallback(async () => {
    setLoading(true);
    const [petsRes, scansRes] = await Promise.all([
      supabase.from('pets').select('*'),
      supabase.from('pet_scans').select('id, pet_id, latitude, longitude, scanned_at').order('scanned_at', { ascending: true }),
    ]);
    if (!petsRes.error && petsRes.data) setPets(petsRes.data as PetRecord[]);
    if (!scansRes.error && scansRes.data) {
      setScans(
        scansRes.data
          .map((row) => normalizeScan(row as Record<string, unknown>))
          .filter((row): row is ScanMarker => row !== null)
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMapData();
  }, [fetchMapData]);

  const markers = useMemo<PetMarker[]>(() => {
    return pets
      .map((pet) => {
        const coords = getPetCoordinates(pet);
        if (!coords) return null;
        return { ...pet, ...coords };
      })
      .filter((pet): pet is PetMarker => pet !== null);
  }, [pets]);

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

  const trailCoordinates = useMemo(() => {
    if (!selectedPet || selectedPetScans.length === 0) return [];
    return [
      { latitude: selectedPet.latitude, longitude: selectedPet.longitude },
      ...selectedPetScans.map(({ latitude, longitude }) => ({ latitude, longitude })),
    ];
  }, [selectedPet, selectedPetScans]);

  const handleMarkerPress = (petId: string | number) => {
    setSelectedPetId(petId);
  };

  useEffect(() => {
    if (!mapRef.current) return;

    const coords = selectedPet
      ? [
          { latitude: selectedPet.latitude, longitude: selectedPet.longitude },
          ...selectedPetScans.map(({ latitude, longitude }) => ({ latitude, longitude })),
        ]
      : filteredMarkers.map(({ latitude, longitude }) => ({ latitude, longitude }));

    if (coords.length === 0) return;

    mapRef.current.fitToCoordinates(coords, {
      edgePadding: { top: insets.top + 120, right: 40, bottom: 40, left: 40 },
      animated: true,
    });
  }, [filteredMarkers, selectedPet, selectedPetScans, insets.top]);

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(app)/home');
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
          const isSelected = selectedPetId === pet.id;
          return (
            <Circle
              key={`circle-${pet.id}`}
              center={{ latitude: pet.latitude, longitude: pet.longitude }}
              radius={SEARCH_RADIUS_METERS}
              fillColor="rgba(255, 0, 0, 0.2)"
              strokeColor="rgba(239, 68, 68, 0.75)"
              strokeWidth={2}
              zIndex={isSelected ? 2 : 1}
            />
          );
        })}
        {filteredMarkers.map((pet) => {
          const isSelected = samePetId(selectedPetId, pet.id);
          return (
            <Marker
              key={`marker-${pet.id}`}
              coordinate={{ latitude: pet.latitude, longitude: pet.longitude }}
              pinColor="red"
              zIndex={isSelected ? 3 : 2}
              onPress={() => handleMarkerPress(pet.id)}
            >
              <Callout onPress={() => handleMarkerPress(pet.id)}>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{pet.name || 'İsimsiz'}</Text>
                  <Text style={styles.calloutSub}>
                    {isSelected
                      ? `${selectedPetScans.length} QR görülme`
                      : 'Dokun → yeşil pin izi'}
                    {' · '}500 m alan
                  </Text>
                </View>
              </Callout>
            </Marker>
          );
        })}

        {selectedPet && trailCoordinates.length > 1 && (
          <Polyline
            key={`trail-${selectedPet.id}`}
            coordinates={trailCoordinates}
            strokeColor="#22C55E"
            strokeWidth={3}
            lineDashPattern={[10, 8]}
            zIndex={4}
          />
        )}

        {selectedPetScans.map((scan, index) => (
          <Marker
            key={`scan-${scan.id}`}
            coordinate={{ latitude: scan.latitude, longitude: scan.longitude }}
            pinColor="green"
            zIndex={5 + index}
          >
            <Callout>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>QR görülme #{index + 1}</Text>
                <Text style={styles.calloutSub}>
                  {new Date(scan.scanned_at).toLocaleString('tr-TR')}
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Top overlay: back + search */}
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
              placeholder="Kayıp hayvan ara..."
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
                : `${filteredMarkers.length} kayıp · ${scans.length} tarama`}
            </Text>
          </View>
          {selectedPetId != null && (
            <View style={[styles.legendCard, styles.legendGreen]}>
              <MapPin color={BRAND.success} size={16} strokeWidth={2.5} />
              <Text style={styles.legendText}>{selectedPetScans.length} yeşil pin</Text>
            </View>
          )}
        </View>

        {!loading && petsMissingCoords > 0 && (
          <View style={styles.hintBanner}>
            <Text style={styles.hintTitle}>Konumsuz ilanlar atlandı</Text>
            <Text style={styles.hintBody}>
              {petsMissingCoords} kayıt için latitude/longitude yok. Supabase’de{' '}
              add_pets_map_coordinates.sql migrasyonunu çalıştırın.
            </Text>
          </View>
        )}

        {!loading && markers.length === 0 && (
          <View style={styles.hintBanner}>
            <Text style={styles.hintTitle}>Haritada gösterilecek pin yok</Text>
            <Text style={styles.hintBody}>
              Kayıp ilanlara son görülme koordinatı ekleyince kırmızı pinler burada görünür.
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
