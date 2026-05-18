# 05. App Shell Dashboard

## Purpose

This task builds the first real authenticated application surface for scōre.. It turns the protected `/app` route into a usable dashboard shell with navigation, account controls, user profile upsert, basic usage display placeholders, empty scan history states, and clear entry points for future scan creation and report history.

This task should make the app feel like a real SaaS product after login, but it must not implement scan creation, URL validation, SEO analysis, queues, report generation, PDF export, or billing.

## Required Context

Before starting this task, read these files:

1. `project-overview.md`
2. `architecture-context.md`
3. `ui-context.md`
4. `01-project-setup.md`
5. `02-ui-design-system.md`
6. `03-authentication.md`
7. `04-database-schema.md`

This task depends on:

- Clerk authentication being configured.
- App routes being protected.
- Drizzle schema and database client existing.
- Reusable UI components existing from the design system task.

## Goal

At the end of this task:

- `/app` is a polished authenticated dashboard.
- The app shell navigation is real and consistent.
- Authenticated users have a corresponding database user row.
- The dashboard can read basic user-owned scan records if any exist.
- Empty states are shown when no scans exist.
- The user sees their free-tier scan usage position in a presentational way.
- Future routes for new scans, reports, usage, and settings have placeholders or navigation targets.

This step creates the authenticated product foundation that later feature tasks will build on.

## Scope

### In Scope

- Improve or finalize authenticated app shell layout.
- Add authenticated navigation.
- Add account/user control in the app shell.
- Add database user upsert for authenticated Clerk users.
- Add dashboard page.
- Query basic user scan history from the database if tables exist.
- Show empty scan history state.
- Show static or database-derived scan usage summary without enforcing limits.
- Add placeholder pages for app navigation targets if needed.
- Add route-level loading and error states where useful.
- Ensure responsive behavior.

### Out Of Scope

- Creating scans.
- Enforcing the 5 scans/day free-tier limit.
- URL normalization.
- Domain verification.
- Queue setup.
- Worker setup.
- SEO extraction.
- Report generation.
- Report detail page.
- PDF export.
- Stripe billing.
- Plan upgrade flow.
- Real scheduled scans.
- Competitor comparison.

If a button points to a future route, it can link to a placeholder page. It should not fake feature behavior.

## Recommended Routes

Authenticated routes:

```text
app/
  app/
    layout.tsx
    page.tsx
    new-scan/
      page.tsx
    reports/
      page.tsx
    usage/
      page.tsx
    settings/
      page.tsx
```

Route responsibilities for this task:

- `/app` renders the dashboard.
- `/app/new-scan` may show a placeholder saying scan creation is coming in the next task.
- `/app/reports` may show a scan/report history placeholder or basic list.
- `/app/usage` may show current usage summary placeholder.
- `/app/settings` may show account settings placeholder.

Do not implement full feature behavior in placeholder routes.

## Part 1: Finalize App Shell

Use the design system app shell components from `02-ui-design-system.md`.

The authenticated app shell should include:

- Product name: `scōre.`
- Primary navigation
- Main content region
- User/account control
- Responsive mobile navigation

Recommended navigation items:

```text
Dashboard -> /app
New Scan -> /app/new-scan
Reports -> /app/reports
Usage -> /app/usage
Settings -> /app/settings
```

Recommended icons from `lucide-react`:

```text
Dashboard: LayoutDashboard
New Scan: Search
Reports: FileText
Usage: Gauge
Settings: Settings
```

Rules:

- Active route should be visibly highlighted using theme tokens.
- Navigation should work on mobile.
- Do not hardcode colors.
- Do not require database data to render the shell.
- User control should use Clerk `UserButton` or equivalent.

## Part 2: Database User Upsert

Create a small server-side helper to ensure the authenticated Clerk user has an app user row.

Recommended file:

```text
lib/auth/current-user.ts
```

or:

```text
lib/users/current-user.ts
```

Expected function:

```ts
export async function getOrCreateCurrentUser() {
  // 1. Read Clerk auth.
  // 2. Require authenticated user ID.
  // 3. Fetch Clerk user details if needed.
  // 4. Upsert into users table by clerkUserId.
  // 5. Return the database user row.
}
```

Required behavior:

- Uses Clerk server APIs.
- Uses Drizzle server-side database client.
- Looks up by `clerk_user_id`.
- Creates the user row if it does not exist.
- Updates email/name/image if available.
- Defaults the plan to `free`.

Do not create organizations.

Do not create Stripe customers.

Do not implement Clerk webhooks in this task.

## Part 3: Dashboard Data Query

Create a server-side dashboard data helper.

Recommended file:

```text
lib/dashboard/get-dashboard-data.ts
```

Expected responsibilities:

- Get or create the current database user.
- Fetch recent scans for that user.
- Count today's accepted scan usage events if `usage_events` exists.
- Return dashboard-safe data.

Recommended data shape:

```ts
type DashboardData = {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    planCode: "free" | "pro" | "agency";
  };
  usage: {
    usedToday: number;
    dailyLimit: number;
  };
  recentScans: Array<{
    id: string;
    inputUrl: string;
    finalUrl: string | null;
    status: string;
    overallScore: number | null;
    createdAt: Date;
    completedAt: Date | null;
    errorMessage: string | null;
  }>;
};
```

Important:

- Counting usage is allowed for display.
- Enforcing usage limits belongs to `06-usage-limits.md`.
- If plan records are not seeded yet, use a centralized fallback constant for free limit display.

## Part 4: Dashboard Page

Update:

```text
app/app/page.tsx
```

The dashboard should show:

- Page header.
- Welcome or product-relevant title.
- Free-tier usage summary.
- New scan call-to-action.
- Recent scans list/table.
- Empty state when no scans exist.
- Basic cards for report-related metrics.

Recommended layout:

```text
Dashboard Page
  PageHeader
    Title: Dashboard
    Description: Analyze URLs and review saved SEO reports.
    Action: New Scan button

  Usage + metric cards grid
    UsageMeter
    Completed scans
    Failed scans
    Average score

  Recent scans section
    Table or list
    Empty state if no scans
```

Rules:

- Do not create a working scan form here.
- The New Scan button should link to `/app/new-scan`.
- If no scans exist, show an empty state with a call-to-action.
- If scans exist, show status using `StatusBadge`.
- Scores should use `ScoreCard` or a compact equivalent.

## Part 5: Recent Scans Display

Create a reusable component if useful:

```text
components/dashboard/recent-scans.tsx
```

It should support:

- Empty state.
- Completed scans.
- Failed scans.
- In-progress scans.
- Long URL wrapping/truncation.
- Mobile-friendly layout.

Fields to show:

```text
URL
Status
Score
Created date
Action
```

Action behavior:

- Completed scan: link can point to future `/app/reports/[id]`.
- In-progress scan: link can point to future report/progress page.
- Failed scan: show error message if available.

If report detail routes do not exist yet, links may be disabled or point to `/app/reports` with clear placeholder behavior.

Do not create report detail pages in this task.

## Part 6: New Scan Placeholder Page

Create:

```text
app/app/new-scan/page.tsx
```

This page should:

- Use `PageHeader`.
- Explain that URL scanning will be added in the scan creation task.
- Show a disabled input or placeholder card if desired.
- Avoid implementing validation or submission.

Acceptable copy:

```text
URL scan creation will be added in the next workflow step.
```

This page exists so navigation is not broken.

## Part 7: Reports Placeholder Page

Create:

```text
app/app/reports/page.tsx
```

This page should:

- Show saved reports or scan history if the same query helper can be reused.
- Show empty state if no scans exist.
- Link back to `/app/new-scan`.

Do not build the full report page.

Do not implement filters unless they are simple presentational controls.

## Part 8: Usage Placeholder Page

Create:

```text
app/app/usage/page.tsx
```

This page should:

- Show current plan as `Free`.
- Show `usedToday` and daily limit if available.
- Mention that free users get 5 scans per day.
- Use `UsageMeter`.

Do not implement upgrade checkout.

Do not enforce limits here.

## Part 9: Settings Placeholder Page

Create:

```text
app/app/settings/page.tsx
```

This page should:

- Show account-related placeholder content.
- Include Clerk `UserProfile` link or embedded component only if easy and appropriate.
- Avoid custom profile persistence beyond the user upsert helper.

Do not build notification settings, team settings, or billing settings yet.

## Part 10: Loading And Error States

Add route-level loading and error states where useful.

Recommended:

```text
app/app/loading.tsx
app/app/error.tsx
```

Behavior:

- Loading uses `LoadingState` or skeletons.
- Error uses `ErrorState`.
- Error component must be a client component if it uses Next.js error reset behavior.

Do not leak internal error details to users.

## Part 11: Empty States

Empty states should be clear and actionable.

Dashboard no scans:

```text
No scans yet
Run your first SEO scan to start building report history.
```

Reports no scans:

```text
No reports yet
Completed scans will appear here as saved reports.
```

New Scan placeholder:

```text
Scan creation is not wired up yet
The next feature task will add URL validation and scan job creation.
```

## Part 12: Usage Display

The dashboard may display:

```text
0 of 5 scans used today
```

Rules:

- This task can calculate usage from `usage_events`.
- This task must not block scan creation because scan creation does not exist yet.
- Limit values should come from plan data if available or a centralized fallback constant.
- Do not hardcode `5` in multiple components.

Recommended file:

```text
lib/plans/constants.ts
```

Example:

```ts
export const FREE_DAILY_SCAN_LIMIT = 5;
```

Future task `06-usage-limits.md` will turn this into enforcement.

## Part 13: Access Control

All app pages must require authentication.

Access rules:

- `/app` and all nested app routes require Clerk auth.
- Dashboard data must only query records for the current user.
- No user should see another user's scans.
- Public shared report access is not part of this task.

Use server-side auth helpers from the authentication task.

## Part 14: UI Requirements

Follow `ui-context.md` and the design system.

Rules:

- Use `PageContainer`, `PageHeader`, `AppShell`, `StatusBadge`, `UsageMeter`, `MetricCard`, and empty/loading/error components where available.
- Use shadcn/ui tables, cards, buttons, badges, and separators.
- Use `lucide-react` icons for navigation and clear actions.
- Do not hardcode colors.
- Keep dashboard dense and useful.
- Do not create nested cards.
- Long URLs must not overflow.
- Mobile layout must remain usable.

## Part 15: Code Quality Requirements

Rules:

- Keep server data fetching in server components or server-only helpers.
- Do not import database client into client components.
- Add `"use client"` only where necessary.
- Keep dashboard components presentational when possible.
- Keep data transformation close to server helpers.
- Use TypeScript types inferred from Drizzle where appropriate.
- Avoid fake data except in clearly marked placeholders.

## Validation

Run:

```bash
npm run lint
npm run typecheck
npm run build
```

Run the dev server:

```bash
npm run dev
```

Manually verify:

- Signed-out users cannot access `/app`.
- Signed-in users can access `/app`.
- A database user row is created or updated for the signed-in user.
- Dashboard renders without scan records.
- Empty states render correctly.
- Navigation links work.
- `/app/new-scan` renders a placeholder.
- `/app/reports` renders a placeholder or empty report history.
- `/app/usage` renders free usage summary.
- `/app/settings` renders account placeholder.
- Long URLs do not break recent scan layout if test data exists.
- Mobile layout is usable.

If a real Neon database is unavailable, document that database-backed dashboard checks could not be run.

## Expected Final State

At the end of this task:

- The authenticated app has a polished shell.
- The dashboard is no longer a basic placeholder.
- User profile rows are created or updated from Clerk identity.
- Dashboard data is scoped to the current user.
- Recent scan display is ready for future scan records.
- Usage display is visible but not enforced.
- Navigation routes exist and do not dead-end.
- No scan creation or SEO analysis has been implemented.

## Acceptance Criteria

This task is complete when:

1. `/app` renders a real dashboard for signed-in users.
2. `/app` remains protected from signed-out users.
3. The app shell includes navigation and user/account controls.
4. Navigation includes Dashboard, New Scan, Reports, Usage, and Settings.
5. Authenticated user profile data is upserted into the database.
6. Dashboard queries only the current user's scan records.
7. Dashboard shows usage display for the free daily scan limit.
8. Dashboard shows recent scans or a clear empty state.
9. Placeholder pages exist for `/app/new-scan`, `/app/reports`, `/app/usage`, and `/app/settings`.
10. Loading and error states exist for the authenticated app area where appropriate.
11. UI follows the global theme and design system.
12. No scan creation, usage enforcement, URL validation, queue, worker, SEO, report detail, PDF, or billing logic is implemented.
13. Lint, typecheck, and build pass, or any environment-specific blocker is documented.

## Agent Notes

- This task should make the authenticated app feel real without building scan functionality yet.
- Do not duplicate layout markup across pages if app shell components exist.
- Do not hardcode user-specific data.
- Do not show fake reports as if they are real.
- It is acceptable to show empty states until scan creation exists.
- Keep free scan limit display centralized so the next task can enforce it.
- If the database schema is slightly different from the planning doc, adapt queries to the actual schema instead of rewriting unrelated schema.
- Do not add Clerk webhooks unless explicitly requested.
