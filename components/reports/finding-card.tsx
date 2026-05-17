import * as React from "react";

import {
  SeverityBadge,
  type FindingSeverity,
} from "@/components/shared/severity-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export interface FindingCardProps {
  title: string;
  category: string;
  severity: FindingSeverity;
  affectedUrl?: string;
  description?: string;
  evidence?: React.ReactNode;
  recommendation?: string;
  className?: string;
}

export function FindingCard({
  title,
  category,
  severity,
  affectedUrl,
  description,
  evidence,
  recommendation,
  className,
}: FindingCardProps) {
  return (
    <Card className={cn("min-w-0", className)}>
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            <p className="text-xs font-medium text-muted-foreground">
              {category}
            </p>
          </div>
          <SeverityBadge severity={severity} />
        </div>
        {affectedUrl ? (
          <p className="break-all font-mono text-xs text-muted-foreground">
            {affectedUrl}
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {description ? (
          <p className="text-sm leading-6 text-foreground">{description}</p>
        ) : null}
        {evidence ? (
          <div className="rounded-lg border border-border bg-muted p-3 font-mono text-xs leading-5 text-foreground">
            {evidence}
          </div>
        ) : null}
        {recommendation ? (
          <>
            <Separator />
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-foreground">
                Recommendation
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                {recommendation}
              </p>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
