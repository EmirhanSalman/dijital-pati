/**
 * Canvas yardımcı fonksiyonları - Resim kırpma işlemleri için
 */

export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Bir görüntüyü belirtilen pixel kırpma alanına göre kırpar
 * @param imageSrc - Kaynak görüntü (URL veya base64)
 * @param pixelCrop - Kırpılacak alan (piksel cinsinden)
 * @returns Kırpılmış görüntünün Blob'u
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: PixelCrop
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = imageSrc;

    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context alınamadı'));
        return;
      }

      // Canvas boyutlarını kırpma alanına göre ayarla
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;

      // Resmi kırpılmış alana çiz
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );

      // Canvas'ı Blob'a dönüştür
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Blob oluşturulamadı'));
            return;
          }
          resolve(blob);
        },
        'image/jpeg',
        0.95 // Kalite (0-1 arası)
      );
    };

    image.onerror = () => {
      reject(new Error('Resim yüklenemedi'));
    };
  });
}

/**
 * Blob'u File objesine dönüştürür
 * @param blob - Dönüştürülecek Blob
 * @param fileName - Dosya adı
 * @returns File objesi
 */
export function blobToFile(blob: Blob, fileName: string): File {
  return new File([blob], fileName, { type: blob.type });
}

