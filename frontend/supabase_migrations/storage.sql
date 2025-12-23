-- ============================================
-- SUPABASE STORAGE - AVATAR BUCKET
-- ============================================

-- 1. avatars storage bucket'ını oluştur
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true, -- Herkes avatarları görebilir
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLİTİKALARI
-- ============================================

-- 2. SELECT Politikası: Herkes avatarları görebilir (bucket public olduğu için gerekli değil ama explicit olsun)
CREATE POLICY IF NOT EXISTS "Public avatars are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- 3. INSERT Politikası: Sadece giriş yapmış kullanıcılar kendi klasörüne resim yükleyebilir
-- Dosya yolu: avatars/{user_id}/{filename}
CREATE POLICY IF NOT EXISTS "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. UPDATE Politikası: Kullanıcılar sadece kendi klasöründeki resimleri güncelleyebilir
CREATE POLICY IF NOT EXISTS "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. DELETE Politikası: Kullanıcılar sadece kendi klasöründeki resimleri silebilir
CREATE POLICY IF NOT EXISTS "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- NOTLAR
-- ============================================
-- - Avatar dosyaları: avatars/{user_id}/{filename} formatında saklanır
-- - Maksimum dosya boyutu: 5MB
-- - İzin verilen formatlar: JPEG, JPG, PNG, WebP, GIF
-- - Herkes avatarları görebilir (public bucket)
-- - Kullanıcılar sadece kendi klasörüne resim yükleyebilir/güncelleyebilir/silebilir
-- - URL formatı: {SUPABASE_URL}/storage/v1/object/public/avatars/{user_id}/{filename}



