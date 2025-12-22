import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Heart, Shield, Users, Zap } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Hakkımızda</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            DijitalPati, kayıp evcil hayvanların bulunması ve sahipleriyle buluşturulması 
            için geliştirilmiş bir platformdur.
          </p>
        </div>

        {/* Misyon */}
        <Card className="mb-6 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Misyonumuz
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              DijitalPati olarak, her kayıp evcil hayvanın sahibine dönmesi için çalışıyoruz. 
              Blockchain teknolojisi ve topluluk gücünü birleştirerek, kayıp ilanlarını 
              hızlı ve güvenilir bir şekilde yayınlıyoruz. Amacımız, her evcil hayvan sahibinin 
              ailesine güvenle dönmesini sağlamak ve kaybolma durumlarında en kısa sürede 
              buluşmalarına yardımcı olmaktır.
            </p>
          </CardContent>
        </Card>

        {/* Değerler */}
        <Card className="mb-6 border-2">
          <CardHeader>
            <CardTitle>Değerlerimiz</CardTitle>
            <CardDescription>Platformumuzun temel prensipleri</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Güvenlik</h3>
                  <p className="text-sm text-muted-foreground">
                    Blockchain teknolojisi ile verilerinizin güvenliğini sağlıyoruz. 
                    Tüm kayıtlar şeffaf ve değiştirilemezdir.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Topluluk</h3>
                  <p className="text-sm text-muted-foreground">
                    Binlerce kullanıcıdan oluşan güçlü bir topluluk ile kayıp ilanlarını 
                    hızla yayınlıyoruz.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Hız</h3>
                  <p className="text-sm text-muted-foreground">
                    Kayıp ilanları anında yayınlanır ve topluluk üyeleri tarafından 
                    hızla paylaşılır.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Heart className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Sevgi</h3>
                  <p className="text-sm text-muted-foreground">
                    Her evcil hayvanın özel olduğuna inanıyoruz ve onların güvenliği 
                    için çalışıyoruz.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nasıl Çalışır */}
        <Card className="mb-6 border-2">
          <CardHeader>
            <CardTitle>Nasıl Çalışır?</CardTitle>
            <CardDescription>Platformumuzun işleyişi</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Kayıt Olun</h3>
                  <p className="text-sm text-muted-foreground">
                    Evcil hayvanınızı blockchain üzerine kaydedin. Bu kayıt kalıcı 
                    ve güvenlidir.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Kayıp İlanı Verin</h3>
                  <p className="text-sm text-muted-foreground">
                    Evcil hayvanınız kaybolduğunda, platform üzerinden kayıp ilanı 
                    oluşturun.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Topluluk Bildirimi</h3>
                  <p className="text-sm text-muted-foreground">
                    Kayıp ilanınız anında topluluk üyelerine bildirim olarak gönderilir.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Buluşma</h3>
                  <p className="text-sm text-muted-foreground">
                    Bulan kişiler sizinle iletişime geçer ve evcil hayvanınız 
                    size geri döner.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center space-y-4">
          <Button asChild size="lg">
            <Link href="/register">Hemen Kayıt Ol</Link>
          </Button>
          <div>
            <Button variant="outline" asChild>
              <Link href="/contact">İletişime Geç</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


