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

/** Shop-facing currency (matches `shop_settings.currency`, default CAD). */
export function formatCurrencyShop(value: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompactCurrency(value: number): string {
  const n = Math.abs(value)
  if (n >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(value / 1_000).toFixed(1)}k`
  return formatCurrencyShop(value)
}

export function formatLastUpdated(timestamp: Date): string {
  const seconds = Math.floor((Date.now() - timestamp.getTime()) / 1000)
  if (seconds < 60) return "Updated just now"
  if (seconds < 120) return "Updated 1 min ago"
  return `Updated ${Math.floor(seconds / 60)} min ago`
}

export function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

export function formatDashboardHeadingDate(): string {
  return new Date().toLocaleDateString("en-CA", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
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
