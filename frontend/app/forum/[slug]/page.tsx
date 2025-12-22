import { notFound } from "next/navigation";
import Link from "next/link";
import { getForumPostBySlug, isAdmin } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Calendar, User, AlertCircle } from "lucide-react";
import VoteControl from "@/components/forum/VoteControl";
import DeleteButton from "@/components/forum/DeleteButton";
import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load comment components to reduce initial bundle size and hydration cost
const CommentList = dynamic(() => import("@/components/forum/CommentList"), {
  loading: () => (
    <div className="space-y-4">
      <Skeleton className="h-6 w-32" />
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <Skeleton className="h-16 w-full" />
          </div>
        ))}
      </div>
    </div>
  ),
  ssr: false, // Disable SSR for comments since they're below the fold
});

const CommentForm = dynamic(() => import("@/components/forum/CommentForm"), {
  loading: () => (
    <div className="space-y-4">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-10 w-24 ml-auto" />
    </div>
  ),
  ssr: false, // Disable SSR for comment form
});

// Force dynamic rendering to support authentication checks (cookies)
export const dynamic = 'force-dynamic';

interface ForumPostDetailPageProps {
  params: Promise<{ slug: string }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ForumPostDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getForumPostBySlug(slug);

  if (!post) {
    return {
      title: "Konu Bulunamadı | DijitalPati",
    };
  }

  return {
    title: `${post.title} | DijitalPati Forum`,
    description: post.content.substring(0, 160) + "...",
  };
}

export default async function ForumPostDetailPage({ params }: ForumPostDetailPageProps) {
  const { slug } = await params;
  
  // Parallel data fetching to avoid waterfalls
  const [post, userIsAdmin] = await Promise.all([
    getForumPostBySlug(slug),
    isAdmin(),
  ]);

  // Gönderi bulunamazsa 404 göster
  if (!post) {
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
              <h1 className="text-2xl font-bold">Konu Bulunamadı</h1>
              <p className="text-muted-foreground">
                Aradığınız konu bulunamadı veya silinmiş olabilir.
              </p>
              <Button asChild className="w-full">
                <Link href="/forum">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Foruma Dön
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tarihi formatla
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Kullanıcının baş harflerini al
  const getUserInitials = (fullName: string | null, username: string | null) => {
    if (fullName) {
      const names = fullName.split(" ");
      if (names.length >= 2) {
        return (names[0][0] + names[1][0]).toUpperCase();
      }
      return fullName[0].toUpperCase();
    }
    if (username) {
      return username[0].toUpperCase();
    }
    return "K";
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Geri Dön ve Admin Butonu */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" asChild>
            <Link href="/forum">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Foruma Dön
            </Link>
          </Button>
          {userIsAdmin && (
            <DeleteButton
              id={post.id}
              type="forum"
              redirectPath="/forum"
            />
          )}
        </div>

        {/* Başlık ve Meta Bilgiler */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight flex-1">
              {post.title}
            </h1>
            <VoteControl
              postId={post.id}
              initialScore={post.score || 0}
              initialUserVote={post.user_vote || null}
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                {post.author_avatar_url && (
                  <AvatarImage src={post.author_avatar_url} />
                )}
                <AvatarFallback>
                  {getUserInitials(post.author_full_name ?? null, post.author_username ?? null)}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">
                {post.author_full_name || post.author_username || "Anonim"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(post.created_at)}</span>
            </div>
            {post.category && (
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-md text-sm font-medium">
                {post.category}
              </span>
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
              {post.content.split("\n\n").map((paragraph, index) => (
                <p key={index} className="mb-6 last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Yorum Bölümü */}
        <div className="mt-12 space-y-8">
          {/* Yorum Listesi */}
          <CommentList postId={post.id} />

          {/* Yorum Formu */}
          <div className="border-t pt-8">
            <CommentForm postId={post.id} />
          </div>
        </div>

        {/* Alt Butonlar */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="outline" asChild>
            <Link href="/forum">Tüm Konular</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
