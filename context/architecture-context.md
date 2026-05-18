# Architecture Context

## Stack

| Layer            | Technology                             | Role                                                                                        |
| ---------------- | -------------------------------------- | ------------------------------------------------------------------------------------------- |
| Framework        | Next.js 16 + TypeScript                | Full-stack web app, protected dashboard, API routes, server actions, and report pages       |
| UI               | TailwindCSS + shadcn/ui                | Design system, dashboard UI, scan forms, report views, and reusable components              |
| Auth             | Clerk                                  | User identity, login/signup, protected routes, and user-scoped access                       |
| Database         | Neon PostgreSQL                        | Relational source of truth for users, scans, pages, findings, reports, usage, and plan data |
| ORM              | Prisma or Drizzle                      | Type-safe schema access, migrations, and relational queries                                 |
| Queue            | BullMQ + Redis                         | Asynchronous scan jobs, report generation jobs, PDF jobs, and retry handling                |
| Redis            | Upstash Redis or managed Redis         | Queue backend, job state coordination, and lightweight rate/usage helpers where useful      |
| Worker           | Node.js worker service                 | Long-running scan execution outside the Next.js request lifecycle                           |
| HTML fetching    | native fetch or undici                 | Safe page fetching, redirects, headers, timing, and response metadata                       |
| HTML parsing     | Cheerio                                | Server-side extraction of titles, metadata, headings, links, images, schema, and page text  |
| AI               | OpenAI or provider abstraction         | Human-readable report sections generated from deterministic findings                        |
| PDF              | Playwright or server-side PDF renderer | Export completed reports as polished PDF files                                              |
| Artifact storage | Cloudflare R2, S3, or equivalent       | PDF files, optional raw HTML snapshots, screenshots, and later crawl artifacts              |
| Payments         | Stripe                                 | Future paid plans, upgrade flows, and subscription state                                    |
| Deployment       | Vercel + separate worker host          | Vercel for the Next.js app; Railway, Render, Fly.io, ECS, or VPS for workers                |

## System Boundaries

- `app` — Next.js routes, layouts, authenticated pages, public pages, and report views.
- `app/api` — Request handlers for scan creation, scan status, reports, share links, PDF actions, billing hooks, and internal job callbacks where needed.
- `components` — UI composition for dashboard, scan form, report sections, score cards, tables, dialogs, and navigation.
- `lib/auth` — Clerk helpers, route guards, user lookup, and access checks.
- `lib/db` — Database client, schema access, and query helpers.
- `lib/plans` — Plan definitions, free-tier limits, feature gates, and usage policy helpers.
- `lib/usage` — Daily scan usage checks, usage event creation, and quota enforcement.
- `lib/url` — URL normalization, validation, SSRF protection, DNS checks, and redirect safety helpers.
- `lib/scans` — Scan creation, status transitions, scan ownership checks, and scan lifecycle helpers.
- `lib/seo` — SEO extraction, deterministic checks, scoring, and structured finding generation.
- `lib/ai` — AI provider abstraction, prompt builders, report generation schemas, and response validation.
- `lib/pdf` — PDF generation helpers and report rendering for export.
- `worker` — Background scan processor, queue consumers, fetcher execution, analyzer execution, AI report generation, and PDF generation.
- `prisma` or `drizzle` — Database schema, migrations, and generated query types.

The exact ORM can be finalized before implementation, but all agents must treat the database schema as the source of truth for scan state, findings, and reports.

## Runtime Model

scōre. must be built as an asynchronous job-based system.

The Next.js request layer should:

1. Authenticate the user.
2. Validate input.
3. Check usage limits.
4. Create database records.
5. Enqueue background jobs.
6. Return quickly to the client.

The worker layer should:

1. Pick up queued scan jobs.
2. Verify or re-verify the target safely.
3. Fetch the page.
4. Extract SEO data.
5. Run deterministic checks.
6. Calculate scores.
7. Generate AI report sections.
8. Generate PDF when requested or configured.
9. Persist results.
10. Mark the scan completed or failed.

Long-running scan work must not run inside normal page requests or API requests.

## Scan Lifecycle

Recommended scan statuses:

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

Each status transition should be persisted to the database. Failed scans should preserve an error code and user-safe message.

The normal V1 flow is:

```text
user submits URL
usage limit checked
input normalized and validated
scan row created
job enqueued
worker verifies reachability
worker fetches page
worker extracts SEO data
worker generates findings
worker calculates scores
worker generates AI report
worker optionally generates PDF
scan marked completed
report becomes viewable
```

## Storage Model

### Database

PostgreSQL stores relational and queryable data:

- Users or user profile records linked to Clerk identity
- Plan and subscription state
- Usage events
- Scan records
- Scan status and errors
- Input URL, normalized URL, and final URL
- Verification metadata
- Page metadata
- Extracted SEO data where useful for filtering or display
- Deterministic SEO findings
- SEO score values
- AI-generated report sections
- Share links
- PDF export records

### Object Storage

Object storage is used for large or file-like artifacts:

- Generated PDF reports
- Optional raw HTML snapshots
- Optional screenshots
- Future Lighthouse or trace files
- Future whole-site crawl artifacts

Recommended object paths:

```text
reports/{userId}/{scanId}/report.pdf
scans/{userId}/{scanId}/page.html
scans/{userId}/{scanId}/screenshots/{pageId}.png
```

Database records should store object keys or URLs as references. Large artifacts should not be stored directly in PostgreSQL unless they are small structured JSON fields intentionally used for querying or rendering.

## Database Model

V1 should include these core entities:

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

Optional V1 or early V2 entities:

```text
projects
domains
competitor_reports
scheduled_scans
scan_events
```

Entity responsibilities:

- `users` stores app-level user profile data mapped to Clerk user IDs.
- `plans` defines feature and usage limits.
- `subscriptions` stores Stripe subscription state when billing is enabled.
- `usage_events` records accepted scan usage for quota enforcement.
- `scans` stores one submitted scan request and its lifecycle.
- `scan_pages` stores the analyzed page for V1 and will support multiple pages in future crawl scans.
- `seo_findings` stores deterministic issues and recommendations.
- `report_sections` stores AI-generated report content.
- `share_links` stores public report access tokens and enabled/disabled state.
- `pdf_exports` stores PDF generation status and artifact location.

## Auth And Access Model

- Users must be authenticated before creating scans.
- Each scan belongs to exactly one user in V1.
- Users can only view and mutate their own private scans and reports.
- Public share links expose read-only report data without exposing private account data.
- API handlers must enforce ownership before returning scan, report, share, or PDF data.
- Worker jobs must verify that referenced scan records exist before updating them.
- Future organization and team access should be added without breaking user-owned scans.

Recommended access model for V1:

```text
private report access = scan.userId matches authenticated user
public report access = active share link token maps to completed scan
scan creation = authenticated user and usage limit available
pdf export = authenticated owner, or future paid feature gate
```

## Usage And Plan Model

V1 free tier:

```text
5 accepted URL scans per day
homepage and single URL scans only
saved reports
shareable reports
PDF export enabled or limited
```

Usage enforcement should happen before scan creation. Failed validation should not consume usage. Once a scan is accepted and queued, usage should be recorded as a `scan_accepted` usage event. Daily usage resets on UTC day boundaries in V1.

Accepted scan usage events are idempotent per scan through a unique `(event_type, scan_id)` database index, so retrying accepted-scan usage recording for the same scan does not double-count quota.

Plan checks should use centralized helpers. Agents should not hardcode plan limits in UI components or API handlers.

Future paid feature gates:

- Whole-site crawl
- Higher scan limits
- Competitor comparison
- Scheduled scans
- Historical tracking
- JavaScript rendering
- White-label PDF reports
- Priority queue

## URL Safety Model

User-submitted URLs are untrusted input.

The application must reject:

- Unsupported protocols such as `file:`, `ftp:`, `data:`, and `mailto:`
- `localhost`
- Loopback addresses
- Private IPv4 ranges
- Private IPv6 ranges
- Link-local addresses
- Internal hostnames
- Cloud metadata service addresses
- Redirect chains that end at private or unsafe addresses
- Excessive redirect chains
- Responses that exceed configured size limits
- Requests that exceed timeout limits

The URL safety layer belongs in shared server-side utilities and must be used by both request handlers and workers.

## SEO Analysis Model

scōre. separates SEO analysis into three layers:

### 1. Extraction

The extraction layer reads HTML and response metadata and produces structured page facts.

Examples:

- Title text
- Meta description
- Heading list
- Canonical URL
- Robots directives
- Image list
- Link list
- Word count
- Structured data blocks
- Open Graph tags

### 2. Deterministic Checks

The checks layer evaluates extracted facts and creates findings.

Examples:

- Missing title
- Title too long
- Missing meta description
- Missing H1
- Multiple H1 tags
- Page is noindex
- Missing canonical
- Images missing alt text
- Missing viewport tag

### 3. AI Report Writing

The AI layer receives structured scan facts, scores, and findings. It writes explanations, summaries, suggested metadata, and prioritized action plans.

The AI layer must not invent unsupported technical findings. If the deterministic layer did not detect an issue, AI should not present it as a fact.

## Report Model

A completed report is assembled from:

- Scan metadata
- Page metadata
- Scores
- Deterministic findings
- AI-generated sections
- PDF export state
- Share link state

Recommended report sections:

- Executive summary
- Overall score
- Category scores
- Top priority fixes
- Technical SEO
- On-page SEO
- Content SEO
- Metadata
- Indexability
- Basic performance
- Suggested title tags
- Suggested meta descriptions
- Developer checklist
- Business owner explanation

Report pages should render from persisted data. Opening a completed report should not rerun AI generation or page analysis.

## PDF Model

PDF generation should use completed report data.

PDF generation must not:

- Rerun the scan
- Refetch the target URL
- Regenerate AI content unless explicitly requested

PDF files should be stored in object storage and referenced from `pdf_exports`.

PDF generation may be triggered:

- Automatically after report completion
- Lazily when the user clicks export
- Through a background job if generation is slow

The chosen implementation should avoid fragile browser-only print behavior for production exports.

## AI Model

AI integration should be isolated behind a provider abstraction.

The app should avoid scattering provider-specific API calls across route handlers, UI components, or SEO logic.

AI prompts should be built from structured input:

- URL
- Final URL
- Page facts
- Scores
- Findings
- Severity counts
- Extracted page text summary when available
- Heading structure

AI outputs should be validated into predictable report section shapes before persistence.

If AI generation fails, the scan should still preserve deterministic findings and show a useful partial report or retryable failure state.

## Worker And Queue Model

The queue owns background work. The worker owns execution.

Recommended V1 job types:

```text
scan.run
report.generate
pdf.generate
```

These may start as one combined `scan.run` job, but the code should not make it difficult to split them later.

Workers should:

- Be idempotent where practical
- Persist status transitions
- Record recoverable errors
- Respect retry limits
- Avoid duplicate final writes
- Avoid analyzing unsafe URLs even if a bad job is enqueued

Queue jobs should include IDs, not large payloads. Workers should load canonical data from PostgreSQL.

## Error Model

Common scan failures should have stable error codes and user-safe messages.

Examples:

```text
INVALID_URL
UNSAFE_URL
DNS_FAILED
CONNECTION_TIMEOUT
TOO_MANY_REDIRECTS
UNSAFE_REDIRECT
NON_HTML_RESPONSE
RESPONSE_TOO_LARGE
FETCH_BLOCKED
ANALYSIS_FAILED
AI_GENERATION_FAILED
PDF_GENERATION_FAILED
```

Error details useful for debugging may be stored internally, but user-facing messages should be clear and non-alarming.

## Deployment Model

Recommended V1 deployment:

- Next.js app on Vercel
- Neon PostgreSQL for database
- Upstash Redis or managed Redis for queues
- Worker service on Railway, Render, Fly.io, ECS, or VPS
- Cloudflare R2 or S3-compatible storage for PDFs and future artifacts
- Stripe for future billing

The worker must not depend on Vercel serverless execution. It should run as a persistent or long-running process capable of handling queue jobs.

## Invariants

1. Authenticated users are required for scan creation.
2. Free users are limited to 5 accepted URL scans per day.
3. Request handlers do not perform long-running scan work.
4. All scan execution belongs in background jobs.
5. User-submitted URLs are treated as hostile input until validated.
6. SSRF protections are mandatory before any network request to a user-submitted target.
7. Redirect safety must be checked, not assumed.
8. Deterministic code produces SEO facts and numeric scores.
9. AI explains and prioritizes findings; AI does not invent the technical source of truth.
10. Completed reports render from persisted data.
11. PDF export uses saved report data and does not rerun scans.
12. Private reports require ownership checks.
13. Public reports require active share tokens and expose read-only report data.
14. Plan limits and feature gates belong in centralized helpers.
15. Large artifacts belong in object storage, not relational tables.
16. Queue jobs should carry record IDs, not full page HTML or large payloads.
17. The V1 single-page scan model must be compatible with future multi-page crawl scans.
18. Agents must keep feature work scoped and avoid bundling unrelated capabilities into one implementation step.
