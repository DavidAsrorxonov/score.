import * as React from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type LoadingStateVariant = "page" | "card" | "table" | "report";

export interface LoadingStateProps {
  variant?: LoadingStateVariant;
  className?: string;
}

export function LoadingState({
  variant = "page",
  className,
}: LoadingStateProps) {
  if (variant === "card") {
    return (
      <Card className={className}>
        <CardHeader className="space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-2/3" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-2 w-4/5" />
        </CardContent>
      </Card>
    );
  }

  if (variant === "table") {
    return (
      <div className={cn("rounded-lg border border-border", className)}>
        <div className="grid grid-cols-4 gap-4 border-b border-border p-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-3 w-full" />
          ))}
        </div>
        <div className="space-y-3 p-3">
          {Array.from({ length: 4 }).map((_, row) => (
            <div key={row} className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((__, column) => (
                <Skeleton key={column} className="h-3 w-full" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "report") {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="space-y-2">
          <Skeleton className="h-7 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <LoadingState key={index} variant="card" />
          ))}
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <LoadingState key={index} variant="card" />
        ))}
      </div>
    </div>
  );
}
