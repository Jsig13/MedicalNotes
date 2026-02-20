"use client";

import { cn } from "@/lib/utils";
import { forwardRef, type SelectHTMLAttributes } from "react";

const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { className?: string }>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "h-10 w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 text-sm text-slate-200 outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50",
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = "Select";
export default Select;
