import { getComments } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import DeleteButton from "./DeleteButton";
import { deleteComment } from "@/app/actions/admin";
import { MessageSquare } from "lucide-react";

interface CommentListProps {
  postId: string;
}

export default async function CommentList({ postId }: CommentListProps) {
  const comments = await getComments(postId);
  const userIsAdmin = await isAdmin();

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

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Henüz yorum yapılmamış. İlk yorumu sen yap!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold mb-4">
        Yorumlar ({comments.length})
      </h3>
      {comments.map((comment) => (
        <Card key={comment.id} className="border">
          <CardContent className="pt-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar className="h-8 w-8">
                    {comment.author_avatar_url && (
                      <AvatarImage src={comment.author_avatar_url} />
                    )}
                    <AvatarFallback className="text-xs">
                      {getUserInitials(
                        comment.author_full_name,
                        comment.author_username
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">
                      {comment.author_full_name ||
                        comment.author_username ||
                        "Anonim"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(comment.created_at)}
                    </p>
                  </div>
                </div>
                <div className="pl-11">
                  <p className="text-sm whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              </div>
              {userIsAdmin && (
                <DeleteButton
                  id={comment.id}
                  type="comment"
                  className="shrink-0"
                />
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

