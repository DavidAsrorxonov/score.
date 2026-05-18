# 04. Database Schema

## Purpose

This task adds the database foundation for scōre. using Neon PostgreSQL and Drizzle ORM. It defines the relational source of truth for users, plans, usage, scans, analyzed pages, SEO findings, AI report sections, public share links, and PDF export records.

This task is only about database setup and schema. It should not implement scan creation APIs, URL validation, domain verification, queue processing, SEO analysis, report UI, PDF rendering, or billing checkout.

## Required Context

Before starting this task, read these files:

1. `project-overview.md`
2. `architecture-context.md`
3. `ui-context.md`
4. `01-project-setup.md`
5. `02-ui-design-system.md`
6. `03-authentication.md`

The database schema must support the Version 1 product:

- Authenticated users.
- 5 accepted free URL scans per day.
- Single-page scans.
- Scan lifecycle statuses.
- Deterministic SEO findings.
- AI-generated report sections.
- Saved report history.
- Public shareable report links.
- PDF export records.
- Future paid feature gates.

## Goal

At the end of this task:

- Drizzle ORM is installed and configured.
- Neon PostgreSQL is the target database.
- Database environment variables are documented.
- The initial schema exists.
- Migrations can be generated and applied.
- A database client helper exists.
- Core tables are ready for future feature work.
- TypeScript can import database types safely.

No runtime product feature should depend on the database yet unless needed to validate the connection.

## Stack Decision

Use:

- Neon PostgreSQL
- Drizzle ORM
- `drizzle-kit`
- `postgres` or Neon serverless driver, depending on the selected runtime approach

Recommended default:

```text
drizzle-orm
drizzle-kit
postgres
```

Use the standard `postgres` client for simplicity in server-side Node runtimes. If the deployment target requires edge-compatible access later, a future task can adapt the driver for specific routes.

## Scope

### In Scope

- Install Drizzle and database client dependencies.
- Add Drizzle configuration.
- Add database connection helper.
- Add schema files.
- Define V1 database tables.
- Define enums.
- Define indexes and unique constraints.
- Define relationships where useful.
- Add migration scripts.
- Add environment variable documentation.
- Run migration generation.
- Optionally run migration against a configured Neon database.
- Add a simple database health check helper if useful.

### Out Of Scope

- Clerk webhook syncing.
- Creating users automatically on sign-up.
- Scan creation API.
- Usage limit enforcement logic.
- URL normalization.
- Domain verification.
- Queue jobs.
- Worker updates.
- SEO extraction.
- AI report generation.
- Report page queries.
- PDF generation.
- Stripe checkout.
- Stripe webhooks.

This task may create the tables required for those future features, but it must not implement those feature flows.

## Environment Variables

Update `.env.example`:

```env
# Database
DATABASE_URL=
```

For Neon, `DATABASE_URL` should usually look like:

```text
postgresql://USER:PASSWORD@HOST.neon.tech/DB_NAME?sslmode=require
```

Do not commit real database credentials.

Local development should use `.env.local`, but this file must not be committed.

## Required Packages

Install:

```bash
npm install drizzle-orm postgres
npm install -D drizzle-kit
```

If the project already uses a different package manager, use the existing package manager consistently.

Do not install Prisma. The selected ORM is Drizzle.

## Recommended Files

Create or update:

```text
drizzle.config.ts
lib/db/client.ts
lib/db/schema.ts
lib/db/types.ts
lib/db/index.ts
```

Optional:

```text
lib/db/relations.ts
drizzle/
```

Expected responsibilities:

- `drizzle.config.ts` configures migrations.
- `lib/db/client.ts` creates the Drizzle database client.
- `lib/db/schema.ts` defines tables and enums.
- `lib/db/types.ts` exports inferred select/insert types.
- `lib/db/index.ts` re-exports database helpers.
- `drizzle/` stores generated migrations.

## Drizzle Config

Create:

```text
drizzle.config.ts
```

Expected shape:

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

Rules:

- Do not hardcode credentials.
- Read `DATABASE_URL` from the environment.
- Keep migration output in `drizzle/`.

If TypeScript config or Drizzle version requires small syntax changes, use the current Drizzle-recommended format.

## Database Client

Create:

```text
lib/db/client.ts
```

Expected behavior:

- Uses `postgres`.
- Creates a Drizzle client.
- Exports `db`.
- Avoids creating unnecessary duplicate clients in development if practical.

Example shape:

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const queryClient = postgres(process.env.DATABASE_URL!);

export const db = drizzle(queryClient, { schema });
```

Rules:

- Do not use this client in browser components.
- Server-only database access must stay in server modules, route handlers, server actions, or workers.
- Do not expose `DATABASE_URL` to client-side code.

## Schema Overview

V1 core tables:

```text
users
plans
subscriptions
usage_events
scans
scan_pages
seo_findings
report_sections
share_links
pdf_exports
```

Optional early support tables:

```text
scan_events
```

Do not add future-heavy tables yet unless they are needed by V1. Tables such as `scheduled_scans`, `competitor_reports`, and `crawl_pages` should wait until their feature task.

## Enum Design

Define PostgreSQL enums for stable workflow values.

Recommended enums:

```text
plan_code
subscription_status
scan_type
scan_status
finding_category
finding_severity
report_section_type
pdf_status
usage_event_type
```

### `plan_code`

Values:

```text
free
pro
agency
```

Only `free` needs to be active in V1, but `pro` and `agency` can exist as future-safe plan codes.

### `subscription_status`

Values:

```text
none
trialing
active
past_due
canceled
incomplete
```

### `scan_type`

Values:

```text
homepage
single_url
site_crawl
```

V1 supports:

```text
homepage
single_url
```

`site_crawl` exists only as a future paid scan type.

### `scan_status`

Values:

```text
queued
validating
fetching
analyzing
generating_report
generating_pdf
completed
failed
```

These must match `architecture-context.md` and UI status badges.

### `finding_category`

Values:

```text
technical
metadata
content
indexability
performance
accessibility
structured_data
links
security
other
```

### `finding_severity`

Values:

```text
critical
high
medium
low
info
passed
```

These must match the UI design system severity badge.

### `report_section_type`

Values:

```text
executive_summary
top_priorities
technical_seo
content_seo
metadata_suggestions
developer_checklist
business_explanation
performance_summary
indexability_summary
```

### `pdf_status`

Values:

```text
queued
generating
completed
failed
```

### `usage_event_type`

Values:

```text
scan_accepted
pdf_export
share_created
```

Only `scan_accepted` is required for V1 free-tier scan enforcement.

## Table Details

### `users`

Purpose:

Stores app-level user profile data mapped to Clerk identity.

Recommended columns:

```text
id uuid primary key
clerk_user_id text unique not null
email text
name text
image_url text
plan_code plan_code not null default 'free'
created_at timestamp not null
updated_at timestamp not null
```

Notes:

- `clerk_user_id` is the stable external identity reference.
- This table does not need to be populated in the authentication task.
- A future user-sync task can upsert this row after sign-in or via Clerk webhook.
- Use this table for database ownership instead of storing only Clerk IDs across all tables if the implementation is ready.

Index requirements:

```text
unique(clerk_user_id)
index(email)
```

### `plans`

Purpose:

Stores plan definitions and limits.

Recommended columns:

```text
id uuid primary key
code plan_code unique not null
name text not null
daily_scan_limit integer
monthly_scan_limit integer
single_url_enabled boolean not null default true
homepage_scan_enabled boolean not null default true
site_crawl_enabled boolean not null default false
competitor_comparison_enabled boolean not null default false
pdf_export_enabled boolean not null default true
max_pages_per_scan integer not null default 1
created_at timestamp not null
updated_at timestamp not null
```

V1 free plan values:

```text
code = free
daily_scan_limit = 5
single_url_enabled = true
homepage_scan_enabled = true
site_crawl_enabled = false
max_pages_per_scan = 1
```

Notes:

- The plan table makes limits data-driven.
- If the team prefers hardcoded plan constants for early V1, the table can still exist for future billing migration.

### `subscriptions`

Purpose:

Stores future Stripe subscription state.

Recommended columns:

```text
id uuid primary key
user_id uuid not null references users(id)
plan_code plan_code not null default 'free'
status subscription_status not null default 'none'
stripe_customer_id text
stripe_subscription_id text
current_period_start timestamp
current_period_end timestamp
created_at timestamp not null
updated_at timestamp not null
```

Constraints:

```text
unique(user_id)
unique(stripe_customer_id)
unique(stripe_subscription_id)
```

Notes:

- No Stripe logic should be implemented in this task.
- This table only prepares the schema.

### `usage_events`

Purpose:

Records accepted usage events for quota enforcement.

Recommended columns:

```text
id uuid primary key
user_id uuid not null references users(id)
event_type usage_event_type not null
scan_id uuid references scans(id)
metadata jsonb
created_at timestamp not null
```

Index requirements:

```text
index(user_id, event_type, created_at)
index(scan_id)
```

V1 usage logic later:

- Count `scan_accepted` events for the authenticated user.
- Count only events created within the current day boundary.
- Block the sixth accepted free scan.

This task creates the table but does not implement that logic.

### `scans`

Purpose:

Stores one scan request and its lifecycle.

Recommended columns:

```text
id uuid primary key
user_id uuid not null references users(id)
scan_type scan_type not null
status scan_status not null default 'queued'
input_url text not null
normalized_url text
final_url text
domain text
status_code integer
content_type text
redirect_chain jsonb
verification jsonb
error_code text
error_message text
overall_score integer
technical_score integer
content_score integer
metadata_score integer
indexability_score integer
performance_score integer
started_at timestamp
completed_at timestamp
failed_at timestamp
created_at timestamp not null
updated_at timestamp not null
```

Index requirements:

```text
index(user_id, created_at)
index(user_id, status)
index(status, created_at)
index(domain)
```

Rules:

- `input_url` is exactly what the user submitted.
- `normalized_url` is the safe normalized URL.
- `final_url` is the URL after redirects.
- `verification` stores structured verification metadata.
- Scores should be nullable until analysis completes.
- Failed scans should preserve `error_code` and `error_message`.

### `scan_pages`

Purpose:

Stores page-level data for a scan.

V1 has one page per scan. Future paid site crawl scans will have many pages per scan.

Recommended columns:

```text
id uuid primary key
scan_id uuid not null references scans(id)
url text not null
final_url text
status_code integer
content_type text
title text
meta_description text
canonical_url text
meta_robots text
h1 jsonb
h2 jsonb
h3 jsonb
word_count integer
internal_link_count integer
external_link_count integer
image_count integer
images_missing_alt_count integer
schema_types jsonb
open_graph jsonb
twitter_card jsonb
technical_data jsonb
raw_html_object_key text
response_time_ms integer
page_size_bytes integer
created_at timestamp not null
updated_at timestamp not null
```

Index requirements:

```text
index(scan_id)
index(url)
unique(scan_id, url)
```

Notes:

- Keep extracted facts queryable where useful.
- Use JSONB for structured fields that vary by page.
- Do not store very large raw HTML directly in this table unless intentionally limited. Prefer object storage for raw HTML snapshots.

### `seo_findings`

Purpose:

Stores deterministic SEO findings produced by code.

Recommended columns:

```text
id uuid primary key
scan_id uuid not null references scans(id)
page_id uuid references scan_pages(id)
category finding_category not null
severity finding_severity not null
title text not null
description text
recommendation text
evidence jsonb
affected_url text
sort_order integer not null default 0
created_at timestamp not null
```

Index requirements:

```text
index(scan_id)
index(page_id)
index(scan_id, severity)
index(scan_id, category)
```

Rules:

- Findings are factual.
- AI does not write this table.
- Findings should include enough evidence for UI and AI report generation.

### `report_sections`

Purpose:

Stores AI-generated report sections.

Recommended columns:

```text
id uuid primary key
scan_id uuid not null references scans(id)
section_type report_section_type not null
title text not null
content_markdown text not null
content_json jsonb
sort_order integer not null default 0
model text
created_at timestamp not null
updated_at timestamp not null
```

Index requirements:

```text
index(scan_id)
unique(scan_id, section_type)
```

Rules:

- These sections render the report narrative.
- The report page should not rerun AI generation just because a user opens it.
- `content_markdown` is the primary display content.
- `content_json` can store structured suggestions or checklist items if useful.

### `share_links`

Purpose:

Stores public report share links.

Recommended columns:

```text
id uuid primary key
scan_id uuid not null references scans(id)
token text unique not null
is_active boolean not null default true
created_by_user_id uuid not null references users(id)
created_at timestamp not null
disabled_at timestamp
expires_at timestamp
```

Index requirements:

```text
unique(token)
index(scan_id)
index(created_by_user_id)
index(is_active)
```

Rules:

- Public reports are read-only.
- Public links must not expose private account data.
- Only completed scans should be shareable in later feature logic.

### `pdf_exports`

Purpose:

Stores PDF export jobs and generated artifact references.

Recommended columns:

```text
id uuid primary key
scan_id uuid not null references scans(id)
user_id uuid not null references users(id)
status pdf_status not null default 'queued'
object_key text
file_name text
file_size_bytes integer
error_code text
error_message text
created_at timestamp not null
completed_at timestamp
failed_at timestamp
updated_at timestamp not null
```

Index requirements:

```text
index(scan_id)
index(user_id, created_at)
index(status)
```

Rules:

- PDF generation must use saved report data.
- The actual PDF file belongs in object storage.
- The database stores metadata and object key only.

### `scan_events` Optional

Purpose:

Stores detailed lifecycle events for debugging and progress display.

Recommended columns:

```text
id uuid primary key
scan_id uuid not null references scans(id)
status scan_status
message text
metadata jsonb
created_at timestamp not null
```

Index requirements:

```text
index(scan_id, created_at)
```

This table is optional for V1. It is useful if the product wants detailed progress timelines or worker debugging.

## Timestamp Rules

Use consistent timestamp columns:

```text
created_at
updated_at
completed_at
failed_at
disabled_at
expires_at
```

In Drizzle, define reusable timestamp helpers if useful.

Recommended behavior:

- `created_at` defaults to now.
- `updated_at` defaults to now and is manually updated by write helpers or update queries.
- Completion/failure timestamps are nullable and set only when relevant.

## ID Rules

Use UUID primary keys.

Recommended:

```ts
uuid("id").defaultRandom().primaryKey();
```

Do not use sequential numeric IDs for public-facing resources.

Public share links should use a separate random token, not expose scan IDs as the only public identifier.

## Deletion Rules

For V1, prefer preserving scan records instead of hard deleting.

Foreign key behavior:

- User deletion behavior can be restrictive or cascade depending on policy.
- Scan deletion should cascade to scan pages, findings, report sections, share links, and PDF exports if hard delete is later implemented.

If uncertain, use explicit references and avoid automatic cascade until product deletion policy is defined.

## JSONB Usage Rules

Use JSONB for flexible structured data:

- Redirect chains
- Verification details
- SEO evidence
- Heading arrays
- Open Graph metadata
- Twitter card metadata
- Structured data types
- Technical extraction details
- AI structured outputs

Do not use JSONB when the field is important for filtering, sorting, or indexing in V1.

Examples that should be normal columns:

- Scan status
- User ID
- Scan type
- Scores
- Severity
- Category
- Created date

## Relationships

Expected relationships:

```text
users 1 -> many scans
users 1 -> many usage_events
users 1 -> 1 subscriptions
plans 1 -> many users through plan_code
scans 1 -> many scan_pages
scans 1 -> many seo_findings
scan_pages 1 -> many seo_findings
scans 1 -> many report_sections
scans 1 -> many share_links
scans 1 -> many pdf_exports
```

If using Drizzle relations, define them in the schema or a nearby relations file.

## Package Scripts

Add scripts to `package.json`:

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "db:push": "drizzle-kit push"
  }
}
```

Recommended usage:

- Use `db:generate` to create migration files.
- Use `db:migrate` to apply migrations.
- Use `db:studio` for local inspection.
- Use `db:push` only for rapid prototyping if the team accepts that workflow.

For a production-oriented project, migrations are preferred over direct push.

## Seed Data

This task may include a minimal seed script only for plan records.

Optional file:

```text
lib/db/seed.ts
```

Recommended seed:

```text
free plan
pro plan placeholder
agency plan placeholder
```

Do not seed fake users, fake scans, fake reports, or fake findings in this task.

If adding a seed script, add:

```json
{
  "scripts": {
    "db:seed": "tsx lib/db/seed.ts"
  }
}
```

Only add `tsx` if needed:

```bash
npm install -D tsx
```

Seeding can also be deferred to a later plan/billing task if the team wants the schema task to stay minimal.

## User Sync Note

The database includes a `users` table, but this task does not need to populate it automatically.

User profile creation can happen later through one of these approaches:

1. Lazy upsert when an authenticated user first enters `/app`.
2. Clerk webhook on user creation/update.
3. Lazy upsert when the user creates their first scan.

Recommended for early V1:

```text
lazy upsert when authenticated user enters the app
```

That belongs to the dashboard or user-profile integration task, not this schema task.

## Migration Flow

Expected implementation flow:

1. Install Drizzle packages.
2. Add `DATABASE_URL` to `.env.example`.
3. Create `drizzle.config.ts`.
4. Create `lib/db/schema.ts`.
5. Create `lib/db/client.ts`.
6. Add inferred types.
7. Add package scripts.
8. Generate migration.
9. Apply migration if a Neon database URL is available.
10. Run lint, typecheck, and build.

## Validation

Run:

```bash
npm run lint
npm run typecheck
npm run build
```

Generate migration:

```bash
npm run db:generate
```

If `DATABASE_URL` is configured, apply migration:

```bash
npm run db:migrate
```

Optional:

```bash
npm run db:studio
```

If migration cannot be applied because no Neon credentials exist locally, document that migrations were generated but not applied.

## Expected Final State

At the end of this task:

- Drizzle ORM is installed.
- Neon-compatible Postgres connection is configured.
- `DATABASE_URL` is documented.
- Initial schema exists.
- Initial migration exists.
- Database client helper exists.
- Core V1 tables are defined.
- Enums match architecture and UI statuses.
- Package scripts exist for database operations.
- No runtime product workflows are implemented.

## Acceptance Criteria

This task is complete when:

1. `drizzle-orm`, `drizzle-kit`, and the selected Postgres client are installed.
2. `drizzle.config.ts` exists and reads `DATABASE_URL`.
3. `lib/db/client.ts` exports a server-side Drizzle client.
4. `lib/db/schema.ts` defines the V1 tables.
5. Required enums are defined.
6. `users` maps app users to Clerk user IDs.
7. `usage_events` supports daily scan quota tracking.
8. `scans` supports V1 scan lifecycle statuses.
9. `scan_pages` supports one page now and many pages later.
10. `seo_findings` stores deterministic findings.
11. `report_sections` stores AI-generated report content.
12. `share_links` supports public read-only report URLs.
13. `pdf_exports` supports generated PDF metadata.
14. Indexes and unique constraints are defined for common access patterns.
15. Migration generation works.
16. Migration application works if `DATABASE_URL` is available.
17. Lint, typecheck, and build pass, or any environment-specific blocker is documented.

## Agent Notes

- Use Drizzle, not Prisma.
- Use Neon PostgreSQL as the target database.
- Keep schema names clear and product-specific.
- Do not implement feature logic in this task.
- Do not add scan creation API routes.
- Do not add usage enforcement yet.
- Do not add Clerk webhooks yet.
- Do not add Stripe logic yet.
- Do not seed fake scans or fake reports.
- Keep status and severity values aligned with `architecture-context.md` and `ui-context.md`.
- If schema changes are needed later, add migrations instead of editing generated migration history.
