"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PetPaginationProps {
  currentPage: number;
  totalPages: number;
}

export default function PetPagination({
  currentPage,
  totalPages,
}: PetPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updatePage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (page > 1) {
      params.set("page", page.toString());
    } else {
      params.delete("page");
    }

    router.push(`/lost-pets?${params.toString()}`);
  };

  // Sayfa numaralarını hesapla
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // Tüm sayfaları göster
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // İlk sayfa
      pages.push(1);

      // Mevcut sayfanın etrafındaki sayfalar
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      // Başta boşluk varsa
      if (start > 2) {
        pages.push("...");
      }

      // Orta sayfalar
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Sonda boşluk varsa
      if (end < totalPages - 1) {
        pages.push("...");
      }

      // Son sayfa
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-center gap-2 flex-wrap">
      {/* Önceki Sayfa */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => updatePage(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
        Önceki
      </Button>

      {/* Sayfa Numaraları */}
      {pageNumbers.map((page, index) => {
        if (page === "...") {
          return (
            <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
              ...
            </span>
          );
        }

        const pageNum = page as number;
        return (
          <Button
            key={pageNum}
            variant={currentPage === pageNum ? "default" : "outline"}
            size="sm"
            onClick={() => updatePage(pageNum)}
          >
            {pageNum}
          </Button>
        );
      })}

      {/* Sonraki Sayfa */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => updatePage(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Sonraki
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}





