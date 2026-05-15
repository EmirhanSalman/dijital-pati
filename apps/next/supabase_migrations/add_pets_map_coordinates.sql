-- Map pins: last-seen coordinates for lost pet listings
-- Run this migration before expecting red pins on the mobile map screen.

ALTER TABLE pets
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

COMMENT ON COLUMN pets.latitude IS 'Last seen latitude (WGS84) for map display';
COMMENT ON COLUMN pets.longitude IS 'Last seen longitude (WGS84) for map display';
