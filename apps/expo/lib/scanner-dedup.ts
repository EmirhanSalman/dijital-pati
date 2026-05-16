/**
 * Lightweight duplicate-scan guards for QR scanner (in-memory + optional DB).
 */

import { supabase } from './supabase';
import { logScannerLine } from './map-debug';

/** Same QR slug cooldown while staying on scanner screen */
export const SAME_QR_COOLDOWN_MS = 15_000;

/** Skip DB insert if latest scan for pet is newer than this */
export const DB_RECENT_SCAN_SECONDS = 30;

/** Treat scans within this distance as duplicate (meters) */
const NEARBY_METERS = 75;

function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export type MemoryCooldownResult = 'ok' | 'cooldown';

export function checkMemoryCooldown(
  normalizedQr: string,
  lastValue: string | null,
  lastTimeMs: number | null,
  now = Date.now()
): MemoryCooldownResult {
  if (!lastValue || lastTimeMs == null) return 'ok';
  if (lastValue !== normalizedQr) return 'ok';
  if (now - lastTimeMs < SAME_QR_COOLDOWN_MS) return 'cooldown';
  return 'ok';
}

export type DbRecentScanResult = 'ok' | 'duplicate';

export async function checkRecentPetScan(
  petId: number,
  latitude: number,
  longitude: number
): Promise<DbRecentScanResult> {
  const { data, error } = await supabase
    .from('pet_scans')
    .select('latitude, longitude, scanned_at')
    .eq('pet_id', petId)
    .order('scanned_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    logScannerLine(`duplicate DB check skipped: ${error.message}`);
    return 'ok';
  }

  if (!data?.scanned_at) return 'ok';

  const ageMs = Date.now() - new Date(data.scanned_at).getTime();
  if (ageMs > DB_RECENT_SCAN_SECONDS * 1000) return 'ok';

  const lat = Number(data.latitude);
  const lng = Number(data.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return 'duplicate';
  }

  const dist = haversineMeters(latitude, longitude, lat, lng);
  if (dist <= NEARBY_METERS) {
    return 'duplicate';
  }

  return 'ok';
}
