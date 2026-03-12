'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { uploadToPinata } from '@/lib/ipfs/pinata'

/**
 * Pet resmini IPFS'e (Pinata) yükler
 * Falls back to Supabase Storage if Pinata is not configured
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

    // Dosya boyutunu kontrol et (100MB for Pinata, 10MB fallback)
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      return {
        error: `Resim boyutu ${(maxSize / 1024 / 1024).toFixed(0)}MB'dan küçük olmalıdır.`,
      }
    }

    // Try Pinata IPFS upload first
    const hasPinataConfig =
      process.env.NEXT_PUBLIC_PINATA_JWT ||
      (process.env.NEXT_PUBLIC_PINATA_API_KEY && process.env.NEXT_PUBLIC_PINATA_SECRET_KEY)

    if (hasPinataConfig) {
      try {
        console.log('🔄 Attempting Pinata IPFS upload...')
        const pinataResult = await uploadToPinata(file)

        return {
          success: true,
          ipfsHash: pinataResult.ipfsHash,
          hash: pinataResult.ipfsHash, // Alias for compatibility
          IpfsHash: pinataResult.ipfsHash, // Alias for compatibility
          url: pinataResult.gatewayUrl, // Gateway URL for display
          message: 'Resim başarıyla IPFS\'e yüklendi!',
        }
      } catch (pinataError: any) {
        console.error('❌ Pinata upload failed, falling back to Supabase:', pinataError)
        // Fall through to Supabase Storage fallback
      }
    } else {
      console.warn('⚠️ Pinata credentials not found, using Supabase Storage fallback')
    }

    // Fallback to Supabase Storage if Pinata fails or is not configured
    console.log('🔄 Using Supabase Storage fallback...')

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

    // Return Supabase URL (no IPFS hash available)
    return {
      success: true,
      url: publicUrl,
      message: 'Resim başarıyla yüklendi! (Supabase Storage)',
      // Note: No ipfsHash for Supabase Storage uploads
    }
  } catch (error: any) {
    console.error('uploadPetImage error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })
    return {
      error: error.message || 'Resim yüklenirken bir hata oluştu.',
    }
  }
}

/**
 * Pet bilgilerini veritabanına kaydeder
 */
export async function savePetToDatabase(petInput: {
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

    // Validate tokenId is provided and is a valid string/number
    if (!petInput.tokenId) {
      console.error("❌ savePetToDatabase: tokenId is missing!");
      return {
        error: "Token ID (tokenId) is required and must come from blockchain receipt.",
      };
    }

    // Convert tokenId to string to ensure consistency
    const tokenIdString = String(petInput.tokenId).trim();
    
    if (!tokenIdString || tokenIdString === "null" || tokenIdString === "undefined") {
      console.error("❌ savePetToDatabase: Invalid tokenId value:", petInput.tokenId);
      return {
        error: "Invalid token ID. Token ID must come directly from blockchain receipt.",
      };
    }

    console.log("💾 Saving pet to database:");
    console.log("  📍 token_id (from blockchain):", tokenIdString);
    console.log("  📍 name:", petInput.name);
    console.log("  📍 owner_address:", petInput.ownerAddress);
    console.log("  ⚠️ Note: DB 'id' (auto-increment) will differ from 'token_id' (blockchain)");

    // Pets tablosuna kaydet (eğer varsa)
    // Use contact_phone and contact_email if available, fallback to contact_info for backwards compatibility
    // IMPORTANT: token_id comes from blockchain, NOT from any local counter
    const insertData: any = {
      token_id: tokenIdString, // EXACT value from blockchain receipt
      name: petInput.name,
      breed: petInput.breed,
      description: petInput.description,
      image_url: petInput.imageUrl,
      owner_address: petInput.ownerAddress,
      owner_id: user.id,
    };

    // Prefer separate phone/email fields if provided
    if (petInput.phone !== undefined && petInput.phone !== null) {
      insertData.contact_phone = petInput.phone;
    }
    if (petInput.email !== undefined && petInput.email !== null) {
      insertData.contact_email = petInput.email;
    }
    
    // Fallback to contact_info for backwards compatibility
    if (petInput.contactInfo) {
      insertData.contact_info = petInput.contactInfo;
    }

    // Add location fields
    if (petInput.city !== undefined && petInput.city !== null) {
      insertData.city = petInput.city.trim();
    }
    if (petInput.district !== undefined && petInput.district !== null) {
      insertData.district = petInput.district.trim();
    }

    const { data: savedRecord, error } = await supabase
      .from('pets')
      .insert([insertData])
      .select()
      .single()

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
      data: savedRecord, // Return the created record with id
    }
  } catch (error: any) {
    console.error('savePetToDatabase error:', error)
    return {
      error: error.message || 'Veritabanına kaydedilirken bir hata oluştu.',
    }
  }
}

