"use client";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import type { DateRange as PickerDateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/utils";
import type { DateRangePreset, DateRange } from "@/lib/date-range";
import { getRangeForPreset } from "@/lib/date-range";
import { startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";

const PRESET_LABELS: Record<DateRangePreset, string> = {
  all: "All",
  today: "Today",
  last_7: "Last 7 days",
  last_30: "Last 30 days",
  this_month: "This month",
  custom: "Custom",
};

export interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  preset?: DateRangePreset;
  onPresetChange?: (preset: DateRangePreset) => void;
  /** Rendered on the same row as preset buttons (e.g. "View all jobs") for alignment */
  trailing?: React.ReactNode;
  className?: string;
}

export function DateRangePicker({
  value,
  onChange,
  preset: controlledPreset,
  onPresetChange,
  trailing,
  className,
}: DateRangePickerProps) {
  const [internalPreset, setInternalPreset] = useState<DateRangePreset>("last_30");
  const [customOpen, setCustomOpen] = useState(false);
  const [customRange, setCustomRange] = useState<PickerDateRange | undefined>(() => ({
    from: value.from,
    to: value.to,
  }));
  const [customMonth, setCustomMonth] = useState<Date>(() => value.from);

  const preset = controlledPreset ?? internalPreset;
  const setPreset = onPresetChange ?? setInternalPreset;

  const handlePresetSelect = (v: string) => {
    const p = v as DateRangePreset;
    setPreset(p);
    if (p === "custom") {
      setCustomRange({ from: value.from, to: value.to });
      setCustomMonth(value.from);
      setCustomOpen(true);
    } else {
      onChange(getRangeForPreset(p));
    }
  };

  const handleApplyCustom = () => {
    const from = customRange?.from ? startOfDay(customRange.from) : value.from;
    const to = customRange?.to ? endOfDay(customRange.to) : customRange?.from ? endOfDay(customRange.from) : value.to;
    const fromDate = from.getTime() <= to.getTime() ? from : to;
    const toDate = from.getTime() <= to.getTime() ? to : from;
    onChange({ from: fromDate, to: toDate });
    setPreset("custom");
    setCustomOpen(false);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {(Object.keys(PRESET_LABELS) as DateRangePreset[]).map((p) => (
            <Button
              key={p}
              type="button"
              variant={preset === p ? "default" : "outline"}
              size="sm"
              className={cn(
                "min-w-0 rounded-md border font-normal transition-colors",
                preset === p
                  ? "bg-wraptors-gold text-wraptors-black hover:bg-wraptors-gold-light"
                  : "border-wraptors-border bg-wraptors-charcoal/50 text-wraptors-muted-light hover:border-wraptors-gold/50 hover:text-white"
              )}
              onClick={() => handlePresetSelect(p)}
            >
              {p === "custom" ? (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {PRESET_LABELS[p]}
                </span>
              ) : (
                PRESET_LABELS[p]
              )}
            </Button>
          ))}
        </div>
        {trailing}
      </div>
      <p className="text-xs text-wraptors-muted">
        {preset === "all" ? "All time" : `${formatDate(value.from)} – ${formatDate(value.to)}`}
      </p>

      <Dialog open={customOpen} onOpenChange={setCustomOpen}>
        <DialogContent className="border-wraptors-border bg-wraptors-surface max-w-[min(100vw,42rem)]">
          <DialogHeader>
            <DialogTitle>Select date range</DialogTitle>
            <DialogDescription>
              Pick a From and To date. Data collected within this range will be shown on the dashboard and analytics.
            </DialogDescription>
          </DialogHeader>
          {customRange?.from && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-wraptors-border bg-wraptors-charcoal/50 px-4 py-2 text-sm">
              <Label className="text-wraptors-muted font-normal">From:</Label>
              <span className="font-medium text-white">{formatDate(customRange.from)}</span>
              {customRange.to && (
                <>
                  <Label className="text-wraptors-muted font-normal">To:</Label>
                  <span className="font-medium text-white">{formatDate(customRange.to)}</span>
                </>
              )}
            </div>
          )}
          <div className="flex justify-center overflow-auto py-4">
            <Calendar
              mode="range"
              month={customMonth}
              onMonthChange={setCustomMonth}
              selected={customRange}
              onSelect={setCustomRange}
              numberOfMonths={2}
              disabled={(date) => date > new Date()}
              className="rounded-lg border border-wraptors-border bg-wraptors-charcoal"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleApplyCustom}
              className="bg-wraptors-gold text-wraptors-black hover:bg-wraptors-gold-light"
              disabled={!customRange?.from}
            >
              Apply — show data for selected range
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
