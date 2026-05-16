/**
 * Pure QR resolution helpers (no Supabase) — safe to unit-test / regression-check.
 */

import { normalizeQrIdentifier } from './qr';

export type PetQrResolveMethod = 'token_id' | 'legacy_id';

/** Lookup order for resolvePetByQrIdentifier */
export function getResolveSteps(normalized: string): PetQrResolveMethod[] {
  if (!normalized) return [];
  const steps: PetQrResolveMethod[] = ['token_id'];
  if (/^\d+$/.test(normalized)) {
    steps.push('legacy_id');
  } else if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(normalized)
  ) {
    steps.push('legacy_id');
  }
  return steps;
}

/** token_id column is TEXT — compare as string; include numeric-normalized variants */
export function buildTokenIdLookupCandidates(normalized: string): string[] {
  const out = new Set<string>();
  const base = normalizeQrIdentifier(normalized);
  if (!base) return [];

  out.add(base);
  out.add(normalized.trim());

  if (/^\d+$/.test(base)) {
    out.add(String(Number(base)));
  }

  return [...out];
}

export type QrRegressionFixture = {
  label: string;
  identifier: string;
  pets: { id: number; token_id: string | null; name: string }[];
  expected: { method: PetQrResolveMethod; id: number; name: string; token_id: string } | null;
};

/**
 * In-memory resolver mirroring production order (token_id before legacy id).
 */
export function resolvePetByQrIdentifierLocal(
  identifier: string,
  pets: QrRegressionFixture['pets']
): { method: PetQrResolveMethod; id: number; name: string; token_id: string } | null {
  const normalized = normalizeQrIdentifier(identifier);
  if (!normalized) return null;

  const candidates = buildTokenIdLookupCandidates(normalized);

  for (const c of candidates) {
    const hit = pets.find(
      (p) => p.token_id != null && normalizeQrIdentifier(String(p.token_id)) === normalizeQrIdentifier(c)
    );
    if (hit) {
      return {
        method: 'token_id',
        id: hit.id,
        name: hit.name,
        token_id: String(hit.token_id),
      };
    }
  }

  if (/^\d+$/.test(normalized)) {
    const legacy = pets.find((p) => String(p.id) === normalized);
    if (legacy) {
      return {
        method: 'legacy_id',
        id: legacy.id,
        name: legacy.name,
        token_id: String(legacy.token_id ?? ''),
      };
    }
  }

  return null;
}

export const QR_REGRESSION_FIXTURES: QrRegressionFixture[] = [
  {
    label: 'Rıfkı canonical /pet/6 — must NOT resolve to Sis (id=6)',
    identifier: '6',
    pets: [
      { id: 1, token_id: '6', name: 'Rıfkı' },
      { id: 6, token_id: '11', name: 'Sis' },
    ],
    expected: { method: 'token_id', id: 1, name: 'Rıfkı', token_id: '6' },
  },
  {
    label: 'Sis token_id 11',
    identifier: '11',
    pets: [
      { id: 1, token_id: '6', name: 'Rıfkı' },
      { id: 6, token_id: '11', name: 'Sis' },
    ],
    expected: { method: 'token_id', id: 6, name: 'Sis', token_id: '11' },
  },
  {
    label: 'Legacy pets.id=6 only when no token_id=6 (Rıfkı missing)',
    identifier: '6',
    pets: [{ id: 6, token_id: '11', name: 'Sis' }],
    expected: { method: 'legacy_id', id: 6, name: 'Sis', token_id: '11' },
  },
];

export function runQrRegressionFixtures(): { ok: boolean; failures: string[] } {
  const failures: string[] = [];

  for (const fx of QR_REGRESSION_FIXTURES) {
    const got = resolvePetByQrIdentifierLocal(fx.identifier, fx.pets);
    const exp = fx.expected;

    if (!exp && got) {
      failures.push(`${fx.label}: expected null, got ${JSON.stringify(got)}`);
      continue;
    }
    if (exp && !got) {
      failures.push(`${fx.label}: expected ${JSON.stringify(exp)}, got null`);
      continue;
    }
    if (exp && got) {
      if (got.method !== exp.method || got.id !== exp.id || got.name !== exp.name) {
        failures.push(
          `${fx.label}: expected ${JSON.stringify(exp)}, got ${JSON.stringify(got)}`
        );
      }
    }
  }

  return { ok: failures.length === 0, failures };
}
