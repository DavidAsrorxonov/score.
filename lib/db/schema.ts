import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

type JsonObject = Record<string, unknown>;

const primaryId = () => uuid("id").defaultRandom().primaryKey();

const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).defaultNow().notNull();

const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date());

export const planCodeEnum = pgEnum("plan_code", ["free", "pro", "agency"]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "none",
  "trialing",
  "active",
  "past_due",
  "canceled",
  "incomplete",
]);

export const scanTypeEnum = pgEnum("scan_type", [
  "homepage",
  "single_url",
  "site_crawl",
]);

export const scanStatusEnum = pgEnum("scan_status", [
  "queued",
  "validating",
  "fetching",
  "analyzing",
  "generating_report",
  "generating_pdf",
  "completed",
  "failed",
]);

export const findingCategoryEnum = pgEnum("finding_category", [
  "technical",
  "metadata",
  "content",
  "indexability",
  "performance",
  "accessibility",
  "structured_data",
  "links",
  "security",
  "other",
]);

export const findingSeverityEnum = pgEnum("finding_severity", [
  "critical",
  "high",
  "medium",
  "low",
  "info",
  "passed",
]);

export const reportSectionTypeEnum = pgEnum("report_section_type", [
  "executive_summary",
  "top_priorities",
  "technical_seo",
  "content_seo",
  "metadata_suggestions",
  "developer_checklist",
  "business_explanation",
  "performance_summary",
  "indexability_summary",
]);

export const pdfStatusEnum = pgEnum("pdf_status", [
  "queued",
  "generating",
  "completed",
  "failed",
]);

export const usageEventTypeEnum = pgEnum("usage_event_type", [
  "scan_accepted",
  "pdf_export",
  "share_created",
]);

export const plans = pgTable(
  "plans",
  {
    id: primaryId(),
    code: planCodeEnum("code").notNull(),
    name: text("name").notNull(),
    dailyScanLimit: integer("daily_scan_limit"),
    monthlyScanLimit: integer("monthly_scan_limit"),
    singleUrlEnabled: boolean("single_url_enabled").default(true).notNull(),
    homepageScanEnabled: boolean("homepage_scan_enabled")
      .default(true)
      .notNull(),
    siteCrawlEnabled: boolean("site_crawl_enabled").default(false).notNull(),
    competitorComparisonEnabled: boolean("competitor_comparison_enabled")
      .default(false)
      .notNull(),
    pdfExportEnabled: boolean("pdf_export_enabled").default(true).notNull(),
    maxPagesPerScan: integer("max_pages_per_scan").default(1).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [uniqueIndex("plans_code_unique").on(table.code)],
);

export const users = pgTable(
  "users",
  {
    id: primaryId(),
    clerkUserId: text("clerk_user_id").notNull(),
    email: text("email"),
    name: text("name"),
    imageUrl: text("image_url"),
    planCode: planCodeEnum("plan_code").default("free").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("users_clerk_user_id_unique").on(table.clerkUserId),
    index("users_email_idx").on(table.email),
  ],
);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: primaryId(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    planCode: planCodeEnum("plan_code").default("free").notNull(),
    status: subscriptionStatusEnum("status").default("none").notNull(),
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    currentPeriodStart: timestamp("current_period_start", {
      withTimezone: true,
    }),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("subscriptions_user_id_unique").on(table.userId),
    uniqueIndex("subscriptions_stripe_customer_id_unique").on(
      table.stripeCustomerId,
    ),
    uniqueIndex("subscriptions_stripe_subscription_id_unique").on(
      table.stripeSubscriptionId,
    ),
  ],
);

export const scans = pgTable(
  "scans",
  {
    id: primaryId(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    scanType: scanTypeEnum("scan_type").notNull(),
    status: scanStatusEnum("status").default("queued").notNull(),
    inputUrl: text("input_url").notNull(),
    normalizedUrl: text("normalized_url"),
    finalUrl: text("final_url"),
    domain: text("domain"),
    statusCode: integer("status_code"),
    contentType: text("content_type"),
    redirectChain: jsonb("redirect_chain").$type<JsonObject[]>(),
    verification: jsonb("verification").$type<JsonObject>(),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    overallScore: integer("overall_score"),
    technicalScore: integer("technical_score"),
    contentScore: integer("content_score"),
    metadataScore: integer("metadata_score"),
    indexabilityScore: integer("indexability_score"),
    performanceScore: integer("performance_score"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    failedAt: timestamp("failed_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("scans_user_id_created_at_idx").on(table.userId, table.createdAt),
    index("scans_user_id_status_idx").on(table.userId, table.status),
    index("scans_status_created_at_idx").on(table.status, table.createdAt),
    index("scans_domain_idx").on(table.domain),
  ],
);

export const usageEvents = pgTable(
  "usage_events",
  {
    id: primaryId(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    eventType: usageEventTypeEnum("event_type").notNull(),
    scanId: uuid("scan_id").references(() => scans.id, {
      onDelete: "set null",
    }),
    metadata: jsonb("metadata").$type<JsonObject>(),
    createdAt: createdAt(),
  },
  (table) => [
    index("usage_events_user_event_created_at_idx").on(
      table.userId,
      table.eventType,
      table.createdAt,
    ),
    index("usage_events_scan_id_idx").on(table.scanId),
    uniqueIndex("usage_events_event_type_scan_id_unique").on(
      table.eventType,
      table.scanId,
    ),
  ],
);

export const scanPages = pgTable(
  "scan_pages",
  {
    id: primaryId(),
    scanId: uuid("scan_id")
      .notNull()
      .references(() => scans.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    finalUrl: text("final_url"),
    statusCode: integer("status_code"),
    contentType: text("content_type"),
    title: text("title"),
    metaDescription: text("meta_description"),
    canonicalUrl: text("canonical_url"),
    metaRobots: text("meta_robots"),
    h1: jsonb("h1").$type<string[]>(),
    h2: jsonb("h2").$type<string[]>(),
    h3: jsonb("h3").$type<string[]>(),
    wordCount: integer("word_count"),
    internalLinkCount: integer("internal_link_count"),
    externalLinkCount: integer("external_link_count"),
    imageCount: integer("image_count"),
    imagesMissingAltCount: integer("images_missing_alt_count"),
    schemaTypes: jsonb("schema_types").$type<string[]>(),
    openGraph: jsonb("open_graph").$type<JsonObject>(),
    twitterCard: jsonb("twitter_card").$type<JsonObject>(),
    technicalData: jsonb("technical_data").$type<JsonObject>(),
    rawHtmlObjectKey: text("raw_html_object_key"),
    responseTimeMs: integer("response_time_ms"),
    pageSizeBytes: integer("page_size_bytes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("scan_pages_scan_id_idx").on(table.scanId),
    index("scan_pages_url_idx").on(table.url),
    uniqueIndex("scan_pages_scan_id_url_unique").on(table.scanId, table.url),
  ],
);

export const seoFindings = pgTable(
  "seo_findings",
  {
    id: primaryId(),
    scanId: uuid("scan_id")
      .notNull()
      .references(() => scans.id, { onDelete: "cascade" }),
    pageId: uuid("page_id").references(() => scanPages.id, {
      onDelete: "set null",
    }),
    category: findingCategoryEnum("category").notNull(),
    severity: findingSeverityEnum("severity").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    recommendation: text("recommendation"),
    evidence: jsonb("evidence").$type<JsonObject>(),
    affectedUrl: text("affected_url"),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    index("seo_findings_scan_id_idx").on(table.scanId),
    index("seo_findings_page_id_idx").on(table.pageId),
    index("seo_findings_scan_id_severity_idx").on(
      table.scanId,
      table.severity,
    ),
    index("seo_findings_scan_id_category_idx").on(
      table.scanId,
      table.category,
    ),
  ],
);

export const reportSections = pgTable(
  "report_sections",
  {
    id: primaryId(),
    scanId: uuid("scan_id")
      .notNull()
      .references(() => scans.id, { onDelete: "cascade" }),
    sectionType: reportSectionTypeEnum("section_type").notNull(),
    title: text("title").notNull(),
    contentMarkdown: text("content_markdown").notNull(),
    contentJson: jsonb("content_json").$type<JsonObject>(),
    sortOrder: integer("sort_order").default(0).notNull(),
    model: text("model"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("report_sections_scan_id_idx").on(table.scanId),
    uniqueIndex("report_sections_scan_id_section_type_unique").on(
      table.scanId,
      table.sectionType,
    ),
  ],
);

export const shareLinks = pgTable(
  "share_links",
  {
    id: primaryId(),
    scanId: uuid("scan_id")
      .notNull()
      .references(() => scans.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id),
    createdAt: createdAt(),
    disabledAt: timestamp("disabled_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("share_links_token_unique").on(table.token),
    index("share_links_scan_id_idx").on(table.scanId),
    index("share_links_created_by_user_id_idx").on(table.createdByUserId),
    index("share_links_is_active_idx").on(table.isActive),
  ],
);

export const pdfExports = pgTable(
  "pdf_exports",
  {
    id: primaryId(),
    scanId: uuid("scan_id")
      .notNull()
      .references(() => scans.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    status: pdfStatusEnum("status").default("queued").notNull(),
    objectKey: text("object_key"),
    fileName: text("file_name"),
    fileSizeBytes: integer("file_size_bytes"),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    createdAt: createdAt(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    failedAt: timestamp("failed_at", { withTimezone: true }),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("pdf_exports_scan_id_idx").on(table.scanId),
    index("pdf_exports_user_id_created_at_idx").on(
      table.userId,
      table.createdAt,
    ),
    index("pdf_exports_status_idx").on(table.status),
  ],
);

export const scanEvents = pgTable(
  "scan_events",
  {
    id: primaryId(),
    scanId: uuid("scan_id")
      .notNull()
      .references(() => scans.id, { onDelete: "cascade" }),
    status: scanStatusEnum("status"),
    message: text("message"),
    metadata: jsonb("metadata").$type<JsonObject>(),
    createdAt: createdAt(),
  },
  (table) => [
    index("scan_events_scan_id_created_at_idx").on(
      table.scanId,
      table.createdAt,
    ),
  ],
);

export const plansRelations = relations(plans, ({ many }) => ({
  users: many(users),
  subscriptions: many(subscriptions),
}));

export const usersRelations = relations(users, ({ many, one }) => ({
  plan: one(plans, {
    fields: [users.planCode],
    references: [plans.code],
  }),
  subscription: one(subscriptions),
  usageEvents: many(usageEvents),
  scans: many(scans),
  shareLinks: many(shareLinks),
  pdfExports: many(pdfExports),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
  plan: one(plans, {
    fields: [subscriptions.planCode],
    references: [plans.code],
  }),
}));

export const usageEventsRelations = relations(usageEvents, ({ one }) => ({
  user: one(users, {
    fields: [usageEvents.userId],
    references: [users.id],
  }),
  scan: one(scans, {
    fields: [usageEvents.scanId],
    references: [scans.id],
  }),
}));

export const scansRelations = relations(scans, ({ many, one }) => ({
  user: one(users, {
    fields: [scans.userId],
    references: [users.id],
  }),
  usageEvents: many(usageEvents),
  pages: many(scanPages),
  findings: many(seoFindings),
  reportSections: many(reportSections),
  shareLinks: many(shareLinks),
  pdfExports: many(pdfExports),
  events: many(scanEvents),
}));

export const scanPagesRelations = relations(scanPages, ({ many, one }) => ({
  scan: one(scans, {
    fields: [scanPages.scanId],
    references: [scans.id],
  }),
  findings: many(seoFindings),
}));

export const seoFindingsRelations = relations(seoFindings, ({ one }) => ({
  scan: one(scans, {
    fields: [seoFindings.scanId],
    references: [scans.id],
  }),
  page: one(scanPages, {
    fields: [seoFindings.pageId],
    references: [scanPages.id],
  }),
}));

export const reportSectionsRelations = relations(reportSections, ({ one }) => ({
  scan: one(scans, {
    fields: [reportSections.scanId],
    references: [scans.id],
  }),
}));

export const shareLinksRelations = relations(shareLinks, ({ one }) => ({
  scan: one(scans, {
    fields: [shareLinks.scanId],
    references: [scans.id],
  }),
  createdByUser: one(users, {
    fields: [shareLinks.createdByUserId],
    references: [users.id],
  }),
}));

export const pdfExportsRelations = relations(pdfExports, ({ one }) => ({
  scan: one(scans, {
    fields: [pdfExports.scanId],
    references: [scans.id],
  }),
  user: one(users, {
    fields: [pdfExports.userId],
    references: [users.id],
  }),
}));

export const scanEventsRelations = relations(scanEvents, ({ one }) => ({
  scan: one(scans, {
    fields: [scanEvents.scanId],
    references: [scans.id],
  }),
}));
