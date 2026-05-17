"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  MapContainer,
  TileLayer,
  Circle,
  CircleMarker,
  Polyline,
} from "react-leaflet";
import { Loader2, MapPin, Navigation, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MapLostPetDto, MapScanDto } from "@/lib/pets/map-public";
import type { ApproximateGeoDto } from "@/lib/map/approximate-geo";
import {
  ISPARTA_CENTER,
  buildMapPetMarkers,
  buildPawTrailCoordinates,
  filterScansForPetId,
  findMapPetById,
  isLostPet,
  isValidLatLng,
  samePetId,
  type LatLng,
} from "@/lib/pets/map-coords";
import {
  computeInitialMapView,
  computeShowAllMapView,
  computeUserLocationMapView,
  haversineDistanceKm,
  sortByDistanceFrom,
  type MapViewCommand,
} from "@/lib/map/map-focus";
import MapViewport from "./MapViewport";
import PetMapPhoto from "./PetMapPhoto";
import "leaflet/dist/leaflet.css";

const SEARCH_RADIUS_METERS = 500;
const CIRCLE_FILL = "rgba(239, 68, 68, 0.08)";
const CIRCLE_STROKE = "rgba(220, 38, 38, 0.35)";
const USER_MARKER_COLOR = "#2563eb";

type PetRecord = MapLostPetDto;
type FocusPreference = "initial" | "user" | "all";

function petCoordsFromMarkers(
  pets: { mapLatitude: number; mapLongitude: number }[]
): LatLng[] {
  return pets.map((p) => ({
    latitude: p.mapLatitude,
    longitude: p.mapLongitude,
  }));
}

export default function LostPetMap() {
  const [pets, setPets] = useState<PetRecord[]>([]);
  const [scans, setScans] = useState<MapScanDto[]>([]);
  const [approximateGeo, setApproximateGeo] = useState<ApproximateGeoDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [focusPreference, setFocusPreference] = useState<FocusPreference>("initial");
  const [viewCommand, setViewCommand] = useState<MapViewCommand | null>(null);
  const [viewCommandKey, setViewCommandKey] = useState(0);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [userLocationError, setUserLocationError] = useState<string | null>(null);
  const [locatingUser, setLocatingUser] = useState(false);
  const mapFetchInFlightRef = useRef(false);

  const applyView = useCallback((command: MapViewCommand) => {
    setViewCommand(command);
    setViewCommandKey((k) => k + 1);
  }, []);

  const fetchMapData = useCallback(async (manual = false) => {
    if (!manual && mapFetchInFlightRef.current) {
      return;
    }
    mapFetchInFlightRef.current = true;

    if (manual) {
      setRefreshing(true);
      setRefreshError(null);
    } else {
      setLoading(true);
      setFetchError(null);
    }

    try {
      const response = await fetch("/api/map/lost-pets", { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Harita verileri yüklenemedi.");
      }
      setPets(data.pets ?? []);
      setScans(data.scans ?? []);
      setApproximateGeo(data.approximateGeo ?? null);
      if (manual) setRefreshError(null);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Harita verileri yüklenemedi.";
      if (manual) setRefreshError(message);
      else setFetchError(message);
    } finally {
      mapFetchInFlightRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchMapData(false);
  }, [fetchMapData]);

  const lostPets = useMemo(() => pets.filter(isLostPet), [pets]);
  const mapPets = useMemo(() => buildMapPetMarkers(lostPets), [lostPets]);

  const sortCenter = useMemo((): LatLng | null => {
    if (userLocation) return userLocation;
    if (
      approximateGeo?.latitude != null &&
      approximateGeo?.longitude != null
    ) {
      return {
        latitude: approximateGeo.latitude,
        longitude: approximateGeo.longitude,
      };
    }
    return null;
  }, [userLocation, approximateGeo]);

  const visiblePets = useMemo(() => {
    const withValid = mapPets.filter((pet) =>
      isValidLatLng({ latitude: pet.mapLatitude, longitude: pet.mapLongitude })
    );
    const q = searchQuery.trim().toLowerCase();
    const filtered = q
      ? withValid.filter((pet) => (pet.name ?? "").toLowerCase().includes(q))
      : withValid;

    if (sortCenter && (focusPreference === "user" || focusPreference === "initial")) {
      return sortByDistanceFrom(
        filtered.map((p) => ({
          ...p,
          latitude: p.mapLatitude,
          longitude: p.mapLongitude,
        })),
        sortCenter
      );
    }
    return filtered;
  }, [mapPets, searchQuery, sortCenter, focusPreference]);

  const selectedPet = useMemo(
    () => findMapPetById(mapPets, selectedPetId),
    [mapPets, selectedPetId]
  );

  const selectedScans = useMemo(() => {
    if (!selectedPetId) return [];
    return filterScansForPetId(scans, selectedPetId);
  }, [scans, selectedPetId]);

  const trailCoords = useMemo(() => {
    if (!selectedPet) return [];
    return buildPawTrailCoordinates(
      { latitude: selectedPet.latitude, longitude: selectedPet.longitude },
      selectedScans.map((s) => ({ latitude: s.latitude, longitude: s.longitude }))
    );
  }, [selectedPet, selectedScans]);

  const allMarkerCoords = useMemo(
    () => petCoordsFromMarkers(visiblePets),
    [visiblePets]
  );

  const nearbyCount = useMemo(() => {
    if (!userLocation) return null;
    return visiblePets.filter(
      (p) => haversineDistanceKm(userLocation, { latitude: p.mapLatitude, longitude: p.mapLongitude }) <= 50
    ).length;
  }, [userLocation, visiblePets]);

  const showRegionalFocusNote =
    focusPreference === "initial" && mapPets.length > 0 && !userLocation;

  const selectedDistanceKm = useMemo(() => {
    if (!selectedPet || !sortCenter) return null;
    return haversineDistanceKm(sortCenter, {
      latitude: selectedPet.mapLatitude,
      longitude: selectedPet.mapLongitude,
    });
  }, [selectedPet, sortCenter]);

  useEffect(() => {
    if (loading || mapPets.length === 0) return;
    if (focusPreference === "all") return;

    if (focusPreference === "user" && userLocation) {
      applyView(computeUserLocationMapView(userLocation));
      return;
    }

    applyView(computeInitialMapView(petCoordsFromMarkers(mapPets), approximateGeo));
  }, [loading, mapPets, approximateGeo, focusPreference, userLocation, applyView]);

  useEffect(() => {
    if (loading || mapPets.length === 0 || focusPreference !== "all") return;
    const coords = [...allMarkerCoords];
    if (selectedPet) {
      for (const scan of selectedScans) {
        coords.push({ latitude: scan.latitude, longitude: scan.longitude });
      }
    }
    applyView(computeShowAllMapView(coords));
  }, [
    loading,
    mapPets.length,
    focusPreference,
    allMarkerCoords,
    selectedPet,
    selectedScans,
    applyView,
  ]);

  const handleShowMyLocation = useCallback(() => {
    setUserLocationError(null);

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setUserLocationError("Tarayıcınız konum özelliğini desteklemiyor.");
      return;
    }

    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc: LatLng = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setUserLocation(loc);
        setFocusPreference("user");
        applyView(computeUserLocationMapView(loc));
        setLocatingUser(false);
        setUserLocationError(null);
      },
      () => {
        setLocatingUser(false);
        setUserLocationError("Konum izni verilmedi.");
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
    );
  }, [applyView]);

  const handleShowAllListings = useCallback(() => {
    setFocusPreference("all");
    const coords = [...allMarkerCoords];
    if (selectedPet) {
      for (const scan of selectedScans) {
        coords.push({ latitude: scan.latitude, longitude: scan.longitude });
      }
    }
    applyView(computeShowAllMapView(coords));
  }, [allMarkerCoords, selectedPet, selectedScans, applyView]);

  const mapCenter = useMemo((): [number, number] => {
    if (viewCommand?.mode === "center") {
      return [viewCommand.center.latitude, viewCommand.center.longitude];
    }
    if (allMarkerCoords.length > 0) {
      return [allMarkerCoords[0].latitude, allMarkerCoords[0].longitude];
    }
    return [ISPARTA_CENTER.latitude, ISPARTA_CENTER.longitude];
  }, [viewCommand, allMarkerCoords]);

  const mapZoom = useMemo(() => {
    if (viewCommand?.mode === "center") return viewCommand.zoom;
    return 11;
  }, [viewCommand]);

  const showMap = mapPets.length > 0 && visiblePets.length > 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p>Harita yükleniyor...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="space-y-4 py-10 text-center">
          <p className="font-medium text-destructive">{fetchError}</p>
          <Button type="button" onClick={() => void fetchMapData(false)}>
            Tekrar dene
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Hayvan adına göre ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleShowMyLocation}
            disabled={locatingUser}
          >
            {locatingUser ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="mr-2 h-4 w-4" />
            )}
            Konumumu Göster
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleShowAllListings}>
            Tüm İlanları Göster
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void fetchMapData(true)}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Haritayı Yenile
          </Button>
        </div>
      </div>

      {refreshError ? <p className="text-sm text-destructive">{refreshError}</p> : null}
      {userLocationError ? (
        <p className="text-sm text-destructive">{userLocationError}</p>
      ) : null}

      {showRegionalFocusNote ? (
        <p className="text-sm text-muted-foreground">
          Harita
          {approximateGeo?.label
            ? ` yaklaşık konumunuza göre odaklandı (${approximateGeo.label})`
            : " bölgesel olarak odaklandı"}
          . Tüm ilanları görmek için <strong>Tüm İlanları Göster</strong>&apos;e
          basabilirsiniz.
        </p>
      ) : null}

      {userLocation && nearbyCount != null ? (
        <p className="text-sm text-muted-foreground">
          Konumunuza yaklaşık {nearbyCount} kayıp ilan haritada (50 km içinde).
        </p>
      ) : null}

      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded-full bg-red-500" /> Kayıp konumu (kırmızı)
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded-full bg-green-500" /> Görülme bildirimi (yeşil)
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded-full bg-blue-600" /> Benim konumum (mavi)
        </span>
        <span>Arama yarıçapı: 500 m</span>
      </div>

      {mapPets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <MapPin className="mx-auto mb-3 h-10 w-10 opacity-40" />
            <p className="font-medium text-foreground">Haritada gösterilecek kayıp ilan yok</p>
            <p className="mt-2 text-sm">Kayıp ilanların geçerli konum bilgisi olmalıdır.</p>
            <Button variant="link" asChild className="mt-2">
              <Link href="/lost-pets">Kayıp ilanlarına git</Link>
            </Button>
          </CardContent>
        </Card>
      ) : visiblePets.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Aramanızla eşleşen kayıp ilan bulunamadı.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="h-[min(70vh,560px)] overflow-hidden rounded-xl border shadow-sm z-0">
          {showMap ? (
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              className="h-full w-full z-0"
              scrollWheelZoom
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapViewport command={viewCommand} commandKey={viewCommandKey} />
              {visiblePets.map((pet) => (
                <Circle
                  key={`circle-${pet.id}`}
                  center={[pet.mapLatitude, pet.mapLongitude]}
                  radius={SEARCH_RADIUS_METERS}
                  pathOptions={{
                    color: CIRCLE_STROKE,
                    fillColor: CIRCLE_FILL,
                    fillOpacity: 1,
                    weight: 1,
                  }}
                />
              ))}
              {visiblePets.map((pet) => {
                const selected = samePetId(pet.id, selectedPetId);
                return (
                  <CircleMarker
                    key={`pet-${pet.id}`}
                    center={[pet.mapLatitude, pet.mapLongitude]}
                    radius={selected ? 11 : 9}
                    pathOptions={{
                      color: "#b91c1c",
                      fillColor: "#ef4444",
                      fillOpacity: 0.95,
                      weight: selected ? 3 : 2,
                    }}
                    eventHandlers={{ click: () => setSelectedPetId(String(pet.id)) }}
                  />
                );
              })}
              {userLocation ? (
                <CircleMarker
                  center={[userLocation.latitude, userLocation.longitude]}
                  radius={10}
                  pathOptions={{
                    color: USER_MARKER_COLOR,
                    fillColor: "#3b82f6",
                    fillOpacity: 0.95,
                    weight: 3,
                  }}
                />
              ) : null}
              {selectedPet &&
                selectedScans.map((scan) => (
                  <CircleMarker
                    key={`scan-${scan.id}`}
                    center={[scan.latitude, scan.longitude]}
                    radius={7}
                    pathOptions={{
                      color: "#15803d",
                      fillColor: "#22c55e",
                      fillOpacity: 0.95,
                      weight: 2,
                    }}
                  />
                ))}
              {trailCoords.length >= 2 && (
                <Polyline
                  positions={trailCoords.map((c) => [c.latitude, c.longitude])}
                  pathOptions={{ color: "#22c55e", weight: 3, dashArray: "8 8" }}
                />
              )}
            </MapContainer>
          ) : null}
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Seçili hayvan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {selectedPet ? (
              <>
                <PetMapPhoto imageUrl={selectedPet.image_url} name={selectedPet.name} />
                <p className="text-lg font-semibold">{selectedPet.name || "İsimsiz"}</p>
                {selectedPet.breed ? (
                  <p className="text-muted-foreground">{selectedPet.breed}</p>
                ) : null}
                {selectedPet.city ? <p>📍 {selectedPet.city}</p> : null}
                {selectedDistanceKm != null ? (
                  <p className="text-muted-foreground">
                    Yaklaşık {selectedDistanceKm.toFixed(1)} km
                    {userLocation ? " (sizden)" : " (odak noktasından)"}
                  </p>
                ) : null}
                <p className="text-muted-foreground">
                  {selectedScans.length} görülme bildirimi
                </p>
                {selectedPet.token_id ? (
                  <Button asChild className="w-full">
                    <Link href={`/pet/${selectedPet.token_id}`}>QR sayfasını aç</Link>
                  </Button>
                ) : null}
              </>
            ) : (
              <p className="text-muted-foreground">
                Haritadan bir kayıp ilan seçin; yeşil görülme pinleri ve iz burada görünür.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
