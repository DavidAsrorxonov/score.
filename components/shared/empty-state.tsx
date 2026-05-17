import * as React from "react";

import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border px-6 py-8 text-center",
        className
      )}
    >
      {icon ? (
        <div className="mb-3 flex size-9 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
          {icon}
        </div>
      ) : null}
      <h2 className="text-base font-medium text-foreground">{title}</h2>
      {description ? (
        <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
