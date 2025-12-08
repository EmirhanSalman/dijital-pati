import Link from "next/link";
import { getAllNews, isAdmin } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Newspaper, ArrowRight } from "lucide-react";
import Image from "next/image";
import DeleteButton from "@/components/forum/DeleteButton";

export default async function NewsPage() {
  const newsList = await getAllNews();
  const userIsAdmin = await isAdmin();

  // Tarihi formatla
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // İçeriği kısalt
  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-primary">Haberler</span> & Duyurular
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Platformdan en güncel haberler, duyurular ve önemli gelişmeler
          </p>
        </div>

        {/* Haber Listesi */}
        {newsList.length === 0 ? (
          <Card className="border-2">
            <CardContent className="pt-6 text-center py-12">
              <div className="flex justify-center mb-4">
                <div className="bg-muted/50 p-4 rounded-full">
                  <Newspaper className="h-12 w-12 text-muted-foreground" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Henüz haber yayınlanmadı</h3>
              <p className="text-muted-foreground">
                Yakında yeni haberler ve duyurular burada görünecek
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {newsList.map((news) => (
              <Card
                key={news.id}
                className="border-2 hover:border-primary/50 transition-colors h-full flex flex-col relative"
              >
                {/* Admin Delete Button */}
                {userIsAdmin && (
                  <div className="absolute top-2 right-2 z-10">
                    <DeleteButton
                      id={news.id}
                      type="news"
                      redirectPath="/news"
                      className="shadow-lg"
                    />
                  </div>
                )}

                {/* Görsel */}
                {news.image_url && (
                  <div className="relative w-full h-48 overflow-hidden rounded-t-lg">
                    <Image
                      src={news.image_url}
                      alt={news.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                {/* İçerik */}
                <CardHeader>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(news.created_at)}</span>
                  </div>
                  <CardTitle className="line-clamp-2 text-xl">
                    {news.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  <CardDescription className="flex-1 mb-4 text-base">
                    {truncateContent(news.content)}
                  </CardDescription>
                  <Button variant="outline" asChild className="w-full">
                    <Link href={`/news/${news.id}`}>
                      Devamını Oku
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
