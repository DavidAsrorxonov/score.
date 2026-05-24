import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { scanEvents, scans } from "@/lib/db/schema";
import type { ScanStatus } from "@/lib/db/types";

interface UpdateScanStatusParams {
  scanId: string;
  status: ScanStatus;
  errorCode?: string | null;
  errorMessage?: string | null;
  message?: string | null;
  metadata?: Record<string, unknown>;
}

interface MarkScanFailedParams {
  scanId: string;
  errorCode: string;
  errorMessage: string;
  metadata?: Record<string, unknown>;
}

type ScanStatusDatabase = Pick<typeof db, "insert" | "update">;

function buildTimestampFields(status: ScanStatus, now: Date) {
  if (status === "failed") {
    return {
      failedAt: now,
      completedAt: null,
    };
  }

  if (status === "completed") {
    return {
      completedAt: now,
      failedAt: null,
    };
  }

  return {
    completedAt: null,
    failedAt: null,
  };
}

export async function updateScanStatus(
  params: UpdateScanStatusParams,
  database: ScanStatusDatabase = db,
) {
  const now = new Date();
  const isFailed = params.status === "failed";

  const updateValues = {
    status: params.status,
    errorCode: isFailed ? (params.errorCode ?? null) : null,
    errorMessage: isFailed ? (params.errorMessage ?? null) : null,
    updatedAt: now,
    ...buildTimestampFields(params.status, now),
  };

  await database.update(scans).set(updateValues).where(eq(scans.id, params.scanId));

  await database.insert(scanEvents).values({
    scanId: params.scanId,
    status: params.status,
    message: params.message ?? null,
    metadata: params.metadata,
  });
}

export async function markScanFailed(
  params: MarkScanFailedParams,
  database: ScanStatusDatabase = db,
) {
  await updateScanStatus(
    {
      scanId: params.scanId,
      status: "failed",
      errorCode: params.errorCode,
      errorMessage: params.errorMessage,
      message: params.errorMessage,
      metadata: params.metadata,
    },
    database,
  );
}
