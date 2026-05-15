/** Dev-only logging for map / QR scan debugging (Metro console). */

const MAP_TAG = '[DigitalPati Map]';
const SCAN_TAG = '[DigitalPati Scanner]';

function devLog(tag: string, message: string, payload?: unknown) {
  if (!__DEV__) return;
  if (payload !== undefined) {
    console.log(tag, message, payload);
  } else {
    console.log(tag, message);
  }
}

export function logMap(message: string, payload?: unknown) {
  devLog(MAP_TAG, message, payload);
}

export function logScan(message: string, payload?: unknown) {
  devLog(SCAN_TAG, message, payload);
}

/** Stable key for map fitToCoordinates — avoids refitting every render. */
export function coordinatesFitKey(coords: { latitude: number; longitude: number }[]): string {
  if (coords.length === 0) return '';
  return coords
    .map((c) => `${c.latitude.toFixed(5)},${c.longitude.toFixed(5)}`)
    .sort()
    .join('|');
}
