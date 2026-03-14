import {
  startOfDay,
  endOfDay,
  subDays,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
} from "date-fns";

export type DateRangePreset = "all" | "today" | "last_7" | "last_30" | "this_month" | "custom";

export interface DateRange {
  from: Date;
  to: Date;
}

/** Start of "all time" range (year 2000) so all collected data is included */
const ALL_START = new Date(2000, 0, 1);

export function getRangeForPreset(preset: DateRangePreset, ref: Date = new Date()): DateRange {
  const today = endOfDay(ref);
  switch (preset) {
    case "all":
      return { from: startOfDay(ALL_START), to: today };
    case "today":
      return { from: startOfDay(ref), to: today };
    case "last_7":
      return { from: startOfDay(subDays(ref, 6)), to: today };
    case "last_30":
      return { from: startOfDay(subDays(ref, 29)), to: today };
    case "this_month":
      return { from: startOfMonth(ref), to: endOfMonth(ref) };
    default:
      return { from: startOfDay(ref), to: today };
  }
}

export function isDateInRange(date: Date | string, range: DateRange): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  return isWithinInterval(d, { start: range.from, end: range.to });
}
