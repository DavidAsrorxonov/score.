import * as React from "react";

import { AppSidebar } from "@/components/app/app-sidebar";
import { AppTopbar } from "@/components/app/app-topbar";

export interface AppShellProps {
  children: React.ReactNode;
  activeHref?: string;
  userLabel?: string;
}

export function AppShell({
  children,
  activeHref,
  userLabel,
}: AppShellProps) {
  return (
    <div className="min-h-svh bg-background">
      <div className="flex min-h-svh">
        <AppSidebar activeHref={activeHref} />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppTopbar activeHref={activeHref} userLabel={userLabel} />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
