import type { PlanCode } from "@/lib/db/types";

import type { UsageCheckResult, UsageSummary } from "./types";

export interface CreateUsageSummaryParams {
  usedToday: number;
  dailyLimit: number | null;
  resetAt: Date;
  planCode: PlanCode;
}

export function createUsageSummary({
  usedToday,
  dailyLimit,
  resetAt,
  planCode,
}: CreateUsageSummaryParams): UsageSummary {
  const normalizedUsedToday = Math.max(0, usedToday);
  const remainingToday =
    dailyLimit === null ? null : Math.max(0, dailyLimit - normalizedUsedToday);

  return {
    usedToday: normalizedUsedToday,
    dailyLimit,
    remainingToday,
    isLimited: dailyLimit !== null,
    isLimitReached:
      dailyLimit !== null && normalizedUsedToday >= Math.max(0, dailyLimit),
    resetAt,
    planCode,
  };
}

export function getDailyLimitReachedMessage(summary: UsageSummary): string {
  const limit = summary.dailyLimit ?? 0;

  return `You've used all ${limit} free scans for today. Your limit resets at midnight UTC.`;
}

export function getUsageCheckResult(
  summary: UsageSummary
): UsageCheckResult {
  if (!summary.isLimitReached) {
    return {
      allowed: true,
      summary,
    };
  }

  return {
    allowed: false,
    reason: "DAILY_SCAN_LIMIT_REACHED",
    summary,
    message: getDailyLimitReachedMessage(summary),
  };
}
