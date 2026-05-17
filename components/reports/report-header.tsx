import * as React from "react";

import { cn } from "@/lib/utils";

export interface ReportHeaderProps {
  title: string;
  analyzedUrl: string;
  finalUrl?: string;
  scannedAt?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function ReportHeader({
  title,
  analyzedUrl,
  finalUrl,
  scannedAt,
  actions,
  className,
}: ReportHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="min-w-0 space-y-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
          {scannedAt ? (
            <p className="text-sm text-muted-foreground">{scannedAt}</p>
          ) : null}
        </div>
        <dl className="grid gap-2 text-sm">
          <div className="min-w-0">
            <dt className="text-xs font-medium text-muted-foreground">
              Analyzed URL
            </dt>
            <dd className="break-all font-mono text-xs text-foreground">
              {analyzedUrl}
            </dd>
          </div>
          {finalUrl ? (
            <div className="min-w-0">
              <dt className="text-xs font-medium text-muted-foreground">
                Final URL
              </dt>
              <dd className="break-all font-mono text-xs text-foreground">
                {finalUrl}
              </dd>
            </div>
          ) : null}
        </dl>
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
