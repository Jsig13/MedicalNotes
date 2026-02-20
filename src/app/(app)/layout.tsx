"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { ProviderProvider, useProvider } from "@/lib/provider-context";
import {
  LayoutDashboard,
  Stethoscope,
  FileText,
  Settings,
  Mic,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/encounters", label: "Encounters", icon: Stethoscope },
  { href: "/templates", label: "Templates", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { provider } = useProvider();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <nav className="w-60 bg-white border-r border-slate-200 fixed top-0 left-0 h-screen flex flex-col p-3 z-50">
      <div className="flex items-center gap-2.5 px-3 py-3 mb-4">
        <div className="p-2 rounded-lg bg-blue-600 text-white flex items-center justify-center">
          <Mic className="w-4.5 h-4.5" />
        </div>
        <div>
          <div className="font-bold text-base">MedScribe</div>
          <div className="text-[10px] text-slate-400">AI Medical Notes</div>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === "/encounters" && pathname.startsWith("/encounters")) ||
            (item.href === "/templates" && pathname.startsWith("/templates"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="border-t border-slate-200 pt-3 mt-3">
        {provider && (
          <div className="px-3 mb-2">
            <div className="text-sm font-medium text-slate-700 truncate">{provider.name}</div>
            <div className="text-xs text-slate-400 truncate">{provider.specialty}</div>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-700 w-full transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
        <div className="text-[10px] text-slate-400 px-3 mt-2">HIPAA Compliant</div>
      </div>
    </nav>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-60 p-8">{children}</main>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProviderProvider>
      <AppShell>{children}</AppShell>
    </ProviderProvider>
  );
}
