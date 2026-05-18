import Link from "next/link";
import { Search } from "lucide-react";

import { PageContainer } from "@/components/app/page-container";
import { PageHeader } from "@/components/app/page-header";
import { RecentScans } from "@/components/dashboard/recent-scans";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDashboardData } from "@/lib/dashboard/get-dashboard-data";

export default async function ReportsPage() {
  const data = await getDashboardData();

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Reports"
        description="Review saved scan history and completed SEO reports."
        actions={
          <Button asChild>
            <Link href="/app/new-scan">
              <Search className="size-4" aria-hidden="true" />
              New Scan
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Saved reports</CardTitle>
          <CardDescription>
            Full report detail pages will be added in a later task.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RecentScans
            scans={data.recentScans}
            emptyTitle="No reports yet"
            emptyDescription="Completed scans will appear here as saved reports."
          />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
