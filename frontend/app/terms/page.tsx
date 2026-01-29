import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, AlertCircle, CheckCircle, XCircle } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Başlık */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Kullanım Şartları</h1>
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
                <FileText className="h-5 w-5 text-primary" />
                Genel Şartlar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed mb-4">
                DijitalPati platformunu kullanarak, aşağıdaki kullanım şartlarını kabul 
                etmiş sayılırsınız. Bu şartları kabul etmiyorsanız, lütfen platformumuzu 
                kullanmayın.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Platformumuz, kayıp evcil hayvanların bulunması ve sahipleriyle 
                buluşturulması için bir hizmet sağlamaktadır. Bu platform, sadece bilgilendirme 
                amaçlıdır ve herhangi bir garanti vermemektedir.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Kullanıcı Yükümlülükleri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Platformumuzu kullanırken:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Doğru ve güncel bilgiler sağlamalısınız</li>
                <li>Hesap bilgilerinizin güvenliğinden siz sorumlusunuz</li>
                <li>Platform kurallarına uymalısınız</li>
                <li>Yasalara ve düzenlemelere uymalısınız</li>
                <li>Diğer kullanıcılara saygılı olmalısınız</li>
                <li>Spam, dolandırıcılık veya zararlı içerik paylaşmamalısınız</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                Yasaklanan Aktiviteler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Aşağıdaki aktiviteler kesinlikle yasaktır:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Yanlış veya yanıltıcı bilgi paylaşmak</li>
                <li>Sahte kayıp ilanları oluşturmak</li>
                <li>Platformun güvenliğini ihlal etmeye çalışmak</li>
                <li>Diğer kullanıcıların bilgilerini kötüye kullanmak</li>
                <li>Otomatik botlar veya scriptler kullanmak</li>
                <li>Platformun işleyişini bozmaya çalışmak</li>
                <li>Telif hakkı ihlali yapmak</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                Sorumluluk Reddi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed mb-4">
                DijitalPati platformu, aşağıdaki durumlardan sorumlu tutulamaz:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Kayıp evcil hayvanların bulunmasını garanti etmez</li>
                <li>Kullanıcılar arasındaki iletişim ve anlaşmalardan sorumlu değildir</li>
                <li>Platformda paylaşılan bilgilerin doğruluğunu garanti etmez</li>
                <li>Blockchain ağındaki teknik sorunlardan kaynaklanan problemlerden 
                    sorumlu değildir</li>
                <li>Üçüncü taraf hizmetlerinden kaynaklanan sorunlardan sorumlu değildir</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Platform, &quot;olduğu gibi&quot; sağlanmaktadır ve herhangi bir garanti 
                verilmemektedir.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle>Fikri Mülkiyet</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                Platformumuzun tüm içeriği, tasarımı, logosu ve yazılımı DijitalPati&apos;ye 
                aittir ve telif hakkı koruması altındadır. Platform içeriğini izinsiz olarak 
                kopyalamak, dağıtmak veya kullanmak yasaktır. Kullanıcılar, platforma yükledikleri 
                içeriklerin (resimler, metinler) kendilerine ait olduğunu veya kullanım 
                hakkına sahip olduklarını beyan ederler.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle>Hesap İptali ve Fesih</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Aşağıdaki durumlarda hesabınız iptal edilebilir:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Kullanım şartlarını ihlal etmeniz durumunda</li>
                <li>Yanlış veya yanıltıcı bilgi sağlamanız durumunda</li>
                <li>Platformun güvenliğini tehdit etmeniz durumunda</li>
                <li>Uzun süre platformu kullanmamanız durumunda</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Hesap iptali durumunda, hesabınızla ilişkili tüm veriler silinebilir. 
                Blockchain üzerindeki kayıtlar kalıcıdır ve silinemez.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle>Değişiklikler</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                Bu kullanım şartlarını zaman zaman güncelleyebiliriz. Önemli değişiklikler 
                için kullanıcılarımızı e-posta veya platform bildirimleri ile bilgilendireceğiz. 
                Değişikliklerden sonra platformu kullanmaya devam etmeniz, güncellenmiş 
                şartları kabul ettiğiniz anlamına gelir.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle>İletişim</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                Kullanım şartları ile ilgili sorularınız için lütfen{" "}
                <a href="/contact" className="text-primary hover:underline">
                  iletişim sayfamızdan
                </a>{" "}
                bizimle iletişime geçin.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}





