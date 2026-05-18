import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { usageEvents } from "@/lib/db/schema";
import type { UsageEvent } from "@/lib/db/types";

type UsageWriteDatabase = Pick<typeof db, "insert" | "select">;

export interface RecordScanAcceptedUsageParams {
  userId: string;
  scanId: string;
  metadata?: Record<string, unknown>;
}

export async function recordScanAcceptedUsage(
  params: RecordScanAcceptedUsageParams,
  database: UsageWriteDatabase = db
): Promise<UsageEvent> {
  const [usageEvent] = await database
    .insert(usageEvents)
    .values({
      userId: params.userId,
      scanId: params.scanId,
      eventType: "scan_accepted",
      metadata: params.metadata,
    })
    .onConflictDoNothing({
      target: [usageEvents.eventType, usageEvents.scanId],
    })
    .returning();

  if (usageEvent) {
    return usageEvent;
  }

  const [existingUsageEvent] = await database
    .select()
    .from(usageEvents)
    .where(
      and(
        eq(usageEvents.eventType, "scan_accepted"),
        eq(usageEvents.scanId, params.scanId)
      )
    )
    .limit(1);

  if (!existingUsageEvent) {
    throw new Error("Unable to record accepted scan usage.");
  }

  return existingUsageEvent;
}
