import Link from "next/link";
import { AlertTriangle, Search } from "lucide-react";

import { PageContainer } from "@/components/app/page-container";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { UsageMeter } from "@/components/shared/usage-meter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getUsageSummary } from "@/lib/usage/get-usage-summary";
import { getDailyLimitReachedMessage } from "@/lib/usage/usage-limit-state";
import { getOrCreateCurrentUser } from "@/lib/users/current-user";

function getRemainingCopy(remainingToday: number | null) {
  if (remainingToday === null) {
    return "Your current plan has unlimited scans today.";
  }

  if (remainingToday === 1) {
    return "You have 1 scan remaining today.";
  }

  return `You have ${remainingToday} scans remaining today.`;
}

export default async function NewScanPage() {
  const user = await getOrCreateCurrentUser();
  const usage = await getUsageSummary(user.id);

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="New Scan"
        description="Create a single-page SEO scan from a domain or URL."
      />

      <Card>
        <CardHeader>
          <CardTitle>Scan creation is not wired up yet</CardTitle>
          <CardDescription>
            {usage.isLimitReached
              ? getDailyLimitReachedMessage(usage)
              : getRemainingCopy(usage.remainingToday)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <UsageMeter used={usage.usedToday} limit={usage.dailyLimit} />
          {usage.isLimitReached ? (
            <Alert>
              <AlertTriangle className="size-4" aria-hidden="true" />
              <AlertTitle>Daily limit reached</AlertTitle>
              <AlertDescription>
                You have used all {usage.dailyLimit} free scans for today.
              </AlertDescription>
            </Alert>
          ) : null}
          <div className="max-w-2xl space-y-2">
            <label htmlFor="scan-url-preview" className="text-sm font-medium">
              URL or domain
            </label>
            <Input
              id="scan-url-preview"
              placeholder="example.com"
              disabled
              aria-describedby="scan-url-preview-help"
            />
            <p
              id="scan-url-preview-help"
              className="text-sm text-muted-foreground"
            >
              URL validation and accepted scan recording will be added in the
              next workflow step.
            </p>
            <Button disabled>
              <Search className="size-4" aria-hidden="true" />
              Start scan
            </Button>
          </div>
          <EmptyState
            title="No scan submission yet"
            description="This placeholder shows the real daily usage state for the upcoming scan creation workflow."
            icon={<Search className="size-4" aria-hidden="true" />}
            action={
              <Button asChild variant="outline">
                <Link href="/app">Back to Dashboard</Link>
              </Button>
            }
          />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
