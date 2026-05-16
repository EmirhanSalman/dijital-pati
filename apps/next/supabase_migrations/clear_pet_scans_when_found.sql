-- When a pet is marked found (is_lost: true → false), remove temporary QR scan trail.
-- App layer also deletes scans; this trigger keeps web/mobile/admin consistent.

CREATE OR REPLACE FUNCTION public.delete_pet_scans_when_pet_found()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.is_lost IS TRUE AND (NEW.is_lost IS DISTINCT FROM TRUE) THEN
    DELETE FROM public.pet_scans WHERE pet_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_delete_pet_scans_when_found ON public.pets;

CREATE TRIGGER trg_delete_pet_scans_when_found
  AFTER UPDATE OF is_lost ON public.pets
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_pet_scans_when_pet_found();

COMMENT ON FUNCTION public.delete_pet_scans_when_pet_found() IS
  'Removes pet_scans rows when pets.is_lost becomes false (pet found).';

-- Optional sync columns for legacy readers (mobile map fallback).
ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS location_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS location_lng DOUBLE PRECISION;

ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS lost_reported_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS found_at TIMESTAMPTZ;

-- One-time cleanup: scans for pets that are not currently lost.
DELETE FROM public.pet_scans AS ps
USING public.pets AS p
WHERE p.id = ps.pet_id
  AND (p.is_lost IS NOT TRUE);
