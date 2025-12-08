"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2 } from "lucide-react";
import { uploadAvatar } from "@/app/actions/profile";
import { useRouter } from "next/navigation";
import ImageCropper from "./ImageCropper";
import { blobToFile } from "@/lib/canvasUtils";

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  userInitials: string;
}

export default function AvatarUpload({ currentAvatarUrl, userInitials }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Dosya boyutu kontrolü (5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        alert("Dosya boyutu çok büyük. Maksimum 5MB boyutunda resim yükleyebilirsiniz.");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      // Dosyayı FileReader ile oku ve modal'ı aç
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageSrc = reader.result as string;
        setSelectedImageSrc(imageSrc);
        setIsCropperOpen(true);
      };
      reader.onerror = () => {
        alert("Dosya okunurken bir hata oluştu. Lütfen tekrar deneyin.");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    setIsCropperOpen(false);
    setIsUploading(true);

    try {
      // Blob'u File'a dönüştür
      const croppedFile = blobToFile(croppedImageBlob, "avatar.jpg");

      // FormData oluştur
      const formData = new FormData();
      formData.append("avatar", croppedFile);

      // Server action'ı çağır
      const result = await uploadAvatar(formData);

      if (result.error) {
        alert(result.error);
        return;
      }

      // Önizleme URL'ini güncelle
      const previewBlobUrl = URL.createObjectURL(croppedImageBlob);
      setPreviewUrl(previewBlobUrl);

      // Sayfayı yenile
      router.refresh();
    } catch (error: any) {
      console.error("Yükleme hatası:", error);
      alert("Bir hata oluştu: " + (error.message || "Bilinmeyen hata"));
    } finally {
      setIsUploading(false);
      setSelectedImageSrc(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleCropperClose = () => {
    setIsCropperOpen(false);
    setSelectedImageSrc(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const displayUrl = previewUrl || currentAvatarUrl;

  return (
    <>
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Avatar className="h-24 w-24 md:h-32 md:w-32">
            {displayUrl && !isUploading && (
              <AvatarImage src={displayUrl} alt="Profil fotoğrafı" />
            )}
            <AvatarFallback className="text-2xl md:text-3xl">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          className="hidden"
          id="avatar-upload"
          disabled={isUploading || isCropperOpen}
        />

        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || isCropperOpen}
          className="w-full md:w-auto"
        >
          <Camera className="h-4 w-4 mr-2" />
          {isUploading ? "Yükleniyor..." : "Fotoğraf Yükle"}
        </Button>

        <p className="text-xs text-muted-foreground text-center max-w-xs">
          JPEG, PNG, WebP veya GIF formatında, maksimum 5MB boyutunda resim yükleyebilirsiniz.
        </p>
      </div>

      {/* Image Cropper Modal */}
      {selectedImageSrc && (
        <ImageCropper
          imageSrc={selectedImageSrc}
          isOpen={isCropperOpen}
          onClose={handleCropperClose}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
}

