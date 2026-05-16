"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin } from "lucide-react";
import { isValidMapCoordinates } from "@/lib/pets/coordinates";

type ReportLostLocationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  petName: string;
  loading?: boolean;
  onConfirm: (latitude: number, longitude: number) => Promise<void>;
};

export default function ReportLostLocationDialog({
  open,
  onOpenChange,
  petName,
  loading = false,
  onConfirm,
}: ReportLostLocationDialogProps) {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const handleUseMyLocation = () => {
    setError(null);
    if (!navigator.geolocation) {
      setError("Tarayıcı konum desteği yok. Koordinatları elle girin.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(String(pos.coords.latitude));
        setLongitude(String(pos.coords.longitude));
        setLocating(false);
      },
      () => {
        setLocating(false);
        setError("Konum alınamadı. Lütfen izin verin veya koordinatları elle girin.");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handleSubmit = async () => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (!isValidMapCoordinates(lat, lng)) {
      setError(
        "Geçerli bir son görülme konumu girin (enlem -90…90, boylam -180…180)."
      );
      return;
    }
    setError(null);
    await onConfirm(lat, lng);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Kayıp bildir — konum gerekli</DialogTitle>
          <DialogDescription>
            <strong>{petName}</strong> için haritadaki kırmızı pin, son görüldüğü
            konumu gösterecek. Konumunuzu veya koordinatları girin.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleUseMyLocation}
            disabled={locating || loading}
          >
            {locating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="mr-2 h-4 w-4" />
            )}
            Konumumu kullan
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="lost-lat">Enlem (latitude)</Label>
              <Input
                id="lost-lat"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="37.7648"
                inputMode="decimal"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lost-lng">Boylam (longitude)</Label>
              <Input
                id="lost-lng"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="30.5566"
                inputMode="decimal"
              />
            </div>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            İptal
          </Button>
          <Button onClick={handleSubmit} disabled={loading || locating}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              "Kayıp ilanını yayınla"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
