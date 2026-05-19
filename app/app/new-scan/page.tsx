import { ScanForm } from "@/components/scans/scan-form";
import { PageContainer } from "@/components/app/page-container";
import { PageHeader } from "@/components/app/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getUsageSummary } from "@/lib/usage/get-usage-summary";
import { getDailyLimitReachedMessage } from "@/lib/usage/usage-limit-state";
import { getOrCreateCurrentUser } from "@/lib/users/current-user";

export default async function NewScanPage() {
  const user = await getOrCreateCurrentUser();
  const usage = await getUsageSummary(user.id);

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="New Scan"
        description="Analyze a homepage or specific URL."
      />

      <Card>
        <CardHeader>
          <CardTitle>Submit target</CardTitle>
          <CardDescription>
            The target is verified before a queued scan is accepted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScanForm
            usage={{
              usedToday: usage.usedToday,
              dailyLimit: usage.dailyLimit,
              remainingToday: usage.remainingToday,
              isLimitReached: usage.isLimitReached,
              limitMessage: getDailyLimitReachedMessage(usage),
            }}
          />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
