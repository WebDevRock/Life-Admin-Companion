import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, isPast, isToday, isTomorrow, isThisWeek } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string | null | undefined) {
  if (!dateString) return null;
  const date = new Date(dateString);
  return format(date, "MMM d, yyyy");
}

export function getRelativeDateLabel(dateString: string | null | undefined) {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isPast(date) && !isToday(date)) return "Overdue";
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  if (isThisWeek(date)) return "This week";
  return formatDate(dateString);
}
