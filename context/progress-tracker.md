# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase
Feature 13 SEO extraction complete

## Current Goal
SEO extraction is complete; worker-fetched HTML is parsed into objective page facts, persisted on `scan_pages`, and stopped at the explicit SEO checks boundary.

## Completed
- Read root agent instructions and required context files.
- Confirmed the repository already contains a generated Next.js 16 App Router application.
- Initialized shadcn/ui with the current CLI and added `Button`, `Input`, `Card`, `Badge`, and `Separator`.
- Installed the tweakcn Vercel theme tokens globally in `app/globals.css`.
- Configured Geist fonts, baseline metadata, a setup-only home page, `.env.example`, and TypeScript check script.
- `npm run lint`, `npm run typecheck`, and `npm run build` pass.
- Read `context/feature/02-ui-design-system.md` and local Next.js 16 App Router docs for pages, layouts, navigation, and server/client component boundaries.
- Added the remaining feature 02 shadcn/ui primitives: `Skeleton`, `Alert`, `Progress`, `Tabs`, `Table`, `DropdownMenu`, `Tooltip`, `Sheet`, `Dialog`, `Textarea`, `Select`, and `Accordion`.
- Added reusable app/public layout primitives, navigation foundations, shared empty/error/loading states, scan status and finding severity badges, score/metric/usage displays, and report presentation components with static typed props.
- Added a temporary static `/ui-preview` route for visual verification of buttons, inputs, cards, badges, status/severity displays, scores, usage, states, report sections, long URL wrapping, and dark-mode token compatibility.
- `npm run lint`, `npm run typecheck`, `npm run build`, and `git diff --check` pass.
- Fixed `/ui-preview` hydration mismatch by making `AppTopbar` an explicit client component around the Radix Sheet mobile navigation.
- Fixed desktop sidebar scrolling by making `AppSidebar` sticky to the viewport with an internal overflow area.
- Re-ran `npm run lint`, `npm run typecheck`, `npm run build`, and `git diff --check`; all pass.
- Started Feature 03 authentication setup.
- Installed `@clerk/nextjs`.
- Added Clerk environment placeholders for sign-in/sign-up URLs and fallback redirects.
- Wrapped the root layout with `ClerkProvider` while preserving Geist fonts, theme classes, and tooltip provider.
- Added `proxy.ts` route protection for `/app` and future `/app/*` routes.
- Added Clerk sign-in and sign-up catch-all routes.
- Added a Clerk-backed server auth helper at `lib/auth/require-user.ts`.
- Added a protected `/app` layout and dashboard placeholder with a Clerk `UserButton`.
- Updated public navigation to show sign-in/sign-up actions for signed-out users and dashboard/account actions for signed-in users.
- Moved authenticated navigation links into the `/app` route namespace.
- Re-ran `npm run lint`, `npm run typecheck`, `npm run build`, and `git diff --check`; all pass.
- Started Feature 04 database schema setup.
- Installed `drizzle-orm`, `postgres`, `drizzle-kit`, and explicit `@next/env` support for ORM config environment loading.
- Added Drizzle configuration, server-only database client helper, schema exports, inferred database types, and database package scripts.
- Defined V1 database enums and tables for users, plans, subscriptions, usage events, scans, scan pages, SEO findings, report sections, share links, PDF exports, and scan events.
- Generated the initial Drizzle migration in `drizzle/`.
- Applied the generated migration to the configured database.
- Ran `npm run db:generate`, `npm run db:migrate`, `npm run lint`, `npm run typecheck`, `npm run build`, and `git diff --check`; all pass.
- Started Feature 05 app shell dashboard.
- Added route-aware authenticated navigation highlighting for desktop and mobile app navigation.
- Added lazy Clerk-to-database user upsert helper for the `users` table.
- Added centralized free daily scan limit constants for display.
- Added dashboard data helper that upserts the current user, reads user-scoped recent scans, and counts today's accepted scan usage events.
- Replaced the `/app` placeholder with a real dashboard showing free usage, recent scan metrics, and user-owned recent scan history or an empty state.
- Added reusable recent scans display with empty, completed, failed, in-progress, long-URL, desktop table, and mobile stacked-list states.
- Added authenticated placeholder routes for `/app/new-scan`, `/app/reports`, `/app/usage`, and `/app/settings`.
- Added route-level loading and error states for the authenticated app area.
- Ran `npm run lint`, `npm run typecheck`, `npm run build`, and `git diff --check`; all pass.
- Started Feature 06 usage limits.
- Added centralized plan limit definitions for free, pro, and agency plans with the free daily scan limit defined once.
- Added UTC daily boundary helpers, usage summary calculation, scan quota checking, and accepted-scan usage recording helpers.
- Added idempotent accepted-scan usage protection with a unique `(event_type, scan_id)` index and generated/applied the Drizzle migration.
- Updated dashboard, usage, and new scan placeholder surfaces to display real usage summary, remaining scans, unlimited-plan state, and daily-limit-reached messaging.
- Added Vitest and focused usage-limit tests for free quota states, unlimited paid plans, non-negative remaining scans, and UTC day boundaries.
- Ran `npm run db:generate`, `npm run db:migrate`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, and `git diff --check`; all pass.
- Started Feature 07 URL normalization and security.
- Added structured URL safety types, centralized safe error messages, URL normalization, IP range safety checks, DNS resolution helpers, full URL safety validation, redirect target validation, and public `lib/url` exports.
- Added focused Vitest coverage for accepted/rejected normalization, unsafe IP ranges, blocked hostnames, direct IP rejection, mocked DNS resolution safety, and redirect target validation.
- Hardened IPv4-mapped IPv6 handling for both dotted and hex mapped representations.
- Ran `npm run test`, `npm run lint`, `npm run typecheck`, `npm run build`, and `git diff --check`; all pass.
- Started Feature 08 domain verification.
- Added reusable verification types, safe user-facing verification messages, centralized verification config, manual-redirect HTTP request helper, and public `verifyTarget` service.
- `verifyTarget` now runs `validateUrlSafety` before the first request, follows redirects manually, validates every redirect target with `validateRedirectUrl`, records redirect chains, validates final status/content type/content length, and returns structured success/failure metadata.
- Added focused mocked verification tests for successful HTTPS/HTTP/bare-domain verification, URL safety failures, DNS failures, safe redirects, redirect limits, unsafe redirects, missing redirect locations, blocked/error statuses, non-HTML content, missing content type, oversized content length, timeout, network, SSL errors, and manual fetch redirect behavior.
- Ran `npm run test`, `npm run lint`, `npm run typecheck`, `npm run build`, and `git diff --check`; all pass.
- Started Feature 09 scan creation API.
- Added `zod` for server-side scan creation request validation.
- Added scan creation types, centralized scan errors, authenticated scan creation service, and `POST /api/scans`.
- Scan creation now checks usage before verification, verifies targets through `verifyTarget`, re-checks usage inside the database transaction, creates queued scan rows, and records `scan_accepted` usage events atomically.
- Re-exported the verification message helper for scan creation error mapping.
- Replaced the New Scan placeholder with a working client form that calls `/api/scans`, handles validation/verification/quota errors, disables submission when the daily limit is reached, and redirects accepted scans to `/app/scans/[scanId]`.
- Added an ownership-checked scan status placeholder route and panel for accepted queued scans.
- Updated recent scan actions to link to scan status pages.
- Added focused scan creation service tests for unsupported scan types, quota blocking, verification failures, transactional scan/usage creation, and the in-transaction usage re-check.
- Added Vitest `@/*` alias configuration for tests that import application modules.
- Ran `npm run test`, `npm run lint`, `npm run typecheck`, `npm run build`, and `git diff --check`; all pass.
- Completed the select UI tweak from `context/tweaks/select-ui.md` by ensuring every local `@/components/ui/select` usage sets `SelectContent position="popper"` and wraps options in `SelectGroup`.
- Started Feature 10 queue setup.
- Installed `bullmq` and `ioredis`.
- Added server-only queue configuration, Redis connection helper, centralized queue/job names, scan queue singleton, enqueue helper, queue health helper, and public queue exports.
- Updated scan creation to enqueue accepted scans after the database transaction commits, using deterministic `scan.run-{scanId}` job IDs and `{ scanId }` payloads only.
- Added `QUEUE_ENQUEUE_FAILED` handling that marks the created scan as failed with a user-safe message when enqueueing fails.
- Updated the scan status placeholder to show persisted failed-scan messages.
- Added focused tests for scan enqueue helper behavior and scan creation enqueue/failure paths.
- Ran `npm run test`, `npm run lint`, `npm run typecheck`, `npm run build`, and `git diff --check`; all pass.
- Started Feature 11 worker setup.
- Installed `tsx` for standalone worker execution.
- Added worker scripts for `npm run worker` and `npm run worker:dev` using Node's `react-server` condition so existing server-only modules can be imported outside the Next.js runtime.
- Added scan status helpers that update scan timestamps, clear active-status errors, mark completed/failed timestamps, and record scan lifecycle events.
- Added worker-specific scan error codes and user-safe processing messages.
- Added the worker configuration, scan worker factory, `scan.run` handler, lifecycle shutdown helper, and worker entrypoint.
- `scan.run` jobs now validate payloads, load scans by ID, no-op completed and failed scans, transition queued scans through `validating` and `fetching`, and mark scans failed with `PROCESSING_NOT_IMPLEMENTED` instead of faking reports.
- Added README local development instructions for running the worker separately with `DATABASE_URL` and `REDIS_URL`.
- Added focused worker handler tests for invalid payloads, missing scans, completed/failed no-ops, queued scan transitions, retry recovery from `validating`, and unexpected error failure marking.
- Ran `npm run test -- worker/__tests__/run-scan.test.ts`, `npm run typecheck`, `npm run test`, `npm run lint`, `npm run build`, and `git diff --check`; all pass.
- Fixed the worker entrypoint after local `npm run worker:dev` exposed a `tsx` CommonJS transform limitation with top-level `await`; the entrypoint now uses an async `main()` startup path.
- Re-ran `npm run test -- worker/__tests__/run-scan.test.ts` and `npm run typecheck`; both pass.
- Fixed worker startup after local execution exposed that `node --conditions react-server` breaks normal React/Next imports; worker scripts now use a small Node preload hook to stub only `server-only`, and the scan handler imports worker-safe scan modules directly instead of the scans barrel.
- Re-ran `npm run test -- worker/__tests__/run-scan.test.ts`, `npm run typecheck`, `npm run lint`, `npm run build`, and `git diff --check`; all pass.
- Started Feature 12 page fetcher.
- Read `context/feature/12-page-fetcher.md` and its dependency specs for database schema, URL safety, domain verification, scan creation, queue setup, and worker setup.
- Added the `lib/fetcher` boundary with centralized config, typed fetch success/failure results, user-safe fetch messages, bounded response body streaming, charset-aware HTML decoding, manual redirect handling, URL safety re-checks, timeout handling, status/content-type validation, and response size enforcement.
- Added focused mocked fetcher tests for safe normalization, manual redirects, unsafe URL rejection, unsafe redirect rejection, non-HTML rejection, blocked status mapping, oversized response rejection, timeout mapping, and bounded body reads.
- Integrated the worker with `fetchPageHtml`; active queued/validating/fetching scans now transition through `fetching`, persist successful fetch metadata into `scan_pages`, transition to `analyzing`, and stop with `SEO_EXTRACTION_NOT_IMPLEMENTED`.
- Fetch failures now mark scans failed with the fetcher's stable error code and user-safe message.
- Updated worker tests for fetch success persistence, fetch failure handling, and the new SEO extraction boundary.
- Ran `npm run test -- lib/fetcher/__tests__/read-response-body.test.ts lib/fetcher/__tests__/fetch-page-html.test.ts worker/__tests__/run-scan.test.ts`, `npm run typecheck`, `npm run test`, `npm run lint`, `git diff --check`, and `npm run build`; all pass after rerunning build with approved network access for Next font fetching.
- Installed `cheerio` for deterministic server-side HTML parsing.
- Added `lib/seo/extraction` with typed extraction of title, meta description, robots, canonical URL, language, charset, viewport, headings, internal/external links, images and alt presence, Open Graph metadata, Twitter card metadata, JSON-LD structured data, schema types, word count, and bounded text samples.
- Added bounded extraction persistence for `scan_pages` SEO columns and diagnostic `technical_data` without storing raw HTML.
- Integrated the worker after page fetch: fetched HTML is extracted, facts are persisted to the same scan page row when available, and successful extraction now stops at `SEO_CHECKS_NOT_IMPLEMENTED`.
- Added focused tests for extraction metadata/headings/images/text, link classification, structured data parsing, and worker extraction integration/failure handling.
- Ran `npm run lint`, `npm run typecheck`, `npm run test`, `git diff --check`, and `npm run build`; all pass after rerunning build with approved network access for Next font fetching.

## In Progress
- None.

## Next Up
- Implement deterministic SEO checks in the next feature unit.

## Open Questions
- None for Feature 13.

## Architecture Decisions
- Keep the generated root-level `app/` directory and `@/*` import alias.
- Use Clerk for identity and route protection without adding database user syncing in Feature 03.
- Keep Feature 03 limited to authentication only; no database, scan, report, usage, billing, SEO, AI, queue, worker, or PDF logic.
- Use Drizzle ORM with the `postgres` client for the database foundation.
- Keep database user syncing out of Feature 04; `users` maps to Clerk IDs but is not populated automatically yet.
- Include `scan_events` in the initial schema for persisted scan lifecycle history and future progress/debug views.
- Count daily scan usage with UTC day boundaries.
- Prevent duplicate accepted-scan quota events with a unique `(event_type, scan_id)` usage event index.
- Reject direct IP URL targets for V1, including public IPs, because scōre. is domain/URL-oriented and direct IP scans add SSRF and SEO edge cases.
- Require future scan creation, domain verification, and worker fetch code to call `validateUrlSafety` before fetching and `validateRedirectUrl` before following redirects.
- Keep domain verification separate from scan creation and page fetching: `verifyTarget` performs reachability preflight only and does not create scans, consume usage, enqueue jobs, parse HTML, or generate reports.
- Verification accepts 2xx HTML/XHTML responses, rejects non-2xx final statuses for V1 analysis, maps blocked statuses such as 403/429 to `FETCH_BLOCKED`, and rejects missing/non-HTML content types.
- Keep Feature 09 scan acceptance queue-free: accepted scans remain in `queued` status until Feature 10 adds real queue integration.
- Use BullMQ with Redis for background job coordination, keep queue modules server-only, create Redis/queue connections lazily, keep BullMQ queue names and custom job IDs free of `:`, and keep V1 scan jobs limited to `{ scanId }` payloads.
- Enqueue accepted scans only after the scan/usage transaction commits; if enqueueing fails, mark the scan `failed` with `QUEUE_ENQUEUE_FAILED` while leaving accepted usage intact.
- Run the worker as a separate Node process, not inside Next.js; worker scripts use `node --require ./worker/register-server-only.cjs --import tsx` so `server-only` markers are stubbed for local worker execution without changing React export conditions.
- Keep Feature 11's processing boundary explicit by marking picked-up scans `failed` with `PROCESSING_NOT_IMPLEMENTED`; later fetcher/analyzer tasks must replace this rather than fabricating completed report data.
- Keep page fetching separate from verification: verification remains a reachability preflight, while `lib/fetcher` retrieves bounded HTML and returns metadata for worker processing.
- Page fetches use a larger 5 MB body limit than verification, manual redirect following, and per-request URL safety validation before every network request.
- Do not store raw HTML in PostgreSQL for Feature 12; persist fetch metadata in `scan_pages.technical_data` and keep HTML in memory for the future SEO extraction step.
- Replace Feature 11's temporary `PROCESSING_NOT_IMPLEMENTED` worker boundary with `SEO_EXTRACTION_NOT_IMPLEMENTED` after successful page fetch persistence.
- Keep SEO extraction factual only: extraction persists objective page facts and bounded diagnostic arrays, while findings, scoring, AI report generation, report UI, and PDF export remain out of scope.
- Replace Feature 12's temporary `SEO_EXTRACTION_NOT_IMPLEMENTED` worker boundary with `SEO_CHECKS_NOT_IMPLEMENTED` after successful extraction persistence.

## Session Notes
- Next.js local docs reviewed for `next/font` and metadata usage before editing framework files.
- Initial sandboxed `npm run build` failed while fetching `next/font` Google assets; rerunning build with approved network access passed.
- Dev server start was not performed because the user said it is already running. Sandbox `curl` could not connect to `localhost:3000`.
- Feature 02 must remain UI-only: no Clerk, database, scan API, queue, worker, AI, PDF, Stripe, or real scan state.
- Sandboxed `npm run build` failed on Google Fonts network access; rerunning with approved network access passed.
- Sandboxed `npm run dev` could not bind to port 3000. The user will start the dev server locally.
- Feature 03 sandboxed `npm run build` failed on Google Fonts network access; rerunning with approved network access passed.
- Feature 03 sandboxed `npm run dev` could not bind to port 3000. The user said they will run the dev server locally.
- Feature 04 used local Next.js 16 docs for environment variables, server/client boundaries, and server-only data access before adding database modules.
- Feature 04 sandboxed package install failed on registry DNS; rerunning with approved network access installed the required Drizzle packages.
- Feature 04 sandboxed `npm run build` failed on Google Fonts network access; rerunning with approved network access passed.
- Feature 05 sandboxed `npm run build` failed on Google Fonts network access; rerunning with approved network access passed.
- Feature 05 sandboxed `npm run dev` failed with `listen EPERM` on port 3000. Elevated dev-server start was not approved, so browser/runtime verification remains pending.
- Feature 06 sandboxed `npm install -D vitest` failed on registry DNS; rerunning with approved network access installed the test runner.
- Feature 06 sandboxed `npm run db:migrate` did not complete database access; rerunning with approved database access applied the migration.
- Feature 06 sandboxed `npm run build` failed on Google Fonts network access; rerunning with approved network access passed.
- Feature 06 sandboxed `npm run dev` failed with `listen EPERM` on port 3000. Elevated dev-server start was not approved, so browser/runtime verification remains pending.
- Feature 07 sandboxed `npm run build` failed on Google Fonts network access; rerunning with approved network access passed.
- Feature 08 uses mocked HTTP requests and mocked DNS resolution in tests; no live external websites are required.
- Feature 08 sandboxed `npm run build` failed on Google Fonts network access; rerunning with approved network access passed.
- Feature 09 sandboxed `npm install zod` failed on registry DNS; rerunning with approved network access completed successfully.
- Feature 09 sandboxed `npm run build` failed on Google Fonts network access; rerunning with approved network access passed.
- Feature 09 sandboxed `npm run dev` failed with `listen EPERM` on port 3000. Elevated dev-server start was not approved, so browser/runtime verification remains pending.
- Scan creation API issue follow-up: Clerk proxy matcher now includes `/api/scans` so `auth()` in `app/api/scans/route.ts` has Clerk middleware context. The route still returns its own JSON `401` for unauthenticated API requests because `auth.protect()` remains limited to `/app`.
- Select UI tweak: all local `@/components/ui/select` usages now render `SelectContent` with `position="popper"` and wrap `SelectItem` entries in `SelectGroup`; functionality and flow behavior were left unchanged.
- Feature 10 sandboxed `npm install bullmq ioredis` stalled and then failed with registry DNS resolution; rerunning with approved network access completed successfully.
- Feature 10 sandboxed `npm run build` failed on Google Fonts network access; rerunning with approved network access passed.
- Live Redis enqueue verification was not run because no Redis service was started or requested in this task.
- Queue setup issue follow-up: BullMQ rejected `:` in queue names and custom job IDs, so queue name uses `score-scans` and scan job IDs now use `scan.run-{scanId}`.
- Feature 11 sandboxed `npm install -D tsx` failed on registry DNS; rerunning with approved network access completed successfully.
- Feature 11 sandboxed `npm run build` failed on Google Fonts network access; rerunning with approved network access passed.
- Live worker execution with Redis was not run because no Redis service was started or requested in this task.
- Worker dev follow-up: local `npm run worker:dev` initially failed because `tsx` transformed top-level `await` as CommonJS; switching to an async `main()` startup fixed that class of startup error.
- Worker dev follow-up: local `npm run worker:dev` then failed because `node --conditions react-server` changed React's export condition and broke Next internals. The worker script now uses a preload hook for `server-only` instead of the global `react-server` condition.
- Feature 11 follow-up sandboxed `npm run build` failed on Google Fonts network access; rerunning with approved network access passed.
- Feature 12 uses mocked fetch responses and mocked DNS resolution in tests; no live external websites are required.
- Feature 12 sandboxed `npm run build` failed on Google Fonts network access; rerunning with approved network access passed.
- Started Feature 13 SEO extraction.
- Read `context/feature/13-seo-extraction.md` and its required dependency specs for database schema, worker setup, and page fetching.
- Feature 13 sandboxed `npm install cheerio` failed on registry DNS; rerunning with approved network access completed successfully.
- Feature 13 sandboxed `npm run build` failed on Google Fonts network access; rerunning with approved network access passed.
