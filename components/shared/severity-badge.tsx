import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type FindingSeverity =
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "info"
  | "passed";

const severityLabels: Record<FindingSeverity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  info: "Info",
  passed: "Passed",
};

const severityClasses: Record<FindingSeverity, string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-destructive/10 text-destructive dark:bg-destructive/20",
  medium: "bg-primary text-primary-foreground",
  low: "border-border bg-secondary text-secondary-foreground",
  info: "border-border bg-muted text-muted-foreground",
  passed: "border-border bg-background text-foreground",
};

export interface SeverityBadgeProps {
  severity: FindingSeverity;
  className?: string;
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  return (
    <Badge
      variant="outline"
      aria-label={`Finding severity: ${severityLabels[severity]}`}
      className={cn(severityClasses[severity], className)}
    >
      {severityLabels[severity]}
    </Badge>
  );
}
