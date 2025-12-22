import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAllNews, isAdmin } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Newspaper, Calendar, ArrowLeft } from "lucide-react";
import Image from "next/image";
import DeleteButton from "@/components/forum/DeleteButton";

export default async function AdminNewsPage() {
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

  const newsList = await getAllNews(true); // Admin için tüm haberleri getir (aktif + pasif)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Başlık ve Buton */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-2">Haber Yönetimi</h1>
            <p className="text-lg text-muted-foreground">
              Tüm haberleri görüntüleyin, düzenleyin veya silin
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/admin/news/create">
              <Plus className="mr-2 h-4 w-4" />
              Yeni Haber Ekle
            </Link>
          </Button>
        </div>

        {/* Geri Dön */}
        <div className="mb-6">
          <Button variant="outline" asChild>
            <Link href="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Admin Paneline Dön
            </Link>
          </Button>
        </div>

        {/* Haber Listesi */}
        {newsList.length === 0 ? (
          <Card className="border-2">
            <CardContent className="pt-6 text-center py-12">
              <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Henüz haber yok</h3>
              <p className="text-muted-foreground mb-6">
                İlk haberinizi oluşturmak için yukarıdaki butona tıklayın
              </p>
              <Button asChild>
                <Link href="/admin/news/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Yeni Haber Ekle
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {newsList.map((news) => (
              <Card key={news.id} className="border-2 hover:border-primary/50 transition-colors">
                {news.image_url && (
                  <div className="relative h-48 w-full overflow-hidden rounded-t-lg aspect-[16/9]">
                    <Image
                      src={news.image_url}
                      alt={news.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="line-clamp-2">{news.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    {formatDate(news.created_at)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {news.content}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link href={`/news/${news.id}`}>
                        Görüntüle
                      </Link>
                    </Button>
                    <DeleteButton
                      id={news.id}
                      type="news"
                      className="shrink-0"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
