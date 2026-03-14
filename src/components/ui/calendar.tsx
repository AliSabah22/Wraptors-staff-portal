"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, type DayPickerProps } from "react-day-picker";
import { cn } from "@/lib/utils";

export type CalendarProps = DayPickerProps;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("rdp-root p-3", className)}
      classNames={{
        root: "w-fit text-white",
        months: "flex flex-col gap-4 sm:flex-row sm:gap-6",
        month: "flex flex-col gap-4",
        month_caption: "flex justify-center pt-1 relative items-center h-9",
        caption_label: "text-sm font-medium text-wraptors-muted-light",
        nav: "flex items-center gap-1",
        button_previous:
          "absolute left-1 inline-flex h-8 w-8 items-center justify-center rounded-md text-wraptors-muted hover:text-white hover:bg-wraptors-surface-hover disabled:opacity-50",
        button_next:
          "absolute right-1 inline-flex h-8 w-8 items-center justify-center rounded-md text-wraptors-muted hover:text-white hover:bg-wraptors-surface-hover disabled:opacity-50",
        weekdays: "flex",
        weekday: "text-wraptors-muted text-[0.8rem] font-normal w-9 text-center",
        week: "flex w-full mt-1",
        day_button:
          "inline-flex h-9 w-9 items-center justify-center rounded-full p-0 text-sm font-normal text-wraptors-muted-light hover:bg-wraptors-surface-hover hover:text-white focus-visible:ring-2 focus-visible:ring-wraptors-gold focus-visible:ring-offset-2 focus-visible:ring-offset-wraptors-charcoal disabled:opacity-50",
        selected:
          "!bg-wraptors-gold !text-wraptors-black rounded-full ring-2 ring-wraptors-gold ring-offset-2 ring-offset-wraptors-charcoal rdp-day_selected",
        day_selected:
          "bg-wraptors-gold text-wraptors-black hover:bg-wraptors-gold/90 hover:text-wraptors-black focus:bg-wraptors-gold",
        outside: "text-wraptors-muted/50 opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      modifiersClassNames={{
        selected: "!bg-wraptors-gold !text-wraptors-black rounded-full ring-2 ring-wraptors-gold",
      }}
      components={{
        Chevron: ({ orientation, className: c, ...rest }) =>
          orientation === "left" ? (
            <ChevronLeft className={cn("h-4 w-4", c)} {...rest} />
          ) : (
            <ChevronRight className={cn("h-4 w-4", c)} {...rest} />
          ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
