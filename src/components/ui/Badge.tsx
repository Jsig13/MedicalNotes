"use client";

import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "recording" | "scrubbing" | "generating" | "review" | "complete" | "primary";
  className?: string;
}

const variantClasses: Record<string, string> = {
  default: "bg-slate-100 text-slate-600 border-slate-200",
  recording: "bg-red-50 text-red-500 border-red-200",
  scrubbing: "bg-amber-50 text-amber-500 border-amber-200",
  generating: "bg-blue-50 text-blue-500 border-blue-200",
  review: "bg-purple-50 text-purple-500 border-purple-200",
  complete: "bg-green-50 text-green-500 border-green-200",
  primary: "bg-blue-600 text-white border-blue-600",
};

export default function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap",
        variantClasses[variant] || variantClasses.default,
        className
      )}
    >
      {children}
    </span>
  );
}
