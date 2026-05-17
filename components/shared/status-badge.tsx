import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ScanStatus =
  | "queued"
  | "validating"
  | "fetching"
  | "analyzing"
  | "generating_report"
  | "generating_pdf"
  | "completed"
  | "failed";

const statusLabels: Record<ScanStatus, string> = {
  queued: "Queued",
  validating: "Validating",
  fetching: "Fetching",
  analyzing: "Analyzing",
  generating_report: "Generating report",
  generating_pdf: "Generating PDF",
  completed: "Completed",
  failed: "Failed",
};

const statusClasses: Record<ScanStatus, string> = {
  queued: "border-border bg-muted text-muted-foreground",
  validating: "border-border bg-secondary text-secondary-foreground",
  fetching: "border-border bg-secondary text-secondary-foreground",
  analyzing: "border-border bg-secondary text-secondary-foreground",
  generating_report: "border-border bg-secondary text-secondary-foreground",
  generating_pdf: "border-border bg-secondary text-secondary-foreground",
  completed: "border-border bg-primary text-primary-foreground",
  failed: "bg-destructive/10 text-destructive dark:bg-destructive/20",
};

export interface StatusBadgeProps {
  status: ScanStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      aria-label={`Scan status: ${statusLabels[status]}`}
      className={cn(statusClasses[status], className)}
    >
      {statusLabels[status]}
    </Badge>
  );
}
