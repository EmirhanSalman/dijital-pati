'use server'

import { createClient } from '@/lib/supabase/server'
import { createNotification } from '@/lib/supabase/server'
import { sendLostPetAlert } from '@/lib/mail'
import { revalidatePath } from 'next/cache'

/**
 * Kayıp hayvan bulunduğunda sahibine bildirim gönderir
 * @param petId - Hayvan NFT ID'si (tokenId)
 * @param ownerAddress - Pet sahibinin wallet address'i (blockchain'den alınmalı)
 * @param latitude - Konum enlemi (opsiyonel)
 * @param longitude - Konum boylamı (opsiyonel)
 * @param contactInfo - Bulan kişinin iletişim bilgisi
 * @returns Başarı durumu
 */
export async function reportFoundPet(
  petId: string,
  ownerAddress: string | null,
  latitude: number | null,
  longitude: number | null,
  contactInfo: string
) {
  try {
    const supabase = await createClient()

    // Google Maps linki oluştur
    let locationLink = '#'
    if (latitude !== null && longitude !== null) {
      locationLink = `https://www.google.com/maps?q=${latitude},${longitude}`
    }

    const petName = `Pati #${petId}`
    const message = `${petName} bulundu! Birisi sizinle iletişime geçmek istiyor.`

    // Owner address varsa, Supabase'de bu address'e sahip kullanıcıyı bul
    let ownerUserId: string | null = null
    let ownerEmail: string | null = null

    if (ownerAddress) {
      const cleanAddress = ownerAddress.trim().toLowerCase()
      
      // Wallet address ile kullanıcıyı bul
      const { data: ownerProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('wallet_address', cleanAddress)
        .single()

      if (ownerProfile && !profileError) {
        ownerUserId = ownerProfile.id

        // Owner'ın email'ini auth.users'dan çekmeye çalış
        // Not: Bu işlem için service role key gerekiyor, şimdilik bildirim göndermek yeterli
      }
    }

    // Bildirim oluştur (owner userId varsa)
    if (ownerUserId) {
      await supabase.from('notifications').insert([
        {
          user_id: ownerUserId,
          type: 'lost_pet_found',
          message: message,
          link: `/pet/${petId}`,
          metadata: {
            pet_id: petId,
            latitude,
            longitude,
            finder_contact: contactInfo,
            location_link: locationLink,
          },
        },
      ])
    }

    revalidatePath(`/pet/${petId}`)

    return {
      success: true,
      message: 'Sahibine bilgi verildi!',
    }
  } catch (error: any) {
    console.error('reportFoundPet error:', error)
    return {
      error: error.message || 'Bildirim gönderilirken bir hata oluştu.',
    }
  }
}

/**
 * Konum paylaşımı için bildirim gönderir (sadece bildirim, e-posta yok)
 * @param petId - Hayvan NFT ID'si (tokenId)
 * @param ownerId - Pet sahibinin user ID'si
 * @param latitude - Konum enlemi
 * @param longitude - Konum boylamı
 * @returns Başarı durumu
 */
export async function shareLocation(
  petId: string,
  ownerId: string | null,
  latitude: number,
  longitude: number
) {
  try {
    // Pet bilgisini al (pet adı için)
    const supabase = await createClient()
    const { data: petData } = await supabase
      .from('pets')
      .select('name, token_id, owner_id')
      .eq('token_id', petId)
      .single()

    // Eğer ownerId verilmemişse, pet'ten al
    const finalOwnerId = ownerId || petData?.owner_id

    if (!finalOwnerId) {
      return {
        error: 'Hayvan sahibi bulunamadı.',
      }
    }

    // Pet adını belirle
    const petName = petData?.name && petData.name.trim() && !petData.name.startsWith('Pati #')
      ? petData.name
      : `Pati #${petId}`

    // Google Maps linki oluştur
    const locationLink = `https://www.google.com/maps?q=${latitude},${longitude}`

    // Bildirim oluştur
    const notificationResult = await createNotification({
      userId: finalOwnerId,
      type: 'location_alert',
      message: `DİKKAT! Biri ${petName} ilanınız için konum bildirdi. Haritada görmek için tıklayın.`,
      link: locationLink,
      metadata: {
        pet_id: petId,
        pet_name: petName,
        latitude,
        longitude,
        location_link: locationLink,
      },
    })

    if (!notificationResult.success) {
      return {
        error: notificationResult.error || 'Bildirim oluşturulamadı.',
      }
    }

    revalidatePath(`/pet/${petId}`)

    return {
      success: true,
      message: 'Konum başarıyla sahibine iletildi.',
    }
  } catch (error: any) {
    console.error('shareLocation error:', error)
    return {
      error: error.message || 'Konum paylaşılırken bir hata oluştu.',
    }
  }
}
