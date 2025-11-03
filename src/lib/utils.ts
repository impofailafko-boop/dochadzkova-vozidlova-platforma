import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts a Date object to a local date string in YYYY-MM-DD format
 * without timezone conversion issues
 */
export function formatDateToLocalString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Gets today's date as a string in YYYY-MM-DD format in local timezone
 */
export function getTodayLocalString(): string {
  return formatDateToLocalString(new Date());
}

/**
 * Parses a YYYY-MM-DD string to a Date object at midnight local time
 */
export function parseDateString(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/**
 * Converts decimal hours to readable format (e.g., 6.58 -> "6h 35min")
 */
export function formatHoursToReadable(decimalHours: number | null | undefined): string {
  if (!decimalHours || decimalHours === 0) return '0h';
  
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);
  
  if (minutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${minutes}min`;
}

/**
 * Gets current time as a string in HH:MM:SS format
 */
export function getCurrentTimeString(): string {
  return new Date().toTimeString().split(' ')[0];
}

/**
 * Formats a Date object to ISO date string (YYYY-MM-DD)
 */
export function formatDateToISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Gets today's date as ISO string (YYYY-MM-DD)
 */
export function getTodayISO(): string {
  return formatDateToISO(new Date());
}
