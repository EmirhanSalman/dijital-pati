/**
 * Run: node apps/expo/scripts/qr-regression-check.mjs
 * Verifies token_id-before-legacy_id order (Rıfkı id=1 token_id=6 vs Sis id=6).
 */

function normalizeQrIdentifier(identifier) {
  const trimmed = identifier.trim();
  if (!trimmed) return '';
  if (/^\d+$/.test(trimmed)) return String(Number(trimmed));
  return trimmed;
}

function resolveLocal(identifier, pets) {
  const normalized = normalizeQrIdentifier(identifier);
  const candidates = new Set([normalized, identifier.trim()]);
  if (/^\d+$/.test(normalized)) candidates.add(String(Number(normalized)));

  for (const c of candidates) {
    const hit = pets.find(
      (p) =>
        p.token_id != null &&
        normalizeQrIdentifier(String(p.token_id)) === normalizeQrIdentifier(c)
    );
    if (hit) {
      return { method: 'token_id', id: hit.id, name: hit.name, token_id: String(hit.token_id) };
    }
  }

  if (/^\d+$/.test(normalized)) {
    const legacy = pets.find((p) => String(p.id) === normalized);
    if (legacy) {
      return {
        method: 'legacy_id',
        id: legacy.id,
        name: legacy.name,
        token_id: String(legacy.token_id),
      };
    }
  }
  return null;
}

const pets = [
  { id: 1, token_id: '6', name: 'Rıfkı' },
  { id: 6, token_id: '11', name: 'Sis' },
];

const r = resolveLocal('6', pets);
const ok =
  r?.method === 'token_id' && r.id === 1 && r.name === 'Rıfkı' && r.token_id === '6';

console.log('[DigitalPati QR regression]', ok ? 'PASS' : 'FAIL', r);
process.exit(ok ? 0 : 1);
