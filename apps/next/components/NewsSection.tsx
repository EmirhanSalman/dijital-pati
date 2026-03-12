import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowRight, Newspaper } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { formatDateTR } from "@/lib/utils/date";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  created_at: string;
}

export default async function NewsSection() {
  const supabase = await createClient();

  // Son 3 aktif haberi çek
  const { data: news, error } = await supabase
    .from("news")
    .select("id, title, content, image_url, created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(3);

  if (error || !news || news.length === 0) {
    // Hata varsa veya haber yoksa hiçbir şey gösterme
    return null;
  }

  // Tarihi formatla - using optimized utility to avoid timezone queries

  // İçeriği kısalt
  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Son <span className="text-primary">Haberler</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Platformdan son haberler ve duyurular
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {news.map((item: NewsItem) => (
            <Card key={item.id} className="border-2 hover:border-primary/50 transition-colors h-full flex flex-col">
              {item.image_url && (
                <div className="relative w-full overflow-hidden rounded-t-lg" style={{ aspectRatio: '16/9' }}>
                  <Image
                    src={item.image_url}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDateTR(item.created_at, { year: "numeric", month: "long", day: "numeric" })}</span>
                </div>
                <CardTitle className="line-clamp-2">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <CardDescription className="flex-1 mb-4">
                  {truncateContent(item.content)}
                </CardDescription>
                <Button variant="outline" asChild className="w-full">
                  <Link href={`/news/${item.id}`}>
                    Devamını Oku
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button variant="outline" size="lg" asChild>
            <Link href="/news">
              <Newspaper className="mr-2 h-5 w-5" />
              Tüm Haberleri Görüntüle
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}


