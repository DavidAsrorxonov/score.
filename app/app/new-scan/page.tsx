import Link from "next/link";
import { Search } from "lucide-react";

import { PageContainer } from "@/components/app/page-container";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getOrCreateCurrentUser } from "@/lib/users/current-user";

export default async function NewScanPage() {
  await getOrCreateCurrentUser();

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
            The next feature task will add URL validation and scan job creation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
              URL scan creation will be added in the next workflow step.
            </p>
          </div>
          <EmptyState
            title="No scan submission yet"
            description="This page is a navigation target for the upcoming scan creation workflow."
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
