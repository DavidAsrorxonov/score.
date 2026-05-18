CREATE TYPE "public"."finding_category" AS ENUM('technical', 'metadata', 'content', 'indexability', 'performance', 'accessibility', 'structured_data', 'links', 'security', 'other');--> statement-breakpoint
CREATE TYPE "public"."finding_severity" AS ENUM('critical', 'high', 'medium', 'low', 'info', 'passed');--> statement-breakpoint
CREATE TYPE "public"."pdf_status" AS ENUM('queued', 'generating', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."plan_code" AS ENUM('free', 'pro', 'agency');--> statement-breakpoint
CREATE TYPE "public"."report_section_type" AS ENUM('executive_summary', 'top_priorities', 'technical_seo', 'content_seo', 'metadata_suggestions', 'developer_checklist', 'business_explanation', 'performance_summary', 'indexability_summary');--> statement-breakpoint
CREATE TYPE "public"."scan_status" AS ENUM('queued', 'validating', 'fetching', 'analyzing', 'generating_report', 'generating_pdf', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."scan_type" AS ENUM('homepage', 'single_url', 'site_crawl');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('none', 'trialing', 'active', 'past_due', 'canceled', 'incomplete');--> statement-breakpoint
CREATE TYPE "public"."usage_event_type" AS ENUM('scan_accepted', 'pdf_export', 'share_created');--> statement-breakpoint
CREATE TABLE "pdf_exports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scan_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "pdf_status" DEFAULT 'queued' NOT NULL,
	"object_key" text,
	"file_name" text,
	"file_size_bytes" integer,
	"error_code" text,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" "plan_code" NOT NULL,
	"name" text NOT NULL,
	"daily_scan_limit" integer,
	"monthly_scan_limit" integer,
	"single_url_enabled" boolean DEFAULT true NOT NULL,
	"homepage_scan_enabled" boolean DEFAULT true NOT NULL,
	"site_crawl_enabled" boolean DEFAULT false NOT NULL,
	"competitor_comparison_enabled" boolean DEFAULT false NOT NULL,
	"pdf_export_enabled" boolean DEFAULT true NOT NULL,
	"max_pages_per_scan" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scan_id" uuid NOT NULL,
	"section_type" "report_section_type" NOT NULL,
	"title" text NOT NULL,
	"content_markdown" text NOT NULL,
	"content_json" jsonb,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"model" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scan_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scan_id" uuid NOT NULL,
	"status" "scan_status",
	"message" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scan_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scan_id" uuid NOT NULL,
	"url" text NOT NULL,
	"final_url" text,
	"status_code" integer,
	"content_type" text,
	"title" text,
	"meta_description" text,
	"canonical_url" text,
	"meta_robots" text,
	"h1" jsonb,
	"h2" jsonb,
	"h3" jsonb,
	"word_count" integer,
	"internal_link_count" integer,
	"external_link_count" integer,
	"image_count" integer,
	"images_missing_alt_count" integer,
	"schema_types" jsonb,
	"open_graph" jsonb,
	"twitter_card" jsonb,
	"technical_data" jsonb,
	"raw_html_object_key" text,
	"response_time_ms" integer,
	"page_size_bytes" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"scan_type" "scan_type" NOT NULL,
	"status" "scan_status" DEFAULT 'queued' NOT NULL,
	"input_url" text NOT NULL,
	"normalized_url" text,
	"final_url" text,
	"domain" text,
	"status_code" integer,
	"content_type" text,
	"redirect_chain" jsonb,
	"verification" jsonb,
	"error_code" text,
	"error_message" text,
	"overall_score" integer,
	"technical_score" integer,
	"content_score" integer,
	"metadata_score" integer,
	"indexability_score" integer,
	"performance_score" integer,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_findings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scan_id" uuid NOT NULL,
	"page_id" uuid,
	"category" "finding_category" NOT NULL,
	"severity" "finding_severity" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"recommendation" text,
	"evidence" jsonb,
	"affected_url" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "share_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scan_id" uuid NOT NULL,
	"token" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"disabled_at" timestamp with time zone,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_code" "plan_code" DEFAULT 'free' NOT NULL,
	"status" "subscription_status" DEFAULT 'none' NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"current_period_start" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"event_type" "usage_event_type" NOT NULL,
	"scan_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text NOT NULL,
	"email" text,
	"name" text,
	"image_url" text,
	"plan_code" "plan_code" DEFAULT 'free' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pdf_exports" ADD CONSTRAINT "pdf_exports_scan_id_scans_id_fk" FOREIGN KEY ("scan_id") REFERENCES "public"."scans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdf_exports" ADD CONSTRAINT "pdf_exports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_sections" ADD CONSTRAINT "report_sections_scan_id_scans_id_fk" FOREIGN KEY ("scan_id") REFERENCES "public"."scans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_events" ADD CONSTRAINT "scan_events_scan_id_scans_id_fk" FOREIGN KEY ("scan_id") REFERENCES "public"."scans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_pages" ADD CONSTRAINT "scan_pages_scan_id_scans_id_fk" FOREIGN KEY ("scan_id") REFERENCES "public"."scans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scans" ADD CONSTRAINT "scans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_findings" ADD CONSTRAINT "seo_findings_scan_id_scans_id_fk" FOREIGN KEY ("scan_id") REFERENCES "public"."scans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_findings" ADD CONSTRAINT "seo_findings_page_id_scan_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."scan_pages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_scan_id_scans_id_fk" FOREIGN KEY ("scan_id") REFERENCES "public"."scans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_scan_id_scans_id_fk" FOREIGN KEY ("scan_id") REFERENCES "public"."scans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pdf_exports_scan_id_idx" ON "pdf_exports" USING btree ("scan_id");--> statement-breakpoint
CREATE INDEX "pdf_exports_user_id_created_at_idx" ON "pdf_exports" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "pdf_exports_status_idx" ON "pdf_exports" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "plans_code_unique" ON "plans" USING btree ("code");--> statement-breakpoint
CREATE INDEX "report_sections_scan_id_idx" ON "report_sections" USING btree ("scan_id");--> statement-breakpoint
CREATE UNIQUE INDEX "report_sections_scan_id_section_type_unique" ON "report_sections" USING btree ("scan_id","section_type");--> statement-breakpoint
CREATE INDEX "scan_events_scan_id_created_at_idx" ON "scan_events" USING btree ("scan_id","created_at");--> statement-breakpoint
CREATE INDEX "scan_pages_scan_id_idx" ON "scan_pages" USING btree ("scan_id");--> statement-breakpoint
CREATE INDEX "scan_pages_url_idx" ON "scan_pages" USING btree ("url");--> statement-breakpoint
CREATE UNIQUE INDEX "scan_pages_scan_id_url_unique" ON "scan_pages" USING btree ("scan_id","url");--> statement-breakpoint
CREATE INDEX "scans_user_id_created_at_idx" ON "scans" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "scans_user_id_status_idx" ON "scans" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "scans_status_created_at_idx" ON "scans" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "scans_domain_idx" ON "scans" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "seo_findings_scan_id_idx" ON "seo_findings" USING btree ("scan_id");--> statement-breakpoint
CREATE INDEX "seo_findings_page_id_idx" ON "seo_findings" USING btree ("page_id");--> statement-breakpoint
CREATE INDEX "seo_findings_scan_id_severity_idx" ON "seo_findings" USING btree ("scan_id","severity");--> statement-breakpoint
CREATE INDEX "seo_findings_scan_id_category_idx" ON "seo_findings" USING btree ("scan_id","category");--> statement-breakpoint
CREATE UNIQUE INDEX "share_links_token_unique" ON "share_links" USING btree ("token");--> statement-breakpoint
CREATE INDEX "share_links_scan_id_idx" ON "share_links" USING btree ("scan_id");--> statement-breakpoint
CREATE INDEX "share_links_created_by_user_id_idx" ON "share_links" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "share_links_is_active_idx" ON "share_links" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_user_id_unique" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_stripe_customer_id_unique" ON "subscriptions" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_stripe_subscription_id_unique" ON "subscriptions" USING btree ("stripe_subscription_id");--> statement-breakpoint
CREATE INDEX "usage_events_user_event_created_at_idx" ON "usage_events" USING btree ("user_id","event_type","created_at");--> statement-breakpoint
CREATE INDEX "usage_events_scan_id_idx" ON "usage_events" USING btree ("scan_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_clerk_user_id_unique" ON "users" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");