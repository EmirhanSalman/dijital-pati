-- Forum post cover images + pets/forum storage buckets (mobile uploads)

ALTER TABLE public.forum_posts
ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMENT ON COLUMN public.forum_posts.image_url IS 'Optional cover image URL from Supabase Storage (forum bucket)';

-- pets bucket (public read; authenticated users upload under their user id folder)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pets',
  'pets',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- forum bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'forum',
  'forum',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- pets policies
CREATE POLICY IF NOT EXISTS "Public pet images are viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'pets');

CREATE POLICY IF NOT EXISTS "Users can upload pet images to own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'pets'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY IF NOT EXISTS "Users can update own pet images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'pets'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- forum policies
CREATE POLICY IF NOT EXISTS "Public forum images are viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'forum');

CREATE POLICY IF NOT EXISTS "Users can upload forum images to own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'forum'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY IF NOT EXISTS "Users can update own forum images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'forum'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);
