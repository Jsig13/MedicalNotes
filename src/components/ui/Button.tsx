"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "destructive" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
          {
            "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90":
              variant === "primary",
            "bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:opacity-80":
              variant === "secondary",
            "bg-[var(--destructive)] text-white hover:opacity-90":
              variant === "destructive",
            "hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]":
              variant === "ghost",
            "border border-[var(--border)] bg-transparent hover:bg-[var(--accent)]":
              variant === "outline",
          },
          {
            "h-8 px-3 text-sm": size === "sm",
            "h-10 px-4 text-sm": size === "md",
            "h-12 px-6 text-base": size === "lg",
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
export { Button };
