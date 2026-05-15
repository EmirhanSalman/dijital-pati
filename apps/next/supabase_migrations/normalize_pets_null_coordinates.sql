-- Backfill pets missing map coordinates (Isparta region defaults)
-- Only rows where latitude OR longitude is NULL are updated.

UPDATE public.pets
SET
  latitude = 37.76,
  longitude = 30.55
WHERE latitude IS NULL
   OR longitude IS NULL;
