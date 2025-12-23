-- ============================================
-- HABERLER/DUYURULAR TABLOSU OLUŞTURMA
-- ============================================

-- 1. news tablosunu oluştur
CREATE TABLE IF NOT EXISTS public.news (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 2. İndeksler ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_news_created_at ON public.news(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_is_active ON public.news(is_active) WHERE is_active = true;

-- 3. updated_at otomatik güncelleme için trigger fonksiyonu
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger oluştur
DROP TRIGGER IF EXISTS set_updated_at ON public.news;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.news
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLİTİKALARI
-- ============================================

-- RLS'yi etkinleştir
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

-- 5. SELECT Politikası: Herkes aktif haberleri okuyabilir
CREATE POLICY "Anyone can view active news"
    ON public.news
    FOR SELECT
    USING (is_active = true);

-- Adminler tüm haberleri (aktif + pasif) görebilir
CREATE POLICY "Admins can view all news"
    ON public.news
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- 6. INSERT Politikası: Sadece adminler haber ekleyebilir
CREATE POLICY "Only admins can insert news"
    ON public.news
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- 7. UPDATE Politikası: Sadece adminler haber güncelleyebilir
CREATE POLICY "Only admins can update news"
    ON public.news
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- 8. DELETE Politikası: Sadece adminler haber silebilir
CREATE POLICY "Only admins can delete news"
    ON public.news
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- ============================================
-- YORUMLAR (OPSIYONEL - İLERİDE KULLANILABİLİR)
-- ============================================
-- Şimdilik yorumsuz bırakıyoruz, ileride eklenebilir

-- ============================================
-- NOT: Eğer profiles tablosunda role sütunu yoksa
-- aşağıdaki SQL'i çalıştırın:
-- ============================================
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
-- CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);



