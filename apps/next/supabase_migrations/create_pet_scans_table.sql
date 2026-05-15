-- GPS "seen" locations captured when a DigitalPati collar QR is scanned

CREATE TABLE IF NOT EXISTS public.pet_scans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pet_id BIGINT NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    scanned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pet_scans_pet_id ON public.pet_scans(pet_id);
CREATE INDEX IF NOT EXISTS idx_pet_scans_scanned_at ON public.pet_scans(scanned_at DESC);

COMMENT ON TABLE public.pet_scans IS 'Scanner GPS sightings linked to a pet via QR collar scan';

-- RLS: allow inserts from mobile scanners; reads for map visualization
ALTER TABLE public.pet_scans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert pet scans" ON public.pet_scans;
CREATE POLICY "Anyone can insert pet scans"
    ON public.pet_scans
    FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can read pet scans" ON public.pet_scans;
CREATE POLICY "Anyone can read pet scans"
    ON public.pet_scans
    FOR SELECT
    USING (true);
