/**
 * Parses DigitalPati QR payloads (URL, deep link, or raw id).
 * Web collars encode: https://dijitalpati.com/pet/{token_id|id}
 */
export function parsePetIdFromQr(data: string): string | null {
  const raw = data.trim();
  if (!raw) return null;

  const urlMatch = raw.match(/\/pet\/([^/?#\s]+)/i);
  if (urlMatch?.[1]) return decodeURIComponent(urlMatch[1]);

  const schemeMatch = raw.match(/^dijitalpati:\/\/pet\/([^/?#\s]+)/i);
  if (schemeMatch?.[1]) return decodeURIComponent(schemeMatch[1]);

  if (/^[\w-]+$/.test(raw) && raw.length <= 64) return raw;

  return null;
}
