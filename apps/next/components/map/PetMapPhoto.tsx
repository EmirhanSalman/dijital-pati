"use client";

import { useState } from "react";
import { PawPrint } from "lucide-react";
import { resolvePetImageUrl } from "@/lib/pets/resolve-pet-image-url";
import { safeImageSrc } from "@/lib/image-display";

type PetMapPhotoProps = {
  imageUrl: string | null | undefined;
  name: string;
};

export default function PetMapPhoto({ imageUrl, name }: PetMapPhotoProps) {
  const [failed, setFailed] = useState(false);
  const resolved = safeImageSrc(
    resolvePetImageUrl(imageUrl, "PetMapPhoto")
  );

  if (!resolved || failed) {
    return (
      <div className="flex h-32 w-full items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <PawPrint className="h-10 w-10 opacity-40" aria-hidden />
        <span className="sr-only">Fotoğraf yok</span>
      </div>
    );
  }

  return (
    <img
      src={resolved}
      alt={name || "Kayıp hayvan"}
      className="h-32 w-full rounded-lg object-cover bg-muted"
      onError={() => setFailed(true)}
    />
  );
}
