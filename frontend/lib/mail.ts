import { Resend } from "resend";

// Resend client oluştur
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Kayıp hayvan bulunduğunda sahibine email gönderir
 * @param email - Hayvan sahibinin email adresi
 * @param petName - Hayvanın adı
 * @param locationLink - Google Maps konum linki
 * @param finderContact - Bulan kişinin iletişim bilgisi
 * @returns Başarı durumu
 */
export async function sendLostPetAlert(
  email: string,
  petName: string,
  locationLink: string,
  finderContact: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY bulunamadı!");
      return {
        success: false,
        error: "Email servisi yapılandırılmamış",
      };
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@dijitalpati.com";

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject: `🎉 ${petName} Bulundu!`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
              }
              .content {
                background: #f9fafb;
                padding: 30px;
                border-radius: 0 0 10px 10px;
              }
              .pet-name {
                font-size: 24px;
                font-weight: bold;
                color: #2563eb;
                margin: 20px 0;
              }
              .button {
                display: inline-block;
                background: #2563eb;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
              }
              .contact-info {
                background: white;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
                border-left: 4px solid #2563eb;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🎉 İyi Haberler!</h1>
            </div>
            <div class="content">
              <p>Merhaba,</p>
              <p class="pet-name">${petName}</p>
              <p><strong>bulundu!</strong> Birisi kayıp ilanınızı görüp sizinle iletişime geçmek istiyor.</p>
              
              <div class="contact-info">
                <h3>📞 İletişim Bilgisi:</h3>
                <p>${finderContact}</p>
              </div>
              
              <p><strong>📍 Konum:</strong></p>
              <p>
                <a href="${locationLink}" class="button" target="_blank">
                  Haritada Göster
                </a>
              </p>
              
              <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <small>
                  Bu bildirim <a href="https://dijitalpati.com">DijitalPati</a> platformu tarafından gönderilmiştir.
                </small>
              </p>
            </div>
          </body>
        </html>
      `,
      text: `
İyi Haberler!

${petName} bulundu!

Birisi kayıp ilanınızı görüp sizinle iletişime geçmek istiyor.

İletişim Bilgisi:
${finderContact}

Konum:
${locationLink}

Bu bildirim DijitalPati platformu tarafından gönderilmiştir.
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return {
        success: false,
        error: error.message || "Email gönderilemedi",
      };
    }

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("sendLostPetAlert error:", error);
    return {
      success: false,
      error: error.message || "Email gönderilirken bir hata oluştu",
    };
  }
}

