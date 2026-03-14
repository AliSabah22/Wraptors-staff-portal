import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wraptors-gold focus-visible:ring-offset-2 focus-visible:ring-offset-wraptors-black disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-wraptors-gold text-wraptors-black hover:bg-wraptors-gold-light shadow-gold active:bg-wraptors-gold/90",
        destructive: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
        outline:
          "border border-wraptors-border bg-transparent text-wraptors-muted-light hover:bg-wraptors-surface hover:text-white hover:border-wraptors-gold/50 active:bg-wraptors-surface/80",
        secondary:
          "bg-wraptors-surface text-wraptors-muted-light hover:bg-wraptors-surface-hover hover:text-white active:bg-wraptors-surface-hover/90",
        ghost: "text-wraptors-muted-light hover:bg-wraptors-surface hover:text-white active:bg-wraptors-surface/80",
        link: "text-wraptors-gold underline-offset-4 hover:underline active:opacity-80",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-8 text-base",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
