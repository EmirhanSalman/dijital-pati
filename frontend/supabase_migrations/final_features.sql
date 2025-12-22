-- ============================================
-- FİNAL ÖZELLİKLER: BİLDİRİM SİSTEMİ
-- ============================================

-- 1. notifications tablosunu oluştur
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('reply', 'lost_pet_found', 'mention', 'system')),
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT false NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. İndeksler ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);

-- ============================================
-- TRİGGER: YORUM BİLDİRİMİ
-- ============================================

-- 3. Yorum bildirimi oluşturan trigger fonksiyonu
CREATE OR REPLACE FUNCTION public.handle_forum_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
    post_owner_id UUID;
    commenter_name TEXT;
BEGIN
    -- Konu sahibinin ID'sini al
    SELECT user_id INTO post_owner_id
    FROM public.forum_posts
    WHERE id = NEW.post_id;

    -- Eğer yorumu yapan kişi konu sahibi ise bildirim oluşturma
    IF post_owner_id = NEW.user_id THEN
        RETURN NEW;
    END IF;

    -- Yorumu yapan kişinin adını al
    SELECT COALESCE(full_name, username, 'Birisi') INTO commenter_name
    FROM public.profiles
    WHERE id = NEW.user_id;

    -- Bildirim oluştur
    INSERT INTO public.notifications (user_id, type, message, link, metadata)
    VALUES (
        post_owner_id,
        'reply',
        commenter_name || ' konunuza yorum yaptı: "' || LEFT(NEW.content, 100) || '"',
        '/forum/' || (SELECT slug FROM public.forum_posts WHERE id = NEW.post_id),
        jsonb_build_object(
            'post_id', NEW.post_id,
            'comment_id', NEW.id,
            'commenter_id', NEW.user_id
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger oluştur (INSERT sonrası)
DROP TRIGGER IF EXISTS notify_on_forum_comment ON public.forum_comments;
CREATE TRIGGER notify_on_forum_comment
    AFTER INSERT ON public.forum_comments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_forum_comment_notification();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLİTİKALARI
-- ============================================

-- RLS'yi etkinleştir
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 5. SELECT Politikası: Kullanıcılar sadece kendi bildirimlerini görebilir
CREATE POLICY "Users can view their own notifications"
    ON public.notifications
    FOR SELECT
    USING (user_id = auth.uid());

-- 6. UPDATE Politikası: Kullanıcılar sadece kendi bildirimlerini güncelleyebilir (okundu olarak işaretleme)
CREATE POLICY "Users can update their own notifications"
    ON public.notifications
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 7. INSERT Politikası: Sadece sistem bildirim oluşturabilir (trigger'lar aracılığıyla)
-- Bu politika özellikle tanımlanmayacak, çünkü bildirimler sadece trigger'lar aracılığıyla oluşturulacak
-- Eğer manuel insert gerekiyorsa, admin yetkisi kontrolü yapılabilir

-- ============================================
-- VIEW: KULLANICI BİLDİRİM İSTATİSTİKLERİ (OPSİYONEL)
-- ============================================

-- 8. Okunmamış bildirim sayısını hızlıca görmek için view
CREATE OR REPLACE VIEW public.user_unread_notifications_count AS
SELECT 
    user_id,
    COUNT(*) as unread_count
FROM public.notifications
WHERE is_read = false
GROUP BY user_id;

-- ============================================
-- NOTLAR
-- ============================================
-- - Bildirimler trigger'lar aracılığıyla otomatik oluşturulur
-- - Kullanıcılar sadece kendi bildirimlerini görebilir
-- - Yorum bildirimi: Başka biri konuya yorum yapınca konu sahibine bildirim gider
-- - Kayıp hayvan bildirimi: reportFoundPet action'ı tarafından manuel oluşturulacak


