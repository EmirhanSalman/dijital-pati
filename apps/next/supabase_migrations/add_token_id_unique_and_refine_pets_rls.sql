-- =============================================================================
-- add_token_id_unique_and_refine_pets_rls.sql (idempotent)
-- =============================================================================
-- pets.id  = BIGINT primary key (never sync with token_id)
-- token_id = public QR slug (unique when set)
--
-- BEFORE creating the unique index below, run:
--
--   SELECT token_id, COUNT(*) AS n
--   FROM public.pets
--   WHERE token_id IS NOT NULL
--   GROUP BY token_id
--   HAVING COUNT(*) > 1;
--
-- Resolve any duplicate token_id rows first, or CREATE UNIQUE INDEX will fail.
--
-- PUBLIC QR PAGE (web /pet/[token_id]):
--   Do NOT re-enable "read all pets" for anon/authenticated.
--   Use a Next.js API route with the service role (or a SECURITY DEFINER RPC)
--   that resolves token_id and returns only safe public fields
--   (e.g. name, image_url, is_lost, species) — not owner_id, wallet, etc.
-- =============================================================================

-- ─── Schema: token_id ────────────────────────────────────────────────────────
ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS token_id TEXT;

-- ─── pets: drop legacy / duplicate / unsafe policies ─────────────────────────
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access for all pets" ON public.pets;
DROP POLICY IF EXISTS "Authenticated users can read lost pets" ON public.pets;
DROP POLICY IF EXISTS "Owners can delete their own pets" ON public.pets;
DROP POLICY IF EXISTS "Owners can insert their own pets" ON public.pets;
DROP POLICY IF EXISTS "Owners can update their own pets" ON public.pets;
DROP POLICY IF EXISTS "Users can read own pets" ON public.pets;
DROP POLICY IF EXISTS "Users can update their own pets" ON public.pets;
DROP POLICY IF EXISTS "pets_insert_policy" ON public.pets;

-- From earlier migrations (avoid duplicate/conflict on re-run)
DROP POLICY IF EXISTS "Authenticated users can read pets for map" ON public.pets;
DROP POLICY IF EXISTS "Authenticated users can read pets" ON public.pets;
DROP POLICY IF EXISTS "Public read access" ON public.pets;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.pets;

-- ─── pets: final RLS (authenticated only; no public read/write) ─────────────

-- Profile / My Pets: own rows only
CREATE POLICY "Users can read own pets"
  ON public.pets
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- Map + Kayıplar list: lost pets only
CREATE POLICY "Authenticated users can read lost pets"
  ON public.pets
  FOR SELECT
  TO authenticated
  USING (is_lost = true);

-- Insert: force owner_id to match session (replaces unsafe pets_insert_policy)
CREATE POLICY "Owners can insert their own pets"
  ON public.pets
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- Update: own rows only; cannot reassign owner_id
CREATE POLICY "Owners can update their own pets"
  ON public.pets
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can delete their own pets"
  ON public.pets
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- ─── token_id unique index (run duplicate check above first) ─────────────────
DROP INDEX IF EXISTS public.idx_pets_token_id_unique;

CREATE UNIQUE INDEX IF NOT EXISTS pets_token_id_unique_idx
  ON public.pets (token_id)
  WHERE token_id IS NOT NULL;

-- ─── pet_scans: idempotent policy refresh (map / QR trail) ───────────────────
ALTER TABLE public.pet_scans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert pet scans" ON public.pet_scans;
DROP POLICY IF EXISTS "Anyone can read pet scans" ON public.pet_scans;
DROP POLICY IF EXISTS "Authenticated users can insert pet scans" ON public.pet_scans;
DROP POLICY IF EXISTS "Authenticated users can read pet scans" ON public.pet_scans;
DROP POLICY IF EXISTS "Pet owners can delete scans for their pets" ON public.pet_scans;

CREATE POLICY "Authenticated users can insert pet scans"
  ON public.pet_scans
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.pets
      WHERE public.pets.id = pet_id
    )
  );

CREATE POLICY "Authenticated users can read pet scans"
  ON public.pet_scans
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Pet owners can delete scans for their pets"
  ON public.pet_scans
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.pets
      WHERE public.pets.id = pet_scans.pet_id
        AND public.pets.owner_id = auth.uid()
    )
  );
