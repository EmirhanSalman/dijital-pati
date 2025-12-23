"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { reportFoundPet } from "@/app/actions/pet";

interface PetFoundButtonProps {
  petId: string;
  ownerAddress: string | null;
}

export default function PetFoundButton({ petId, ownerAddress }: PetFoundButtonProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReportFound = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      let latitude: number | null = null;
      let longitude: number | null = null;

      // Konum izni iste
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>(
            (resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
              });
            }
          );

          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        } catch (geoError: any) {
          console.warn("Konum izni verilmedi:", geoError);
          // Konum izni verilmezse devam et
        }
      }

      // İletişim bilgisi al (basit prompt)
      const contactInfo = prompt(
        "Lütfen iletişim bilginizi girin (Telefon veya Email):"
      );

      if (!contactInfo || !contactInfo.trim()) {
        setError("İletişim bilgisi gereklidir.");
        setLoading(false);
        return;
      }

      // Bildirim gönder
      const result = await reportFoundPet(
        petId,
        ownerAddress,
        latitude,
        longitude,
        contactInfo.trim()
      );

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
        }, 5000);
      }
    } catch (err: any) {
      setError(err.message || "Bildirim gönderilirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg flex items-center space-x-2 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg flex items-center space-x-2 text-sm">
          <CheckCircle2 className="h-4 w-4" />
          <span>Sahibine bilgi verildi! Email ve bildirim gönderildi.</span>
        </div>
      )}

      <Button
        onClick={handleReportFound}
        disabled={loading}
        className="w-full"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Gönderiliyor...
          </>
        ) : (
          <>
            <MapPin className="mr-2 h-5 w-5" />
            Konum Paylaş ve Sahibine Bildir
          </>
        )}
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Konum izni verirseniz haritada gösterilecek
      </p>
    </div>
  );
}



