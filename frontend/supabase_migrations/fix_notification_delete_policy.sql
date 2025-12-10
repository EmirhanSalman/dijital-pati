-- ============================================
-- FIX: BİLDİRİM SİLME RLS POLİTİKASI
-- ============================================
-- Bu migration, bildirim silme RLS politikasını oluşturur

-- Önce mevcut DELETE politikasını kaldır (eğer varsa)
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;

-- Yeni DELETE politikası: Kullanıcılar sadece kendi bildirimlerini silebilir
CREATE POLICY "Users can delete their own notifications"
    ON public.notifications
    FOR DELETE
    USING (user_id = auth.uid());

-- ============================================
-- NOTLAR
-- ============================================
-- - USING: Hangi satırların silinebileceğini belirler (user_id = auth.uid())
-- - Bu politika sayesinde kullanıcılar sadece kendi bildirimlerini silebilir

