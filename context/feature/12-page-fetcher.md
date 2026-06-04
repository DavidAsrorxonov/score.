# 12. Page Fetcher

## Purpose

This task implements the safe page fetcher for scōre.. After a scan has been accepted and picked up by the worker, the system must fetch the final HTML page in a controlled way so later tasks can extract SEO data from it.

The page fetcher is responsible for retrieving HTML and response metadata. It must enforce SSRF protections, redirect safety, timeout limits, response size limits, content-type checks, and clear error handling.

This task does not implement SEO extraction, SEO checks, scoring, AI report generation, report UI, PDF export, or whole-site crawling.

## Required Context

Before starting this task, read these files:

1. `project-overview.md`
2. `architecture-context.md`
3. `04-database-schema.md`
4. `07-urlnormalization-security.md`
5. `08-domain-verification.md`
6. `09-scan-creation-api.md`
7. `10-queue-setup.md`
8. `11-worker-setup.md`

This task depends on:

- URL safety helpers.
- Redirect target validation.
- Domain verification conventions.
- Worker consuming `scan.run` jobs.
- `scans` and `scan_pages` tables.

## Goal

At the end of this task:

- A reusable safe page fetcher exists.
- The fetcher returns HTML plus response metadata.
- The fetcher never fetches raw unvalidated user input.
- The fetcher validates redirects manually.
- The fetcher enforces timeout and maximum body size.
- The fetcher rejects non-HTML responses.
- The worker can use the fetcher for queued scans.
- A successful fetch creates or updates a `scan_pages` record with fetch metadata.
- The worker stops after fetching because SEO extraction is not implemented yet.

The next task, `13-seo-extraction.md`, will parse the fetched HTML.

## Core Rule

The fetcher retrieves page content. It does not interpret SEO meaning.

Allowed in this task:

- Fetch HTML.
- Store response metadata.
- Store page status and basic technical fetch data.
- Return the HTML string to the caller.

Not allowed in this task:

- Parse title tags.
- Parse meta descriptions.
- Count headings.
- Count links.
- Count words.
- Create SEO findings.
- Calculate SEO scores.
- Generate AI report text.

## Scope

### In Scope

- Safe HTML fetch function.
- Manual redirect following.
- Redirect target validation.
- DNS/URL safety re-check before fetching.
- Timeout handling.
- Maximum response body size enforcement.
- Content-Type validation.
- HTML decoding.
- Fetch metadata result type.
- Worker integration up to fetch completion.
- `scan_pages` basic record creation/update.
- Tests with mocked fetch.

### Out Of Scope

- SEO extraction.
- Cheerio parsing.
- SEO checks.
- Scoring engine.
- AI report generation.
- PDF export.
- Object storage setup.
- Screenshot capture.
- JavaScript rendering with Playwright.
- Whole-site crawling.
- Robots.txt policy.
- Sitemap discovery.

## Recommended Files

Create:

```text
lib/fetcher/config.ts
lib/fetcher/types.ts
lib/fetcher/errors.ts
lib/fetcher/read-response-body.ts
lib/fetcher/fetch-page-html.ts
lib/fetcher/index.ts
```

Update:

```text
worker/handlers/run-scan.ts
lib/scans/status.ts
```

Optional:

```text
lib/fetcher/__tests__/fetch-page-html.test.ts
lib/fetcher/__tests__/read-response-body.test.ts
```

## Part 1: Fetcher Configuration

Create:

```text
lib/fetcher/config.ts
```

Recommended defaults:

```ts
export const PAGE_FETCHER_CONFIG = {
  timeoutMs: 15000,
  maxRedirects: 5,
  maxResponseBytes: 5_000_000,
  userAgent: "score-SEO-Fetcher/1.0",
  acceptedContentTypes: ["text/html", "application/xhtml+xml"],
} as const;
```

Notes:

- Verification can use a smaller response size limit.
- The page fetcher needs enough room for real HTML pages.
- Do not set an unlimited body size.

## Part 2: Fetcher Types

Create:

```text
lib/fetcher/types.ts
```

Recommended types:

```ts
export type PageFetchErrorCode =
  | "INVALID_URL"
  | "UNSAFE_URL"
  | "DNS_FAILED"
  | "CONNECTION_FAILED"
  | "CONNECTION_TIMEOUT"
  | "TOO_MANY_REDIRECTS"
  | "UNSAFE_REDIRECT"
  | "FETCH_BLOCKED"
  | "NON_HTML_RESPONSE"
  | "RESPONSE_TOO_LARGE"
  | "UNSUPPORTED_STATUS_CODE"
  | "SSL_ERROR"
  | "BODY_READ_FAILED"
  | "PAGE_FETCH_FAILED";

export type FetchRedirectHop = {
  fromUrl: string;
  toUrl: string;
  statusCode: number;
};

export type FetchPageSuccess = {
  ok: true;
  inputUrl: string;
  normalizedUrl: string;
  finalUrl: string;
  hostname: string;
  resolvedIps: string[];
  statusCode: number;
  contentType: string;
  contentLengthBytes: number | null;
  responseTimeMs: number;
  pageSizeBytes: number;
  redirectChain: FetchRedirectHop[];
  html: string;
  fetchedAt: Date;
};

export type FetchPageFailure = {
  ok: false;
  inputUrl: string;
  normalizedUrl?: string;
  finalUrl?: string;
  hostname?: string;
  resolvedIps?: string[];
  statusCode?: number;
  contentType?: string | null;
  contentLengthBytes?: number | null;
  responseTimeMs?: number;
  pageSizeBytes?: number;
  redirectChain?: FetchRedirectHop[];
  code: PageFetchErrorCode;
  message: string;
  fetchedAt: Date;
};

export type FetchPageResult = FetchPageSuccess | FetchPageFailure;
```

Rules:

- Expected network/content failures should return structured failure results.
- Do not throw for normal fetch failures.
- Throw only for programming errors that cannot be represented safely.

## Part 3: Fetcher Error Messages

Create:

```text
lib/fetcher/errors.ts
```

Recommended user-safe messages:

```ts
export const PAGE_FETCH_MESSAGES = {
  INVALID_URL: "Enter a valid domain or URL.",
  UNSAFE_URL: "This URL cannot be fetched for security reasons.",
  DNS_FAILED: "This domain could not be resolved.",
  CONNECTION_FAILED: "The page could not be reached.",
  CONNECTION_TIMEOUT: "The page took too long to respond.",
  TOO_MANY_REDIRECTS: "The page redirects too many times.",
  UNSAFE_REDIRECT: "The page redirects to an unsafe target.",
  FETCH_BLOCKED: "The website blocked the fetch request.",
  NON_HTML_RESPONSE: "This URL does not return an HTML page.",
  RESPONSE_TOO_LARGE: "The page is too large to analyze safely.",
  UNSUPPORTED_STATUS_CODE:
    "The page returned a status code that cannot be analyzed.",
  SSL_ERROR: "The page's SSL connection could not be verified.",
  BODY_READ_FAILED: "The page response could not be read.",
  PAGE_FETCH_FAILED: "The page could not be fetched.",
} as const;
```

Rules:

- Do not expose stack traces.
- Do not expose internal network details.
- Preserve technical error codes for logs and scan records.

## Part 4: Public Fetch Function

Create:

```text
lib/fetcher/fetch-page-html.ts
```

Expected function:

```ts
export async function fetchPageHtml(inputUrl: string): Promise<FetchPageResult>;
```

Flow:

1. Validate URL safety using `validateUrlSafety`.
2. If unsafe, return structured failure.
3. Request the normalized URL with manual redirects.
4. Validate every redirect target using `validateRedirectUrl`.
5. Enforce redirect limit.
6. Enforce timeout.
7. Validate final status code.
8. Validate final Content-Type.
9. Validate Content-Length if present.
10. Read response body with max byte limit.
11. Decode HTML.
12. Return HTML and metadata.

Important:

- Never use raw user input directly in `fetch`.
- Never use automatic redirect following.
- Never read the body before checking status/content type/known content length.
- Always enforce a hard maximum body size while reading.

## Part 5: HTTP Request Behavior

Use server-side `fetch` or a focused HTTP client.

Recommended fetch options:

```ts
fetch(url, {
  method: "GET",
  redirect: "manual",
  signal,
  headers: {
    "User-Agent": PAGE_FETCHER_CONFIG.userAgent,
    Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
  },
});
```

Rules:

- Use `GET`, not `HEAD`.
- Disable automatic redirects.
- Use `AbortController` for timeout.
- Keep request headers minimal.
- Do not send cookies.
- Do not send user credentials.
- Do not forward user request headers.

## Part 6: Status Code Rules

Accepted final statuses:

```text
2xx
```

Recommended V1 accepted statuses:

```text
200
203
206
```

Rejected:

```text
3xx without a final accepted target
4xx
5xx
```

Error mapping:

```text
401 -> FETCH_BLOCKED
403 -> FETCH_BLOCKED
429 -> FETCH_BLOCKED
404 -> UNSUPPORTED_STATUS_CODE
410 -> UNSUPPORTED_STATUS_CODE
5xx -> UNSUPPORTED_STATUS_CODE
other non-2xx -> UNSUPPORTED_STATUS_CODE
```

Do not analyze error pages in V1.

## Part 7: Content-Type Rules

Accepted final content types:

```text
text/html
application/xhtml+xml
```

Content-Type may include charset:

```text
text/html; charset=utf-8
```

This should be accepted.

Rejected:

```text
application/json
application/pdf
text/plain
image/*
video/*
audio/*
application/octet-stream
```

Missing Content-Type:

Recommended V1 policy:

```text
Reject as NON_HTML_RESPONSE.
```

Do not sniff arbitrary binary content as HTML in V1.

## Part 8: Body Size Enforcement

Create:

```text
lib/fetcher/read-response-body.ts
```

Expected function:

```ts
export async function readResponseBodyWithLimit(
  response: Response,
  maxBytes: number,
): Promise<
  | { ok: true; bytes: Uint8Array; sizeBytes: number }
  | {
      ok: false;
      code: "RESPONSE_TOO_LARGE" | "BODY_READ_FAILED";
      message: string;
      sizeBytes?: number;
    }
>;
```

Rules:

- If `Content-Length` is present and above limit, reject before reading.
- While reading the stream, track accumulated bytes.
- Stop reading and reject once size exceeds limit.
- Do not call `response.text()` directly unless the response size is already safely bounded.

Reason:

- `response.text()` can load an unexpectedly large body into memory.
- SEO targets are untrusted.

## Part 9: HTML Decoding

After reading bytes, decode HTML.

Recommended:

- Default to UTF-8.
- If Content-Type includes `charset=...`, use it when supported.
- Fall back to UTF-8 if charset is missing or unsupported.

Implementation can use:

```ts
new TextDecoder(charset, { fatal: false });
```

Rules:

- Do not fail the entire fetch solely because charset is unusual unless decoding throws unexpectedly.
- Preserve the decoded HTML string for the next SEO extraction task.

## Part 10: Redirect Handling

Redirect statuses:

```text
301
302
303
307
308
```

Flow:

1. Request current URL with `redirect: "manual"`.
2. If response status is redirect, read `Location`.
3. Resolve relative redirects against current URL.
4. Validate target with `validateRedirectUrl`.
5. If unsafe, return `UNSAFE_REDIRECT`.
6. Add redirect hop.
7. Continue until final response or redirect limit.

Rules:

- Every redirect target must be revalidated.
- Cross-domain redirects are allowed only if safe.
- Redirects to private/internal targets must fail.
- Redirect chains must be included in success/failure results.

## Part 11: DNS And SSRF Re-Checks

Even though scan creation already verified the target, the worker fetcher must re-check safety.

Reasons:

- Time passes between scan creation and worker execution.
- DNS can change.
- Jobs can be inserted manually or maliciously.
- Redirect targets can change.

Required:

- Call `validateUrlSafety` before first fetch.
- Call `validateRedirectUrl` before every redirect fetch.
- Reject unsafe DNS results.

Future hardening:

- Use an outbound proxy.
- Pin DNS results during actual connection.
- Enforce private-network egress blocking at infrastructure level.

## Part 12: Persistence Boundary

When the worker successfully fetches a page, it should create or update a `scan_pages` row.

Recommended values:

```text
scan_id
url = normalizedUrl
final_url = finalUrl
status_code
content_type
response_time_ms
page_size_bytes
technical_data = fetch metadata JSON
created_at
updated_at
```

Do not fill these fields yet:

```text
title
meta_description
canonical_url
meta_robots
h1
h2
h3
word_count
internal_link_count
external_link_count
image_count
images_missing_alt_count
schema_types
open_graph
twitter_card
```

Those belong to SEO extraction.

Raw HTML storage:

- Do not store large raw HTML directly in PostgreSQL.
- If object storage is already configured, saving raw HTML to object storage is acceptable.
- If object storage is not configured yet, keep HTML in memory and pass it to the next processing step in later tasks.
- Do not add full object storage infrastructure in this task unless it already exists.

For this task, it is acceptable to fetch HTML, persist metadata, and then stop before extraction.

## Part 13: Worker Integration

Update:

```text
worker/handlers/run-scan.ts
```

Expected V1 flow after this task:

```text
validate job payload
load scan
skip completed/failed scans
set status validating
re-check target safety if needed through fetcher
set status fetching
fetch HTML
if fetch fails -> mark scan failed with fetch error
if fetch succeeds -> create/update scan_pages metadata
set status analyzing
stop with SEO_EXTRACTION_NOT_IMPLEMENTED
```

Temporary final failure:

```text
error_code = SEO_EXTRACTION_NOT_IMPLEMENTED
error_message = SEO extraction is not implemented yet.
```

Why:

- The worker should not mark scans completed without SEO findings.
- The status path proves fetching works.
- The next task will replace this boundary with real extraction.

Do not fake extracted SEO fields.

## Part 14: Scan Status Updates

Worker should update:

```text
fetching
analyzing
failed
```

On fetch failure:

```text
status = failed
error_code = fetch result code
error_message = fetch result message
failed_at = now
```

On fetch success before extraction exists:

```text
status = failed
error_code = SEO_EXTRACTION_NOT_IMPLEMENTED
error_message = SEO extraction is not implemented yet.
```

Later, `13-seo-extraction.md` will continue from `analyzing`.

## Part 15: Tests

Use mocked fetch responses. Do not depend on live websites for unit tests.

Recommended test cases:

### Success

```text
200 text/html small body -> success
200 text/html; charset=utf-8 -> success
203 text/html -> success
relative redirect then 200 html -> success
absolute safe redirect then 200 html -> success
```

### URL Safety

```text
localhost input -> UNSAFE_URL
private DNS result -> UNSAFE_URL
invalid URL -> INVALID_URL
```

### Redirects

```text
redirect to localhost -> UNSAFE_REDIRECT
redirect to 169.254.169.254 -> UNSAFE_REDIRECT
redirect loop over maxRedirects -> TOO_MANY_REDIRECTS
redirect without Location -> PAGE_FETCH_FAILED
```

### Status Codes

```text
403 -> FETCH_BLOCKED
404 -> UNSUPPORTED_STATUS_CODE
429 -> FETCH_BLOCKED
500 -> UNSUPPORTED_STATUS_CODE
```

### Content Type

```text
application/json -> NON_HTML_RESPONSE
application/pdf -> NON_HTML_RESPONSE
image/png -> NON_HTML_RESPONSE
missing Content-Type -> NON_HTML_RESPONSE
```

### Body Size

```text
Content-Length above limit -> RESPONSE_TOO_LARGE before body read
stream exceeds limit -> RESPONSE_TOO_LARGE
body under limit -> success
stream read error -> BODY_READ_FAILED
```

### Timeout

```text
AbortController timeout -> CONNECTION_TIMEOUT
network error -> CONNECTION_FAILED
TLS error -> SSL_ERROR if distinguishable, otherwise CONNECTION_FAILED
```

### Worker Integration

```text
fetch failure marks scan failed
fetch success creates scan_pages metadata
fetch success stops with SEO_EXTRACTION_NOT_IMPLEMENTED
completed scans are skipped
failed scans are skipped
```

## Part 16: Manual Validation

Run:

```bash
npm run lint
npm run typecheck
npm run build
npm run test
```

With Redis and Neon configured:

1. Start the app:

```bash
npm run dev
```

2. Start the worker:

```bash
npm run worker:dev
```

3. Create a scan for a normal HTML page.
4. Confirm the worker picks up the job.
5. Confirm status changes to `fetching`.
6. Confirm a `scan_pages` row is created with response metadata.
7. Confirm scan stops with `SEO_EXTRACTION_NOT_IMPLEMENTED`.
8. Create a scan for a non-HTML URL.
9. Confirm scan fails with `NON_HTML_RESPONSE`.

If external network access is restricted, use mocked tests and document manual network validation as blocked.

## Part 17: Security Requirements

Required:

- Do not fetch raw user input directly.
- Re-run URL safety validation in the worker.
- Validate every redirect target before following it.
- Disable automatic redirect following.
- Enforce request timeout.
- Enforce maximum body size.
- Do not send cookies.
- Do not forward user request headers.
- Do not store raw HTML in Redis.
- Do not store large raw HTML in PostgreSQL.
- Return safe error messages.

## Part 18: Expected Final State

At the end of this task:

- The app has a safe reusable page fetcher.
- The worker can fetch HTML pages for accepted scans.
- Fetch metadata is persisted to `scan_pages`.
- Fetch failures mark scans failed with stable error codes.
- Successful fetches stop at the SEO extraction boundary.
- No SEO parsing or findings exist yet.

## Acceptance Criteria

This task is complete when:

1. `fetchPageHtml(inputUrl)` exists.
2. The fetcher validates URL safety before fetching.
3. The fetcher disables automatic redirects.
4. The fetcher validates every redirect target.
5. The fetcher enforces redirect limits.
6. The fetcher enforces request timeout.
7. The fetcher rejects unsupported status codes.
8. The fetcher rejects non-HTML content types.
9. The fetcher rejects oversized responses by Content-Length.
10. The fetcher rejects streams that exceed max body size while reading.
11. The fetcher returns decoded HTML on success.
12. The fetcher returns response metadata on success.
13. Worker uses the fetcher for `scan.run` jobs.
14. Worker creates or updates `scan_pages` fetch metadata.
15. Worker marks fetch failures as failed scans.
16. Worker does not fake SEO results.
17. Tests cover success, redirects, unsafe redirects, status codes, content types, body limits, timeouts, and worker integration.
18. No SEO extraction, SEO checks, scoring, AI report, PDF, billing, site crawl, or competitor logic is added.
19. Lint, typecheck, build, and tests pass, or any environment-specific blocker is documented.

## Agent Notes

- This is the page content retrieval layer only.
- Keep SSRF checks conservative.
- Do not call `response.text()` on unbounded responses.
- Do not use automatic redirects.
- Do not parse SEO fields yet.
- Do not store large HTML in Postgres.
- Keep the fetcher reusable so future single-page scans and paid crawls can share it.
- The next task should consume the fetched HTML and extract SEO facts.
