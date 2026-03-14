"use client";

import * as React from "react";
import { format, parse } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Value format: "YYYY-MM-DD". */
function parseValue(value: string | undefined): Date | null {
  if (!value || !value.trim()) return null;
  const s = value.trim().slice(0, 10);
  if (s.length < 10) return null;
  const d = parse(s, "yyyy-MM-dd", new Date());
  return isNaN(d.getTime()) ? null : d;
}

function formatValue(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export interface DatePickerProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  disabled,
  className,
  id,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const parsed = parseValue(value);
  const [date, setDate] = React.useState<Date | undefined>(() => parsed ?? undefined);

  React.useEffect(() => {
    const p = parseValue(value);
    setDate(p ?? undefined);
  }, [value]);

  const handleDateSelect = (d: Date | undefined) => {
    setDate(d ?? undefined);
    if (d) onChange(formatValue(d)); // Commit immediately so calendar/dashboard trackers update
  };

  const handleApply = () => {
    if (date) onChange(formatValue(date));
    setOpen(false);
  };

  // When open, show pending selection (date) so user sees what they're about to apply
  const displayStr = open && date
    ? format(date, "MMM d, yyyy")
    : parsed
      ? format(parsed, "MMM d, yyyy")
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
