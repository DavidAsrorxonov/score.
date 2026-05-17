import * as React from "react";

import { cn } from "@/lib/utils";

export interface ReportSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function ReportSection({
  title,
  description,
  children,
  actions,
  className,
}: ReportSectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {description ? (
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        ) : null}
      </div>
      <div>{children}</div>
    </section>
  );
}
