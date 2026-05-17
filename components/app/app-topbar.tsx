"use client";

import Link from "next/link";
import { Menu } from "lucide-react";

import { appNavItems } from "@/components/app/app-sidebar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export interface AppTopbarProps {
  activeHref?: string;
  userLabel?: string;
}

export function AppTopbar({
  activeHref = "/dashboard",
  userLabel = "Workspace",
}: AppTopbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background">
      <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Open navigation"
              >
                <Menu className="size-4" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="border-b border-border px-5 py-4 text-left">
                <SheetTitle>scōre.</SheetTitle>
              </SheetHeader>
              <nav aria-label="Mobile primary" className="space-y-1 p-3">
                {appNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.href === activeHref;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isActive && "bg-accent text-accent-foreground",
                      )}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
          <Link href="/" className="font-semibold text-foreground lg:hidden">
            scōre.
          </Link>
        </div>
        <p className="truncate text-sm text-muted-foreground">{userLabel}</p>
      </div>
    </header>
  );
}
