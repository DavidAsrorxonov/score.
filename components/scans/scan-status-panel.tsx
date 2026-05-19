import Link from "next/link";

import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Scan } from "@/lib/db/types";

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatNullable(value: string | number | null) {
  return value === null ? "Not recorded" : value;
}

export interface ScanStatusPanelProps {
  scan: Scan;
}

export function ScanStatusPanel({ scan }: ScanStatusPanelProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle>Scan status</CardTitle>
            <CardDescription>
              This scan has been accepted and is waiting for processing.
            </CardDescription>
          </div>
          <StatusBadge status={scan.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div className="space-y-1">
            <dt className="font-medium text-foreground">Submitted target</dt>
            <dd className="break-all font-mono text-xs text-muted-foreground">
              {scan.inputUrl}
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="font-medium text-foreground">Scan type</dt>
            <dd className="text-muted-foreground">
              {scan.scanType === "homepage" ? "Homepage" : "Specific URL"}
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="font-medium text-foreground">Normalized URL</dt>
            <dd className="break-all font-mono text-xs text-muted-foreground">
              {formatNullable(scan.normalizedUrl)}
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="font-medium text-foreground">Final URL</dt>
            <dd className="break-all font-mono text-xs text-muted-foreground">
              {formatNullable(scan.finalUrl)}
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="font-medium text-foreground">Domain</dt>
            <dd className="break-all font-mono text-xs text-muted-foreground">
              {formatNullable(scan.domain)}
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="font-medium text-foreground">HTTP status</dt>
            <dd className="font-mono text-xs text-muted-foreground">
              {formatNullable(scan.statusCode)}
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="font-medium text-foreground">Content type</dt>
            <dd className="break-all font-mono text-xs text-muted-foreground">
              {formatNullable(scan.contentType)}
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="font-medium text-foreground">Created</dt>
            <dd className="text-muted-foreground">
              {dateFormatter.format(scan.createdAt)}
            </dd>
          </div>
        </dl>

        <div className="rounded-lg border border-border bg-muted p-4 text-sm text-muted-foreground">
          Queue and worker setup comes next, so no SEO findings or report data
          are generated for this scan yet.
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/app">Back to Dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/app/new-scan">New Scan</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

