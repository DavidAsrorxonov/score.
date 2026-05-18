import "server-only";

import { and, count, eq, gte, lt } from "drizzle-orm";

import { db } from "@/lib/db";
import { usageEvents, users } from "@/lib/db/schema";
import { getPlanLimits } from "@/lib/plans/get-plan-limits";

import { getNextUtcReset, getUtcDayRange } from "./day-boundary";
import { createUsageSummary } from "./usage-limit-state";
import type { UsageSummary } from "./types";

type UsageReadDatabase = Pick<typeof db, "select">;

export async function getUsageSummary(
  userId: string,
  database: UsageReadDatabase = db,
  now = new Date()
): Promise<UsageSummary> {
  const [user] = await database
    .select({
      planCode: users.planCode,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw new Error("Unable to load usage summary for missing user.");
  }

  const limits = await getPlanLimits(user.planCode, database);
  const { end, start } = getUtcDayRange(now);

  const [usageCount] = await database
    .select({
      count: count(),
    })
    .from(usageEvents)
    .where(
      and(
        eq(usageEvents.userId, userId),
        eq(usageEvents.eventType, "scan_accepted"),
        gte(usageEvents.createdAt, start),
        lt(usageEvents.createdAt, end)
      )
    );

  return createUsageSummary({
    usedToday: usageCount?.count ?? 0,
    dailyLimit: limits.dailyScanLimit,
    resetAt: getNextUtcReset(now),
    planCode: user.planCode,
  });
}
