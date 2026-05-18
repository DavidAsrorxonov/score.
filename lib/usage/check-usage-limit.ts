import "server-only";

import { db } from "@/lib/db";

import { getUsageSummary } from "./get-usage-summary";
import type { UsageCheckResult } from "./types";
import { getUsageCheckResult } from "./usage-limit-state";

type UsageReadDatabase = Pick<typeof db, "select">;

export async function checkScanUsageLimit(
  userId: string,
  database: UsageReadDatabase = db
): Promise<UsageCheckResult> {
  const summary = await getUsageSummary(userId, database);

  return getUsageCheckResult(summary);
}
