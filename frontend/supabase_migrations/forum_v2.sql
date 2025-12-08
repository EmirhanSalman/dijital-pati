-- ============================================
-- FORUM V2: OY SİSTEMİ (LIKE/DISLIKE) VE PUAN HESAPLAMA
-- ============================================

-- 1. forum_votes tablosunu oluştur
CREATE TABLE IF NOT EXISTS public.forum_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE NOT NULL,
    vote_type INTEGER NOT NULL CHECK (vote_type IN (1, -1)),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, post_id)
);

-- 2. İndeksler ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_forum_votes_post_id ON public.forum_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_votes_user_id ON public.forum_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_votes_vote_type ON public.forum_votes(vote_type);

-- 3. updated_at otomatik güncelleme için trigger fonksiyonu
CREATE OR REPLACE FUNCTION public.handle_forum_vote_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger oluştur
DROP TRIGGER IF EXISTS set_forum_vote_updated_at ON public.forum_votes;
CREATE TRIGGER set_forum_vote_updated_at
    BEFORE UPDATE ON public.forum_votes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_forum_vote_updated_at();

-- ============================================
-- PUAN HESAPLAMA FONKSİYONU
-- ============================================

-- 5. Bir post'un toplam puanını (score) hesaplayan fonksiyon
CREATE OR REPLACE FUNCTION public.get_post_score(p_post_id UUID)
RETURNS INTEGER AS $$
DECLARE
    total_score INTEGER;
BEGIN
    SELECT COALESCE(SUM(vote_type), 0) INTO total_score
    FROM public.forum_votes
    WHERE post_id = p_post_id;
    
    RETURN total_score;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLİTİKALARI
-- ============================================

-- RLS'yi etkinleştir
ALTER TABLE public.forum_votes ENABLE ROW LEVEL SECURITY;

-- 6. SELECT Politikası: Herkes oyları görebilir
CREATE POLICY "Anyone can view forum votes"
    ON public.forum_votes
    FOR SELECT
    USING (true);

-- 7. INSERT Politikası: Giriş yapmış kullanıcılar oy verebilir
CREATE POLICY "Authenticated users can vote"
    ON public.forum_votes
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND user_id = auth.uid()
    );

-- 8. UPDATE Politikası: Kullanıcılar sadece kendi oylarını güncelleyebilir
CREATE POLICY "Users can update their own votes"
    ON public.forum_votes
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 9. DELETE Politikası: Kullanıcılar sadece kendi oylarını silebilir
CREATE POLICY "Users can delete their own votes"
    ON public.forum_votes
    FOR DELETE
    USING (user_id = auth.uid());

-- ============================================
-- VIEW: FORUM POSTS WITH SCORES (OPSIYONEL - PERFORMANS İÇİN)
-- ============================================

-- 10. Forum gönderilerini puanlarıyla birlikte gösteren view
CREATE OR REPLACE VIEW public.forum_posts_with_scores AS
SELECT 
    fp.*,
    COALESCE(
        (SELECT SUM(vote_type) FROM public.forum_votes WHERE post_id = fp.id),
        0
    ) as score,
    COALESCE(
        (SELECT COUNT(*) FROM public.forum_votes WHERE post_id = fp.id),
        0
    ) as vote_count
FROM public.forum_posts fp;

-- ============================================
-- NOTLAR
-- ============================================
-- - vote_type: 1 = like, -1 = dislike
-- - UNIQUE constraint sayesinde bir kullanıcı bir post'a sadece bir oy verebilir
-- - Eğer kullanıcı aynı oyu tekrar verirse, UPDATE yapılabilir (oy değişimi)
-- - Puan hesaplama için get_post_score() fonksiyonu kullanılabilir

