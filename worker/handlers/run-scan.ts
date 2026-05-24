import { eq } from "drizzle-orm";
import type { Job } from "bullmq";
import { z } from "zod";

import { db } from "@/lib/db";
import { scans } from "@/lib/db/schema";
import type { Scan, ScanStatus } from "@/lib/db/types";
import type { RunScanJobData } from "@/lib/queue";
import {
  getScanProcessingMessage,
  type WorkerScanErrorCode,
} from "@/lib/scans/errors";
import { markScanFailed, updateScanStatus } from "@/lib/scans/status";

const runScanJobSchema = z.object({
  scanId: z.string().trim().min(1),
});

const ACTIVE_SCAN_STATUSES = new Set<ScanStatus>([
  "queued",
  "validating",
  "fetching",
  "analyzing",
  "generating_report",
  "generating_pdf",
]);

type LoadedScan = Pick<Scan, "id" | "status">;

interface RunScanJobDependencies {
  loadScan?: (scanId: string) => Promise<LoadedScan | null>;
  updateStatus?: typeof updateScanStatus;
  failScan?: typeof markScanFailed;
}

interface RunScanJobResult {
  scanId: string;
  action: "processed" | "skipped";
  status: ScanStatus;
}

async function loadScanById(scanId: string): Promise<LoadedScan | null> {
  const [scan] = await db
    .select({
      id: scans.id,
      status: scans.status,
    })
    .from(scans)
    .where(eq(scans.id, scanId))
    .limit(1);

  return scan ?? null;
}

function createWorkerError(code: WorkerScanErrorCode, detail?: string) {
  return new Error(detail ? `${code}: ${detail}` : code);
}

async function markUnexpectedFailure(
  scanId: string,
  error: unknown,
  failScan: typeof markScanFailed,
) {
  try {
    await failScan({
      scanId,
      errorCode: "WORKER_PROCESSING_FAILED",
      errorMessage: getScanProcessingMessage("WORKER_PROCESSING_FAILED"),
      metadata: {
        reason: error instanceof Error ? error.message : "Unknown worker error",
      },
    });
  } catch (failureError) {
    console.error("Failed to mark scan worker error", failureError);
  }
}

export async function handleRunScanJob(
  job: Job<unknown>,
  dependencies: RunScanJobDependencies = {},
): Promise<RunScanJobResult> {
  const parsed = runScanJobSchema.safeParse(job.data);

  if (!parsed.success) {
    throw createWorkerError(
      "INVALID_JOB_PAYLOAD",
      "scan.run jobs require a non-empty scanId.",
    );
  }

  const scanId = parsed.data.scanId;
  const loadScan = dependencies.loadScan ?? loadScanById;
  const updateStatus = dependencies.updateStatus ?? updateScanStatus;
  const failScan = dependencies.failScan ?? markScanFailed;

  try {
    const scan = await loadScan(scanId);

    if (!scan) {
      throw createWorkerError("SCAN_NOT_FOUND", `scanId=${scanId}`);
    }

    if (scan.status === "completed" || scan.status === "failed") {
      return {
        scanId,
        action: "skipped",
        status: scan.status,
      };
    }

    if (!ACTIVE_SCAN_STATUSES.has(scan.status)) {
      throw createWorkerError(
        "WORKER_PROCESSING_FAILED",
        `Unsupported scan status: ${scan.status}`,
      );
    }

    if (scan.status === "queued") {
      await updateStatus({
        scanId,
        status: "validating",
        message: "Worker picked up scan job.",
        metadata: {
          jobId: job.id,
          jobName: job.name,
        },
      });
    }

    if (scan.status === "queued" || scan.status === "validating") {
      await updateStatus({
        scanId,
        status: "fetching",
        message: "Worker reached the page-fetching boundary.",
        metadata: {
          jobId: job.id,
          jobName: job.name,
        },
      });
    }

    await failScan({
      scanId,
      errorCode: "PROCESSING_NOT_IMPLEMENTED",
      errorMessage: getScanProcessingMessage("PROCESSING_NOT_IMPLEMENTED"),
      metadata: {
        jobId: job.id,
        jobName: job.name,
      },
    });

    return {
      scanId,
      action: "processed",
      status: "failed",
    };
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.startsWith("INVALID_JOB_PAYLOAD") ||
        error.message.startsWith("SCAN_NOT_FOUND"))
    ) {
      throw error;
    }

    await markUnexpectedFailure(scanId, error, failScan);
    throw error;
  }
}

export type { RunScanJobData };
