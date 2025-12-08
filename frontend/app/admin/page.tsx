import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminStats, isAdmin } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, Newspaper, MessageSquare, AlertTriangle, Plus, Settings } from "lucide-react";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const admin = await isAdmin();
  if (!admin) {
    redirect("/");
  }

  const stats = await getAdminStats();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Başlık */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Admin Paneli</h1>
          <p className="text-lg text-muted-foreground">
            Platform yönetimi ve istatistikler
          </p>
        </div>

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardDescription>Toplam Kullanıcı</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Users className="h-6 w-6 text-blue-500" />
                {stats.totalUsers}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Platforma kayıtlı toplam kullanıcı sayısı
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardDescription>Toplam Haber</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Newspaper className="h-6 w-6 text-green-500" />
                {stats.totalNews}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Yayınlanmış toplam haber sayısı
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardDescription>Forum Konuları</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-purple-500" />
                {stats.totalForumPosts}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Forumda açılmış toplam konu sayısı
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardDescription>Kayıp Hayvan</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-red-500" />
                {stats.totalLostPets}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Aktif kayıp ilanı sayısı
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Yönetim Menüsü */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Haber Yönetimi</CardTitle>
              <CardDescription>
                Haberleri görüntüleyin, düzenleyin veya silin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" asChild>
                <Link href="/admin/news">
                  <Newspaper className="mr-2 h-4 w-4" />
                  Haberleri Görüntüle
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/admin/news/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Yeni Haber Ekle
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle>Forum Yönetimi</CardTitle>
              <CardDescription>
                Forum konularını ve yorumlarını yönetin (Yakında)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                <MessageSquare className="mr-2 h-4 w-4" />
                Forum Yönetimi (Yakında)
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle>Kayıp İlanları</CardTitle>
              <CardDescription>
                Kayıp hayvan ilanlarını görüntüleyin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/lost-pets">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Kayıp İlanlarını Görüntüle
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle>Diğer İşlemler</CardTitle>
              <CardDescription>
                Ek yönetim araçları
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full" disabled>
                <Settings className="mr-2 h-4 w-4" />
                Sistem Ayarları (Yakında)
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Alt Bilgi */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Admin paneli güçlü yönetim araçlarıyla donatılmıştır. 
            Dikkatli kullanın.
          </p>
        </div>
      </div>
    </div>
  );
}
