"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  Gauge,
  LayoutDashboard,
  Search,
  Settings,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

export interface AppNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const appNavItems: AppNavItem[] = [
  { label: "Dashboard", href: "/app", icon: LayoutDashboard },
  { label: "New Scan", href: "/app/new-scan", icon: Search },
  { label: "Reports", href: "/app/reports", icon: FileText },
  { label: "Usage", href: "/app/usage", icon: Gauge },
  { label: "Settings", href: "/app/settings", icon: Settings },
];

export function isAppNavItemActive(pathname: string, href: string) {
  if (href === "/app") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export interface AppSidebarProps {
  activeHref?: string;
  items?: AppNavItem[];
  className?: string;
}

export function AppSidebar({
  activeHref,
  items = appNavItems,
  className,
}: AppSidebarProps) {
  const pathname = usePathname();
  const currentPathname = activeHref ?? pathname;

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-svh w-64 shrink-0 overflow-y-auto border-r border-sidebar-border bg-sidebar lg:block",
        className
      )}
    >
      <div className="flex h-full flex-col">
        <div className="border-b border-sidebar-border px-5 py-4">
          <Link
            href="/"
            className="text-base font-semibold text-sidebar-foreground"
          >
            scōre.
          </Link>
        </div>
        <nav aria-label="Primary" className="flex-1 space-y-1 px-3 py-4">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = isAppNavItemActive(currentPathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                  isActive &&
                    "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
