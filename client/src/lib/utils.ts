import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, startOfDay } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(date: Date): string {
  return format(date, 'HH:mm');
}

export function formatDate(date: Date): string {
  return format(startOfDay(date), 'yyyy-MM-dd');
}

// New utility function to normalize dates for comparison
export function normalizeDate(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : date;
  return startOfDay(d);
}