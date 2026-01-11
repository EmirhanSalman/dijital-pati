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
    email: "",
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

    if (!formData.email.trim()) {
      setError("Lütfen e-posta adresinizi girin.");
      return;
    }

    if (!formData.message.trim()) {
      setError("Lütfen bir mesaj yazın.");
      return;
    }

    if (!pet.owner_id) {
      setError("Hayvan sahibi bilgisi bulunamadı.");
      return;
    }

    setLoading(true);

    try {
      // STRICT TYPE SAFETY: Explicitly convert to String.
      // This handles the union type where token_id might be a number (Blockchain) 
      // or id might be a UUID string (Database).
      const petId = String(pet.token_id || pet.id);

      const result = await sendContactEmail({
        petId,
        ownerId: pet.owner_id,
        senderEmail: formData.email.trim(),
        message: formData.message.trim(),
      });

      if (result.success) {
        setSuccess(true);
        // Formu temizle
        setFormData({
          finderName: "",
          finderPhone: "",
          email: "",
          message: "",
          shareLocation: false,
        });
        setLocation(null);
        // 2 saniye sonra modal'ı kapat
        setTimeout(() => {
          setOpen(false);
          setSuccess(false);
        }, 2000);
      } else {
        setError(result.error || 'Mesaj gönderilirken bir hata oluştu.');
      }
    } catch (err: any) {
      console.error('Contact form error:', err);
      setError(err.message || "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.");
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
        <DialogDescription className="sr-only">Dialog Details</DialogDescription>
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
              onChange={(e) => {
                // Immediate update for input value (critical for UX)
                setFormData((prev) => ({ ...prev, finderName: e.target.value }));
              }}
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
              onChange={(e) => {
                // Immediate update for input value (critical for UX)
                setFormData((prev) => ({ ...prev, finderPhone: e.target.value }));
              }}
              placeholder="0555 123 45 67"
              required
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="email">E-posta Adresiniz *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => {
                // Immediate update for input value (critical for UX)
                setFormData((prev) => ({ ...prev, email: e.target.value }));
              }}
              placeholder="ornek@email.com"
              required
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="message">Mesajınız *</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => {
                // Immediate update for input value (critical for UX)
                setFormData((prev) => ({ ...prev, message: e.target.value }));
              }}
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

