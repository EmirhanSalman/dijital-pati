"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Filter, X } from "lucide-react";

export default function LostPetsFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [city, setCity] = useState(searchParams.get("city") || "");
  const [district, setDistrict] = useState(searchParams.get("district") || "");

  const handleFilter = () => {
    startTransition(() => {
      const params = new URLSearchParams();
      if (city.trim()) {
        params.set("city", city.trim());
      }
      if (district.trim()) {
        params.set("district", district.trim());
      }
      router.push(`/lost-pets?${params.toString()}`);
    });
  };

  const handleClear = () => {
    setCity("");
    setDistrict("");
    startTransition(() => {
      router.push("/lost-pets");
    });
  };

  const hasFilters = city.trim() || district.trim();

  return (
    <Card className="border-2 mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtrele
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city">İl</Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Örn: İstanbul, Ankara..."
              className="mt-2"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleFilter();
                }
              }}
            />
          </div>
          <div>
            <Label htmlFor="district">İlçe</Label>
            <Input
              id="district"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="Örn: Kadıköy, Çankaya..."
              className="mt-2"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleFilter();
                }
              }}
            />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button
            onClick={handleFilter}
            disabled={isPending}
            className="flex-1"
          >
            {isPending ? "Filtreleniyor..." : "Filtrele"}
          </Button>
          {hasFilters && (
            <Button
              onClick={handleClear}
              variant="outline"
              disabled={isPending}
            >
              <X className="h-4 w-4 mr-2" />
              Temizle
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

