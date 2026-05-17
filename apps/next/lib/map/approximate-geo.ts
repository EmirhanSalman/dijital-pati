import { ISPARTA_CENTER } from "@/lib/pets/map-coords";

/** Vercel / edge geo headers (approximate, not precise). */
export type ApproximateGeoHeaders = {
  country: string | null;
  region: string | null;
  city: string | null;
  postalCode: string | null;
};

export type ApproximateGeoDto = ApproximateGeoHeaders & {
  source: "vercel-headers" | "none";
  latitude: number | null;
  longitude: number | null;
  /** Human-readable approximate label — never "exact location". */
  label: string | null;
};

const TURKEY_CENTER = { latitude: 39.0, longitude: 35.0 };

type RegionEntry = {
  latitude: number;
  longitude: number;
  label: string;
  match: (normalized: string) => boolean;
};

function normalizeGeoToken(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, " ");
}

const REGION_ENTRIES: RegionEntry[] = [
  {
    latitude: ISPARTA_CENTER.latitude,
    longitude: ISPARTA_CENTER.longitude,
    label: "Isparta, Türkiye (yaklaşık)",
    match: (n) => n.includes("isparta"),
  },
  {
    latitude: 41.0082,
    longitude: 28.9784,
    label: "İstanbul, Türkiye (yaklaşık)",
    match: (n) => n.includes("istanbul") || n.includes("stanbul"),
  },
  {
    latitude: 39.9334,
    longitude: 32.8597,
    label: "Ankara, Türkiye (yaklaşık)",
    match: (n) => n.includes("ankara"),
  },
  {
    latitude: 38.4192,
    longitude: 27.1287,
    label: "İzmir, Türkiye (yaklaşık)",
    match: (n) => n.includes("izmir"),
  },
  {
    latitude: 36.8969,
    longitude: 30.7133,
    label: "Antalya, Türkiye (yaklaşık)",
    match: (n) => n.includes("antalya"),
  },
  {
    latitude: 37.0662,
    longitude: 37.3833,
    label: "Gaziantep, Türkiye (yaklaşık)",
    match: (n) => n.includes("gaziantep"),
  },
  {
    latitude: 40.1885,
    longitude: 29.061,
    label: "Bursa, Türkiye (yaklaşık)",
    match: (n) => n.includes("bursa"),
  },
];

function isTurkey(countryNorm: string): boolean {
  return (
    countryNorm === "tr" ||
    countryNorm === "tur" ||
    countryNorm.includes("turkiye") ||
    countryNorm.includes("turkey")
  );
}

/**
 * Resolve approximate lat/lng from city/country strings only (no paid geocoding).
 */
export function resolveApproximateCoordinates(
  headers: ApproximateGeoHeaders
): Pick<ApproximateGeoDto, "latitude" | "longitude" | "label"> {
  const countryNorm = normalizeGeoToken(headers.country);
  const cityNorm = normalizeGeoToken(headers.city);
  const regionNorm = normalizeGeoToken(headers.region);
  const combined = `${cityNorm} ${regionNorm} ${countryNorm}`.trim();

  if (combined) {
    for (const entry of REGION_ENTRIES) {
      if (entry.match(combined) || entry.match(cityNorm) || entry.match(regionNorm)) {
        return {
          latitude: entry.latitude,
          longitude: entry.longitude,
          label: entry.label,
        };
      }
    }
  }

  if (isTurkey(countryNorm)) {
    const cityLabel = headers.city?.trim();
    return {
      latitude: TURKEY_CENTER.latitude,
      longitude: TURKEY_CENTER.longitude,
      label: cityLabel
        ? `${cityLabel}, Türkiye (yaklaşık)`
        : "Türkiye (yaklaşık)",
    };
  }

  return { latitude: null, longitude: null, label: null };
}

export function readVercelGeoHeaders(
  headerSource: Headers | { get(name: string): string | null }
): ApproximateGeoHeaders {
  const get = (name: string) => headerSource.get(name)?.trim() || null;
  return {
    country: get("x-vercel-ip-country"),
    region: get("x-vercel-ip-country-region"),
    city: get("x-vercel-ip-city"),
    postalCode: get("x-vercel-ip-postal-code"),
  };
}

export function buildApproximateGeoDto(
  headerSource: Headers | { get(name: string): string | null }
): ApproximateGeoDto {
  const raw = readVercelGeoHeaders(headerSource);
  const hasHeaders = Boolean(raw.country || raw.city || raw.region || raw.postalCode);
  const resolved = resolveApproximateCoordinates(raw);

  return {
    ...raw,
    source: hasHeaders ? "vercel-headers" : "none",
    latitude: resolved.latitude,
    longitude: resolved.longitude,
    label: resolved.label,
  };
}
