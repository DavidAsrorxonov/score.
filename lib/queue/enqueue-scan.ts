import "server-only";

import { getScanQueue } from "./scan-queue";
import { JOB_NAMES } from "./names";

export async function enqueueScanRun(scanId: string) {
  const trimmedScanId = scanId.trim();

  if (!trimmedScanId) {
    throw new Error("scanId is required to enqueue a scan.");
  }

  return getScanQueue().add(
    JOB_NAMES.runScan,
    { scanId: trimmedScanId },
    {
      jobId: `${JOB_NAMES.runScan}-${trimmedScanId}`,
    },
  );
}
