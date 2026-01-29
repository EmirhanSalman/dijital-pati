import { getUserThreads } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, MessageSquare } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatDateTimeTR } from "@/lib/utils/date";

interface UserThreadsTabProps {
  userId: string;
}

export default async function UserThreadsTab({ userId }: UserThreadsTabProps) {
  const threads = await getUserThreads(userId);

  // Tarihi formatla - using optimized utility to avoid timezone queries

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

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  if (threads.length === 0) {
    return (
      <Card className="border-2">
        <CardContent className="pt-6 text-center py-12">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Henüz konu açmadınız</h3>
          <p className="text-muted-foreground mb-6">
            Forumda ilk konunuzu açarak topluluğa katılın
          </p>
          <Button asChild>
            <Link href="/forum/create">Yeni Konu Aç</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {threads.map((thread) => (
        <Card key={thread.id} className="border-2 hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <Link href={`/forum/${thread.slug}`}>
                  <CardTitle className="text-xl hover:text-primary transition-colors mb-2">
                    {thread.title}
                  </CardTitle>
                </Link>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDateTimeTR(thread.created_at)}</span>
                  </div>
                  {thread.category && (
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs">
                      {thread.category}
                    </span>
                  )}
                  {thread.score !== undefined && (
                    <span className="text-sm font-medium">
                      Puan: {thread.score > 0 ? `+${thread.score}` : thread.score}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-base mb-4">
              {truncateContent(thread.content)}
            </CardDescription>
            <Button variant="outline" asChild>
              <Link href={`/forum/${thread.slug}`}>Konuya Git</Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}



