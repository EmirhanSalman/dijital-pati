import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Eye, Lock, FileText } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Başlık */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Gizlilik Politikası</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Son güncelleme: {new Date().toLocaleDateString("tr-TR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* İçerik */}
        <div className="space-y-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Genel Bilgiler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed mb-4">
                DijitalPati olarak, kullanıcılarımızın gizliliğini korumak en öncelikli 
                konularımızdan biridir. Bu gizlilik politikası, platformumuzu kullanırken 
                topladığımız bilgilerin nasıl işlendiğini ve korunduğunu açıklamaktadır.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Platformumuzu kullanarak, bu politikanın şartlarını kabul etmiş sayılırsınız. 
                Eğer bu şartları kabul etmiyorsanız, lütfen platformumuzu kullanmayın.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Toplanan Bilgiler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Platformumuzu kullanırken aşağıdaki bilgileri topluyoruz:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Hesap oluştururken sağladığınız kişisel bilgiler (ad, soyad, e-posta)</li>
                <li>Evcil hayvan kayıtlarınız ve ilgili bilgiler</li>
                <li>Platform kullanım verileri ve etkileşimleriniz</li>
                <li>Cüzdan adresi (blockchain işlemleri için)</li>
                <li>İletişim bilgileri (kayıp ilanları için)</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Bilgilerin Kullanımı
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Topladığımız bilgileri aşağıdaki amaçlarla kullanıyoruz:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Platform hizmetlerini sağlamak ve geliştirmek</li>
                <li>Kayıp ilanlarını yayınlamak ve yönetmek</li>
                <li>Kullanıcı hesaplarını yönetmek</li>
                <li>Blockchain işlemlerini gerçekleştirmek</li>
                <li>Güvenlik ve dolandırıcılık önleme</li>
                <li>Yasal yükümlülüklerimizi yerine getirmek</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Veri Güvenliği
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Verilerinizin güvenliğini sağlamak için:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Blockchain teknolojisi ile şifreleme ve dağıtık depolama</li>
                <li>Güvenli sunucu altyapısı ve veritabanı yönetimi</li>
                <li>Düzenli güvenlik denetimleri ve güncellemeler</li>
                <li>Erişim kontrolleri ve yetkilendirme sistemleri</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Ancak, hiçbir internet platformu %100 güvenli değildir. Verilerinizi 
                korumak için en iyi çabayı sarf etsek de, mutlak güvenlik garantisi veremeyiz.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle>Kullanıcı Hakları</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed mb-4">
                KVKK kapsamında, aşağıdaki haklara sahipsiniz:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Kişisel verilerinize erişim hakkı</li>
                <li>Kişisel verilerinizin düzeltilmesini talep etme hakkı</li>
                <li>Kişisel verilerinizin silinmesini talep etme hakkı</li>
                <li>Veri işlemeye itiraz etme hakkı</li>
                <li>Veri taşınabilirliği hakkı</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Bu haklarınızı kullanmak için lütfen{" "}
                <a href="/contact" className="text-primary hover:underline">
                  iletişim sayfamızdan
                </a>{" "}
                bizimle iletişime geçin.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle>Çerezler (Cookies)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                Platformumuz, kullanıcı deneyimini iyileştirmek ve platform işlevselliğini 
                sağlamak için çerezler kullanmaktadır. Çerezler, tarayıcınızda saklanan 
                küçük metin dosyalarıdır. Çerez tercihlerinizi tarayıcı ayarlarınızdan 
                yönetebilirsiniz.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle>Politika Değişiklikleri</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                Bu gizlilik politikasını zaman zaman güncelleyebiliriz. Önemli değişiklikler 
                için kullanıcılarımızı e-posta veya platform bildirimleri ile bilgilendireceğiz. 
                Güncel politikanın en üst kısmında "Son güncelleme" tarihi yer almaktadır.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}



