import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { plans } from "@/lib/db/schema";
import type { PlanCode } from "@/lib/db/types";

import { PLAN_LIMITS } from "./constants";
import type { PlanLimits } from "./types";

type PlanLimitDatabase = Pick<typeof db, "select">;

export function getFallbackPlanLimits(planCode: PlanCode): PlanLimits {
  return PLAN_LIMITS[planCode];
}

export async function getPlanLimits(
  planCode: PlanCode,
  database: PlanLimitDatabase = db
): Promise<PlanLimits> {
  const fallback = getFallbackPlanLimits(planCode);

  const [plan] = await database
    .select({
      dailyScanLimit: plans.dailyScanLimit,
      homepageScanEnabled: plans.homepageScanEnabled,
      singleUrlEnabled: plans.singleUrlEnabled,
      siteCrawlEnabled: plans.siteCrawlEnabled,
      competitorComparisonEnabled: plans.competitorComparisonEnabled,
      pdfExportEnabled: plans.pdfExportEnabled,
      maxPagesPerScan: plans.maxPagesPerScan,
    })
    .from(plans)
    .where(eq(plans.code, planCode))
    .limit(1);

  if (!plan) {
    return fallback;
  }

  return {
    dailyScanLimit: plan.dailyScanLimit ?? fallback.dailyScanLimit,
    homepageScanEnabled: plan.homepageScanEnabled,
    singleUrlScanEnabled: plan.singleUrlEnabled,
    siteCrawlEnabled: plan.siteCrawlEnabled,
    competitorComparisonEnabled: plan.competitorComparisonEnabled,
    pdfExportEnabled: plan.pdfExportEnabled,
    maxPagesPerScan: plan.maxPagesPerScan,
  };
}
