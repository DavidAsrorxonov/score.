import { UserRound } from "lucide-react";

import { PageContainer } from "@/components/app/page-container";
import { PageHeader } from "@/components/app/page-header";
import { MetricCard } from "@/components/shared/metric-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getOrCreateCurrentUser } from "@/lib/users/current-user";

export default async function SettingsPage() {
  const user = await getOrCreateCurrentUser();

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Settings"
        description="Review account details for the authenticated workspace."
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              Profile changes are managed from the account menu.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid gap-1">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{user.name ?? "Not provided"}</span>
            </div>
            <div className="grid gap-1">
              <span className="text-muted-foreground">Email</span>
              <span className="break-all font-mono text-xs">
                {user.email ?? "Not provided"}
              </span>
            </div>
          </CardContent>
        </Card>
        <MetricCard
          label="Plan"
          value="Free"
          description="Billing and team settings are planned for later feature work."
          icon={<UserRound className="size-4" aria-hidden="true" />}
        />
      </div>
    </PageContainer>
  );
}
