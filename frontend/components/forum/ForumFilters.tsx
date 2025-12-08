"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { useEffect, useRef } from "react";

const CATEGORIES = [
  { value: "all", label: "Tüm Kategoriler" },
  { value: "Genel", label: "Genel" },
  { value: "Soru & Cevap", label: "Soru & Cevap" },
  { value: "Kayıp İlanı", label: "Kayıp İlanı" },
  { value: "Sağlık & Bakım", label: "Sağlık & Bakım" },
  { value: "Eğitim", label: "Eğitim" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "En Yeni" },
  { value: "popular", label: "En Popüler" },
];

export default function ForumFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get("q") || "";
  const currentCategory = searchParams.get("cat") || "all";
  const currentSort = searchParams.get("sort") || "newest";

  const updateURL = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    // Eğer arama boşsa, q parametresini kaldır
    if (key === "q" && !value) {
      params.delete("q");
    }

    router.push(`/forum?${params.toString()}`);
  };

  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Önceki timeout'u temizle
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Yeni timeout oluştur
    searchTimeoutRef.current = setTimeout(() => {
      updateURL("q", value);
    }, 300);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleCategoryChange = (value: string) => {
    updateURL("cat", value);
  };

  const handleSortChange = (value: string) => {
    updateURL("sort", value);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      {/* Arama */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Başlık veya içerikte ara..."
          defaultValue={currentSearch}
          onChange={handleSearchChange}
          className="pl-10"
        />
      </div>

      {/* Kategori Filtresi */}
      <Select value={currentCategory} onValueChange={handleCategoryChange}>
        <SelectTrigger className="w-full md:w-[200px]">
          <SelectValue placeholder="Kategori" />
        </SelectTrigger>
        <SelectContent>
          {CATEGORIES.map((category) => (
            <SelectItem key={category.value} value={category.value}>
              {category.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Sıralama */}
      <Select value={currentSort} onValueChange={handleSortChange}>
        <SelectTrigger className="w-full md:w-[150px]">
          <SelectValue placeholder="Sırala" />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
