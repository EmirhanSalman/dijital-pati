"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const LostPetMap = dynamic(() => import("@/components/map/LostPetMap"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p>Harita yükleniyor...</p>
    </div>
  ),
});

export default function MapPageClient() {
  return <LostPetMap />;
}
