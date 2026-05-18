import Link from "next/link";
import { AlertTriangle, CheckCircle2, FileText, Search } from "lucide-react";

import { RecentScans } from "@/components/dashboard/recent-scans";
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

function getAverageScore(scans: Awaited<ReturnType<typeof getDashboardData>>["recentScans"]) {
  const scoredScans = scans.filter((scan) => scan.overallScore !== null);

  if (scoredScans.length === 0) {
    return null;
  }

  const total = scoredScans.reduce(
    (sum, scan) => sum + (scan.overallScore ?? 0),
    0
  );

  return Math.round(total / scoredScans.length);
}

function getUsageDescription(data: Awaited<ReturnType<typeof getDashboardData>>) {
  if (!data.usage.isLimited) {
    return `${data.usage.usedToday} scans used today. This plan has no daily limit.`;
  }

  if (data.usage.isLimitReached) {
    return "Daily limit reached.";
  }

  return `${data.usage.usedToday} of ${data.usage.dailyLimit} scans used today.`;
}

export default async function AppHomePage() {
  const data = await getDashboardData();
  const completedScans = data.recentScans.filter(
    (scan) => scan.status === "completed"
  ).length;
  const failedScans = data.recentScans.filter(
    (scan) => scan.status === "failed"
  ).length;
  const averageScore = getAverageScore(data.recentScans);

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Analyze URLs and review saved SEO reports."
        actions={
          <Button asChild>
            <Link href="/app/new-scan">
              <Search className="size-4" aria-hidden="true" />
              New Scan
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Scan usage</CardTitle>
            <CardDescription>{getUsageDescription(data)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <UsageMeter
              used={data.usage.usedToday}
              limit={data.usage.dailyLimit}
            />
            {data.usage.isLimitReached ? (
              <Alert>
                <AlertTriangle className="size-4" aria-hidden="true" />
                <AlertTitle>Daily limit reached</AlertTitle>
                <AlertDescription>
                  {getDailyLimitReachedMessage(data.usage)}
                </AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
        </Card>
        <MetricCard
          label="Completed scans"
          value={completedScans}
          description="Recent scans marked completed."
          icon={<CheckCircle2 className="size-4" aria-hidden="true" />}
        />
        <MetricCard
          label="Failed scans"
          value={failedScans}
          description="Recent scans needing review."
          icon={<AlertTriangle className="size-4" aria-hidden="true" />}
        />
        <MetricCard
          label="Average score"
          value={averageScore ?? "N/A"}
          description="Average from recent completed reports."
          icon={<FileText className="size-4" aria-hidden="true" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent scans</CardTitle>
          <CardDescription>
            User-owned scan history will appear here as reports are created.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RecentScans scans={data.recentScans} />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
