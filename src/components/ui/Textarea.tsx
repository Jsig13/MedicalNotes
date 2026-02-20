"use client";

import { cn } from "@/lib/utils";
import { forwardRef, type TextareaHTMLAttributes } from "react";

const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { className?: string }>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full min-h-[80px] rounded-lg border border-slate-700 bg-slate-800/50 p-3 text-sm text-slate-200 outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-y placeholder:text-slate-500",
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";
export default Textarea;
