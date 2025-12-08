'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Kullanıcının wallet address'ini profiline kaydeder
 * @param walletAddress - Wallet address (blockchain address)
 * @returns Başarı durumu
 */
export async function saveWalletAddress(walletAddress: string) {
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

    // Wallet address'i temizle ve doğrula
    const cleanAddress = walletAddress.trim().toLowerCase()

    if (!cleanAddress || !/^0x[a-fA-F0-9]{40}$/.test(cleanAddress)) {
      return {
        error: 'Geçersiz wallet address formatı.',
      }
    }

    // Wallet address'i profile kaydet
    const { error } = await supabase
      .from('profiles')
      .update({ wallet_address: cleanAddress })
      .eq('id', user.id)

    if (error) {
      throw error
    }

    revalidatePath('/profile')

    return {
      success: true,
      message: 'Cüzdan adresi başarıyla kaydedildi!',
    }
  } catch (error: any) {
    console.error('saveWalletAddress error:', error)
    return {
      error: error.message || 'Cüzdan adresi kaydedilirken bir hata oluştu.',
    }
  }
}

/**
 * Kullanıcının avatar resmini yükler ve profiline kaydeder
 * @param formData - FormData içinde file olarak resim
 * @returns Başarı durumu
 */
export async function uploadAvatar(formData: FormData) {
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

    const file = formData.get('avatar') as File
    if (!file) {
      return {
        error: 'Dosya seçilmedi.',
      }
    }

    // Dosya tipini kontrol et
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return {
        error: 'Sadece JPEG, PNG, WebP veya GIF formatında resim yükleyebilirsiniz.',
      }
    }

    // Dosya boyutunu kontrol et (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return {
        error: 'Resim boyutu 5MB\'dan küçük olmalıdır.',
      }
    }

    // Dosya adını oluştur (user_id/timestamp.extension)
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    // Eski avatar'ı sil (varsa)
    const { data: profile } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single()

    if (profile?.avatar_url) {
      // Eski avatar URL'inden dosya yolunu çıkar
      const oldPath = profile.avatar_url.split('/').slice(-2).join('/')
      if (oldPath.startsWith(user.id)) {
        await supabase.storage.from('avatars').remove([`${user.id}/${oldPath.split('/')[1]}`])
      }
    }

    // Resmi storage'a yükle
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      throw uploadError
    }

    // Public URL'i al
    const {
      data: { publicUrl },
    } = supabase.storage.from('avatars').getPublicUrl(fileName)

    // Profili güncelle
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id)

    if (updateError) {
      throw updateError
    }

    revalidatePath('/profile')

    return {
      success: true,
      message: 'Profil fotoğrafı başarıyla yüklendi!',
      url: publicUrl,
    }
  } catch (error: any) {
    console.error('uploadAvatar error:', error)
    return {
      error: error.message || 'Profil fotoğrafı yüklenirken bir hata oluştu.',
    }
  }
}

