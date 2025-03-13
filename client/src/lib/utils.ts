import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, startOfDay, parseISO } from "date-fns";
import { toZonedTime } from 'date-fns-tz';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(date: Date): string {
  // Convert UTC date to local timezone before formatting
  const localDate = toZonedTime(date, Intl.DateTimeFormat().resolvedOptions().timeZone);
  return format(localDate, 'HH:mm');
}

export function formatDate(date: Date): string {
  // Convert UTC date to local timezone before formatting
  const localDate = toZonedTime(date, Intl.DateTimeFormat().resolvedOptions().timeZone);
  return format(startOfDay(localDate), 'yyyy-MM-dd');
}

// New utility function to normalize dates for comparison
export function normalizeDate(date: Date | string): Date {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const localDate = toZonedTime(d, Intl.DateTimeFormat().resolvedOptions().timeZone);
  return startOfDay(localDate);
}