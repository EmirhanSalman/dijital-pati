/**
 * Parses DigitalPati QR payloads (URL, deep link, or raw id).
 * Canonical QR URL: https://dijital-pati.vercel.app/pet/{token_id}
 * Legacy QRs may contain pets.id — resolved in pet-qr-resolve (token_id first).
 */

export type ParsedQrPayload = {
  /** Exact string from the camera */
  raw: string;
  /** Path segment after /pet/ when URL/deep link; otherwise null */
  urlPath: string | null;
  /** Decoded slug used for DB lookup */
  identifier: string | null;
  /** Trimmed identifier (same as identifier when present) */
  normalized: string | null;
};

export function parseQrPayload(data: string): ParsedQrPayload {
  const raw = data;
  const trimmed = data.trim();

  if (!trimmed) {
    return { raw, urlPath: null, identifier: null, normalized: null };
  }

  const urlMatch = trimmed.match(/\/pet\/([^/?#\s]+)/i);
  if (urlMatch?.[1]) {
    const slug = decodeURIComponent(urlMatch[1]);
    return {
      raw,
      urlPath: slug,
      identifier: slug,
      normalized: normalizeQrIdentifier(slug),
    };
  }

  const schemeMatch = trimmed.match(/^dijitalpati:\/\/pet\/([^/?#\s]+)/i);
  if (schemeMatch?.[1]) {
    const slug = decodeURIComponent(schemeMatch[1]);
    return {
      raw,
      urlPath: slug,
      identifier: slug,
      normalized: normalizeQrIdentifier(slug),
    };
  }

  if (/^[\w-]+$/.test(trimmed) && trimmed.length <= 64) {
    return {
      raw,
      urlPath: null,
      identifier: trimmed,
      normalized: normalizeQrIdentifier(trimmed),
    };
  }

  return { raw, urlPath: null, identifier: null, normalized: null };
}

/** @deprecated Use parseQrPayload */
export function parsePetIdFromQr(data: string): string | null {
  return parseQrPayload(data).normalized;
}

/** Trim + collapse numeric strings (e.g. "06" → "6") for token_id comparison */
export function normalizeQrIdentifier(identifier: string): string {
  const trimmed = identifier.trim();
  if (!trimmed) return '';
  if (/^\d+$/.test(trimmed)) {
    return String(Number(trimmed));
  }
  return trimmed;
}
