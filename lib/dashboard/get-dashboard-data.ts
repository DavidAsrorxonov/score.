import "server-only";

import { and, count, desc, eq, gte, lt } from "drizzle-orm";

import { db } from "@/lib/db";
import { plans, scans, usageEvents } from "@/lib/db/schema";
import type { PlanCode, ScanStatus } from "@/lib/db/types";
import { FREE_DAILY_SCAN_LIMIT } from "@/lib/plans/constants";
import { getOrCreateCurrentUser } from "@/lib/users/current-user";

export interface DashboardScan {
  id: string;
  inputUrl: string;
  finalUrl: string | null;
  status: ScanStatus;
  overallScore: number | null;
  createdAt: Date;
  completedAt: Date | null;
  errorMessage: string | null;
}

export interface DashboardData {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    planCode: PlanCode;
  };
  usage: {
    usedToday: number;
    dailyLimit: number;
  };
  recentScans: DashboardScan[];
}

function getTodayRange() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { end, start };
}

export async function getDashboardData(): Promise<DashboardData> {
  const user = await getOrCreateCurrentUser();
  const { end, start } = getTodayRange();

  const [plan, usageCount, recentScans] = await Promise.all([
    db
      .select({
        dailyScanLimit: plans.dailyScanLimit,
      })
      .from(plans)
      .where(eq(plans.code, user.planCode))
      .limit(1),
    db
      .select({
        count: count(),
      })
      .from(usageEvents)
      .where(
        and(
          eq(usageEvents.userId, user.id),
          eq(usageEvents.eventType, "scan_accepted"),
          gte(usageEvents.createdAt, start),
          lt(usageEvents.createdAt, end)
        )
      ),
    db
      .select({
        id: scans.id,
        inputUrl: scans.inputUrl,
        finalUrl: scans.finalUrl,
        status: scans.status,
        overallScore: scans.overallScore,
        createdAt: scans.createdAt,
        completedAt: scans.completedAt,
        errorMessage: scans.errorMessage,
      })
      .from(scans)
      .where(eq(scans.userId, user.id))
      .orderBy(desc(scans.createdAt))
      .limit(10),
  ]);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      planCode: user.planCode,
    },
    usage: {
      usedToday: usageCount[0]?.count ?? 0,
      dailyLimit: plan[0]?.dailyScanLimit ?? FREE_DAILY_SCAN_LIMIT,
    },
    recentScans,
  };
}
