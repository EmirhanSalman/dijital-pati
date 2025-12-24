'use server'
import { Resend } from 'resend';

// Initialize Resend client safely
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

interface ContactEmailParams {
  petId: string;
  ownerId: string;
  senderEmail: string;
  message: string;
}

interface ActionResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export async function sendContactEmail(data: ContactEmailParams): Promise<ActionResponse> {
  const { petId, ownerId, senderEmail, message } = data;

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
    // 3. Determine Recipient (Safe Handling for Dev/Test)
    const isDev = process.env.NODE_ENV === 'development';
    // In Dev, use Resend's magic test email to avoid 403 errors
    const toAddress = isDev ? 'delivered@resend.dev' : 'admin@dijitalpati.com'; 

    const { data: emailData, error: resendError } = await resend.emails.send({
      from: 'Dijital Pati <onboarding@resend.dev>',
      to: [toAddress],
      replyTo: senderEmail,
      subject: `Dijital Pati: İletişim Talebi (Pet ID: ${petId})`,
      text: `
        Yeni bir mesajınız var!
        
        Gönderen: ${senderEmail}
        İlgili İlan (Pet ID): ${petId}
        
        Mesaj:
        ${message}
      `,
    });

    // 4. Handle Resend API Errors
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

    return { success: true, message: 'Email sent successfully' };

  } catch (error) {
    console.error('Unexpected error in sendContactEmail:', error);
    return { success: false, error: 'İşlem sırasında beklenmeyen bir hata oluştu.' };
  }
}
