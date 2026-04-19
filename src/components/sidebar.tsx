"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Settings,
  Bot,
  LogOut,
  ShieldCheck,
  ClipboardList,
  Rocket,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

export function Sidebar() {
  const pathname = usePathname();
  const { adminUser, signOut } = useAuth();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/tenants", label: "Tenants", icon: Users },
    ...(adminUser?.role === "super_admin"
      ? [
          { href: "/registrations", label: "Registrations", icon: ClipboardList },
          { href: "/users", label: "Users", icon: ShieldCheck },
        ]
      : [{ href: "/onboarding", label: "Onboarding", icon: Rocket }]),
    ...(adminUser?.role === "super_admin"
      ? [{ href: "/billing", label: "Billing", icon: DollarSign }]
      : []),
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex items-center gap-2 border-b px-6 py-4">
        <Bot className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold">VIRIYA</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User info + Logout */}
      <div className="border-t px-4 py-3">
        {adminUser && (
          <div className="mb-2">
            <p className="truncate text-sm font-medium">
              {adminUser.display_name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {adminUser.email}
            </p>
            <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {adminUser.role === "super_admin" ? "Super Admin" : "Faculty Admin"}
            </span>
          </div>
        )}
        <button
          onClick={signOut}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
