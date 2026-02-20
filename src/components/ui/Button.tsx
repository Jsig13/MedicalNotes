"use client";

import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "destructive" | "ghost" | "outline" | "success";
  size?: "sm" | "md" | "lg";
}

const variantClasses: Record<string, string> = {
  primary: "bg-blue-600 text-white hover:bg-blue-500 shadow-sm shadow-blue-500/20",
  secondary: "bg-slate-800 text-slate-200 hover:bg-slate-700",
  destructive: "bg-red-500/90 text-white hover:bg-red-500 shadow-sm shadow-red-500/20",
  ghost: "bg-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200",
  outline: "bg-transparent text-slate-300 border border-slate-700 hover:bg-slate-800 hover:border-slate-600",
  success: "bg-green-500/90 text-white hover:bg-green-500 shadow-sm shadow-green-500/20",
};

const sizeClasses: Record<string, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-sm",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
