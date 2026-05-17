"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import type { LatLng } from "@/lib/pets/map-coords";
import type { MapViewCommand } from "@/lib/map/map-focus";

type MapViewportProps = {
  command: MapViewCommand | null;
  /** Increment to re-apply the same command (e.g. button click). */
  commandKey: number;
  padding?: [number, number];
};

export default function MapViewport({
  command,
  commandKey,
  padding = [48, 48],
}: MapViewportProps) {
  const map = useMap();

  useEffect(() => {
    if (!command) return;

    if (command.mode === "center") {
      map.setView([command.center.latitude, command.center.longitude], command.zoom);
      return;
    }

    const coords = command.coordinates;
    if (coords.length === 0) return;

    if (coords.length === 1) {
      map.setView([coords[0].latitude, coords[0].longitude], command.maxZoom ?? 14);
      return;
    }

    const bounds = coords.map(
      (c) => [c.latitude, c.longitude] as [number, number]
    );
    map.fitBounds(bounds, { padding, maxZoom: command.maxZoom });
  }, [map, command, commandKey, padding]);

  return null;
}
