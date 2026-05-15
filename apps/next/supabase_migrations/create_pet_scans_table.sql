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

-- RLS: see harden_pet_scans_and_pets_map_rls.sql for production policies.
ALTER TABLE public.pet_scans ENABLE ROW LEVEL SECURITY;
