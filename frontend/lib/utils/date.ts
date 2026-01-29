/**
 * Date formatting utility that avoids timezone database queries
 * This prevents the pg_timezone_names query that causes high TTFB
 * 
 * Instead of using toLocaleDateString which queries the database,
 * we manually format dates using simple string operations.
 */

const TURKISH_MONTHS = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
] as const;

const TURKISH_DAYS = [
  "Pazar",
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
] as const;

/**
 * Formats a date string or Date object to Turkish locale format
 * without triggering timezone database queries
 * 
 * @param date - Date string or Date object
 * @param options - Formatting options
 * @returns Formatted date string (e.g., "15 Ocak 2024")
 */
export function formatDateTR(
  date: string | Date,
  options: {
    year?: "numeric" | "2-digit";
    month?: "long" | "short" | "numeric" | "2-digit";
    day?: "numeric" | "2-digit";
    weekday?: "long" | "short" | "narrow";
  } = {}
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  // Validate date
  if (isNaN(dateObj.getTime())) {
    return "Geçersiz tarih";
  }

  const year = dateObj.getFullYear();
  const month = dateObj.getMonth(); // 0-11
  const day = dateObj.getDate();
  const weekday = dateObj.getDay(); // 0-6

  const parts: string[] = [];

  // Add weekday if requested
  if (options.weekday) {
    const dayName = TURKISH_DAYS[weekday];
    if (options.weekday === "long") {
      parts.push(dayName);
    } else if (options.weekday === "short") {
      parts.push(dayName.substring(0, 3));
    } else {
      parts.push(dayName.substring(0, 2));
    }
  }

  // Add day
  if (options.day !== undefined) {
    if (options.day === "numeric" || options.day === "2-digit") {
      parts.push(day.toString().padStart(2, "0"));
    } else {
      parts.push(day.toString());
    }
  } else {
    // Default: include day
    parts.push(day.toString());
  }

  // Add month
  if (options.month !== undefined) {
    if (options.month === "long") {
      parts.push(TURKISH_MONTHS[month]);
    } else if (options.month === "short") {
      parts.push(TURKISH_MONTHS[month].substring(0, 3));
    } else if (options.month === "numeric" || options.month === "2-digit") {
      const monthNum = (month + 1).toString().padStart(2, "0");
      parts.push(monthNum);
    }
  } else {
    // Default: include month name
    parts.push(TURKISH_MONTHS[month]);
  }

  // Add year
  if (options.year !== undefined) {
    if (options.year === "numeric") {
      parts.push(year.toString());
    } else if (options.year === "2-digit") {
      parts.push(year.toString().slice(-2));
    }
  } else {
    // Default: include year
    parts.push(year.toString());
  }

  // Format: "15 Ocak 2024" (day month year)
  return parts.join(" ");
}

/**
 * Formats a date to a short format (e.g., "15.01.2024")
 */
export function formatDateShort(date: string | Date): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return "Geçersiz tarih";
  }

  const day = dateObj.getDate().toString().padStart(2, "0");
  const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
  const year = dateObj.getFullYear();

  return `${day}.${month}.${year}`;
}

/**
 * Formats a date with time (e.g., "15 Ocak 2024, 14:30")
 */
export function formatDateTimeTR(
  date: string | Date,
  includeSeconds = false
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return "Geçersiz tarih";
  }

  const dateStr = formatDateTR(dateObj, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const hours = dateObj.getHours().toString().padStart(2, "0");
  const minutes = dateObj.getMinutes().toString().padStart(2, "0");
  
  if (includeSeconds) {
    const seconds = dateObj.getSeconds().toString().padStart(2, "0");
    return `${dateStr}, ${hours}:${minutes}:${seconds}`;
  }

  return `${dateStr}, ${hours}:${minutes}`;
}

/**
 * Formats a relative date (e.g., "Az önce", "5 dakika önce", "15 Ocak")
 * Used for notifications and recent content
 */
export function formatRelativeDateTR(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Az önce";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} dakika önce`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} saat önce`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} gün önce`;
  
  // For older dates, show short format
  return formatDateTR(date, {
    day: "numeric",
    month: "short",
  });
}

