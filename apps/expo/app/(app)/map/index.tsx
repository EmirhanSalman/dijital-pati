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
import { ArrowLeft, MapPin, RefreshCw, Search } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import { navigateScreenBack } from '../../../lib/navigation';
import {
  buildMapPetMarkers,
  buildPawTrailCoordinates,
  filterScansForPetId,
  findMapPetById,
  getPetMapCoordinate,
  isLostPet,
  isSelectionValidOnMap,
  samePetId,
  ISPARTA_CENTER,
  filterValidLatLng,
  isValidLatLng,
  type MapPetMarker,
  type PetLike,
  type LatLng,
} from '../../../lib/map-coords';
import { coordinatesFitKey, logMap } from '../../../lib/map-debug';

/** Map overlay layers — custom callouts stay off (native markers are stable). */
const SHOW_CIRCLES = true;
const SHOW_SCAN_MARKERS = true;
const SHOW_POLYLINE = true;
const SHOW_CUSTOM_MARKERS = false;

type PetRecord = PetLike & {
  name?: string | null;
  is_lost?: boolean | null;
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

const CIRCLE_FILL = 'rgba(239, 68, 68, 0.08)';
const CIRCLE_STROKE = 'rgba(220, 38, 38, 0.35)';

const DEFAULT_REGION: Region = {
  latitude: ISPARTA_CENTER.latitude,
  longitude: ISPARTA_CENTER.longitude,
  latitudeDelta: 0.35,
  longitudeDelta: 0.35,
};

const MIN_REGION_DELTA = 0.06;

/** Approximate floating header height (controls row + legend + gaps). */
const CONTROLS_ROW_HEIGHT = 44;
const LEGEND_ROW_HEIGHT = 36;
const OVERLAY_VERTICAL_GAP = 10;

/** Fixed z-index — do not change on selection (native maps can drop pins when zIndex changes). */
const Z_PET_MARKER = 3;
const Z_PET_CIRCLE = 1;
const Z_SCAN_MARKER = 8;
const Z_POLYLINE = 5;

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
  const didCompleteInitialFit = useRef(false);
  const selectedPetIdRef = useRef<string | number | null>(null);

  const [pets, setPets] = useState<PetRecord[]>([]);
  const [scans, setScans] = useState<ScanMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [selectedPetId, setSelectedPetId] = useState<string | number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const hasMapDataRef = useRef(false);

  const topOverlayHeight = useMemo(() => {
    const refreshLine = refreshing ? 18 : 0;
    return (
      insets.top +
      8 +
      CONTROLS_ROW_HEIGHT +
      OVERLAY_VERTICAL_GAP +
      LEGEND_ROW_HEIGHT +
      OVERLAY_VERTICAL_GAP +
      refreshLine +
      12
    );
  }, [insets.top, refreshing]);

  /** Keeps marker centers out from under the floating top controls. */
  const mapPadding = useMemo(
    () => ({
      top: topOverlayHeight,
      right: 16,
      bottom: Math.max(insets.bottom, 24) + 20,
      left: 16,
    }),
    [topOverlayHeight, insets.bottom]
  );

  const mapEdgePadding = useMemo(
    () => ({
      top: topOverlayHeight + 32,
      right: 52,
      bottom: Math.max(insets.bottom, 24) + 56,
      left: 52,
    }),
    [topOverlayHeight, insets.bottom]
  );

  selectedPetIdRef.current = selectedPetId;

  const fetchMapData = useCallback(async (options?: { manual?: boolean }) => {
    const manual = options?.manual === true;
    const selectedBeforeFetch = selectedPetIdRef.current;

    if (manual) {
      setRefreshing(true);
      setRefreshError(null);
    } else if (!hasMapDataRef.current) {
      setLoading(true);
      setFetchError(null);
    }

    logMap('fetchMapData: start', {
      manual,
      selectedPetIdBeforeRefetch: selectedBeforeFetch,
    });

    const [petsRes, scansRes] = await Promise.all([
      supabase.from('pets').select('*'),
      supabase
        .from('pet_scans')
        .select('id, pet_id, latitude, longitude, scanned_at')
        .order('scanned_at', { ascending: true }),
    ]);

    const petsOk = !petsRes.error && petsRes.data != null;
    const scansOk = !scansRes.error && scansRes.data != null;

    let nextPets: PetRecord[] | null = null;
    let nextScans: ScanMarker[] | null = null;

    if (petsRes.error) {
      logMap('pets fetch error', petsRes.error);
      if (manual) {
        setRefreshError('Harita yenilenemedi.');
      } else if (!hasMapDataRef.current) {
        setFetchError(petsRes.error.message);
      }
    } else if (petsRes.data) {
      nextPets = petsRes.data as PetRecord[];
      logMap(`pets fetched: ${nextPets.length}`);
    }

    if (scansRes.error) {
      logMap('pet_scans fetch error', scansRes.error);
      if (manual) {
        setRefreshError((prev) => prev ?? 'Veriler güncellenirken bir hata oluştu.');
      } else if (!hasMapDataRef.current) {
        setFetchError((prev) => prev ?? scansRes.error!.message);
      }
    } else if (scansRes.data) {
      const normalized = scansRes.data
        .map((row) => normalizeScan(row as Record<string, unknown>))
        .filter((row): row is ScanMarker => row !== null);
      nextScans = normalized;
      logMap(`pet_scans fetched: ${scansRes.data.length} raw, ${normalized.length} valid`, {
        skippedInvalid: scansRes.data.length - normalized.length,
      });
    }

    const canCommitPets = petsOk && nextPets != null;
    const canCommitScans = scansOk && nextScans != null;

    if (manual) {
      if (canCommitPets) setPets(nextPets);
      if (canCommitScans) setScans(nextScans);
      if (canCommitPets || canCommitScans) hasMapDataRef.current = true;
      if (canCommitPets && canCommitScans) {
        setRefreshError(null);
        logMap('manual refresh: success');
      }
    } else {
      if (canCommitPets) {
        setPets(nextPets);
        hasMapDataRef.current = true;
      }
      if (canCommitScans) {
        setScans(nextScans);
        hasMapDataRef.current = true;
      } else if (scansRes.error && !hasMapDataRef.current) {
        setScans([]);
      }
    }

    setLoading(false);
    setRefreshing(false);

    if (canCommitPets && nextPets) {
      const mapPetsAfterFetch = buildMapPetMarkers(nextPets.filter(isLostPet));
      const lostCount = nextPets.filter(isLostPet).length;
      const selectionStillValid = isSelectionValidOnMap(
        mapPetsAfterFetch,
        selectedBeforeFetch
      );

      logMap('fetchMapData: done', {
        manual,
        totalPets: nextPets.length,
        lostPets: lostCount,
        mapPets: mapPetsAfterFetch.length,
        selectedPetIdBeforeRefetch: selectedBeforeFetch,
        selectionStillValid,
      });

      if (selectedBeforeFetch != null && !selectionStillValid) {
        setSelectedPetId(null);
        logMap('cleared selectedPetId after fetch (not lost or no valid coordinate)', {
          selectedPetId: selectedBeforeFetch,
        });
      }
    } else {
      logMap('fetchMapData: done (pets not committed)', { manual, petsOk, scansOk });
    }
  }, []);

  const handleRefresh = useCallback(() => {
    if (refreshing || loading) return;
    void fetchMapData({ manual: true });
  }, [fetchMapData, refreshing, loading]);

  useFocusEffect(
    useCallback(() => {
      void fetchMapData();
    }, [fetchMapData])
  );

  useEffect(() => {
    if (!selectPetId) return;
    setSelectedPetId(selectPetId);
    void fetchMapData();
  }, [selectPetId, fetchMapData]);

  /** Raw rows from Supabase. */
  const allPets = pets;

  /** `is_lost === true` only. */
  const lostPets = useMemo(() => allPets.filter(isLostPet), [allPets]);

  /** Lost pets with valid map coordinates (all pins, ignoring search). */
  const mapPets = useMemo<MapPetMarker<PetRecord>[]>(
    () => buildMapPetMarkers(lostPets),
    [lostPets]
  );

  const mapPetIds = useMemo(
    () => new Set(mapPets.map((pet) => String(pet.id))),
    [mapPets]
  );

  useEffect(() => {
    if (!__DEV__ || lostPets.length === 0) return;
    const skipped = lostPets
      .filter((pet) => !getPetMapCoordinate(pet))
      .map((pet) => ({ petId: String(pet.id), name: pet.name, reason: 'invalid_coordinates' }));
    if (skipped.length > 0) {
      logMap('lost pets skipped (invalid coordinates)', { count: skipped.length, skipped });
    }
  }, [lostPets]);

  /** Search-filtered subset of mapPets (display only — does not affect selection validity). */
  const visiblePets = useMemo(() => {
    const withValidDisplay = mapPets.filter((pet) =>
      isValidLatLng({ latitude: pet.mapLatitude, longitude: pet.mapLongitude })
    );
    const q = searchQuery.trim().toLowerCase();
    if (!q) return withValidDisplay;
    return withValidDisplay.filter((pet) =>
      (pet.name ?? '').toLowerCase().includes(q)
    );
  }, [mapPets, searchQuery]);

  const scansForMapLostPets = useMemo(
    () => scans.filter((scan) => mapPetIds.has(String(scan.pet_id))),
    [scans, mapPetIds]
  );

  const petsMissingCoords = lostPets.length - mapPets.length;

  const visibleCirclePets = useMemo(
    () =>
      visiblePets.filter((pet) =>
        isValidLatLng({ latitude: pet.latitude, longitude: pet.longitude })
      ),
    [visiblePets]
  );

  /** Selected pet from full mapPets — not from search-filtered visiblePets. */
  const selectedPet = useMemo(
    () => findMapPetById(mapPets, selectedPetId),
    [mapPets, selectedPetId]
  );

  const isSelectedPetVisible = useMemo(() => {
    if (!selectedPetId || !selectedPet) return false;
    return visiblePets.some((pet) => samePetId(pet.id, selectedPetId));
  }, [visiblePets, selectedPetId, selectedPet]);

  const selectedScans = useMemo(() => {
    if (!selectedPet) return [];
    return filterScansForPetId(scans, selectedPet.id);
  }, [scans, selectedPet]);

  /** Green pins / trail only when selected pet is on map and currently visible (not hidden by search). */
  const showSelectionOverlays = isSelectedPetVisible && selectedPet != null;

  const selectedPetScanCoords = useMemo(
    () =>
      selectedScans.map((s) => ({ latitude: s.latitude, longitude: s.longitude })),
    [selectedScans]
  );

  const pawTrailCoordinates = useMemo(
    () =>
      showSelectionOverlays
        ? buildPawTrailCoordinates(selectedPet, selectedPetScanCoords)
        : [],
    [showSelectionOverlays, selectedPet, selectedPetScanCoords]
  );

  const polylineCoords = useMemo(
    () => filterValidLatLng(pawTrailCoordinates),
    [pawTrailCoordinates]
  );

  const willRenderPolyline =
    SHOW_POLYLINE &&
    showSelectionOverlays &&
    selectedScans.length > 0 &&
    polylineCoords.length >= 2;

  const visibleSelectedScans = useMemo(() => {
    if (!SHOW_SCAN_MARKERS || !showSelectionOverlays) return [];
    return selectedScans;
  }, [selectedScans, showSelectionOverlays]);

  /** Initial fit: all map pets + their scans (not search-filtered). */
  const initialFitCoordinates = useMemo<LatLng[]>(() => {
    const petCoords = mapPets.map(({ mapLatitude, mapLongitude }) => ({
      latitude: mapLatitude,
      longitude: mapLongitude,
    }));
    const scanCoords = scansForMapLostPets.map(({ latitude, longitude }) => ({
      latitude,
      longitude,
    }));
    return filterValidLatLng([...petCoords, ...scanCoords]);
  }, [mapPets, scansForMapLostPets]);

  const initialFitKey = useMemo(
    () => coordinatesFitKey(initialFitCoordinates),
    [initialFitCoordinates]
  );

  const searchActive = searchQuery.trim().length > 0;

  useEffect(() => {
    if (!__DEV__) return;
    logMap('map state', {
      allPets: allPets.length,
      lostPets: lostPets.length,
      mapPets: mapPets.length,
      visiblePets: visiblePets.length,
      selectedPetId,
      isSelectedPetVisible,
      selectedScanCount: selectedScans.length,
      willRenderPolyline,
    });
  }, [
    allPets.length,
    lostPets.length,
    mapPets.length,
    visiblePets.length,
    selectedPetId,
    isSelectedPetVisible,
    selectedScans.length,
    willRenderPolyline,
  ]);

  useEffect(() => {
    if (loading) return;
    if (didCompleteInitialFit.current) return;

    if (initialFitCoordinates.length === 0) {
      const emptyKey = 'no-lost-pets';
      if (lastInitialFitKey.current === emptyKey) return;
      try {
        mapRef.current?.animateToRegion(DEFAULT_REGION, 0);
        logMap('fit default region (no lost pets with coordinates)');
      } catch (err) {
        logMap('fit default region error', err);
      }
      lastInitialFitKey.current = emptyKey;
      didCompleteInitialFit.current = true;
      return;
    }

    if (!initialFitKey || initialFitKey === lastInitialFitKey.current) return;

    safeFitMapToCoords(
      mapRef,
      initialFitCoordinates,
      mapEdgePadding,
      false,
      'initial-load'
    );
    lastInitialFitKey.current = initialFitKey;
    didCompleteInitialFit.current = true;
  }, [loading, initialFitKey, initialFitCoordinates, mapEdgePadding]);

  const handleMarkerPress = useCallback(
    (petId: string | number) => {
      try {
        const pet = visiblePets.find((p) => samePetId(p.id, petId));
        const coord = pet ? getPetMapCoordinate(pet) : null;
        const scansForPet = pet ? filterScansForPetId(scans, pet.id) : [];
        const trail =
          pet && scansForPet.length > 0
            ? buildPawTrailCoordinates(
                { latitude: pet.latitude, longitude: pet.longitude },
                scansForPet.map((s) => ({ latitude: s.latitude, longitude: s.longitude }))
              )
            : [];
        const trailValid = filterValidLatLng(trail);
        const willLine =
          SHOW_POLYLINE && scansForPet.length > 0 && trailValid.length >= 2;

        logMap('marker pressed', {
          pressedPetId: petId,
          pressedPetIdNormalized: String(petId),
          pressedPetName: pet?.name ?? null,
          isLostPet: pet ? isLostPet(pet) : false,
          coordinate: coord,
          hasValidCoordinate: coord != null,
          selectedScanCount: scansForPet.length,
          validScanCount: scansForPet.length,
          willRenderPolyline: willLine,
          polylinePointCount: willLine ? trailValid.length : 0,
        });

        if (!pet || !coord) {
          logMap('marker press ignored: pet not on map or invalid coordinate', { petId });
          return;
        }

        setSelectedPetId(pet.id);
      } catch (err) {
        logMap('marker press error', err);
      }
    },
    [visiblePets, scans]
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
        mapPadding={mapPadding}
        showsUserLocation
        showsMyLocationButton={Platform.OS === 'android'}
      >
        {SHOW_CIRCLES &&
          visibleCirclePets.map((pet) => {
            const center = {
              latitude: pet.latitude,
              longitude: pet.longitude,
            };
            if (!isValidLatLng(center)) return null;

            return (
              <Circle
                key={`circle-${pet.id}`}
                center={center}
                radius={SEARCH_RADIUS_METERS}
                fillColor={CIRCLE_FILL}
                strokeColor={CIRCLE_STROKE}
                strokeWidth={1}
                zIndex={Z_PET_CIRCLE}
              />
            );
          })}

        {visiblePets.map((pet) => {
          const coordinate: LatLng = {
            latitude: pet.mapLatitude,
            longitude: pet.mapLongitude,
          };
          if (!isValidLatLng(coordinate)) return null;

          if (SHOW_CUSTOM_MARKERS) {
            return (
              <Marker
                key={`pet-${pet.id}`}
                identifier={`pet-${pet.id}`}
                coordinate={coordinate}
                pinColor="red"
                zIndex={Z_PET_MARKER}
                tracksViewChanges={false}
                onPress={() => handleMarkerPress(pet.id)}
              >
                <Callout onPress={() => handleMarkerPress(pet.id)}>
                  <View style={styles.callout}>
                    <Text style={styles.calloutTitle}>{pet.name || 'İsimsiz'}</Text>
                    <Text style={styles.calloutSub}>Kayıp · Dokun → QR izi</Text>
                  </View>
                </Callout>
              </Marker>
            );
          }

          return (
            <Marker
              key={`pet-${pet.id}`}
              identifier={`pet-${pet.id}`}
              coordinate={coordinate}
              pinColor="red"
              title={pet.name ?? 'İsimsiz'}
              description="Kayıp"
              zIndex={Z_PET_MARKER}
              tracksViewChanges={false}
              onPress={() => handleMarkerPress(pet.id)}
            />
          );
        })}

        {willRenderPolyline && selectedPet ? (
          <Polyline
            key={`trail-pet-${String(selectedPet.id)}`}
            coordinates={polylineCoords}
            strokeColor="#16A34A"
            strokeWidth={3}
            lineDashPattern={[12, 8]}
            zIndex={Z_POLYLINE}
          />
        ) : null}

        {SHOW_SCAN_MARKERS &&
          showSelectionOverlays &&
          visibleSelectedScans.map((scan) => {
            const scanCoord = {
              latitude: scan.latitude,
              longitude: scan.longitude,
            };
            if (!isValidLatLng(scanCoord)) return null;

            return (
              <Marker
                key={`scan-${scan.id}`}
                identifier={`scan-${scan.id}`}
                coordinate={scanCoord}
                pinColor="green"
                title="QR tarama"
                zIndex={Z_SCAN_MARKER}
                tracksViewChanges={false}
              />
            );
          })}
      </MapView>

      <View
        style={[styles.overlay, { paddingTop: insets.top + 8 }]}
        pointerEvents="box-none"
      >
        <View style={styles.floatingPanel} pointerEvents="auto">
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

            <Pressable
              style={({ pressed }) => [
                styles.refreshButton,
                (refreshing || loading) && styles.refreshButtonDisabled,
                pressed && !refreshing && !loading && styles.pressed,
              ]}
              onPress={handleRefresh}
              disabled={refreshing || loading}
              accessibilityLabel="Haritayı yenile"
              accessibilityHint="Kayıp hayvanları ve QR izlerini yeniden yükler"
              hitSlop={8}
            >
              {refreshing ? (
                <ActivityIndicator size="small" color={BRAND.primary} />
              ) : (
                <RefreshCw color={BRAND.navy} size={20} strokeWidth={2.5} />
              )}
            </Pressable>
          </View>

          {refreshing ? (
            <Text style={styles.refreshHint}>Yenileniyor...</Text>
          ) : null}

          <View style={styles.legendRow}>
            <View style={styles.legendCard}>
              <MapPin color={BRAND.danger} size={16} strokeWidth={2.5} />
              <Text style={styles.legendText}>
                {loading
                  ? 'Yükleniyor...'
                  : refreshing
                    ? 'Yenileniyor...'
                    : searchActive
                      ? `${visiblePets.length}/${mapPets.length} kayıp · ${scansForMapLostPets.length} iz`
                      : `${mapPets.length} kayıp · ${scansForMapLostPets.length} iz`}
              </Text>
            </View>
            {SHOW_SCAN_MARKERS && showSelectionOverlays && (
              <View style={[styles.legendCard, styles.legendGreen]}>
                <MapPin color={BRAND.success} size={16} strokeWidth={2.5} />
                <Text style={styles.legendText}>{selectedScans.length} yeşil pin</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.messagesStack} pointerEvents="box-none">
        {refreshError ? (
          <View style={[styles.hintBanner, styles.hintBannerError]} pointerEvents="auto">
            <Text style={styles.hintTitle}>Harita yenilenemedi</Text>
            <Text style={styles.hintBody}>{refreshError}</Text>
          </View>
        ) : null}

        {fetchError && pets.length === 0 && scans.length === 0 ? (
          <View style={styles.hintBanner} pointerEvents="auto">
            <Text style={styles.hintTitle}>Veri yüklenemedi</Text>
            <Text style={styles.hintBody}>{fetchError}</Text>
          </View>
        ) : null}

        {!loading && petsMissingCoords > 0 && (
          <View style={styles.hintBanner} pointerEvents="auto">
            <Text style={styles.hintTitle}>Konumsuz kayıtlar atlandı</Text>
            <Text style={styles.hintBody}>
              {petsMissingCoords} hayvan için geçerli latitude/longitude veya location_lat/lng yok.
            </Text>
          </View>
        )}

        {!loading && lostPets.length === 0 && (
          <View style={styles.hintBanner} pointerEvents="auto">
            <Text style={styles.hintTitle}>Kayıp ilan yok</Text>
            <Text style={styles.hintBody}>
              Haritada yalnızca is_lost = true olan hayvanlar gösterilir.
            </Text>
          </View>
        )}

        {!loading && lostPets.length > 0 && mapPets.length === 0 && (
          <View style={styles.hintBanner} pointerEvents="auto">
            <Text style={styles.hintTitle}>Haritada gösterilecek pin yok</Text>
            <Text style={styles.hintBody}>
              Kayıp hayvanlar var ancak geçerli koordinat yok. latitude/longitude veya
              location_lat/lng ekleyin.
            </Text>
          </View>
        )}
        </View>
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
    paddingHorizontal: 12,
  },
  floatingPanel: {
    backgroundColor: 'rgba(248, 250, 252, 0.92)',
    borderRadius: 16,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: BRAND.border,
    shadowColor: BRAND.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  messagesStack: {
    marginTop: 8,
    gap: 8,
    paddingHorizontal: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  refreshButton: {
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
  refreshButtonDisabled: { opacity: 0.55 },
  refreshHint: {
    fontSize: 12,
    fontWeight: '600',
    color: BRAND.primary,
    marginLeft: 4,
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
  hintBannerError: { borderLeftColor: BRAND.danger },
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
