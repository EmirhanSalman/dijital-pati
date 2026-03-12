-- Add city and district columns to pets table for location-based filtering

-- Add city column
ALTER TABLE pets 
ADD COLUMN IF NOT EXISTS city TEXT;

-- Add district column
ALTER TABLE pets 
ADD COLUMN IF NOT EXISTS district TEXT;

-- Add comment for documentation
COMMENT ON COLUMN pets.city IS 'Pet kayıp ilanının şehir bilgisi';
COMMENT ON COLUMN pets.district IS 'Pet kayıp ilanının ilçe bilgisi';

