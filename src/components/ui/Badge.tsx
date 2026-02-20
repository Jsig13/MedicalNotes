"use client";

import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "recording" | "scrubbing" | "generating" | "review" | "complete" | "primary";
  className?: string;
}

const variantClasses: Record<string, string> = {
  default: "bg-slate-500/10 text-slate-400 border-slate-500/30",
  recording: "bg-red-500/10 text-red-400 border-red-500/30 animate-pulse-glow",
  scrubbing: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  generating: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  review: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  complete: "bg-green-500/10 text-green-400 border-green-500/30",
  primary: "bg-blue-600 text-white border-blue-500",
};

export default function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap transition-colors",
        variantClasses[variant] || variantClasses.default,
        className
      )}
    >
      {children}
    </span>
  );
}
