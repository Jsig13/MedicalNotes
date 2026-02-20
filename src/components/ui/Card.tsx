"use client";

import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className }: CardProps) {
  return (
    <div className={cn("bg-slate-800/50 rounded-xl border border-slate-700/50 shadow-sm transition-all duration-200 hover:border-slate-600/50", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return (
    <div className={cn("px-5 py-4 border-b border-slate-700/50", className)}>
      {children}
    </div>
  );
}

export function CardContent({ children, className }: CardProps) {
  return (
    <div className={cn("px-5 py-4", className)}>
      {children}
    </div>
  );
}
