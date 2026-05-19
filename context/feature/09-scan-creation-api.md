# 09. Scan Creation API

## Purpose

This task implements the authenticated scan creation entry point for scōre.. It connects the existing authentication, database, usage limit, URL safety, and domain verification layers so a signed-in user can submit a domain or URL and have the system accept or reject the scan request correctly.

This task creates scan records and records accepted scan usage. It does not process scans, enqueue worker jobs, fetch full page HTML for analysis, extract SEO data, generate AI reports, create report pages, or export PDFs.

The queue integration comes next in `10-queue-setup.md`.

## Required Context

Before starting this task, read these files:

1. `project-overview.md`
2. `architecture-context.md`
3. `04-database-schema.md`
4. `05-app-shell-dashboard.md`
5. `06-usage-limits.md`
6. `07-urlnormalization-security.md`
7. `08-domain-verification.md`

This task depends on:

- Clerk authentication.
- Database user upsert.
- Drizzle schema and database client.
- Usage limit helpers.
- URL safety helpers.
- Domain verification helper.
- Existing app shell and New Scan placeholder page.

## Goal

At the end of this task:

- Authenticated users can submit a URL/domain through an API or server action.
- The system validates request shape.
- The system checks the user's daily usage limit.
- The system verifies the submitted target is reachable and safe.
- The system creates a scan record for accepted scans.
- The system records a `scan_accepted` usage event atomically with scan creation.
- Failed validation and failed verification do not consume usage.
- The New Scan page has a working form.
- The user is redirected to a scan status/report placeholder after scan creation.
- The sixth free scan in one UTC day is blocked.

No scan processing should occur yet. Accepted scans may remain in `queued` status until the queue and worker tasks are implemented.

## Core Flow

The scan creation flow should be:

```text
authenticated user submits input
validate request body
get or create database user
check usage limit
verify target safety and reachability
start database transaction
  create scan row
  create scan_accepted usage event
commit transaction
return scan id and queued status
redirect user to scan status/report placeholder
```

Important:

- Do not record usage until the scan is accepted.
- Do not accept scans that fail URL safety or domain verification.
- Do not enqueue jobs in this task unless a no-op adapter is created for future use.
- Do not process the scan inside the API request.

## Scope

### In Scope

- Scan creation API route or server action.
- New Scan form submission.
- Request validation.
- Authenticated user ownership.
- Usage limit enforcement.
- Domain verification before acceptance.
- Scan database row creation.
- Accepted scan usage event creation.
- Transactional scan creation and usage recording.
- User-facing validation and verification errors.
- Redirect to scan status/report placeholder.
- Tests for scan creation behavior.

### Out Of Scope

- BullMQ setup.
- Redis setup.
- Enqueueing real jobs.
- Worker execution.
- HTML page fetching for analysis.
- SEO extraction.
- SEO checks.
- Scoring.
- AI report generation.
- Full report page.
- PDF export.
- Stripe billing.
- Site crawl scans.
- Competitor comparison.

## API Shape

Recommended endpoint:

```text
POST /api/scans
```

Request body:

```json
{
  "input": "https://example.com/pricing",
  "scanType": "single_url"
}
```

Allowed V1 scan types:

```text
homepage
single_url
```

Future scan type:

```text
site_crawl
```

`site_crawl` must be rejected in V1 unless a paid feature gate exists later.

Response on success:

```json
{
  "ok": true,
  "scan": {
    "id": "scan-id",
    "status": "queued",
    "inputUrl": "example.com",
    "normalizedUrl": "https://example.com/",
    "finalUrl": "https://example.com/",
    "scanType": "homepage"
  }
}
```

Response on expected failure:

```json
{
  "ok": false,
  "code": "DAILY_SCAN_LIMIT_REACHED",
  "message": "You've used all 5 free scans for today. Your limit resets at midnight UTC."
}
```

or:

```json
{
  "ok": false,
  "code": "NON_HTML_RESPONSE",
  "message": "This URL does not appear to return an HTML page."
}
```

Alternative:

- A server action is acceptable if the app is already using server actions consistently.
- If using server actions, keep the same validation, transaction, and result semantics.

Do not implement both API route and server action unless the project architecture already requires both.

## Recommended Files

Create or update:

```text
app/api/scans/route.ts
app/app/new-scan/page.tsx
components/scans/scan-form.tsx
lib/scans/types.ts
lib/scans/errors.ts
lib/scans/create-scan.ts
lib/scans/get-scan.ts
lib/scans/index.ts
```

Optional:

```text
app/app/scans/[scanId]/page.tsx
components/scans/scan-status-panel.tsx
lib/scans/__tests__/create-scan.test.ts
app/api/scans/__tests__/route.test.ts
```

If the project uses `/app/reports/[id]` as the future destination instead of `/app/scans/[scanId]`, use that route. For this task, a scan status placeholder route is usually clearer because no report exists yet.

## Part 1: Define Scan Creation Types

Create:

```text
lib/scans/types.ts
```

Recommended types:

```ts
export type CreateScanInput = {
  input: string;
  scanType: "homepage" | "single_url";
};

export type CreateScanSuccess = {
  ok: true;
  scan: {
    id: string;
    status: "queued";
    inputUrl: string;
    normalizedUrl: string;
    finalUrl: string;
    scanType: "homepage" | "single_url";
  };
};

export type CreateScanFailure = {
  ok: false;
  code: string;
  message: string;
  status?: number;
};

export type CreateScanResult = CreateScanSuccess | CreateScanFailure;
```

Use Drizzle enum types if they are already exported cleanly.

## Part 2: Define Scan Creation Errors

Create:

```text
lib/scans/errors.ts
```

Recommended error codes:

```ts
export type CreateScanErrorCode =
  | "UNAUTHENTICATED"
  | "INVALID_REQUEST"
  | "UNSUPPORTED_SCAN_TYPE"
  | "DAILY_SCAN_LIMIT_REACHED"
  | "TARGET_VERIFICATION_FAILED"
  | "SCAN_CREATION_FAILED";
```

Verification errors from `08-domain-verification.md` should pass through where useful:

```text
INVALID_URL
UNSAFE_URL
DNS_FAILED
CONNECTION_FAILED
CONNECTION_TIMEOUT
TOO_MANY_REDIRECTS
UNSAFE_REDIRECT
FETCH_BLOCKED
NON_HTML_RESPONSE
RESPONSE_TOO_LARGE
UNSUPPORTED_STATUS_CODE
SSL_ERROR
VERIFICATION_FAILED
```

Rules:

- Keep expected errors structured.
- Do not expose stack traces.
- Do not return raw database errors to users.

## Part 3: Request Validation

Validate request input before usage checks or verification.

Recommended validation library:

```text
zod
```

Install if not present:

```bash
npm install zod
```

Schema:

```ts
const createScanSchema = z.object({
  input: z.string().trim().min(1).max(2048),
  scanType: z.enum(["homepage", "single_url"]).default("single_url"),
});
```

Rules:

- Reject missing input.
- Reject input longer than the URL safety max.
- Reject `site_crawl` in V1.
- Do not rely only on client-side validation.
- Server-side validation is mandatory.

## Part 4: Scan Type Determination

The form can let the user choose scan type, or the backend can infer it.

Recommended V1 behavior:

- If user enters a bare domain and no path, scan type can be `homepage`.
- If user enters a URL with path beyond `/`, scan type can be `single_url`.
- If the UI explicitly submits scan type, validate it.

Simple accepted approach:

```text
UI submits scanType = single_url by default.
Backend accepts homepage or single_url only.
```

Do not support `site_crawl` yet.

Future paid feature:

```text
site_crawl requires plan gate and queue/worker crawl support.
```

## Part 5: Create Scan Service

Create:

```text
lib/scans/create-scan.ts
```

Expected function:

```ts
export async function createScanForCurrentUser(
  input: CreateScanInput,
): Promise<CreateScanResult>;
```

or:

```ts
export async function createScan(params: {
  userId: string;
  input: string;
  scanType: "homepage" | "single_url";
}): Promise<CreateScanResult>;
```

Recommended responsibilities:

1. Require authenticated database user.
2. Validate scan type.
3. Check usage limit.
4. Verify target with `verifyTarget`.
5. If verification fails, return failure and do not create usage event.
6. Create scan row and usage event in a transaction.
7. Return created scan summary.

Rules:

- Keep business logic out of the route handler.
- Route handler should call this service and serialize the result.
- Do not enqueue a job here yet.
- Do not run SEO analysis here.

## Part 6: Transactional Database Write

Scan creation and accepted usage recording should be atomic.

Recommended transaction:

```text
tx:
  re-check usage limit inside transaction if helper supports tx
  insert scan row
  insert usage_events row with event_type scan_accepted
```

Why:

- Prevents accepted scans without usage records.
- Prevents usage records without scans.
- Prepares for future race-condition hardening.

Scan row values:

```text
user_id = current database user id
scan_type = homepage or single_url
status = queued
input_url = raw user input
normalized_url = verification.normalizedUrl
final_url = verification.finalUrl
domain = hostname from final or normalized URL
status_code = verification.statusCode
content_type = verification.contentType
redirect_chain = verification.redirectChain
verification = full verification result JSON
created_at = now
updated_at = now
```

Do not set:

```text
overall_score
technical_score
content_score
metadata_score
indexability_score
performance_score
completed_at
```

Those belong to later analysis/report steps.

## Part 7: Usage Enforcement Details

Use helpers from `06-usage-limits.md`.

Expected order:

```text
check usage limit
verify target
transaction:
  check usage limit again if possible
  create scan
  record accepted usage
```

The second check helps reduce concurrent double-submit risk.

Rules:

- Failed request validation does not consume usage.
- Failed URL safety does not consume usage.
- Failed domain verification does not consume usage.
- Accepted queued scan consumes usage.
- If a queued scan later fails in the worker, usage remains consumed.

## Part 8: API Route

Create:

```text
app/api/scans/route.ts
```

Expected behavior:

- Accepts `POST`.
- Requires Clerk authentication.
- Parses JSON body.
- Validates body.
- Calls scan creation service.
- Returns JSON success or failure.
- Uses appropriate HTTP status codes.

Recommended status codes:

```text
200 or 201 -> scan created
400 -> invalid request or invalid URL
401 -> unauthenticated
403 -> unsafe URL or unsupported scan type
409 -> daily usage limit reached
422 -> target verification failed
500 -> unexpected system error
```

Rules:

- Do not accept unauthenticated scan creation.
- Do not expose stack traces.
- Do not fetch or analyze pages directly in the route beyond verification service.
- Do not create scan records on failed verification unless the product explicitly decides to store failed attempts.

## Part 9: New Scan Form

Update:

```text
app/app/new-scan/page.tsx
components/scans/scan-form.tsx
```

The New Scan page should now have a working form.

UI should include:

- Page title: `New Scan`
- Description: `Analyze a homepage or specific URL.`
- Input for domain or URL.
- Scan type selector if desired.
- Usage summary.
- Submit button.
- Limit-reached disabled state.
- Validation error display.
- Verification error display.
- Loading/submitting state.

Accepted placeholder:

```text
example.com
https://example.com/pricing
```

Rules:

- Client-side validation improves UX but does not replace server validation.
- Show clear server error messages.
- Disable submit while request is in progress.
- If daily limit is reached, disable submit and show the limit message.
- On success, redirect to scan status placeholder.

## Part 10: Scan Status Placeholder Route

Create a placeholder route for accepted scans:

```text
app/app/scans/[scanId]/page.tsx
```

This route should:

- Require authentication.
- Verify the scan belongs to the current user.
- Show scan metadata.
- Show status badge.
- Explain that processing will begin after queue/worker setup.
- Link back to dashboard or reports.

Recommended content for queued scans before queue exists:

```text
This scan has been accepted and is waiting for processing.
```

Do not build the full report page here.

Do not fake SEO findings.

## Part 11: Scan Lookup Helper

Create:

```text
lib/scans/get-scan.ts
```

Expected function:

```ts
export async function getScanForCurrentUser(scanId: string);
```

or:

```ts
export async function getScanByIdForUser(params: {
  scanId: string;
  userId: string;
});
```

Rules:

- Must enforce ownership.
- Return null or notFound for scans not owned by current user.
- Do not allow one user to view another user's private scan.
- Public share links are not part of this task.

## Part 12: Dashboard Integration

Update dashboard and recent scans display as needed:

- New scans should appear after creation.
- Queued status should render correctly.
- Dashboard New Scan button should link to `/app/new-scan`.
- Recent scan action can link to `/app/scans/[scanId]`.

Do not build polling yet.

Do not show completed report data because scans are not processed yet.

## Part 13: Error Handling UX

The form should handle expected errors:

```text
DAILY_SCAN_LIMIT_REACHED
INVALID_URL
UNSAFE_URL
DNS_FAILED
CONNECTION_TIMEOUT
TOO_MANY_REDIRECTS
UNSAFE_REDIRECT
FETCH_BLOCKED
NON_HTML_RESPONSE
RESPONSE_TOO_LARGE
UNSUPPORTED_STATUS_CODE
SSL_ERROR
VERIFICATION_FAILED
```

Display messages from centralized error maps.

Rules:

- Keep errors short and actionable.
- Do not show raw JSON.
- Do not show stack traces.
- Preserve the user's input after an error.

## Part 14: Security Requirements

Required:

- Only authenticated users can create scans.
- API route must not trust client-provided user IDs.
- User ID comes from Clerk server auth and database user mapping.
- URL safety and domain verification must run server-side.
- Scan ownership must be enforced on scan status page.
- Failed unsafe URL attempts must not create fetches beyond safety checks.
- Verification must not follow unsafe redirects.
- Do not expose private scan data across users.

## Part 15: Tests

Add tests for scan creation service and/or route.

Recommended cases:

### Authentication

```text
unauthenticated request -> 401
authenticated request -> proceeds
```

### Request Validation

```text
missing input -> 400
empty input -> 400
too long input -> 400
unsupported scanType site_crawl -> 403 or 400
```

### Usage Limit

```text
free user below limit -> allowed
free user at limit -> blocked
blocked request creates no scan
blocked request creates no usage event
```

### Verification

```text
verification success -> scan row created
verification failure -> no scan row
verification failure -> no usage event
unsafe URL -> no scan row
```

### Transaction

```text
scan creation and usage event are both created
usage insert failure rolls back scan if possible
duplicate usage event handled safely
```

### Ownership

```text
user can view own scan status
user cannot view another user's scan status
```

Use mocks for verification and database where practical. Avoid live network tests here because verification has its own tests.

## Part 16: Manual Validation

Run:

```bash
npm run lint
npm run typecheck
npm run build
npm run test
```

Then run:

```bash
npm run dev
```

Manual flow:

1. Sign in.
2. Open `/app/new-scan`.
3. Submit `example.com`.
4. Confirm the app verifies the target.
5. Confirm a scan row is created.
6. Confirm a usage event is created.
7. Confirm redirect to `/app/scans/[scanId]`.
8. Confirm scan shows `queued`.
9. Submit invalid URL.
10. Confirm no scan and no usage event.
11. Simulate limit reached.
12. Confirm submit is blocked.

If Neon credentials or network access are unavailable, document which manual checks could not be completed.

## Expected Final State

At the end of this task:

- A signed-in user can create a queued scan from `/app/new-scan`.
- The system verifies the target before accepting it.
- Accepted scans consume daily usage.
- Failed validation and verification do not consume usage.
- Queued scans are visible in dashboard/recent scans.
- A scan status placeholder route exists.
- No background processing happens yet.

## Acceptance Criteria

This task is complete when:

1. `POST /api/scans` or an equivalent server action exists.
2. Scan creation requires authentication.
3. Request body is validated server-side.
4. Only `homepage` and `single_url` scan types are accepted in V1.
5. Usage limit is checked before scan acceptance.
6. Target verification runs before scan acceptance.
7. Failed validation creates no scan and no usage event.
8. Failed verification creates no scan and no usage event.
9. Accepted scan creates a `scans` row with status `queued`.
10. Accepted scan creates one `scan_accepted` usage event.
11. Scan creation and usage event recording are transactional or safely coordinated.
12. Duplicate usage recording for the same scan is prevented or handled.
13. New Scan page has a working form.
14. Limit-reached state disables or blocks submission.
15. Successful creation redirects to a scan status placeholder.
16. Scan status placeholder enforces ownership.
17. Dashboard recent scans can show queued scans.
18. No queue, worker, SEO extraction, AI report, PDF, billing, site crawl, or competitor logic is added.
19. Lint, typecheck, build, and tests pass, or any environment-specific blocker is documented.

## Agent Notes

- This task accepts scans; it does not process them.
- Keep route handlers thin and put business logic in `lib/scans/create-scan.ts`.
- Never trust client-provided user IDs.
- Do not consume usage for rejected inputs.
- Use the verifier from `08-domain-verification.md`.
- Leave enqueueing to `10-queue-setup.md`.
- Leave worker processing to `11-worker-setup.md`.
- Do not fake completed reports.
- It is acceptable for accepted scans to remain queued until the next tasks exist.
