-- ============================================
-- WALLET ADDRESS MAPPING
-- ============================================

-- 1. profiles tablosuna wallet_address sütunu ekle
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS wallet_address TEXT;

-- 2. İndeks ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_profiles_wallet_address ON public.profiles(wallet_address);

-- 3. Unique constraint ekle (bir wallet address sadece bir profile'a ait olabilir)
-- ÖNEMLİ: Mevcut verilerde duplicate varsa hata verebilir, önce temizleme yapılmalı
-- ALTER TABLE public.profiles ADD CONSTRAINT unique_wallet_address UNIQUE (wallet_address);

-- NOTLAR:
-- - wallet_address case-insensitive karşılaştırma için LOWER() kullanılabilir
-- - Kullanıcı cüzdan bağladığında bu alan güncellenecek
-- - reportFoundPet action'ı bu address ile kullanıcıyı bulacak





