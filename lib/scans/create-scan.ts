import "server-only";

import { scans } from "@/lib/db/schema";
import type { User } from "@/lib/db/types";
import { db } from "@/lib/db";
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

type ScanCreationDatabase = Pick<typeof db, "transaction">;

interface CreateScanDependencies {
  database?: ScanCreationDatabase;
  getCurrentUser?: () => Promise<User>;
  checkUsage?: typeof checkScanUsageLimit;
  recordUsage?: typeof recordScanAcceptedUsage;
  verify?: typeof verifyTarget;
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

    return await database.transaction(async (tx) => {
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
          status: "queued",
          inputUrl: scan.inputUrl,
          normalizedUrl: scan.normalizedUrl ?? verification.normalizedUrl,
          finalUrl: scan.finalUrl ?? verification.finalUrl,
          scanType: scan.scanType as CreateScanType,
        },
      };
    });
  } catch (error) {
    console.error("Scan creation failed", error);
    return createScanFailure("SCAN_CREATION_FAILED");
  }
}

export type { RedirectHop };

