// Utility for Garment Production Date & Month Formatting & Management

export const INDO_MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export const INDO_MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agt",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

export const INDO_DAYS = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

/**
 * Formats "YYYY-MM-DD" to "13 September 2026"
 */
export function formatIndoDate(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return `${day} ${INDO_MONTHS[monthIdx] || parts[1]} ${year}`;
}

/**
 * Formats "YYYY-MM-DD" to "Senin, 14 Sep 2026"
 */
export function formatIndoDateWithDay(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  const dayName = INDO_DAYS[d.getDay()];
  const parts = dateStr.split("-");
  const monthIdx = parseInt(parts[1], 10) - 1;
  return `${dayName}, ${parseInt(parts[2], 10)} ${INDO_MONTHS_SHORT[monthIdx]} ${parts[0]}`;
}

/**
 * Formats "YYYY-MM" to "September 2026"
 */
export function formatIndoMonth(monthStr: string): string {
  if (!monthStr) return "";
  const parts = monthStr.split("-");
  if (parts.length < 2) return monthStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  return `${INDO_MONTHS[monthIdx] || parts[1]} ${year}`;
}

/**
 * Formats "YYYY-MM" to "Sep 2026"
 */
export function formatIndoMonthShort(monthStr: string): string {
  if (!monthStr) return "";
  const parts = monthStr.split("-");
  if (parts.length < 2) return monthStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  return `${INDO_MONTHS_SHORT[monthIdx] || parts[1]} ${year}`;
}

/**
 * Returns number of days in a given YYYY-MM
 */
export function getDaysInMonth(monthStr: string): number {
  if (!monthStr) return 30;
  const parts = monthStr.split("-");
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  return new Date(year, month, 0).getDate();
}

/**
 * Offset date by +/- days
 */
export function offsetDate(dateStr: string, deltaDays: number): string {
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  d.setDate(d.getDate() + deltaDays);
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}
