-- ============================================
-- FORUM TABLOSU OLUŞTURMA
-- ============================================

-- 1. forum_posts tablosunu oluştur
CREATE TABLE IF NOT EXISTS public.forum_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    category TEXT DEFAULT 'Genel' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. İndeksler ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at ON public.forum_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_posts_user_id ON public.forum_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_category ON public.forum_posts(category);
CREATE INDEX IF NOT EXISTS idx_forum_posts_slug ON public.forum_posts(slug);

-- 3. updated_at otomatik güncelleme için trigger fonksiyonu
CREATE OR REPLACE FUNCTION public.handle_forum_post_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger oluştur
DROP TRIGGER IF EXISTS set_forum_post_updated_at ON public.forum_posts;
CREATE TRIGGER set_forum_post_updated_at
    BEFORE UPDATE ON public.forum_posts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_forum_post_updated_at();

-- ============================================
-- GAMIFICATION: PUAN SİSTEMİ TRİGGER'I
-- ============================================

-- 5. Yeni konu açıldığında kullanıcıya +10 puan ekleyen trigger fonksiyonu
CREATE OR REPLACE FUNCTION public.handle_forum_post_created()
RETURNS TRIGGER AS $$
BEGIN
    -- Kullanıcının profili varsa puanını 10 artır
    UPDATE public.profiles
    SET points = COALESCE(points, 0) + 10
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger oluştur (INSERT sonrası)
DROP TRIGGER IF EXISTS award_points_for_forum_post ON public.forum_posts;
CREATE TRIGGER award_points_for_forum_post
    AFTER INSERT ON public.forum_posts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_forum_post_created();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLİTİKALARI
-- ============================================

-- RLS'yi etkinleştir
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;

-- 7. SELECT Politikası: Herkes forum gönderilerini görebilir
CREATE POLICY "Anyone can view forum posts"
    ON public.forum_posts
    FOR SELECT
    USING (true);

-- 8. INSERT Politikası: Sadece giriş yapmış kullanıcılar kendi adına konu açabilir
CREATE POLICY "Authenticated users can create forum posts"
    ON public.forum_posts
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND user_id = auth.uid()
    );

-- 9. UPDATE Politikası: Kullanıcılar sadece kendi gönderilerini güncelleyebilir
CREATE POLICY "Users can update their own forum posts"
    ON public.forum_posts
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 10. DELETE Politikası: Kullanıcılar sadece kendi gönderilerini silebilir
CREATE POLICY "Users can delete their own forum posts"
    ON public.forum_posts
    FOR DELETE
    USING (user_id = auth.uid());

-- ============================================
-- NOTLAR
-- ============================================
-- - Slug üretimi uygulama tarafında yapılacak (slugify)
-- - Kategori sistemi ileride genişletilebilir
-- - Yorum sistemi için ayrı bir tablo (forum_comments) ileride eklenecek


