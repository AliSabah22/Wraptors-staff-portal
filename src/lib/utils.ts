import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatDateRange(from: Date, to: Date): string {
  const fromStr = formatDate(from);
  const toStr = formatDate(to);
  return fromStr === toStr ? fromStr : `${fromStr} – ${toStr}`;
}

/** Single source of truth for job stage display labels (e.g. "Inspection Final"). */
export function formatJobStage(stage: string): string {
  return stage.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}
