"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationControlsProps {
  totalCount: number;
  currentPage: number;
  perPage?: number;
}

export default function PaginationControls({
  totalCount,
  currentPage,
  perPage = 12,
}: PaginationControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Sayfa hesaplamaları
  const totalPages = Math.ceil(totalCount / perPage);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  // URL'i güncelle (mevcut filtreleri koru)
  const updatePage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (newPage === 1) {
      params.delete("page");
    } else {
      params.set("page", newPage.toString());
    }

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handlePrevPage = () => {
    if (hasPrevPage) {
      updatePage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (hasNextPage) {
      updatePage(currentPage + 1);
    }
  };

  // Eğer sayfa yoksa veya tek sayfa varsa pagination gösterme
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-4 mt-8">
      {/* Önceki Sayfa Butonu */}
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrevPage}
        disabled={!hasPrevPage}
        className="flex items-center gap-2"
      >
        <ChevronLeft className="h-4 w-4" />
        Önceki
      </Button>

      {/* Sayfa Bilgisi */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium">
          Sayfa {currentPage} / {totalPages}
        </span>
        <span className="text-xs">
          ({totalCount} toplam kayıt)
        </span>
      </div>

      {/* Sonraki Sayfa Butonu */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleNextPage}
        disabled={!hasNextPage}
        className="flex items-center gap-2"
      >
        Sonraki
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

