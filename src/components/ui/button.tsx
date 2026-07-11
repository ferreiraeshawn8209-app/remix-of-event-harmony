import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:grayscale-[0.3] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-[0_12px_28px_hsl(var(--primary)/0.18)] hover:bg-primary/90 hover:shadow-[0_0_38px_hsl(var(--primary)/0.42)] hover:-translate-y-0.5",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-primary/35 bg-background/40 backdrop-blur-md text-foreground hover:bg-primary/10 hover:text-foreground hover:border-primary/65 hover:shadow-[0_0_30px_hsl(var(--primary)/0.2)]",
        secondary: "bg-secondary text-secondary-foreground shadow-[0_12px_28px_hsl(var(--secondary)/0.16)] hover:bg-secondary/80 hover:shadow-[0_0_32px_hsl(var(--secondary)/0.45)]",
        ghost: "hover:bg-accent/20 hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        hero: "bg-gradient-to-r from-primary via-secondary to-accent text-primary-foreground font-semibold shadow-[0_18px_44px_hsl(var(--primary)/0.26)] hover:shadow-[0_0_56px_hsl(var(--primary)/0.55)] hover:scale-[1.03]",
        glass: "bg-card/45 backdrop-blur-md border border-primary/20 text-foreground shadow-[0_12px_30px_hsl(248_80%_3%_/_0.28)] hover:bg-card/70 hover:border-primary/55 hover:-translate-y-0.5",
        glow: "bg-primary text-primary-foreground shadow-[0_0_24px_hsl(var(--primary)/0.35)] hover:shadow-[0_0_48px_hsl(var(--primary)/0.55)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 rounded-lg px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
