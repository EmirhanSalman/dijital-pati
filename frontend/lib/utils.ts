import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Bir string'i URL-friendly slug'a çevirir
 * @param text - Slug'a çevrilecek metin
 * @returns URL-friendly slug string
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Boşlukları tire ile değiştir
    .replace(/[^\w\-]+/g, '') // Alphanumeric ve tire dışındaki karakterleri kaldır
    .replace(/\-\-+/g, '-') // Çoklu tireleri tek tireye çevir
    .replace(/^-+/, '') // Baştaki tireleri kaldır
    .replace(/-+$/, '') // Sondaki tireleri kaldır
}
