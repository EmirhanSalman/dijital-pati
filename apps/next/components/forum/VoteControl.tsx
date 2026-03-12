"use client";

import { useState, useOptimistic, useTransition } from "react";
import { votePost } from "@/app/actions/forum";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoteControlProps {
  postId: string;
  initialScore: number;
  initialUserVote: number | null;
}

export default function VoteControl({
  postId,
  initialScore,
  initialUserVote,
}: VoteControlProps) {
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState<number | null>(initialUserVote);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  
  // Optimistic UI için
  const [optimisticScore, setOptimisticScore] = useOptimistic(
    score,
    (state, newScore: number) => newScore
  );

  const handleVote = async (voteType: 1 | -1) => {
    setIsLoading(true);
    
    // Önce yeni score değerini hesapla
    const currentVote = userVote;
    let newScore = optimisticScore;
    
    if (currentVote === voteType) {
      // Aynı oyu tekrar verirse, oyu kaldır
      newScore = optimisticScore - voteType;
    } else if (currentVote === -voteType) {
      // Ters oy varsa, oyu değiştir
      newScore = optimisticScore + (voteType * 2);
    } else {
      // Yeni oy ver
      newScore = optimisticScore + voteType;
    }
    
    // Optimistic update - transition içinde yapılmalı
    startTransition(() => {
      if (currentVote === voteType) {
        setUserVote(null);
      } else {
        setUserVote(voteType);
      }
      setOptimisticScore(newScore);
    });

    try {
      const result = await votePost(
        postId,
        currentVote === voteType ? 0 : voteType
      );

      if (result.error) {
        // Hata durumunda geri al
        startTransition(() => {
          setScore(score);
          setUserVote(initialUserVote);
          setOptimisticScore(initialScore);
        });
        alert(result.error);
      } else {
        // Başarılı, state'i güncelle
        startTransition(() => {
          setScore(newScore);
        });
      }
    } catch (error) {
      // Hata durumunda geri al
      startTransition(() => {
        setScore(score);
        setUserVote(initialUserVote);
        setOptimisticScore(initialScore);
      });
      console.error("Vote error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isLiked = userVote === 1;
  const isDisliked = userVote === -1;

  return (
    <div className="flex flex-col items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-8 w-8 hover:bg-primary/10",
          isLiked && "bg-primary/20 text-primary"
        )}
        onClick={() => handleVote(1)}
        disabled={isLoading || isPending}
        aria-label="Beğen"
      >
        <ArrowUp className={cn("h-4 w-4", isLiked && "fill-current")} />
      </Button>
      
      <span className={cn(
        "text-sm font-semibold min-w-[2rem] text-center",
        optimisticScore > 0 && "text-green-600",
        optimisticScore < 0 && "text-red-600"
      )}>
        {optimisticScore}
      </span>
      
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-8 w-8 hover:bg-destructive/10",
          isDisliked && "bg-destructive/20 text-destructive"
        )}
        onClick={() => handleVote(-1)}
        disabled={isLoading || isPending}
        aria-label="Beğenme"
      >
        <ArrowDown className={cn("h-4 w-4", isDisliked && "fill-current")} />
      </Button>
    </div>
  );
}

