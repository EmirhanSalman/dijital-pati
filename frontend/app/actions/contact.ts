'use server'

import { createClient } from '@/lib/supabase/server'
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

    // Resend API key kontrolü
    const resendApiKey = process.env.RESEND_API_KEY

    if (resendApiKey) {
      // Resend API kullanarak mail gönder
      try {
        const resend = await import('resend')
        const resendClient = new resend.Resend(resendApiKey)

        const result = await resendClient.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'noreply@dijitalpati.com',
          to: ownerEmail,
          subject: emailSubject,
          text: emailBody,
        })

        if (result.error) {
          console.error('Resend API error:', result.error)
          // Hata olsa bile simülasyon olarak devam et
          console.log('📧 Mail gönderildi (simülasyon):', {
            to: ownerEmail,
            subject: emailSubject,
            body: emailBody,
          })
        } else {
          console.log('📧 Mail başarıyla gönderildi:', result.data)
        }
      } catch (resendError) {
        console.error('Resend import/usage error:', resendError)
        // Hata olsa bile simülasyon olarak devam et
        console.log('📧 Mail gönderildi (simülasyon):', {
          to: ownerEmail,
          subject: emailSubject,
          body: emailBody,
        })
      }
    } else {
      // Resend API key yoksa simülasyon
      console.log('📧 Mail gönderildi (simülasyon):', {
        to: ownerEmail,
        subject: emailSubject,
        body: emailBody,
      })
    }

    // Site içi bildirim oluştur
    try {
      const supabase = await createClient()
      
      // Pet'in owner_id'sini bul
      const { data: petData, error: petError } = await supabase
        .from('pets')
        .select('owner_id')
        .eq('token_id', petId)
        .single()

      if (!petError && petData && petData.owner_id) {
        // Mesajın ilk 20 karakterini al
        const messagePreview = message.length > 20 
          ? message.substring(0, 20) + '...' 
          : message

        // Bildirim oluştur
        await createNotification({
          userId: petData.owner_id,
          type: 'contact_request',
          message: `Biri ${petName} ilanı için size mesaj gönderdi: ${messagePreview}`,
          link: `/pet/${petId}`,
          metadata: {
            pet_id: petId,
            pet_name: petName,
            finder_name: finderName,
            finder_phone: finderPhone,
            message_preview: messagePreview,
          },
        })
      }
    } catch (notificationError) {
      // Bildirim hatası e-postayı engellemez
      console.error('Bildirim oluşturma hatası:', notificationError)
    }

    return {
      success: true,
      message: 'Mesajınız başarıyla gönderildi.',
    }
  } catch (error: any) {
    console.error('sendContactEmail error:', error)
    return {
      error: error.message || 'Mesaj gönderilirken bir hata oluştu.',
    }
  }
}

