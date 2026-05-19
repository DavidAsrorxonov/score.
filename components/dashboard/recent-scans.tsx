import Link from "next/link";
import { FileText, Search } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge, type ScanStatus } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface RecentScanItem {
  id: string;
  inputUrl: string;
  finalUrl: string | null;
  status: ScanStatus;
  overallScore: number | null;
  createdAt: Date;
  completedAt: Date | null;
  errorMessage: string | null;
}

export interface RecentScansProps {
  scans: RecentScanItem[];
  emptyTitle?: string;
  emptyDescription?: string;
}

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatScanDate(date: Date) {
  return dateFormatter.format(date);
}

function getScanActionLabel(status: ScanStatus) {
  if (status === "completed") {
    return "View report";
  }

  if (status === "failed") {
    return "Review";
  }

  return "View status";
}

export function RecentScans({
  scans,
  emptyTitle = "No scans yet",
  emptyDescription = "Run your first SEO scan to start building report history.",
}: RecentScansProps) {
  if (scans.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        icon={<Search className="size-4" aria-hidden="true" />}
        action={
          <Button asChild>
            <Link href="/app/new-scan">New Scan</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="hidden rounded-lg border border-border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>URL</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scans.map((scan) => (
              <TableRow key={scan.id}>
                <TableCell className="max-w-[28rem] whitespace-normal">
                  <div className="space-y-1">
                    <p className="break-all font-mono text-xs text-foreground">
                      {scan.inputUrl}
                    </p>
                    {scan.finalUrl ? (
                      <p className="break-all font-mono text-xs text-muted-foreground">
                        Final: {scan.finalUrl}
                      </p>
                    ) : null}
                    {scan.status === "failed" && scan.errorMessage ? (
                      <p className="text-xs leading-5 text-muted-foreground">
                        {scan.errorMessage}
                      </p>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={scan.status} />
                </TableCell>
                <TableCell className="tabular-nums">
                  {scan.overallScore === null ? "Not ready" : scan.overallScore}
                </TableCell>
                <TableCell>{formatScanDate(scan.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/app/scans/${scan.id}`}>
                      <FileText className="size-3.5" aria-hidden="true" />
                      {getScanActionLabel(scan.status)}
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-2 md:hidden">
        {scans.map((scan) => (
          <div
            key={scan.id}
            className="space-y-3 rounded-lg border border-border p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 break-all font-mono text-xs text-foreground">
                {scan.inputUrl}
              </p>
              <StatusBadge status={scan.status} className="shrink-0" />
            </div>
            {scan.finalUrl ? (
              <p className="break-all font-mono text-xs text-muted-foreground">
                Final: {scan.finalUrl}
              </p>
            ) : null}
            {scan.status === "failed" && scan.errorMessage ? (
              <p className="text-xs leading-5 text-muted-foreground">
                {scan.errorMessage}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>Score: {scan.overallScore ?? "Not ready"}</span>
              <span>{formatScanDate(scan.createdAt)}</span>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={`/app/scans/${scan.id}`}>
                <FileText className="size-3.5" aria-hidden="true" />
                {getScanActionLabel(scan.status)}
              </Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
