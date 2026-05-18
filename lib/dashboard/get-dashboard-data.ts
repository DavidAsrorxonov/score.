import "server-only";

import { desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { scans } from "@/lib/db/schema";
import type { PlanCode, ScanStatus } from "@/lib/db/types";
import { getUsageSummary } from "@/lib/usage/get-usage-summary";
import type { UsageSummary } from "@/lib/usage/types";
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
  usage: UsageSummary;
  recentScans: DashboardScan[];
}

export async function getDashboardData(): Promise<DashboardData> {
  const user = await getOrCreateCurrentUser();

  const [usage, recentScans] = await Promise.all([
    getUsageSummary(user.id),
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
    usage,
    recentScans,
  };
}
