-- ============================================
-- FORUM YORUM SİSTEMİ (COMMENTS)
-- ============================================

-- 1. forum_comments tablosunu oluştur
CREATE TABLE IF NOT EXISTS public.forum_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. İndeksler ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_forum_comments_post_id ON public.forum_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_comments_user_id ON public.forum_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_comments_created_at ON public.forum_comments(created_at);

-- 3. updated_at otomatik güncelleme için trigger fonksiyonu
CREATE OR REPLACE FUNCTION public.handle_forum_comment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger oluştur
DROP TRIGGER IF EXISTS set_forum_comment_updated_at ON public.forum_comments;
CREATE TRIGGER set_forum_comment_updated_at
    BEFORE UPDATE ON public.forum_comments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_forum_comment_updated_at();

-- ============================================
-- GAMIFICATION: PUAN SİSTEMİ TRİGGER'I
-- ============================================

-- 5. Yeni yorum yapıldığında kullanıcıya +2 puan ekleyen trigger fonksiyonu
CREATE OR REPLACE FUNCTION public.handle_forum_comment_created()
RETURNS TRIGGER AS $$
BEGIN
    -- Kullanıcının profili varsa puanını 2 artır
    UPDATE public.profiles
    SET points = COALESCE(points, 0) + 2
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger oluştur (INSERT sonrası)
DROP TRIGGER IF EXISTS award_points_for_forum_comment ON public.forum_comments;
CREATE TRIGGER award_points_for_forum_comment
    AFTER INSERT ON public.forum_comments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_forum_comment_created();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLİTİKALARI
-- ============================================

-- RLS'yi etkinleştir
ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;

-- 7. SELECT Politikası: Herkes forum yorumlarını görebilir
CREATE POLICY "Anyone can view forum comments"
    ON public.forum_comments
    FOR SELECT
    USING (true);

-- 8. INSERT Politikası: Sadece giriş yapmış kullanıcılar yorum yazabilir
CREATE POLICY "Authenticated users can create forum comments"
    ON public.forum_comments
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND user_id = auth.uid()
    );

-- 9. UPDATE Politikası: Kullanıcılar sadece kendi yorumlarını güncelleyebilir
CREATE POLICY "Users can update their own forum comments"
    ON public.forum_comments
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 10. DELETE Politikası: Kullanıcılar sadece kendi yorumlarını silebilir
CREATE POLICY "Users can delete their own forum comments"
    ON public.forum_comments
    FOR DELETE
    USING (user_id = auth.uid());

-- 11. Admin DELETE Politikası: Adminler tüm yorumları silebilir
CREATE POLICY "Admins can delete any forum comment"
    ON public.forum_comments
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- ============================================
-- NOTLAR
-- ============================================
-- - Yorum yapınca kullanıcıya +2 puan eklenir
-- - Kullanıcılar sadece kendi yorumlarını silebilir
-- - Adminler tüm yorumları silebilir
-- - Konu silinince tüm yorumları da otomatik silinir (CASCADE)




