-- ============================================
-- FIX: BİLDİRİM GÜNCELLEME RLS POLİTİKASI
-- ============================================
-- Bu migration, bildirim güncelleme RLS politikasını kontrol eder ve gerekirse yeniden oluşturur

-- Önce mevcut UPDATE politikasını kaldır (eğer varsa)
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

-- Yeni UPDATE politikası: Kullanıcılar sadece kendi bildirimlerini güncelleyebilir
CREATE POLICY "Users can update their own notifications"
    ON public.notifications
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ============================================
-- NOTLAR
-- ============================================
-- - USING: Hangi satırların güncellenebileceğini belirler (user_id = auth.uid())
-- - WITH CHECK: Güncelleme sonrası yeni değerlerin kontrolünü yapar (user_id = auth.uid())
-- - Bu politika sayesinde kullanıcılar sadece kendi bildirimlerinin is_read alanını güncelleyebilir

