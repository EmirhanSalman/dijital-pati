-- Harden RLS for map + QR paw trail (replaces permissive public pet_scans policies).
-- Mobile app requires authenticated Supabase session (see apps/expo/app/_layout.tsx).

-- ─── pet_scans ───────────────────────────────────────────────────────────────
ALTER TABLE public.pet_scans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert pet scans" ON public.pet_scans;
DROP POLICY IF EXISTS "Anyone can read pet scans" ON public.pet_scans;

-- Any signed-in user may log a collar sighting (finder / owner / helper).
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

-- Lost-pet map: all authenticated users see scan trails (community visibility).
CREATE POLICY "Authenticated users can read pet scans"
    ON public.pet_scans
    FOR SELECT
    TO authenticated
    USING (auth.uid() IS NOT NULL);

-- Pet owners may delete scan rows for their own pets (optional cleanup).
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

-- ─── pets (map read + owner write) ─────────────────────────────────────────
-- Safe if RLS was already off: enabling without policies would block all access.
-- These policies allow map SELECT for any authenticated user while restricting writes.

ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read pets for map" ON public.pets;
CREATE POLICY "Authenticated users can read pets for map"
    ON public.pets
    FOR SELECT
    TO authenticated
    USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Owners can insert their own pets" ON public.pets;
CREATE POLICY "Owners can insert their own pets"
    ON public.pets
    FOR INSERT
    TO authenticated
    WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Owners can update their own pets" ON public.pets;
CREATE POLICY "Owners can update their own pets"
    ON public.pets
    FOR UPDATE
    TO authenticated
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Owners can delete their own pets" ON public.pets;
CREATE POLICY "Owners can delete their own pets"
    ON public.pets
    FOR DELETE
    TO authenticated
    USING (owner_id = auth.uid());
