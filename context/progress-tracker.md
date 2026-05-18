# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase
Usage limits

## Current Goal
Feature 06 usage limits implementation is complete; manual browser verification will be run by the user locally if needed.

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

## In Progress
- None.

## Next Up
- Implement the future scan creation workflow that calls `checkScanUsageLimit` before accepting a scan and `recordScanAcceptedUsage` after scan creation.

## Open Questions
- None for Feature 06.

## Architecture Decisions
- Keep the generated root-level `app/` directory and `@/*` import alias.
- Use Clerk for identity and route protection without adding database user syncing in Feature 03.
- Keep Feature 03 limited to authentication only; no database, scan, report, usage, billing, SEO, AI, queue, worker, or PDF logic.
- Use Drizzle ORM with the `postgres` client for the database foundation.
- Keep database user syncing out of Feature 04; `users` maps to Clerk IDs but is not populated automatically yet.
- Include `scan_events` in the initial schema for persisted scan lifecycle history and future progress/debug views.
- Count daily scan usage with UTC day boundaries.
- Prevent duplicate accepted-scan quota events with a unique `(event_type, scan_id)` usage event index.

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
