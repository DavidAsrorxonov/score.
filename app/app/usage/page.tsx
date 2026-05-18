import Link from "next/link";
import { Gauge, Search } from "lucide-react";

import { PageContainer } from "@/components/app/page-container";
import { PageHeader } from "@/components/app/page-header";
import { MetricCard } from "@/components/shared/metric-card";
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
import { getDashboardData } from "@/lib/dashboard/get-dashboard-data";
import { getDailyLimitReachedMessage } from "@/lib/usage/usage-limit-state";

export default async function UsagePage() {
  const data = await getDashboardData();

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Usage"
        description="Track the current free-tier scan position."
        actions={
          <Button asChild>
            <Link href="/app/new-scan">
              <Search className="size-4" aria-hidden="true" />
              New Scan
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Daily scan usage</CardTitle>
            <CardDescription>
              {data.usage.dailyLimit === null
                ? "This plan has no daily scan limit."
                : `Free users get ${data.usage.dailyLimit} scans per day.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <UsageMeter
              used={data.usage.usedToday}
              limit={data.usage.dailyLimit}
            />
            {data.usage.isLimitReached ? (
              <Alert>
                <Gauge className="size-4" aria-hidden="true" />
                <AlertTitle>Daily limit reached</AlertTitle>
                <AlertDescription>
                  {getDailyLimitReachedMessage(data.usage)}
                </AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
        </Card>
        <MetricCard
          label="Plan"
          value={data.user.planCode}
          description="Accepted scan usage is counted against the daily quota."
          icon={<Gauge className="size-4" aria-hidden="true" />}
        />
      </div>
    </PageContainer>
  );
}
