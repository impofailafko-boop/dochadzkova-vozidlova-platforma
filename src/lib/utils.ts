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

/**
 * Calculates work hours between arrival and departure times
 * Supports both HH:MM:SS and HH:MM formats
 * Handles times crossing midnight
 */
export function calculateWorkHours(arrivalTime: string | null | undefined, departureTime: string | null | undefined): number | null {
  if (!arrivalTime || !departureTime) return null;

  try {
    const parseTime = (timeStr: string): Date => {
      const parts = timeStr.split(':');
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      const seconds = parts[2] ? parseInt(parts[2], 10) : 0;
      
      const date = new Date();
      date.setHours(hours, minutes, seconds, 0);
      return date;
    };

    const arrival = parseTime(arrivalTime);
    const departure = parseTime(departureTime);

    let diffMs = departure.getTime() - arrival.getTime();
    
    // Handle times crossing midnight
    if (diffMs < 0) {
      diffMs += 24 * 60 * 60 * 1000;
    }

    const hours = diffMs / (1000 * 60 * 60);
    return parseFloat(hours.toFixed(2));
  } catch (error) {
    console.error('Error calculating work hours:', error);
    return null;
  }
}
