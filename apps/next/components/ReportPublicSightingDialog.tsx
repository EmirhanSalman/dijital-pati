"use client";

import { useEffect, useState } from "react";
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
import { ChevronDown, ChevronUp, Loader2, MapPin } from "lucide-react";
import { isValidMapCoordinates } from "@/lib/pets/coordinates";

type ReportPublicSightingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  petName: string;
  tokenId: string;
  onSuccess?: (message: string) => void;
};

export default function ReportPublicSightingDialog({
  open,
  onOpenChange,
  petName,
  tokenId,
  onSuccess,
}: ReportPublicSightingDialogProps) {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (!open) {
      setLatitude("");
      setLongitude("");
      setError(null);
      setLocating(false);
      setSubmitting(false);
      setShowAdvanced(false);
    }
  }, [open]);

  const hasCoordinates =
    latitude.trim() !== "" &&
    longitude.trim() !== "" &&
    isValidMapCoordinates(parseFloat(latitude), parseFloat(longitude));

  const handleUseMyLocation = () => {
    setError(null);
    if (!navigator.geolocation) {
      setError("Tarayıcı konum desteği yok. Gelişmiş bölümden koordinat girebilirsiniz.");
      setShowAdvanced(true);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(String(pos.coords.latitude));
        setLongitude(String(pos.coords.longitude));
        setLocating(false);
        setShowAdvanced(false);
      },
      () => {
        setLocating(false);
        setError("Konum alınamadı. Lütfen izin verin veya gelişmiş bölümden koordinat girin.");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handleSubmit = async () => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (!isValidMapCoordinates(lat, lng)) {
      setError("Önce konumunuzu alın veya gelişmiş bölümden geçerli koordinat girin.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch("/api/pet-scans/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ token_id: tokenId, latitude: lat, longitude: lng }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Konum kaydedilemedi.");
      onSuccess?.(data.message || "Konum bildiriminiz kaydedildi.");
      onOpenChange(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Konum kaydedilemedi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bu hayvanı gördüm</DialogTitle>
          <DialogDescription>
            <strong>{petName}</strong> için gördüğünüz konumu bildirin. Kayıp ilanının kırmızı pini
            değişmez; bildiriminiz haritada yeşil pin olarak görünür.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Button
            type="button"
            className="w-full"
            onClick={handleUseMyLocation}
            disabled={locating || submitting}
          >
            {locating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="mr-2 h-4 w-4" />
            )}
            Konumumu kullan
          </Button>

          {hasCoordinates ? (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              Konum alındı. Bildirmek için aşağıdaki &quot;Konum Bildir&quot; düğmesine basın.
            </p>
          ) : null}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={() => setShowAdvanced((v) => !v)}
            disabled={submitting}
          >
            {showAdvanced ? (
              <ChevronUp className="mr-2 h-4 w-4" />
            ) : (
              <ChevronDown className="mr-2 h-4 w-4" />
            )}
            Koordinatları elle gir (gelişmiş)
          </Button>

          {showAdvanced ? (
            <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3">
              <div className="space-y-2">
                <Label htmlFor="scan-lat">Enlem</Label>
                <Input
                  id="scan-lat"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="37.7648"
                  inputMode="decimal"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scan-lng">Boylam</Label>
                <Input
                  id="scan-lng"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="30.5566"
                  inputMode="decimal"
                />
              </div>
            </div>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            İptal
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || locating || !hasCoordinates}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              "Konum Bildir"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
