"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CITIES as ALL_CITIES } from "@/constants/cities";

// Tür seçenekleri
const PET_TYPES = [
  { value: "all", label: "Tümü" },
  { value: "Kedi", label: "Kedi" },
  { value: "Köpek", label: "Köpek" },
  { value: "Kuş", label: "Kuş" },
  { value: "Diğer", label: "Diğer" },
];

// Şehir seçenekleri (merkezi listeden, "Tümü" seçeneği ile)
const CITIES = [
  { value: "all", label: "Tümü" },
  ...ALL_CITIES.map((city) => ({ value: city, label: city })),
];

// Sıralama seçenekleri
const SORT_OPTIONS = [
  { value: "newest", label: "En Yeniler" },
  { value: "oldest", label: "En Eskiler" },
];

export default function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  // URL'den mevcut değerleri al
  const initialQuery = searchParams.get("query") || "";
  const [localQuery, setLocalQuery] = useState(initialQuery); // Local state for input
  const [type, setType] = useState(searchParams.get("type") || "all");
  const [city, setCity] = useState(searchParams.get("city") || "all");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");

  // URL parametreleri değiştiğinde state'i güncelle (ör: geri/ileri butonları)
  useEffect(() => {
    const urlQuery = searchParams.get("query") || "";
    setLocalQuery(urlQuery); // URL'den gelen değeri local state'e senkronize et
    setType(searchParams.get("type") || "all");
    setCity(searchParams.get("city") || "all");
    setSort(searchParams.get("sort") || "newest");
  }, [searchParams]);

  // URL'i güncelle
  const updateURL = useCallback(
    (updates: { query?: string; type?: string; city?: string; sort?: string }) => {
      const params = new URLSearchParams(searchParams.toString());

      // Query güncellemesi
      if (updates.query !== undefined) {
        if (updates.query.trim()) {
          params.set("query", updates.query.trim());
        } else {
          params.delete("query");
        }
      }

      // Type güncellemesi
      if (updates.type !== undefined) {
        if (updates.type === "all") {
          params.delete("type");
        } else {
          params.set("type", updates.type);
        }
      }

      // City güncellemesi
      if (updates.city !== undefined) {
        if (updates.city === "all") {
          params.delete("city");
        } else {
          params.set("city", updates.city);
        }
      }

      // Sort güncellemesi
      if (updates.sort !== undefined) {
        if (updates.sort === "newest") {
          params.delete("sort");
        } else {
          params.set("sort", updates.sort);
        }
      }

      // URL'i güncelle (replace kullan ki geçmiş kirlenmesin)
      // Mevcut pathname'i kullan (pets veya lost-pets)
      // scroll: false ile sayfa zıplamasını önle
      // useTransition ile UI blocking'i önle
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [router, searchParams, pathname, startTransition]
  );

  // Manuel arama fonksiyonu (buton veya Enter tuşu ile tetiklenir)
  const handleSearch = useCallback(() => {
    startTransition(() => {
      updateURL({ query: localQuery });
    });
  }, [localQuery, updateURL, startTransition]);

  // Filtreleri temizle
  const handleClearFilters = () => {
    setLocalQuery(""); // Local query state'ini de sıfırla
    setType("all");
    setCity("all");
    setSort("newest");
    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  };

  // Aktif filtre var mı kontrol et
  const hasActiveFilters =
    localQuery.trim() !== "" || type !== "all" || city !== "all" || sort !== "newest";

  return (
    <Card className="border-2 mb-8">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold text-lg">Filtrele ve Ara</h3>
        </div>

        <div className="flex flex-wrap gap-4">
          {/* Tür Select */}
          <Select value={type} onValueChange={(value) => {
            setType(value);
            updateURL({ type: value });
          }}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Tür Seçiniz" />
            </SelectTrigger>
            <SelectContent>
              {PET_TYPES.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Şehir Select */}
          <Select value={city} onValueChange={(value) => {
            setCity(value);
            updateURL({ city: value });
          }}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Şehir Seçiniz" />
            </SelectTrigger>
            <SelectContent>
              {CITIES.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sıralama Select */}
          <Select value={sort} onValueChange={(value) => {
            setSort(value);
            updateURL({ sort: value });
          }}>
            <SelectTrigger className="w-full sm:w-[180px]">
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

          {/* Arama Input'u ve Butonu - En sağda, flex-1 ile genişliyor */}
          <div className="flex gap-2 flex-1 min-w-[200px] w-full sm:w-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="İsim veya açıklama ara..."
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
                className="pl-10"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isPending}
              className="shrink-0"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="ml-2 hidden sm:inline">Ara</span>
            </Button>
          </div>
        </div>

        {/* Filtreleri Temizle Butonu */}
        {hasActiveFilters && (
          <div className="mt-4 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Filtreleri Temizle
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

