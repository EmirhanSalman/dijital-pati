/**
 * QR → pets.id resolution for scanner (matches web lib/pets/qr-resolve.ts).
 * Order: token_id first, then legacy pets.id only when token_id does not match.
 */

import { supabase } from './supabase';
import { logScan, logScannerLine } from './map-debug';
import { normalizeQrIdentifier } from './qr';
import {
  buildTokenIdLookupCandidates,
  type PetQrResolveMethod,
} from './pet-qr-resolve.logic';

export type { PetQrResolveMethod };

export type PetQrResolveResult = {
  id: number;
  method: PetQrResolveMethod;
  name: string | null;
  token_id: string | null;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type PetRow = { id: number | string; token_id: string | number | null; name: string | null };

function toResult(row: PetRow, method: PetQrResolveMethod): PetQrResolveResult {
  return {
    id: Number(row.id),
    method,
    name: row.name ?? null,
    token_id: row.token_id != null ? String(row.token_id) : null,
  };
}

async function findByTokenIdCandidates(
  normalized: string
): Promise<{ row: PetRow; matchedCandidate: string } | null> {
  const candidates = buildTokenIdLookupCandidates(normalized);
  logScannerLine(`token_id lookup candidates: ${candidates.join(', ') || '(none)'}`);

  for (const candidate of candidates) {
    const { data, error } = await supabase
      .from('pets')
      .select('id, token_id, name')
      .eq('token_id', candidate)
      .maybeSingle();

    if (error) {
      logScan('token_id query error', { candidate, error: error.message, code: error.code });
      continue;
    }

    if (data?.id != null) {
      logScannerLine(`token_id match via candidate "${candidate}"`);
      return { row: data as PetRow, matchedCandidate: candidate };
    }
  }

  // Fallback: fetch lost + own pets may hide collar token via RLS — try in-memory filter
  // on rows visible to this user (logged separately if legacy path used)
  return null;
}

export async function resolvePetByQrIdentifier(
  identifier: string
): Promise<PetQrResolveResult | null> {
  const normalized = normalizeQrIdentifier(identifier);
  if (!normalized) {
    logScannerLine('resolve aborted: empty normalized identifier');
    return null;
  }

  logScannerLine(`normalized identifier for resolve: ${normalized}`);

  // A. token_id first (never skip to legacy id while a token_id row may exist)
  const tokenHit = await findByTokenIdCandidates(normalized);
  if (tokenHit) {
    const result = toResult(tokenHit.row, 'token_id');
    logScannerLine(`resolver method: token_id`);
    logScannerLine(`resolvedPetId: ${result.id}`);
    logScannerLine(`resolvedPetName: ${result.name ?? '(null)'}`);
    logScannerLine(`resolvedTokenId: ${result.token_id ?? '(null)'}`);
    return result;
  }

  logScannerLine('no token_id row visible for any candidate (check RLS or wrong QR slug)');

  // B. legacy pets.id only when token_id did not match
  if (/^\d+$/.test(normalized)) {
    logScannerLine(`trying legacy pets.id match for numeric "${normalized}"`);

    const { data: byId, error } = await supabase
      .from('pets')
      .select('id, token_id, name')
      .eq('id', normalized)
      .maybeSingle();

    if (error) {
      logScan('legacy id query error', { error: error.message, code: error.code });
    } else if (byId?.id != null) {
      const result = toResult(byId as PetRow, 'legacy_id');

      if (String(byId.id) === normalized) {
        logScannerLine(
          'WARNING: legacy_id match — slug equals pets.id; if QR was /pet/{token_id}, RLS may have hidden the real token_id row'
        );
      }

      logScannerLine(`resolver method: legacy_id`);
      logScannerLine(`resolvedPetId: ${result.id}`);
      logScannerLine(`resolvedPetName: ${result.name ?? '(null)'}`);
      logScannerLine(`resolvedTokenId: ${result.token_id ?? '(null)'}`);

      return result;
    }
  }

  if (UUID_RE.test(normalized)) {
    logScannerLine(`trying legacy pets.id UUID match`);

    const { data: byUuid, error } = await supabase
      .from('pets')
      .select('id, token_id, name')
      .eq('id', normalized)
      .maybeSingle();

    if (error) {
      logScan('legacy uuid query error', { error: error.message });
    } else if (byUuid?.id != null) {
      const result = toResult(byUuid as PetRow, 'legacy_id');
      logScannerLine(`resolver method: legacy_id`);
      logScannerLine(`resolvedPetId: ${result.id}`);
      logScannerLine(`resolvedPetName: ${result.name ?? '(null)'}`);
      logScannerLine(`resolvedTokenId: ${result.token_id ?? '(null)'}`);
      return result;
    }
  }

  logScannerLine('resolver: pet not found');
  return null;
}
