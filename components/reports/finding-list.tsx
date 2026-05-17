import { AlertTriangle } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import {
  FindingCard,
  type FindingCardProps,
} from "@/components/reports/finding-card";
import { cn } from "@/lib/utils";

export interface FindingListProps {
  findings: FindingCardProps[];
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

export function FindingList({
  findings,
  emptyTitle = "No findings",
  emptyDescription = "There are no findings to display for this section.",
  className,
}: FindingListProps) {
  if (findings.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        icon={<AlertTriangle className="size-4" aria-hidden="true" />}
      />
    );
  }

  return (
    <div className={cn("grid gap-3", className)}>
      {findings.map((finding, index) => (
        <FindingCard key={`${finding.title}-${index}`} {...finding} />
      ))}
    </div>
  );
}
