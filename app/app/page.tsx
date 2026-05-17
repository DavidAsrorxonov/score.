import { PageContainer } from "@/components/app/page-container";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUserId } from "@/lib/auth/require-user";

export default async function AppHomePage() {
  await requireUserId();

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        eyebrow="Authenticated"
        title="Dashboard"
        description="Your SEO scan dashboard will appear here."
      />

      <Card>
        <CardHeader>
          <CardTitle>Scans are coming next</CardTitle>
          <CardDescription>
            Authentication is ready. Scan creation, usage limits, reports, and
            history will be added in later feature tasks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="No scan data yet"
            description="This placeholder will be replaced by the authenticated dashboard."
          />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
