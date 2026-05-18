# 06. Usage Limits

## Purpose

This task implements scōre.'s Version 1 usage limit system. Free users are allowed 5 accepted URL scans per day. The app must be able to check whether an authenticated user can start a scan, record accepted scan usage, and expose usage state to the UI.

This task creates the quota enforcement layer that future scan creation will call. It should not implement URL normalization, domain verification, scan jobs, workers, SEO analysis, reports, PDF generation, or billing checkout.

## Required Context

Before starting this task, read these files:

1. `project-overview.md`
2. `architecture-context.md`
3. `ui-context.md`
4. `03-authentication.md`
5. `04-database-schema.md`
6. `05-app-shell-dashboard.md`

This task depends on:

- Clerk authentication.
- Database user upsert.
- Drizzle schema.
- `users`, `plans`, `subscriptions`, `usage_events`, and `scans` tables or their equivalents.
- Dashboard usage display from the previous task.

## Goal

At the end of this task:

- Usage limits are defined in one central place.
- Free users are limited to 5 accepted scan attempts per day.
- The app can check whether a user may start a scan.
- The app can record an accepted scan usage event.
- Usage state can be displayed in the dashboard and new scan page.
- Limit-reached states are handled cleanly.
- The enforcement code is ready for the future scan creation API.

No actual scan creation should be implemented in this task unless a minimal internal test harness is needed.

## Core Rule

Version 1 free tier:

```text
5 accepted URL scans per day
```

Important definition:

```text
Accepted scan = a scan request that passes initial authenticated request checks and is accepted into the scan system.
```

Failed URL validation should not consume usage.

Unsafe URL rejection should not consume usage.

Once a future scan is accepted and queued, usage should be recorded even if the scan later fails due to timeout, blocked fetch, non-HTML response, or analysis error.

## Scope

### In Scope

- Centralized plan limit definitions.
- Centralized usage query helpers.
- Daily usage counting.
- Quota check service.
- Accepted scan usage recording.
- Usage summary data shape for UI.
- Limit-reached UI state support.
- Tests for usage calculations and limit checks.
- Dashboard and placeholder new-scan page integration for display-only state.

### Out Of Scope

- URL validation.
- Domain verification.
- Scan creation API.
- Queue job creation.
- Worker execution.
- SEO analysis.
- Report generation.
- Stripe checkout.
- Stripe webhooks.
- Subscription syncing.
- Organization/team usage limits.
- Monthly billing usage.
- Paid plan enforcement beyond basic structure.

Future scan creation must call the helpers from this task.

## Recommended Files

Create or update:

```text
lib/plans/constants.ts
lib/plans/types.ts
lib/plans/get-plan-limits.ts
lib/usage/get-usage-summary.ts
lib/usage/check-usage-limit.ts
lib/usage/record-usage-event.ts
lib/usage/types.ts
```

Optional tests:

```text
lib/usage/__tests__/usage-limits.test.ts
```

If the project uses a different test structure, follow the existing convention.

## Part 1: Define Plan Limits

Create central plan definitions.

Recommended file:

```text
lib/plans/constants.ts
```

Recommended values:

```ts
export const FREE_DAILY_SCAN_LIMIT = 5;

export const PLAN_LIMITS = {
  free: {
    dailyScanLimit: 5,
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
} as const;
```

Rules:

- Do not hardcode the number `5` across the app.
- If plan records exist in the database, the app may read limits from the database.
- Still keep a safe fallback constant for the free plan.
- Paid plans can be present as inactive future values.

## Part 2: Define Usage Types

Create:

```text
lib/usage/types.ts
```

Recommended types:

```ts
export type UsageSummary = {
  usedToday: number;
  dailyLimit: number | null;
  remainingToday: number | null;
  isLimited: boolean;
  isLimitReached: boolean;
  resetAt: Date;
  planCode: "free" | "pro" | "agency";
};

export type UsageCheckResult =
  | {
      allowed: true;
      summary: UsageSummary;
    }
  | {
      allowed: false;
      reason: "DAILY_SCAN_LIMIT_REACHED";
      summary: UsageSummary;
      message: string;
    };
```

Use actual enum/type names from the Drizzle schema if they already exist.

## Part 3: Date Boundary Rules

Define how “per day” is counted.

Recommended V1 rule:

```text
Usage resets daily based on UTC day boundaries.
```

Why UTC:

- Easier to implement consistently.
- Avoids user timezone complexity before user settings exist.
- Works reliably for server-side enforcement.

Alternative:

```text
Usage resets based on the user's configured timezone.
```

Do not implement timezone-based resets unless the product already stores user timezone.

Create helper:

```text
lib/usage/day-boundary.ts
```

Recommended functions:

```ts
export function getUtcDayRange(now = new Date()) {
  // returns { start: Date, end: Date }
}

export function getNextUtcReset(now = new Date()) {
  // returns next UTC midnight Date
}
```

All usage counting should use this helper.

## Part 4: Get Usage Summary

Create:

```text
lib/usage/get-usage-summary.ts
```

Expected function:

```ts
export async function getUsageSummary(userId: string): Promise<UsageSummary> {
  // 1. Load user plan.
  // 2. Resolve plan limits.
  // 3. Count today's scan_accepted usage events.
  // 4. Return used, limit, remaining, reset time, and limit state.
}
```

Expected counting:

```text
usage_events.event_type = 'scan_accepted'
usage_events.user_id = current database user id
usage_events.created_at >= start of UTC day
usage_events.created_at < end of UTC day
```

Rules:

- Count usage events, not completed scans.
- Count only accepted scan events.
- Do not count failed validation attempts.
- Do not count PDF exports as scan usage.
- Do not count share link creation as scan usage.

## Part 5: Check Usage Limit

Create:

```text
lib/usage/check-usage-limit.ts
```

Expected function:

```ts
export async function checkScanUsageLimit(
  userId: string,
): Promise<UsageCheckResult> {
  // 1. Get usage summary.
  // 2. If plan has no daily limit, allow.
  // 3. If usedToday < dailyLimit, allow.
  // 4. Otherwise block.
}
```

Limit-reached message:

```text
You've used all 5 free scans for today. Your limit resets at midnight UTC.
```

Rules:

- Return structured result instead of throwing for normal limit reached.
- Throw only for unexpected system errors.
- Keep this function independent of URL validation and scan creation.

## Part 6: Record Accepted Scan Usage

Create:

```text
lib/usage/record-usage-event.ts
```

Expected function:

```ts
export async function recordScanAcceptedUsage(params: {
  userId: string;
  scanId: string;
  metadata?: Record<string, unknown>;
}) {
  // Insert usage_events row with event_type = scan_accepted
}
```

Rules:

- This should be called only after scan creation is accepted.
- This should include `scanId`.
- This function should not create the scan.
- This function should not check URL validity.

### Idempotency Requirement

Avoid double-counting the same scan.

Preferred database-level protection:

- Add a unique constraint for scan usage events if practical.

Recommended constraint:

```text
unique(event_type, scan_id)
```

This prevents duplicate `scan_accepted` events for the same scan.

If the schema does not currently have this constraint, add a migration.

Rules:

- Retrying record usage for the same scan should not create multiple accepted scan events.
- If duplicate insert is attempted, handle it safely.

## Part 7: Transaction Boundary For Future Scan Creation

Document and prepare the future flow:

```text
begin transaction
  check usage limit
  create scan row
  create scan_accepted usage event
commit transaction
enqueue scan job after commit
```

This task does not need to implement the scan API, but the helper design must support transactional usage.

If Drizzle transaction support is available, make helpers accept an optional database transaction client:

```ts
export async function getUsageSummary(userId: string, tx = db) {}
export async function recordScanAcceptedUsage(params, tx = db) {}
```

This allows future scan creation to avoid race conditions.

## Part 8: Race Condition Handling

The usage system should be safe enough for V1.

Risk:

```text
User submits multiple scans at the same time.
```

Minimum acceptable V1 approach:

- Check usage before scan creation.
- Record usage immediately after scan creation.
- Add unique event protection per scan.

Stronger approach:

- Use a database transaction.
- Recount usage inside the transaction.
- Create scan and usage event atomically.

Best future approach:

- Add per-user/day quota counters or database locking.

For V1, implement the strongest approach that is simple in the current codebase. At minimum, design helpers so the scan creation task can wrap check/create/record in a transaction.

## Part 9: Dashboard Integration

Update the dashboard data helper from `05-app-shell-dashboard.md` to use:

```ts
getUsageSummary(user.id);
```

The dashboard should display:

```text
X of 5 scans used today
```

If limit is reached, show:

```text
Daily limit reached
```

Rules:

- Dashboard display can be real.
- Dashboard should not create scans.
- Dashboard should not enforce scan submission because no scan form exists here.

## Part 10: New Scan Placeholder Integration

Update `/app/new-scan` placeholder page to show real usage summary.

If user has scans remaining:

```text
You have 5 scans available today.
```

or:

```text
You have 2 scans remaining today.
```

If limit is reached:

```text
You've used all 5 free scans for today.
```

Rules:

- Keep form disabled or placeholder-only until scan creation task.
- Do not implement URL submission in this task.

## Part 11: Error Handling

Usage helpers should handle expected and unexpected states.

Expected states:

- Free plan with remaining usage.
- Free plan limit reached.
- Paid plan with no daily limit.
- Missing plan record but user has `planCode = free`.

Unexpected states:

- Missing user.
- Invalid plan code.
- Database query failure.

Rules:

- Return structured blocked result for limit reached.
- Throw for unexpected system errors.
- UI should show a safe error state if usage cannot be loaded.

## Part 12: Tests

Add tests for pure usage logic where possible.

Recommended test cases:

```text
free user with 0 of 5 used -> allowed
free user with 4 of 5 used -> allowed
free user with 5 of 5 used -> blocked
free user with 6 of 5 used -> blocked
paid user with null limit -> allowed
remaining scans never drops below 0
UTC day range starts at 00:00:00.000
UTC day range ends at next day boundary
duplicate scan usage should not double-count if idempotency is implemented
```

If the project does not yet have a test runner, add one only if appropriate.

Recommended:

```bash
npm install -D vitest
```

Add scripts:

```json
{
  "scripts": {
    "test": "vitest run"
  }
}
```

Do not overbuild a large testing framework in this task.

## Part 13: UI Requirements

Follow the UI design system.

Use:

- `UsageMeter`
- `Alert`
- `Card`
- `Button`
- `Badge`
- `PageHeader`

Rules:

- Use theme tokens.
- Do not hardcode colors.
- The limit-reached state should be clear but not alarming.
- Show reset time if available.
- Avoid upsell-heavy copy until billing exists.

Acceptable limit copy:

```text
You've used all 5 free scans for today. Your limit resets at midnight UTC.
```

Avoid:

```text
You are blocked.
```

## Part 14: Validation

Run:

```bash
npm run lint
npm run typecheck
npm run build
```

If tests are added:

```bash
npm run test
```

Manual checks:

- Dashboard shows real usage count.
- New Scan placeholder shows usage count.
- Limit reached state can be simulated or tested.
- Usage count is based on `usage_events`, not scan completion.
- No scan creation route exists yet.

## Expected Final State

At the end of this task:

- Plan limits are centralized.
- Usage summary can be computed.
- Free scan limit can be checked.
- Accepted scan usage can be recorded idempotently.
- Dashboard and new scan placeholder display real usage state.
- Future scan creation has a clear helper API for quota enforcement.
- No scan creation or scan execution is implemented.

## Acceptance Criteria

This task is complete when:

1. Free daily scan limit is defined centrally as 5.
2. Usage day boundaries are consistently calculated.
3. `getUsageSummary` returns used, limit, remaining, reset time, and limit state.
4. `checkScanUsageLimit` allows users below the limit.
5. `checkScanUsageLimit` blocks free users at or above the limit.
6. Paid/future unlimited plans can be represented without daily blocking.
7. `recordScanAcceptedUsage` records `scan_accepted` events.
8. Duplicate usage for the same scan is prevented or handled safely.
9. Dashboard uses the centralized usage summary.
10. New Scan placeholder shows current usage state.
11. Limit-reached UI state exists.
12. Tests cover core usage rules if a test runner is available.
13. No URL validation, scan creation, queue, worker, SEO, report, PDF, or billing feature is implemented.
14. Lint, typecheck, build, and tests pass, or any environment-specific blocker is documented.

## Agent Notes

- This is the quota layer, not the scan creation layer.
- Count accepted scan usage events, not completed scans.
- Failed validation must not consume usage.
- Future scan creation should call `checkScanUsageLimit` before creating a scan and `recordScanAcceptedUsage` after accepting it.
- Keep plan logic centralized.
- Do not scatter the number `5` throughout UI components.
- Use UTC daily reset for V1 unless user timezone support already exists.
- If schema changes are required for idempotency, add a migration.
- Do not add Stripe logic in this task.
