import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[80px] w-full rounded-lg border border-wraptors-border bg-wraptors-charcoal px-3 py-2 text-sm text-white placeholder:text-wraptors-muted focus:outline-none focus:ring-2 focus:ring-wraptors-gold/50 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
