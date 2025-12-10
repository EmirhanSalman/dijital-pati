'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Pet resmini Supabase Storage'a yükler
 */
export async function uploadPetImage(formData: FormData) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        error: 'Giriş yapmanız gerekiyor.',
      }
    }

    const file = formData.get('image') as File
    if (!file) {
      return {
        error: 'Dosya seçilmedi.',
      }
    }

    // Dosya tipini kontrol et
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return {
        error: 'Sadece JPEG, PNG veya WebP formatında resim yükleyebilirsiniz.',
      }
    }

    // Dosya boyutunu kontrol et (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return {
        error: 'Resim boyutu 10MB\'dan küçük olmalıdır.',
      }
    }

    // Dosya adını oluştur
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}.${fileExt}`

    // Resmi storage'a yükle
    const { error: uploadError } = await supabase.storage
      .from('pet-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Pet image upload error:', uploadError)
      return {
        error: uploadError.message || 'Resim yüklenirken bir hata oluştu.',
      }
    }

    // Public URL'i al
    const {
      data: { publicUrl },
    } = supabase.storage.from('pet-images').getPublicUrl(fileName)

    return {
      success: true,
      url: publicUrl,
      message: 'Resim başarıyla yüklendi!',
    }
  } catch (error: any) {
    console.error('uploadPetImage error:', error)
    return {
      error: error.message || 'Resim yüklenirken bir hata oluştu.',
    }
  }
}

/**
 * Pet bilgilerini veritabanına kaydeder
 */
export async function savePetToDatabase(data: {
  tokenId: string
  name: string
  breed: string
  description: string
  imageUrl: string
  ownerAddress: string
  phone?: string | null
  email?: string | null
  contactInfo?: string // Backwards compatibility
  city?: string | null
  district?: string | null
}) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        error: 'Giriş yapmanız gerekiyor.',
      }
    }

    // Pets tablosuna kaydet (eğer varsa)
    // Use contact_phone and contact_email if available, fallback to contact_info for backwards compatibility
    const insertData: any = {
      token_id: data.tokenId,
      name: data.name,
      breed: data.breed,
      description: data.description,
      image_url: data.imageUrl,
      owner_address: data.ownerAddress,
      owner_id: user.id,
    };

    // Prefer separate phone/email fields if provided
    if (data.phone !== undefined && data.phone !== null) {
      insertData.contact_phone = data.phone;
    }
    if (data.email !== undefined && data.email !== null) {
      insertData.contact_email = data.email;
    }
    
    // Fallback to contact_info for backwards compatibility
    if (data.contactInfo) {
      insertData.contact_info = data.contactInfo;
    }

    // Add location fields
    if (data.city !== undefined && data.city !== null) {
      insertData.city = data.city.trim();
    }
    if (data.district !== undefined && data.district !== null) {
      insertData.district = data.district.trim();
    }

    const { error } = await supabase
      .from('pets')
      .insert(insertData)

    if (error) {
      console.error('savePetToDatabase error:', error)
      
      // Column not found hatası
      if (error.code === '42703' || error.message?.includes('column') || error.message?.includes('does not exist')) {
        return {
          error: 'Veritabanı Hatası: Eksik sütun tespit edildi. Lütfen veritabanı migrasyonlarını kontrol edin.',
        }
      }
      
      // Table not found hatası
      if (error.code === '42P01') {
        console.warn('pets tablosu bulunamadı, veritabanı kaydı atlanıyor')
        return {
          error: 'Veritabanı Hatası: pets tablosu bulunamadı. Lütfen veritabanı migrasyonlarını çalıştırın.',
        }
      }
      
      // RLS (Row Level Security) hatası
      if (error.code === '42501' || error.message?.includes('permission denied')) {
        return {
          error: 'Yetki Hatası: Veritabanına kayıt ekleme yetkiniz yok.',
        }
      }
      
      // Detaylı hata mesajı
      return {
        error: `Veritabanı Hatası: ${error.message || 'Veritabanına kaydedilirken bir hata oluştu.'}`,
      }
    }

    revalidatePath('/profile')
    return {
      success: true,
      message: 'Pet başarıyla kaydedildi!',
    }
  } catch (error: any) {
    console.error('savePetToDatabase error:', error)
    return {
      error: error.message || 'Veritabanına kaydedilirken bir hata oluştu.',
    }
  }
}

