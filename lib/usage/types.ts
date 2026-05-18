import type { PlanCode } from "@/lib/db/types";

export interface UsageSummary {
  usedToday: number;
  dailyLimit: number | null;
  remainingToday: number | null;
  isLimited: boolean;
  isLimitReached: boolean;
  resetAt: Date;
  planCode: PlanCode;
}

export type UsageCheckResult =
  | {
      allowed: true;
      summary: UsageSummary;
    }
  | {
      allowed: false;
      reason: "DAILY_SCAN_LIMIT_REACHED";
      summary: UsageSummary;
      message: string;
    };
