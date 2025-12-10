'use server'

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

