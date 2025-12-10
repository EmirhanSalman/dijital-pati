"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/useDebounce";

// Tür seçenekleri
const PET_TYPES = [
  { value: "all", label: "Tümü" },
  { value: "Kedi", label: "Kedi" },
  { value: "Köpek", label: "Köpek" },
  { value: "Kuş", label: "Kuş" },
  { value: "Diğer", label: "Diğer" },
];

// Şehir seçenekleri
const CITIES = [
  { value: "all", label: "Tümü" },
  { value: "İstanbul", label: "İstanbul" },
  { value: "Ankara", label: "Ankara" },
  { value: "İzmir", label: "İzmir" },
  { value: "Bursa", label: "Bursa" },
  { value: "Antalya", label: "Antalya" },
  { value: "Adana", label: "Adana" },
  { value: "Gaziantep", label: "Gaziantep" },
  { value: "Konya", label: "Konya" },
  { value: "Kayseri", label: "Kayseri" },
  { value: "Mersin", label: "Mersin" },
];

// Sıralama seçenekleri
const SORT_OPTIONS = [
  { value: "newest", label: "En Yeniler" },
  { value: "oldest", label: "En Eskiler" },
];

export default function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL'den mevcut değerleri al
  const [query, setQuery] = useState(searchParams.get("query") || "");
  const [type, setType] = useState(searchParams.get("type") || "all");
  const [city, setCity] = useState(searchParams.get("city") || "all");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");

  // Debounced query (500ms)
  const debouncedQuery = useDebounce(query, 500);

  // URL parametreleri değiştiğinde state'i güncelle (ör: geri/ileri butonları)
  useEffect(() => {
    setQuery(searchParams.get("query") || "");
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
      router.replace(`/pets?${params.toString()}`);
    },
    [router, searchParams]
  );

  // Debounced query değiştiğinde URL'i güncelle
  useEffect(() => {
    updateURL({ query: debouncedQuery });
  }, [debouncedQuery, updateURL]);

  // Filtreleri temizle
  const handleClearFilters = () => {
    setQuery("");
    setType("all");
    setCity("all");
    setSort("newest");
    router.replace("/pets");
  };

  // Aktif filtre var mı kontrol et
  const hasActiveFilters =
    query.trim() !== "" || type !== "all" || city !== "all" || sort !== "newest";

  return (
    <Card className="border-2 mb-8">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold text-lg">Filtrele ve Ara</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Arama Input'u */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="İsim veya açıklama ara..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Tür Select */}
          <Select value={type} onValueChange={(value) => {
            setType(value);
            updateURL({ type: value });
          }}>
            <SelectTrigger>
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
            <SelectTrigger>
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
            <SelectTrigger>
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

