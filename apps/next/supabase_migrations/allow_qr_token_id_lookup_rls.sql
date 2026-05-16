-- QR scanner must resolve token_id → pets.id even when the pet is not lost
-- and the scanner is not the owner. Without this, RLS hides the row on token_id
-- lookup and the app falls back to legacy pets.id (e.g. slug "6" → Sis id=6
-- instead of Rıfkı token_id=6).
--
-- Idempotent: safe to re-run.

DROP POLICY IF EXISTS "Authenticated users can resolve QR by token_id" ON public.pets;

CREATE POLICY "Authenticated users can resolve QR by token_id"
  ON public.pets
  FOR SELECT
  TO authenticated
  USING (
    token_id IS NOT NULL
    AND btrim(token_id::text) <> ''
  );
