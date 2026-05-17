"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import type { LatLng } from "@/lib/pets/map-coords";

type MapFitBoundsProps = {
  coordinates: LatLng[];
  padding?: [number, number];
};

export default function MapFitBounds({ coordinates, padding = [48, 48] }: MapFitBoundsProps) {
  const map = useMap();

  useEffect(() => {
    if (coordinates.length === 0) return;
    if (coordinates.length === 1) {
      map.setView([coordinates[0].latitude, coordinates[0].longitude], 14);
      return;
    }
    const bounds = coordinates.map(
      (c) => [c.latitude, c.longitude] as [number, number]
    );
    map.fitBounds(bounds, { padding });
  }, [map, coordinates, padding]);

  return null;
}
