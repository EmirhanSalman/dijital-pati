# Environment Variables Kurulumu

## 📁 Dosya Konumu

`.env.local` dosyası **`frontend/`** klasöründe, `package.json` ile **aynı dizinde** olmalıdır.

```
frontend/
├── .env.local          ← BURADA OLMALI
├── package.json
├── next.config.ts
└── ...
```

## 🔑 Gerekli Environment Variables

`frontend/.env.local` dosyanıza şu değişkenleri ekleyin:

```env
# Supabase Public URL (Zaten var olmalı)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here

# Supabase Anon Key (Zaten var olmalı)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Supabase Service Role Key (YENİ - EKLEMEN GEREKİYOR)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## 🔐 Service Role Key Nasıl Bulunur?

1. [Supabase Dashboard](https://app.supabase.com) → Projenizi seçin
2. **Settings** → **API** sekmesine gidin
3. **Project API keys** bölümünde **`service_role`** key'ini kopyalayın
4. ⚠️ **ÖNEMLİ:** Bu key'i asla client-side kodda kullanmayın! Sadece server-side (server actions, API routes) için kullanın.

## ✅ Kontrol

Sunucuyu yeniden başlattıktan sonra, terminalde şu log'ları görmelisiniz:

```
🔍 [DEBUG] Environment Variables Kontrolü: {
  hasSupabaseUrl: true,
  hasServiceRoleKey: true,
  serviceRoleKeyLength: 100+ (yaklaşık)
}
```

Eğer `hasServiceRoleKey: false` görüyorsanız:
1. `.env.local` dosyasının `frontend/` klasöründe olduğundan emin olun
2. Dosya adının tam olarak `.env.local` olduğundan emin olun (`.env` değil!)
3. Sunucuyu **tamamen durdurup yeniden başlatın** (`Ctrl+C` sonra `npm run dev`)

## 🚨 Güvenlik Uyarısı

- `SUPABASE_SERVICE_ROLE_KEY` asla `.git`'e commit edilmemeli
- `.env.local` dosyası zaten `.gitignore`'da olmalı
- Bu key tüm RLS politikalarını bypass eder, dikkatli kullanın!


