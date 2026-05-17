import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface MetricCardProps {
  label: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function MetricCard({
  label,
  value,
  description,
  icon,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn("min-w-0", className)}>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="truncate text-sm font-medium">{label}</CardTitle>
        {icon ? (
          <div className="shrink-0 text-muted-foreground">{icon}</div>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="truncate text-2xl font-semibold tabular-nums">{value}</p>
        {description ? (
          <p className="text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
