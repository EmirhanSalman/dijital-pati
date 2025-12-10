"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, MessageSquare, MapPin } from "lucide-react";
import { sendContactEmail } from "@/app/actions/contact";
import type { Pet } from "@/lib/supabase/server";

interface ContactOwnerModalProps {
  pet: Pet;
  trigger?: React.ReactNode;
}

export default function ContactOwnerModal({ pet, trigger }: ContactOwnerModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    finderName: "",
    finderPhone: "",
    message: "",
    shareLocation: false,
  });

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Pet adını belirle
  const petName = pet.name && pet.name.trim() && !pet.name.startsWith("Pati #") 
    ? pet.name 
    : `Pati #${pet.token_id}`;

  // İletişim bilgisi kontrolü
  const hasContactInfo = !!(pet.contact_phone || pet.contact_email || pet.contact_info);
  const ownerEmail = pet.contact_email || null;

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Tarayıcınız konum servisini desteklemiyor.");
      return;
    }

    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        setLocationError("Konum alınamadı: " + error.message);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!formData.finderName.trim()) {
      setError("Lütfen adınızı girin.");
      return;
    }

    if (!formData.finderPhone.trim()) {
      setError("Lütfen telefon numaranızı girin.");
      return;
    }

    if (!formData.message.trim()) {
      setError("Lütfen bir mesaj yazın.");
      return;
    }

    if (!ownerEmail) {
      setError("Hayvan sahibinin e-posta adresi bulunamadı.");
      return;
    }

    setLoading(true);

    try {
      const result = await sendContactEmail({
        petId: pet.token_id || pet.id,
        petName: petName,
        ownerEmail: ownerEmail,
        finderName: formData.finderName.trim(),
        finderPhone: formData.finderPhone.trim(),
        message: formData.message.trim(),
        location: formData.shareLocation && location ? location : null,
      });

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        // Formu temizle
        setFormData({
          finderName: "",
          finderPhone: "",
          message: "",
          shareLocation: false,
        });
        setLocation(null);
        // 2 saniye sonra modal'ı kapat
        setTimeout(() => {
          setOpen(false);
          setSuccess(false);
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || "Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const defaultTrigger = (
    <Button className="w-full" variant="default">
      <MessageSquare className="h-4 w-4 mr-2" />
      Sahibiyle İletişime Geç
    </Button>
  );

  if (!hasContactInfo) {
    return null; // İletişim bilgisi yoksa modal gösterilmez
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Sahibiyle İletişime Geç</DialogTitle>
          <DialogDescription>
            {petName} için sahibine mesaj gönderin. İletişim bilgileriniz sadece hayvan sahibine iletilecektir.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="finderName">Adınız *</Label>
            <Input
              id="finderName"
              value={formData.finderName}
              onChange={(e) =>
                setFormData({ ...formData, finderName: e.target.value })
              }
              placeholder="Adınız ve soyadınız"
              required
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="finderPhone">Telefon Numaranız *</Label>
            <Input
              id="finderPhone"
              type="tel"
              value={formData.finderPhone}
              onChange={(e) =>
                setFormData({ ...formData, finderPhone: e.target.value })
              }
              placeholder="0555 123 45 67"
              required
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="message">Mesajınız *</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              placeholder="Örn: Kedinizi parkta gördüm, çok sağlıklı görünüyordu..."
              rows={4}
              required
              className="mt-2"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="shareLocation"
              checked={formData.shareLocation}
              onCheckedChange={(checked) => {
                setFormData({ ...formData, shareLocation: checked as boolean });
                if (checked && !location) {
                  handleGetLocation();
                }
              }}
            />
            <Label
              htmlFor="shareLocation"
              className="text-sm font-normal cursor-pointer flex items-center gap-2"
            >
              <MapPin className="h-4 w-4" />
              Konumumu Paylaş
            </Label>
          </div>

          {formData.shareLocation && (
            <div className="text-sm text-muted-foreground">
              {location ? (
                <div className="flex items-center gap-2 text-green-600">
                  <MapPin className="h-4 w-4" />
                  <span>Konum alındı: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}</span>
                </div>
              ) : locationError ? (
                <div className="text-red-600">{locationError}</div>
              ) : (
                <div className="text-yellow-600">Konum alınıyor...</div>
              )}
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-600 text-sm">
              Mesajınız başarıyla gönderildi! Hayvan sahibi en kısa sürede size dönecektir.
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gönderiliyor...
                </>
              ) : (
                "Gönder"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

