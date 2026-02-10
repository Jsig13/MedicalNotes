"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Stethoscope,
  FileText,
  Settings,
  Mic,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/encounters", label: "Encounters", icon: Stethoscope },
  { href: "/templates", label: "Templates", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 h-full w-64 border-r border-[var(--border)] bg-[var(--card)] p-4 flex flex-col">
      <div className="flex items-center gap-2 px-3 py-4 mb-6">
        <div className="p-2 rounded-lg bg-[var(--primary)]">
          <Mic className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg">MedScribe</h1>
          <p className="text-xs text-[var(--muted-foreground)]">AI Medical Notes</p>
        </div>
      </div>

      <div className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="border-t border-[var(--border)] pt-4 mt-4">
        <p className="text-xs text-[var(--muted-foreground)] px-3">
          HIPAA Compliant
        </p>
        <p className="text-xs text-[var(--muted-foreground)] px-3">
          Powered by Convex
        </p>
      </div>
    </nav>
  );
}
