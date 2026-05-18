import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import type {
  pdfExports,
  plans,
  reportSections,
  scanEvents,
  scanPages,
  scans,
  seoFindings,
  shareLinks,
  subscriptions,
  usageEvents,
  users,
} from "./schema";
import {
  findingCategoryEnum,
  findingSeverityEnum,
  pdfStatusEnum,
  planCodeEnum,
  reportSectionTypeEnum,
  scanStatusEnum,
  scanTypeEnum,
  subscriptionStatusEnum,
  usageEventTypeEnum,
} from "./schema";

export type PlanCode = (typeof planCodeEnum.enumValues)[number];
export type SubscriptionStatus =
  (typeof subscriptionStatusEnum.enumValues)[number];
export type ScanType = (typeof scanTypeEnum.enumValues)[number];
export type ScanStatus = (typeof scanStatusEnum.enumValues)[number];
export type FindingCategory = (typeof findingCategoryEnum.enumValues)[number];
export type FindingSeverity = (typeof findingSeverityEnum.enumValues)[number];
export type ReportSectionType =
  (typeof reportSectionTypeEnum.enumValues)[number];
export type PdfStatus = (typeof pdfStatusEnum.enumValues)[number];
export type UsageEventType = (typeof usageEventTypeEnum.enumValues)[number];

export type Plan = InferSelectModel<typeof plans>;
export type NewPlan = InferInsertModel<typeof plans>;

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Subscription = InferSelectModel<typeof subscriptions>;
export type NewSubscription = InferInsertModel<typeof subscriptions>;

export type UsageEvent = InferSelectModel<typeof usageEvents>;
export type NewUsageEvent = InferInsertModel<typeof usageEvents>;

export type Scan = InferSelectModel<typeof scans>;
export type NewScan = InferInsertModel<typeof scans>;

export type ScanPage = InferSelectModel<typeof scanPages>;
export type NewScanPage = InferInsertModel<typeof scanPages>;

export type SeoFinding = InferSelectModel<typeof seoFindings>;
export type NewSeoFinding = InferInsertModel<typeof seoFindings>;

export type ReportSection = InferSelectModel<typeof reportSections>;
export type NewReportSection = InferInsertModel<typeof reportSections>;

export type ShareLink = InferSelectModel<typeof shareLinks>;
export type NewShareLink = InferInsertModel<typeof shareLinks>;

export type PdfExport = InferSelectModel<typeof pdfExports>;
export type NewPdfExport = InferInsertModel<typeof pdfExports>;

export type ScanEvent = InferSelectModel<typeof scanEvents>;
export type NewScanEvent = InferInsertModel<typeof scanEvents>;
