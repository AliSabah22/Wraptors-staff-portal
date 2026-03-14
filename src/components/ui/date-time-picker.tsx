"use client";

import * as React from "react";
import { format, parse, setHours, setMinutes, startOfDay } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/** Value format: "YYYY-MM-DDTHH:mm" (no seconds, no Z). */
function parseValue(value: string | undefined): Date | null {
  if (!value || !value.trim()) return null;
  const s = value.trim().slice(0, 16);
  if (s.length < 16) return null;
  const d = parse(s, "yyyy-MM-dd'T'HH:mm", new Date());
  return isNaN(d.getTime()) ? null : d;
}

function formatValue(d: Date): string {
  return format(d, "yyyy-MM-dd'T'HH:mm");
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];

export interface DateTimePickerProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Select date & time",
  disabled,
  className,
  id,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const parsed = parseValue(value);
  const [date, setDate] = React.useState<Date | undefined>(() => parsed ?? undefined);
  const [hour, setHour] = React.useState<number>(() => parsed?.getHours() ?? 9);
  const [minute, setMinute] = React.useState<number>(() => parsed?.getMinutes() ?? 0);

  React.useEffect(() => {
    const p = parseValue(value);
    if (p) {
      setDate(p);
      setHour(p.getHours());
      setMinute(p.getMinutes());
    } else {
      setDate(undefined);
      setHour(9);
      setMinute(0);
    }
  }, [value]);

  const handleDateSelect = (d: Date | undefined) => {
    setDate(d ?? undefined);
    const base = d ?? date ?? startOfDay(new Date());
    const combined = setMinutes(setHours(base, hour), minute);
    if (d) onChange(formatValue(combined)); // Commit immediately so calendar/dashboard trackers update
  };

  const handleTimeChange = (newHour: number, newMinute: number) => {
    setHour(newHour);
    setMinute(newMinute);
    const base = date ?? startOfDay(new Date());
    onChange(formatValue(setMinutes(setHours(base, newHour), newMinute)));
  };

  const handleApply = () => {
    if (date) {
      const combined = setMinutes(setHours(date, hour), minute);
      onChange(formatValue(combined));
    }
    setOpen(false);
  };

  // When open, show pending selection so user sees what they're about to apply
  const displayStr = open && date
    ? format(setMinutes(setHours(date, hour), minute), "MMM d, yyyy · h:mm a")
    : parsed
      ? format(parsed, "MMM d, yyyy · h:mm a")
      : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-10 w-full justify-start gap-2 rounded-lg border border-wraptors-border bg-wraptors-charcoal pl-3 text-left font-normal text-white hover:bg-wraptors-surface-hover hover:text-white focus:ring-2 focus:ring-wraptors-gold/50",
            !value && !(open && date) && "text-wraptors-muted",
            className
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0 text-wraptors-gold/80" />
          <span className="truncate">{displayStr}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            defaultMonth={date ?? new Date()}
            initialFocus
            className="rounded-lg border-0"
          />
        </div>
        <div className="flex items-center gap-2 border-t border-wraptors-border px-3 py-3">
          <Clock className="h-4 w-4 text-wraptors-gold/80 shrink-0" />
          <Select
            value={String(hour)}
            onValueChange={(v) => handleTimeChange(Number(v), minute)}
          >
            <SelectTrigger className="h-9 w-20 border-wraptors-border bg-wraptors-black/80 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HOURS.map((h) => (
                <SelectItem key={h} value={String(h)}>
                  {h === 0 ? "12" : h > 12 ? h - 12 : h}:00 {h < 12 ? "AM" : "PM"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-wraptors-muted">:</span>
          <Select
            value={String(minute)}
            onValueChange={(v) => handleTimeChange(hour, Number(v))}
          >
            <SelectTrigger className="h-9 w-20 border-wraptors-border bg-wraptors-black/80 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MINUTES.map((m) => (
                <SelectItem key={m} value={String(m)}>
                  {String(m).padStart(2, "0")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-end gap-2 border-t border-wraptors-border px-3 pb-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              onChange(undefined);
              setOpen(false);
            }}
            className="text-wraptors-muted hover:text-white"
          >
            Clear
          </Button>
          <Button type="button" size="sm" onClick={handleApply} className="bg-wraptors-gold text-wraptors-black hover:bg-wraptors-gold/90">
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
