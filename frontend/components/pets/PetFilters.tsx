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

const PET_TYPES = [
  { value: "all", label: "Tüm Türler" },
  { value: "Köpek", label: "Köpek" },
  { value: "Kedi", label: "Kedi" },
  { value: "Kuş", label: "Kuş" },
  { value: "Diğer", label: "Diğer" },
];

const CITIES = [
  { value: "all", label: "Tüm Şehirler" },
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

interface PetFiltersProps {
  currentCity?: string;
  currentType?: string;
  currentQuery?: string;
}

export default function PetFilters({
  currentCity,
  currentType,
  currentQuery,
}: PetFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateURL = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value && value !== "all") {
      params.set(key, value);
      // Sayfa değiştiğinde ilk sayfaya dön
      if (key !== "page") {
        params.delete("page");
      }
    } else {
      params.delete(key);
    }

    // Eğer arama boşsa, query parametresini kaldır
    if (key === "query" && !value) {
      params.delete("query");
    }

    router.push(`/lost-pets?${params.toString()}`);
  };

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Önceki timeout'u temizle
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Yeni timeout oluştur
    searchTimeoutRef.current = setTimeout(() => {
      updateURL("query", value);
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

  const handleCityChange = (value: string) => {
    updateURL("city", value);
  };

  const handleTypeChange = (value: string) => {
    updateURL("type", value);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      {/* Arama */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="İsim veya türde ara..."
          defaultValue={currentQuery || ""}
          onChange={handleSearchChange}
          className="pl-10"
        />
      </div>

      {/* Şehir Filtresi */}
      <Select
        value={currentCity || "all"}
        onValueChange={handleCityChange}
      >
        <SelectTrigger className="w-full md:w-[200px]">
          <SelectValue placeholder="Şehir" />
        </SelectTrigger>
        <SelectContent>
          {CITIES.map((city) => (
            <SelectItem key={city.value} value={city.value}>
              {city.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Tür Filtresi */}
      <Select
        value={currentType || "all"}
        onValueChange={handleTypeChange}
      >
        <SelectTrigger className="w-full md:w-[200px]">
          <SelectValue placeholder="Tür" />
        </SelectTrigger>
        <SelectContent>
          {PET_TYPES.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

