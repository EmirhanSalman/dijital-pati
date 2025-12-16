-- ============================================
-- TEMİZLİK (Eskisi gitsin, temiz sayfa açalım)
-- ============================================
DROP TABLE IF EXISTS public.contact_messages;

-- ============================================
-- İLETİŞİM MESAJLARI TABLOSU
-- ============================================
CREATE TABLE public.contact_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- DÜZELTME BURADA: UUID yerine BIGINT (Sayı) yaptık.
    -- Çünkü senin pets tablon sayı kullanıyor.
    pet_id BIGINT REFERENCES public.pets(id) ON DELETE CASCADE,
    
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    sender_name TEXT NOT NULL,
    sender_phone TEXT NOT NULL,
    sender_email TEXT,
    message TEXT NOT NULL,
    location_latitude NUMERIC(10, 8),
    location_longitude NUMERIC(11, 8),
    location_link TEXT,
    is_read BOOLEAN DEFAULT false NOT NULL
);

-- ============================================
-- İNDEKSLER
-- ============================================
CREATE INDEX IF NOT EXISTS idx_contact_messages_owner_id ON public.contact_messages(owner_id);
CREATE INDEX IF NOT EXISTS idx_contact_messages_pet_id ON public.contact_messages(pet_id);
CREATE INDEX IF NOT EXISTS idx_contact_messages_is_read ON public.contact_messages(is_read);

-- ============================================
-- GÜVENLİK VE İZİNLER (RLS)
-- ============================================

-- ÖNCE: Tüm eski politikaları temizle
DROP POLICY IF EXISTS "Anyone can insert contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Owners can view their own messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Owners can update their own messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Allow all inserts for contact messages" ON public.contact_messages;

-- RLS'yi etkinleştir
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Tablo izinlerini ver
GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT SELECT, UPDATE ON public.contact_messages TO authenticated;

-- 1. Ekleme (INSERT): Herkes yapabilir (Anonim dahil)
-- ÖNEMLİ: TO anon, authenticated ile hem anonim hem giriş yapmış kullanıcılar insert yapabilir
CREATE POLICY "Anyone can insert contact messages"
    ON public.contact_messages
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- 2. Okuma (SELECT): Sadece sahibi yapabilir
CREATE POLICY "Owners can view their own messages"
    ON public.contact_messages
    FOR SELECT
    TO authenticated
    USING (owner_id = auth.uid());

-- 3. Güncelleme (UPDATE): Sadece sahibi yapabilir (Okundu bilgisi için)
CREATE POLICY "Owners can update their own messages"
    ON public.contact_messages
    FOR UPDATE
    TO authenticated
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());