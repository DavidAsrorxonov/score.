import { notFound } from "next/navigation";

import { PageContainer } from "@/components/app/page-container";
import { PageHeader } from "@/components/app/page-header";
import { ScanStatusPanel } from "@/components/scans/scan-status-panel";
import { getScanForCurrentUser } from "@/lib/scans/get-scan";

export default async function ScanStatusPage({
  params,
}: {
  params: Promise<{ scanId: string }>;
}) {
  const { scanId } = await params;
  const scan = await getScanForCurrentUser(scanId);

  if (!scan) {
    notFound();
  }

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Scan"
        description="Accepted scan metadata and current processing status."
      />
      <ScanStatusPanel scan={scan} />
    </PageContainer>
  );
}

