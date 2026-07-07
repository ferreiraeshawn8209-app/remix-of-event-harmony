/** Format a date string as "DD Mon YYYY" in South African locale */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });
}

/** Format a date string as a short local date (e.g. "07/07/2026") */
export function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-ZA");
}

/** Format a date string as "DD Mon, HH:MM" in South African locale */
export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-ZA", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
