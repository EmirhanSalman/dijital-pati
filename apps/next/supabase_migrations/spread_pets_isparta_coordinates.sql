-- Spread pets around Isparta city center with unique nearby coordinates.
-- Scales to any number of pets (no fixed pet count).
-- Updates: NULL/invalid coords, legacy single-point backfill, or duplicate stacked coords.
-- Preserves pets that already have distinct valid coordinates.

-- Isparta center ≈ 37.7648, 30.5566
WITH candidates AS (
  SELECT p.id
  FROM public.pets AS p
  WHERE p.latitude IS NULL
     OR p.longitude IS NULL
     OR NOT (p.latitude BETWEEN -90 AND 90 AND p.longitude BETWEEN -180 AND 180)
     OR (p.latitude = 0 AND p.longitude = 0)
     -- Legacy normalize_pets_null_coordinates backfill (single stack point)
     OR (
       ABS(p.latitude - 37.76) < 0.001
       AND ABS(p.longitude - 30.55) < 0.001
     )
     -- Multiple pets sharing the exact same rounded coordinate
     OR p.id IN (
       SELECT dup.id
       FROM (
         SELECT
           id,
           ROW_NUMBER() OVER (
             PARTITION BY
               ROUND(latitude::numeric, 4),
               ROUND(longitude::numeric, 4)
             ORDER BY id
           ) AS rn
         FROM public.pets
         WHERE latitude IS NOT NULL
           AND longitude IS NOT NULL
       ) AS dup
       WHERE dup.rn > 1
     )
),
numbered AS (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY id) AS rn,
    COUNT(*) OVER () AS total
  FROM candidates
)
UPDATE public.pets AS p
SET
  latitude = 37.7648
    + sin(radians((n.rn - 1) * (360.0 / GREATEST(n.total, 1))))
      * (0.0035 + ((n.rn - 1) % 6) * 0.0008),
  longitude = 30.5566
    + cos(radians((n.rn - 1) * (360.0 / GREATEST(n.total, 1))))
      * (0.0045 + ((n.rn - 1) % 8) * 0.0007)
FROM numbered AS n
WHERE p.id = n.id;
