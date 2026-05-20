import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  const isFailed = scan.status === "failed";

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle>Scan status</CardTitle>
            <CardDescription>
              {isFailed
                ? "This scan could not be processed."
                : "This scan has been accepted and is waiting for processing."}
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

        {isFailed ? (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" aria-hidden="true" />
            <AlertTitle>Scan failed</AlertTitle>
            <AlertDescription>
              {scan.errorMessage ?? "The scan failed. Please try again later."}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="rounded-lg border border-border bg-muted p-4 text-sm text-muted-foreground">
            This scan is queued for background processing. No SEO findings or
            report data have been generated yet.
          </div>
        )}

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
