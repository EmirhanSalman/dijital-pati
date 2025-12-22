/**
 * Başlıktan URL-dostu slug üretir
 * Türkçe karakterleri destekler
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    // Türkçe karakterleri değiştir
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    // Özel karakterleri temizle
    .replace(/[^\w\s-]/g, '')
    // Boşlukları tire ile değiştir
    .replace(/[\s_]+/g, '-')
    // Çoklu tireleri tek tire yap
    .replace(/-+/g, '-')
    // Başta ve sonda tire varsa kaldır
    .replace(/^-+|-+$/g, '')
}


