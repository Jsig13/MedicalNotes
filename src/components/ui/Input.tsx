"use client";

import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { className?: string }>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-10 w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 text-sm text-slate-200 outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 placeholder:text-slate-500",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
export default Input;
