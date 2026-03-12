'use server'
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';
import { getPetById } from '@/lib/supabase/server';

// Initialize Resend client safely
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

interface ContactEmailParams {
  petId: string;
  ownerId: string;
  senderEmail: string;
  message: string;
  latitude?: number;
  longitude?: number;
}

interface ActionResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// Helper function to create HTML email
function createContactEmailHTML(petName: string, senderEmail: string, message: string, googleMapsLink?: string): string {
  const locationButton = googleMapsLink ? `
              <!-- Location Button -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${googleMapsLink}" target="_blank" style="background-color: #667eea; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: 600; font-size: 16px;">📍 Konumu Haritada Gör</a>
                  </td>
                </tr>
              </table>
  ` : '';

  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>İletişim Talebi</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
    <tr>
      <td style="padding: 20px 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                🐾 Dijital Pati
              </h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">
                Yeni İletişim Talebi
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Merhaba,
              </p>
              <p style="margin: 0 0 30px 0; color: #333333; font-size: 18px; line-height: 1.6; font-weight: 600;">
                Harika bir haber! <strong>${petName}</strong> isimli hayvanınız için bir 'Buldum' bildirimi aldınız. Detayları aşağıda ve bildirimler sayfanızda bulabilirsiniz.
              </p>
              
              <!-- Message Box -->
              <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0 0 15px 0; color: #666666; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
                  Mesaj
                </p>
                <p style="margin: 0; color: #333333; font-size: 16px; line-height: 1.8; white-space: pre-wrap;">
${message.replace(/\n/g, '<br>')}
                </p>
              </div>
              
              <!-- Sender Info -->
              <div style="background-color: #ffffff; border: 1px solid #e0e0e0; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
                  Gönderen Bilgileri
                </p>
                <p style="margin: 0; color: #333333; font-size: 16px; line-height: 1.8;">
                  <strong>E-posta:</strong> <a href="mailto:${senderEmail}" style="color: #667eea; text-decoration: none;">${senderEmail}</a>
                </p>
              </div>
              
              ${locationButton}
              
              <!-- Footer Info -->
              <p style="margin: 30px 0 0 0; color: #999999; font-size: 14px; line-height: 1.6;">
                Bu mesaj, Dijital Pati platformu aracılığıyla gönderilmiştir. Gönderene doğrudan e-posta ile yanıt verebilirsiniz.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.6;">
                © ${new Date().getFullYear()} Dijital Pati. Tüm hakları saklıdır.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendContactEmail(data: ContactEmailParams): Promise<ActionResponse> {
  const { petId, ownerId, senderEmail, message, latitude, longitude } = data;

  // 1. Validate Inputs
  if (!petId || !ownerId || !senderEmail || !message) {
    return { success: false, error: 'Tüm alanların doldurulması zorunludur.' };
  }

  // 2. Validate Server Configuration
  if (!resend) {
    console.error('RESEND_API_KEY is missing.');
    return { success: false, error: 'E-posta servisi şu anda kullanılamıyor (Yapılandırma Hatası).' };
  }

  try {
    // 3. Fetch Pet Information
    const pet = await getPetById(petId);
    if (!pet) {
      return { success: false, error: 'Pet bilgisi bulunamadı.' };
    }

    // Determine pet name for display
    const petName = pet.name && pet.name.trim() && !pet.name.startsWith('Pati #')
      ? pet.name
      : `Pati #${pet.token_id}`;

    // 4. Determine Recipient (Safe Handling for Dev/Test)
    // TODO: Change this to the pet owner's email after domain verification
    const toAddress = 'emirhansalman07@gmail.com'; // Temporarily hardcoded for Resend Sandbox mode

    // 5. Create Google Maps Link if coordinates are provided
    const googleMapsLink = latitude && longitude 
      ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
      : undefined;

    // 6. Create HTML Email Content
    const htmlContent = createContactEmailHTML(petName, senderEmail, message, googleMapsLink);
    const textContent = `
Yeni bir mesajınız var!

Gönderen: ${senderEmail}
İlgili Hayvan: ${petName}

Mesaj:
${message}
    `.trim();

    // 7. Send Email
    const { data: emailData, error: resendError } = await resend.emails.send({
      from: 'Dijital Pati <onboarding@resend.dev>',
      to: [toAddress],
      replyTo: senderEmail,
      subject: `🚨 MÜJDE! ${petName} Hakkında Yeni Bir Bilgi Var!`,
      html: htmlContent,
      text: textContent,
    });

    // 8. Handle Resend API Errors
    if (resendError) {
      console.error('Resend API Error:', resendError);

      if (resendError.name === 'validation_error' || resendError.message.includes('domain')) {
        return { 
          success: false, 
          error: 'Test Modu Uyarısı: Alıcı adresi doğrulanmadığı için e-posta gönderilemedi.' 
        };
      }

      return { success: false, error: 'E-posta servisi hatası. Lütfen daha sonra tekrar deneyin.' };
    }

    // 9. Create Notification Record
    const supabase = await createClient();
    // Updated urgent and professional message
    const notificationMessage = `Harika bir haber! ${petName} isimli hayvanınız için bir 'Buldum' bildirimi aldınız. Detayları aşağıda ve bildirimler sayfanızda bulabilirsiniz.`;
    
    // Build metadata object
    const metadata: Record<string, any> = {
      sender_email: senderEmail,
      message: message,
      pet_id: petId,
      pet_name: petName,
    };

    // Add location to metadata if provided
    if (latitude !== undefined && longitude !== undefined) {
      metadata.latitude = latitude;
      metadata.longitude = longitude;
    }

    // Verify ownerId is valid (should be the pet owner, not sender)
    console.log('Creating notification for ownerId:', ownerId);
    console.log('Pet ID:', petId);
    console.log('Pet Name:', petName);
    console.log('Sender Email:', senderEmail);

    try {
      // Insert notification and get the created notification ID
      const { data: notificationData, error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: ownerId,
          type: 'contact', // Ensure type is exactly 'contact'
          message: notificationMessage,
          link: null, // Will be updated after insert
          metadata: metadata,
        })
        .select()
        .single();

      if (notificationError) {
        console.error('❌ Notification creation FAILED:');
        console.error('Error details:', JSON.stringify(notificationError, null, 2));
        console.error('Error code:', notificationError.code);
        console.error('Error message:', notificationError.message);
        console.error('Error hint:', notificationError.hint);
        console.error('Attempted insert data:', {
          user_id: ownerId,
          type: 'contact',
          message: notificationMessage,
          metadata: metadata,
        });
        // Don't fail the entire operation if notification creation fails
        // Email was sent successfully, notification is just a bonus
      } else if (notificationData) {
        console.log('✅ Notification created successfully with ID:', notificationData.id);
        // Update notification with the correct link pointing to detail page
        const notificationLink = `/notifications/${notificationData.id}`;
        const { error: updateError } = await supabase
          .from('notifications')
          .update({ link: notificationLink })
          .eq('id', notificationData.id);
        
        if (updateError) {
          console.error('⚠️ Failed to update notification link:', updateError);
        } else {
          console.log('✅ Notification link updated to:', notificationLink);
        }
      }
    } catch (notificationException) {
      console.error('❌ Exception during notification creation:', notificationException);
      console.error('Exception stack:', (notificationException as Error).stack);
    }

    return { success: true, message: 'Email sent successfully' };

  } catch (error) {
    console.error('Unexpected error in sendContactEmail:', error);
    return { success: false, error: 'İşlem sırasında beklenmeyen bir hata oluştu.' };
  }
}
