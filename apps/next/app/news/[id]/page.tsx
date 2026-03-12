import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar, User, AlertCircle } from "lucide-react";
import { formatDateTimeTR } from "@/lib/utils/date";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getNewsById, isAdmin } from "@/lib/supabase/server";
import DeleteButton from "@/components/forum/DeleteButton";

interface NewsDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { id } = await params;
  const news = await getNewsById(id);
  const userIsAdmin = await isAdmin();

  // Haber bulunamazsa 404 göster
  if (!news) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Card className="max-w-md mx-4 border-2">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="bg-destructive/10 p-4 rounded-full">
                  <AlertCircle className="h-12 w-12 text-destructive" />
                </div>
              </div>
              <h1 className="text-2xl font-bold">Haber Bulunamadı</h1>
              <p className="text-muted-foreground">
                Aradığınız haber bulunamadı veya yayından kaldırılmış olabilir.
              </p>
              <Button asChild className="w-full">
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Ana Sayfaya Dön
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tarihi formatla - using optimized utility to avoid timezone queries

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Geri Dön ve Admin Butonu */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Geri Dön
            </Link>
          </Button>
          {userIsAdmin && (
            <DeleteButton
              id={id}
              type="news"
              redirectPath="/"
            />
          )}
        </div>

        {/* Hero Görsel */}
        {news.image_url && (
          <div className="relative w-full h-64 md:h-96 mb-8 rounded-lg overflow-hidden shadow-lg">
            <Image
              src={news.image_url}
              alt={news.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 896px"
              priority
            />
          </div>
        )}

        {/* Başlık ve Meta Bilgiler */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground leading-tight">
            {news.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{formatDateTimeTR(news.created_at)}</span>
            </div>
            {news.author_name && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{news.author_name}</span>
              </div>
            )}
          </div>
        </div>

        {/* İçerik */}
        <Card className="border-2">
          <CardContent className="pt-6">
            <div
              className="prose prose-lg max-w-none prose-headings:font-bold prose-p:text-foreground prose-p:leading-relaxed prose-p:mb-4 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-strong:font-semibold"
              style={{
                lineHeight: "1.8",
                fontSize: "1.125rem",
              }}
            >
              {/* İçeriği paragraflara böl */}
              {news.content.split("\n\n").map((paragraph, index) => (
                <p key={index} className="mb-6 last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alt Butonlar */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="outline" asChild>
            <Link href="/news">
              Tüm Haberler
            </Link>
          </Button>
          <Button asChild>
            <Link href="/">
              Ana Sayfaya Dön
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
