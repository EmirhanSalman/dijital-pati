import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getForumPosts } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, MessageSquare, User, Plus } from "lucide-react";
import ForumFilters from "@/components/forum/ForumFilters";
import VoteControl from "@/components/forum/VoteControl";
import EmptyState from "@/components/ui/empty-state";
import { Suspense } from "react";
import { formatDateTimeTR } from "@/lib/utils/date";

interface ForumPageProps {
  searchParams: Promise<{ q?: string; cat?: string; sort?: string }>;
}

export default async function ForumPage({ searchParams }: ForumPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const params = await searchParams;
  const search = params.q || undefined;
  const category = params.cat || undefined;
  const sort = (params.sort === "popular" ? "popular" : "newest") as "newest" | "popular";

  // Forum gönderilerini çek (filtrelerle)
  const posts = await getForumPosts(search, category, sort);

  // Tarihi formatla - using optimized utility to avoid timezone queries

  // İçeriği kısalt
  const truncateContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
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
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Başlık ve Yeni Konu Butonu */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-2">
              <span className="text-primary">Forum</span>
            </h1>
            <p className="text-muted-foreground">
              Toplulukla bilgi paylaşın, soru sorun, tartışın
            </p>
          </div>
          {user && (
            <Button asChild size="lg">
              <Link href="/forum/create">
                <Plus className="mr-2 h-5 w-5" />
                Yeni Konu Aç
              </Link>
            </Button>
          )}
        </div>

        {/* Filtreler */}
        <Suspense fallback={<div className="h-16 mb-6" />}>
          <ForumFilters />
        </Suspense>

        {/* Konu Listesi */}
        {posts.length === 0 ? (
          <EmptyState
            title="Henüz hiç tartışma yok"
            description="Topluluk sessiz... İlk konuyu sen başlat!"
            actionLabel="Konu Aç"
            actionUrl="/forum/create"
          />
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id} className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <Link href={`/forum/${post.slug}`}>
                        <CardTitle className="text-xl hover:text-primary transition-colors mb-2">
                          {post.title}
                        </CardTitle>
                      </Link>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            {post.author_avatar_url && (
                              <AvatarImage src={post.author_avatar_url} />
                            )}
                            <AvatarFallback className="text-xs">
                              {getUserInitials(post.author_full_name ?? null, post.author_username ?? null)}
                            </AvatarFallback>
                          </Avatar>
                          <span>
                            {post.author_full_name || post.author_username || "Anonim"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDateTimeTR(post.created_at)}</span>
                        </div>
                        {post.category && (
                          <span className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs">
                            {post.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <VoteControl
                      postId={post.id}
                      initialScore={post.score || 0}
                      initialUserVote={post.user_vote || null}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base mb-4">
                    {truncateContent(post.content)}
                  </CardDescription>
                  <Button variant="outline" asChild>
                    <Link href={`/forum/${post.slug}`}>
                      Devamını Oku
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
