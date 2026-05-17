import * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export interface PublicShellProps {
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PublicShell({ children, actions, className }: PublicShellProps) {
  return (
    <div className={cn("min-h-svh bg-background text-foreground", className)}>
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="font-semibold text-foreground">
            scōre.
          </Link>
          {actions ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              {actions}
            </div>
          ) : null}
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
