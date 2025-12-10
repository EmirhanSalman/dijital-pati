-- ============================================
-- FIX: YORUM SİLME RLS POLİTİKALARI
-- ============================================
-- Bu migration, yorum silme RLS politikalarını günceller
-- Admin ve yorum sahibi her ikisi de yorum silebilir

-- Önce mevcut DELETE politikalarını kaldır
DROP POLICY IF EXISTS "Users can delete their own forum comments" ON public.forum_comments;
DROP POLICY IF EXISTS "Admins can delete any forum comment" ON public.forum_comments;

-- Yeni DELETE politikası: Kullanıcılar sadece kendi yorumlarını silebilir
CREATE POLICY "Users can delete their own forum comments"
    ON public.forum_comments
    FOR DELETE
    USING (user_id = auth.uid());

-- Yeni DELETE politikası: Adminler tüm yorumları silebilir
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
-- - İki ayrı DELETE politikası var: biri kullanıcılar için, biri adminler için
-- - Supabase RLS'de birden fazla politika varsa OR mantığıyla birleşir
-- - Yani: (user_id = auth.uid()) OR (admin kontrolü) = true ise silme izni verilir

