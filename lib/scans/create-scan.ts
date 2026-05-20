import "server-only";

import { eq } from "drizzle-orm";

import { scans } from "@/lib/db/schema";
import type { User } from "@/lib/db/types";
import { db } from "@/lib/db";
import { enqueueScanRun } from "@/lib/queue";
import { checkScanUsageLimit } from "@/lib/usage/check-usage-limit";
import { recordScanAcceptedUsage } from "@/lib/usage/record-usage-event";
import { getOrCreateCurrentUser } from "@/lib/users/current-user";
import {
  verifyTarget,
  type RedirectHop,
  type VerificationSuccess,
} from "@/lib/verification";

import { createScanFailure } from "./errors";
import type {
  CreateScanInput,
  CreateScanResult,
  CreateScanType,
} from "./types";

const ACCEPTED_SCAN_TYPES = new Set<CreateScanType>([
  "homepage",
  "single_url",
]);

type ScanCreationDatabase = Pick<typeof db, "transaction" | "update">;

interface CreateScanDependencies {
  database?: ScanCreationDatabase;
  getCurrentUser?: () => Promise<User>;
  checkUsage?: typeof checkScanUsageLimit;
  recordUsage?: typeof recordScanAcceptedUsage;
  verify?: typeof verifyTarget;
  enqueueScan?: typeof enqueueScanRun;
}

function getDomainFromVerifiedUrl(verification: VerificationSuccess) {
  return new URL(verification.finalUrl).hostname;
}

function serializeVerification(
  verification: VerificationSuccess,
): Record<string, unknown> {
  return {
    ok: verification.ok,
    inputUrl: verification.inputUrl,
    normalizedUrl: verification.normalizedUrl,
    finalUrl: verification.finalUrl,
    hostname: verification.hostname,
    resolvedIps: verification.resolvedIps,
    statusCode: verification.statusCode,
    contentType: verification.contentType,
    responseTimeMs: verification.responseTimeMs,
    contentLengthBytes: verification.contentLengthBytes,
    redirectChain: verification.redirectChain,
    verifiedAt: verification.verifiedAt.toISOString(),
  };
}

async function markScanQueueEnqueueFailed(
  scanId: string,
  database: Pick<typeof db, "update">,
) {
  const now = new Date();

  await database
    .update(scans)
    .set({
      status: "failed",
      errorCode: "QUEUE_ENQUEUE_FAILED",
      errorMessage:
        "The scan was created, but processing could not be started. Please try again later.",
      failedAt: now,
      updatedAt: now,
    })
    .where(eq(scans.id, scanId));
}

export async function createScanForCurrentUser(
  input: CreateScanInput,
  dependencies: CreateScanDependencies = {},
): Promise<CreateScanResult> {
  if (!ACCEPTED_SCAN_TYPES.has(input.scanType)) {
    return createScanFailure("UNSUPPORTED_SCAN_TYPE");
  }

  const database = dependencies.database ?? db;
  const getCurrentUser = dependencies.getCurrentUser ?? getOrCreateCurrentUser;
  const checkUsage = dependencies.checkUsage ?? checkScanUsageLimit;
  const recordUsage = dependencies.recordUsage ?? recordScanAcceptedUsage;
  const verify = dependencies.verify ?? verifyTarget;
  const enqueueScan = dependencies.enqueueScan ?? enqueueScanRun;

  try {
    const user = await getCurrentUser();
    const usage = await checkUsage(user.id);

    if (!usage.allowed) {
      return createScanFailure(usage.reason, usage.message);
    }

    const verification = await verify(input.input);

    if (!verification.ok) {
      return createScanFailure(verification.code, verification.message);
    }

    const result: CreateScanResult = await database.transaction(
      async (tx): Promise<CreateScanResult> => {
        const transactionUsage = await checkUsage(user.id, tx);

        if (!transactionUsage.allowed) {
          return createScanFailure(
            transactionUsage.reason,
            transactionUsage.message,
          );
        }

        const [scan] = await tx
          .insert(scans)
          .values({
            userId: user.id,
            scanType: input.scanType,
            status: "queued",
            inputUrl: input.input,
            normalizedUrl: verification.normalizedUrl,
            finalUrl: verification.finalUrl,
            domain: getDomainFromVerifiedUrl(verification),
            statusCode: verification.statusCode,
            contentType: verification.contentType,
            redirectChain: verification.redirectChain as unknown as Record<
              string,
              unknown
            >[],
            verification: serializeVerification(verification),
          })
          .returning({
            id: scans.id,
            status: scans.status,
            inputUrl: scans.inputUrl,
            normalizedUrl: scans.normalizedUrl,
            finalUrl: scans.finalUrl,
            scanType: scans.scanType,
          });

        if (!scan) {
          throw new Error("Scan insert returned no row.");
        }

        await recordUsage(
          {
            userId: user.id,
            scanId: scan.id,
            metadata: {
              scanType: input.scanType,
              normalizedUrl: verification.normalizedUrl,
              finalUrl: verification.finalUrl,
            },
          },
          tx,
        );

        return {
          ok: true,
          scan: {
            id: scan.id,
            status: "queued" as const,
            inputUrl: scan.inputUrl,
            normalizedUrl: scan.normalizedUrl ?? verification.normalizedUrl,
            finalUrl: scan.finalUrl ?? verification.finalUrl,
            scanType: scan.scanType as CreateScanType,
          },
        };
      },
    );

    if (!result.ok) {
      return result;
    }

    try {
      await enqueueScan(result.scan.id);
    } catch (error) {
      console.error("Scan queue enqueue failed", error);

      try {
        await markScanQueueEnqueueFailed(result.scan.id, database);
      } catch (markError) {
        console.error("Failed to mark scan queue enqueue failure", markError);
      }

      return createScanFailure("QUEUE_ENQUEUE_FAILED");
    }

    return result;
  } catch (error) {
    console.error("Scan creation failed", error);
    return createScanFailure("SCAN_CREATION_FAILED");
  }
}

export type { RedirectHop };
