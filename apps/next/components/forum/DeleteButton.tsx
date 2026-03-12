"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { deleteNews, deleteForumPost, deleteComment } from "@/app/actions/admin";

interface DeleteButtonProps {
  id: string;
  type: "news" | "forum" | "comment";
  redirectPath?: string;
  className?: string;
}

export default function DeleteButton({
  id,
  type,
  redirectPath,
  className,
}: DeleteButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Bu içeriği silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
    );

    if (!confirmed) {
      return;
    }

    setIsLoading(true);

    try {
      let result;
      
      if (type === "news") {
        result = await deleteNews(id);
      } else if (type === "forum") {
        result = await deleteForumPost(id);
      } else if (type === "comment") {
        result = await deleteComment(id);
      } else {
        throw new Error("Geçersiz silme tipi");
      }

      if (result.error) {
        alert(result.error);
        setIsLoading(false);
        return;
      }

      if (result.success) {
        if (redirectPath) {
          router.push(redirectPath);
        } else {
          router.refresh();
        }
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Silme işlemi sırasında bir hata oluştu.");
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={isLoading}
      className={cn("gap-2", className)}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Siliniyor...
        </>
      ) : (
        <>
          <Trash2 className="h-4 w-4" />
          Sil
        </>
      )}
    </Button>
  );
}
