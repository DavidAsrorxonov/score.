import Link from "next/link";
import { AlertTriangle, CheckCircle2, FileText, Search } from "lucide-react";

import { RecentScans } from "@/components/dashboard/recent-scans";
import { PageContainer } from "@/components/app/page-container";
import { PageHeader } from "@/components/app/page-header";
import { MetricCard } from "@/components/shared/metric-card";
import { UsageMeter } from "@/components/shared/usage-meter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDashboardData } from "@/lib/dashboard/get-dashboard-data";

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
            <CardTitle>Free scan usage</CardTitle>
            <CardDescription>
              {data.usage.usedToday} of {data.usage.dailyLimit} scans used
              today.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UsageMeter
              used={data.usage.usedToday}
              limit={data.usage.dailyLimit}
            />
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
