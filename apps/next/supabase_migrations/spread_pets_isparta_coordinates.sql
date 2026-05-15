-- Spread pets around Isparta city center with unique nearby coordinates.
-- Updates only NULL/invalid coords OR the old single-point backfill (37.76, 30.55).
-- Preserves pets that already have distinct valid coordinates.

-- Isparta center ≈ 37.7648, 30.5566
UPDATE public.pets AS p
SET
  latitude = 37.7648
    + ((ABS(p.id) % 7) - 3) * 0.004
    + ((ABS(p.id) % 5) * 0.0007),
  longitude = 30.5566
    + ((ABS(p.id) % 11) - 5) * 0.005
    + ((ABS(p.id) % 3) * 0.0009)
WHERE latitude IS NULL
   OR longitude IS NULL
   OR NOT (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
   OR (
     ABS(latitude - 37.76) < 0.001
     AND ABS(longitude - 30.55) < 0.001
   );
