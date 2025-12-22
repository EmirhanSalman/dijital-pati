'use server'

import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createNotification } from '@/lib/supabase/server'

/**
 * Hayvan sahibine iletişim mesajı gönderir
 */
export async function sendContactEmail(data: {
  petId: string
  petName: string
  ownerEmail: string
  finderName: string
  finderPhone: string
  message: string
  location: { lat: number; lng: number } | null
}) {
  // DEBUG: Environment variables kontrolü
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  console.log('🔍 [DEBUG] Environment Variables Kontrolü:', {
    hasSupabaseUrl: !!supabaseUrl,
    supabaseUrlLength: supabaseUrl?.length || 0,
    hasServiceRoleKey: !!supabaseServiceRoleKey,
    serviceRoleKeyLength: supabaseServiceRoleKey?.length || 0,
    serviceRoleKeyPrefix: supabaseServiceRoleKey ? `${supabaseServiceRoleKey.substring(0, 10)}...` : 'undefined',
    allEnvKeys: Object.keys(process.env).filter(key => 
      key.includes('SUPABASE') || key.includes('NEXT_PUBLIC')
    ),
  })

  try {
    const { petId, petName, ownerEmail, finderName, finderPhone, message, location } = data

    // Google Maps linki oluştur (eğer konum varsa)
    const locationLink = location
      ? `https://www.google.com/maps?q=${location.lat},${location.lng}`
      : null

    // Mail içeriği
    const emailSubject = `Müjde! Kayıp dostunuz ${petName} için birisi iletişime geçti.`
    
    const emailBody = `
Müjde! Kayıp dostunuz için birisi iletişime geçti.

Pet Bilgileri:
- Ad: ${petName}
- ID: #${petId}

Bulan Kişi Bilgileri:
- Ad: ${finderName}
- Telefon: ${finderPhone}

Mesaj:
${message}

${locationLink ? `Konum: ${locationLink}` : 'Konum paylaşılmadı.'}

---
Bu mesaj DijitalPati platformu üzerinden gönderilmiştir.
`.trim()

    // Resend API key kontrolü ve validasyonu
    const resendApiKey = process.env.RESEND_API_KEY
    let emailError: string | null = null

    if (!resendApiKey || resendApiKey.trim() === '') {
      console.warn('⚠️ [RESEND] RESEND_API_KEY environment variable is missing or empty')
      console.warn('⚠️ [RESEND] Email will not be sent. Please add RESEND_API_KEY to your .env.local file')
      emailError = 'RESEND_API_KEY environment variable is missing'
      // Continue with database operations even if email fails
    } else {
      // Resend API kullanarak mail gönder
      try {
        const resend = await import('resend')
        const resendClient = new resend.Resend(resendApiKey.trim())

        // Use 'onboarding@resend.dev' as default if no verified domain is configured
        // This is Resend's default sender for unverified domains
        const fromEmail = process.env.RESEND_FROM_EMAIL?.trim() || 'onboarding@resend.dev'
        
        console.log('📧 [RESEND] Attempting to send email:', {
          from: fromEmail,
          to: ownerEmail,
          subject: emailSubject,
          hasApiKey: !!resendApiKey,
          apiKeyLength: resendApiKey.length,
        })

        const result = await resendClient.emails.send({
          from: fromEmail,
          to: ownerEmail,
          subject: emailSubject,
          text: emailBody,
        })

        if (result.error) {
          console.error('❌ [RESEND] Email send failed:', {
            error: result.error,
            errorType: typeof result.error,
            errorMessage: result.error.message,
            errorName: result.error.name,
            fullError: JSON.stringify(result.error, null, 2),
          })
          emailError = result.error.message || 'Unknown Resend error'
          // Continue with database operations even if email fails
        } else {
          console.log('✅ [RESEND] Email sent successfully:', {
            id: result.data?.id,
            to: ownerEmail,
            from: fromEmail,
          })
        }
      } catch (resendError: any) {
        console.error('❌ [RESEND] Resend import/usage error:', {
          error: resendError,
          errorType: typeof resendError,
          errorMessage: resendError?.message,
          errorStack: resendError?.stack,
          errorName: resendError?.name,
          fullError: JSON.stringify(resendError, Object.getOwnPropertyNames(resendError), 2),
        })
        emailError = resendError?.message || 'Resend service error'
        // Continue with database operations even if email fails
      }
    }

    // Veritabanına mesaj kaydet ve bildirim oluştur
    try {
      // Normal client ile pet bilgilerini al (SELECT için RLS var)
      const supabase = await createServerClient()
      
      // Pet'in id ve owner_id'sini bul
      const { data: petData, error: petError } = await supabase
        .from('pets')
        .select('id, owner_id')
        .eq('token_id', petId)
        .single()

      if (petError) {
        console.error('Supabase Hatası (Pet Bulunamadı):', {
          error: petError,
          code: petError.code,
          message: petError.message,
          details: petError.details,
          hint: petError.hint,
          petId: petId,
        })
        return {
          error: 'Pet bilgisi bulunamadı. Lütfen tekrar deneyin.',
        }
      }

      if (!petData) {
        console.error('Pet verisi bulunamadı:', { petId })
        return {
          error: 'Pet bilgisi bulunamadı. Lütfen tekrar deneyin.',
        }
      }

      // Owner ID kontrolü
      if (!petData.owner_id) {
        console.error('Owner ID bulunamadı:', { petData, petId })
        return {
          error: 'Pet sahibi bilgisi bulunamadı. Lütfen tekrar deneyin.',
        }
      }

      // Owner ID'nin UUID formatında olduğunu kontrol et
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(petData.owner_id)) {
        console.error('Owner ID geçersiz UUID formatı:', {
          owner_id: petData.owner_id,
          petId: petId,
          petData: petData,
        })
        return {
          error: 'Pet sahibi bilgisi geçersiz. Lütfen tekrar deneyin.',
        }
      }

      // Pet ID kontrolü
      if (!petData.id) {
        console.error('Pet ID bulunamadı:', { petData, petId })
        return {
          error: 'Pet ID bulunamadı. Lütfen tekrar deneyin.',
        }
      }

      console.log('Pet bilgileri alındı:', {
        pet_id: petData.id,
        owner_id: petData.owner_id,
        pet_id_type: typeof petData.id,
        owner_id_type: typeof petData.owner_id,
      })

      // Service Role Key ile admin client oluştur (RLS bypass için)
      // Not: Environment variables fonksiyonun başında kontrol edildi
      if (!supabaseUrl || !supabaseServiceRoleKey) {
        console.error('❌ [HATA] Service Role Key veya Supabase URL bulunamadı:', {
          supabaseUrl: supabaseUrl ? '✅ Var' : '❌ Yok',
          supabaseServiceRoleKey: supabaseServiceRoleKey ? '✅ Var' : '❌ Yok',
          envFileLocation: 'frontend/.env.local (package.json ile aynı dizinde olmalı)',
          requiredVars: [
            'NEXT_PUBLIC_SUPABASE_URL',
            'SUPABASE_SERVICE_ROLE_KEY'
          ],
        })
        return {
          error: 'Sunucu yapılandırması eksik. Lütfen yöneticiye bildirin.',
        }
      }

      // Tip kontrolü ve güvenlik
      if (typeof supabaseUrl !== 'string' || supabaseUrl.trim() === '') {
        console.error('❌ [HATA] Supabase URL geçersiz tip veya boş')
        return {
          error: 'Sunucu yapılandırması geçersiz. Lütfen yöneticiye bildirin.',
        }
      }

      if (typeof supabaseServiceRoleKey !== 'string' || supabaseServiceRoleKey.trim() === '') {
        console.error('❌ [HATA] Service Role Key geçersiz tip veya boş')
        return {
          error: 'Sunucu yapılandırması geçersiz. Lütfen yöneticiye bildirin.',
        }
      }

      console.log('✅ [DEBUG] Admin client oluşturuluyor...')

      // Admin client oluştur (RLS bypass)
      const supabaseAdmin = createClient(supabaseUrl.trim(), supabaseServiceRoleKey.trim(), {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })

      console.log('✅ [DEBUG] Admin client başarıyla oluşturuldu')

      // Mesajı veritabanına kaydet ve ID'sini al (Admin client ile - RLS bypass)
      const { data: newMessage, error: messageError } = await supabaseAdmin
        .from('contact_messages')
        .insert({
          pet_id: petData.id,
          owner_id: petData.owner_id,
          sender_name: finderName,
          sender_phone: finderPhone,
          sender_email: null, // İsteğe bağlı, şimdilik null
          message: message,
          location_latitude: location?.lat || null,
          location_longitude: location?.lng || null,
          location_link: locationLink || null,
          is_read: false,
        })
        .select('id')
        .single()

      if (messageError) {
        console.error('Supabase Hatası (Mesaj Kaydedilemedi):', {
          error: messageError,
          code: messageError.code,
          message: messageError.message,
          details: messageError.details,
          hint: messageError.hint,
          insertData: {
            pet_id: petData.id,
            owner_id: petData.owner_id,
            sender_name: finderName,
            sender_phone: finderPhone,
            message_length: message.length,
            has_location: !!location,
          },
        })
        return {
          error: 'Mesaj kaydedilemedi. Lütfen tekrar deneyin.',
        }
      }

      if (!newMessage || !newMessage.id) {
        console.error('Mesaj ID alınamadı:', {
          newMessage,
          messageError,
          petData,
        })
        return {
          error: 'Mesaj kaydedilemedi. Lütfen tekrar deneyin.',
        }
      }

      // Bildirim linkini mesaj detay sayfasına yönlendir
      // Artık her zaman mesaj ID'si var, çünkü yukarıda kontrol ettik
      const notificationLink = `/messages/${newMessage.id}`

      // Pet adını belirle (fallback ile)
      const displayPetName = petName && petName.trim() && !petName.startsWith('Pati #')
        ? petName
        : 'küçük dostumuz'

      // Bildirim mesajı (UI'da formatlanacak ama burada da tutarlı bir mesaj bırakıyoruz)
      const notificationMessage = `🐾 Müjde! Birisi ${displayPetName} dostumuzu buldu ve sizinle iletişime geçmek istiyor.`

      // Bildirim oluştur
      await createNotification({
        userId: petData.owner_id,
        type: 'contact_request',
        message: notificationMessage,
        link: notificationLink,
        metadata: {
          pet_id: petId,
          pet_name: petName, // Orijinal pet adı (fallback olmadan)
          display_pet_name: displayPetName, // Görüntüleme için formatlanmış ad
          finder_name: finderName,
          finder_phone: finderPhone,
          message_id: newMessage.id,
        },
      })
    } catch (notificationError) {
      // Bildirim hatası e-postayı engellemez
      console.error('Bildirim oluşturma hatası:', notificationError)
    }

    // Return success, but include email error if it occurred
    // Database operations succeeded, so we return success even if email failed
    return {
      success: true,
      message: 'Mesajınız başarıyla gönderildi.',
      emailError: emailError || undefined, // Include email error if it occurred
    }
  } catch (error: any) {
    console.error('sendContactEmail error:', error)
    return {
      error: error.message || 'Mesaj gönderilirken bir hata oluştu.',
    }
  }
}

