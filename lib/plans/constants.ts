import type { PlanCode } from "@/lib/db/types";

import type { PlanLimits } from "./types";

export const FREE_DAILY_SCAN_LIMIT = 5;

export const DEFAULT_PLAN_CODE: PlanCode = "free";

export const PLAN_LIMITS = {
  free: {
    dailyScanLimit: FREE_DAILY_SCAN_LIMIT,
    homepageScanEnabled: true,
    singleUrlScanEnabled: true,
    siteCrawlEnabled: false,
    competitorComparisonEnabled: false,
    pdfExportEnabled: true,
    maxPagesPerScan: 1,
  },
  pro: {
    dailyScanLimit: null,
    homepageScanEnabled: true,
    singleUrlScanEnabled: true,
    siteCrawlEnabled: true,
    competitorComparisonEnabled: true,
    pdfExportEnabled: true,
    maxPagesPerScan: 1000,
  },
  agency: {
    dailyScanLimit: null,
    homepageScanEnabled: true,
    singleUrlScanEnabled: true,
    siteCrawlEnabled: true,
    competitorComparisonEnabled: true,
    pdfExportEnabled: true,
    maxPagesPerScan: 5000,
  },
} as const satisfies Record<PlanCode, PlanLimits>;
