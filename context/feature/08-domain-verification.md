# 08. Domain Verification

## Purpose

This task implements the domain and URL reachability verification layer for scōre.. After a user-submitted input passes URL normalization and security validation, the system must verify that the target actually exists, is reachable over HTTP or HTTPS, follows only safe redirects, returns a usable response, and appears suitable for later SEO analysis.

This task does not create scans, enqueue jobs, analyze SEO, extract HTML data, generate reports, or enforce usage limits. It creates the reusable verification service that future scan creation and workers must call before accepting or processing a target.

## Required Context

Before starting this task, read these files:

1. `project-overview.md`
2. `architecture-context.md`
3. `04-database-schema.md`
4. `06-usage-limits.md`
5. `07-urlnormalization-security.md`

This task depends on:

- URL normalization utilities.
- SSRF protection utilities.
- DNS safety checks.
- Redirect target validation.
- Scan error code conventions from architecture context.

## Goal

At the end of this task:

- The app can verify whether a domain or URL is reachable.
- Verification starts only after URL safety validation succeeds.
- HTTP and HTTPS targets are supported.
- Redirect chains are followed manually and safely.
- Every redirect target is validated before being followed.
- Verification records status code, final URL, content type, response time, and redirect chain.
- Non-HTML or unsupported responses are rejected for SEO analysis.
- Timeouts, too many redirects, blocked responses, and fetch failures return structured results.
- Tests cover successful, failed, redirect, timeout, unsafe redirect, and content-type cases.

This service should be ready for future integration into:

- Scan creation API.
- Worker preflight validation.
- Page fetcher.
- Failure reporting in the UI.

## Scope

### In Scope

- Domain/URL reachability verification.
- Safe manual redirect handling.
- HTTP response status validation.
- Content-Type validation.
- Response timeout handling.
- Response size preflight where possible.
- Response timing metadata.
- Structured verification success and failure results.
- Reusable verification error codes.
- Tests with mocked HTTP responses.
- Integration contract for later scan creation.

### Out Of Scope

- Creating scan records.
- Recording usage events.
- Queueing scan jobs.
- Worker process setup.
- Full page fetching for analysis.
- HTML parsing.
- SEO extraction.
- SEO scoring.
- AI report generation.
- PDF export.
- Billing.
- Whole-site crawling.

The future page fetcher may reuse parts of this verifier, but this task is only about deciding whether a target can be accepted for analysis.

## Verification Flow

The verification flow should be:

```text
raw user input
normalize and validate URL safety
resolve public DNS
start HTTP verification
send request
inspect response
if redirect, validate redirect target
repeat until final response or redirect limit
validate final response status
validate content type
record metadata
return structured result
```

Important:

- Never fetch raw user input directly.
- Never follow redirects automatically without validating them.
- Never assume a previously safe URL remains safe after redirect.

## Recommended Files

Create:

```text
lib/verification/types.ts
lib/verification/errors.ts
lib/verification/http-client.ts
lib/verification/verify-target.ts
lib/verification/index.ts
```

Tests:

```text
lib/verification/__tests__/verify-target.test.ts
```

If existing structure prefers `lib/domain` or `lib/url`, keep the naming consistent, but the feature should remain separate from pure URL normalization.

## Part 1: Define Verification Types

Create:

```text
lib/verification/types.ts
```

Recommended types:

```ts
export type VerificationErrorCode =
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
  | "VERIFICATION_FAILED";

export type RedirectHop = {
  fromUrl: string;
  toUrl: string;
  statusCode: number;
};

export type VerificationSuccess = {
  ok: true;
  inputUrl: string;
  normalizedUrl: string;
  finalUrl: string;
  hostname: string;
  resolvedIps: string[];
  statusCode: number;
  contentType: string | null;
  responseTimeMs: number;
  contentLengthBytes: number | null;
  redirectChain: RedirectHop[];
  verifiedAt: Date;
};

export type VerificationFailure = {
  ok: false;
  inputUrl: string;
  normalizedUrl?: string;
  finalUrl?: string;
  hostname?: string;
  resolvedIps?: string[];
  statusCode?: number;
  contentType?: string | null;
  responseTimeMs?: number;
  redirectChain?: RedirectHop[];
  code: VerificationErrorCode;
  message: string;
  verifiedAt: Date;
};

export type VerificationResult = VerificationSuccess | VerificationFailure;
```

Rules:

- Expected user/domain failures should return structured failure results.
- Unexpected programming errors may throw, but the public verifier should catch common failures and convert them into `VerificationFailure`.
- Keep result shape easy to persist into the `scans.verification` JSON field later.

## Part 2: Error Messages

Create:

```text
lib/verification/errors.ts
```

Recommended safe messages:

```ts
export const VERIFICATION_MESSAGES = {
  INVALID_URL: "Enter a valid domain or URL.",
  UNSAFE_URL: "This URL cannot be analyzed for security reasons.",
  DNS_FAILED: "This domain could not be resolved.",
  CONNECTION_FAILED: "The website could not be reached.",
  CONNECTION_TIMEOUT: "The website took too long to respond.",
  TOO_MANY_REDIRECTS: "The website redirects too many times.",
  UNSAFE_REDIRECT: "The website redirects to an unsafe target.",
  FETCH_BLOCKED: "The website blocked the verification request.",
  NON_HTML_RESPONSE: "This URL does not appear to return an HTML page.",
  RESPONSE_TOO_LARGE: "The response is too large to verify safely.",
  UNSUPPORTED_STATUS_CODE:
    "The website returned a status code that cannot be analyzed.",
  SSL_ERROR: "The website's SSL connection could not be verified.",
  VERIFICATION_FAILED: "The website could not be verified.",
} as const;
```

Rules:

- Messages must be user-safe.
- Do not expose stack traces.
- Do not reveal internal network details.
- Internal debug details can be logged separately if needed.

## Part 3: Verification Configuration

Create centralized config values.

Recommended file:

```text
lib/verification/config.ts
```

Recommended defaults:

```ts
export const VERIFICATION_CONFIG = {
  timeoutMs: 10000,
  maxRedirects: 5,
  maxResponseBytes: 2_000_000,
  userAgent: "score-SEO-Verifier/1.0",
  acceptedContentTypes: ["text/html", "application/xhtml+xml"],
} as const;
```

Notes:

- `maxResponseBytes` is a verification safety limit, not necessarily the final page fetch limit.
- The page fetcher task may use a larger or separate limit.
- Keep configuration centralized so later tuning is simple.

## Part 4: HTTP Client Helper

Create:

```text
lib/verification/http-client.ts
```

Purpose:

- Wrap server-side fetch behavior for verification.
- Disable automatic redirect following.
- Enforce timeout.
- Return headers and small response metadata.

Expected function:

```ts
export async function requestForVerification(url: string): Promise<{
  statusCode: number;
  headers: Headers;
  responseTimeMs: number;
}>;
```

Recommended fetch options:

```ts
fetch(url, {
  method: "GET",
  redirect: "manual",
  signal,
  headers: {
    "User-Agent": VERIFICATION_CONFIG.userAgent,
    Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
  },
});
```

Why use `GET` instead of only `HEAD`:

- Many sites handle `HEAD` incorrectly.
- SEO analysis eventually needs pages that are retrievable by `GET`.
- Verification should reflect real page access.

Important:

- This helper should not read the full body unless needed.
- If it reads any body data, it must enforce `maxResponseBytes`.
- It must not follow redirects automatically.

If the runtime fetch implementation cannot inspect redirect `Location` headers in manual mode for some redirect statuses, document the limitation and consider using a lower-level HTTP client in a later fetcher task.

## Part 5: Status Code Rules

Define which final statuses are acceptable for V1 analysis.

Recommended accepted final statuses:

```text
200
203
206
```

Potentially acceptable but should usually fail:

```text
401
403
404
410
429
500
```

Recommended V1 policy:

- Accept `2xx` HTML responses.
- Reject `3xx` if redirect chain ends without a valid final response.
- Reject `4xx` and `5xx` as unsupported for analysis.

Error mapping:

```text
401/403 -> FETCH_BLOCKED
429 -> FETCH_BLOCKED
404/410 -> UNSUPPORTED_STATUS_CODE
5xx -> UNSUPPORTED_STATUS_CODE
other non-2xx -> UNSUPPORTED_STATUS_CODE
```

Reason:

- V1 report should analyze reachable pages, not error pages.
- Later versions can add special reports for 404/blocked/error pages.

## Part 6: Content-Type Rules

Accepted content types:

```text
text/html
application/xhtml+xml
```

Reject:

```text
application/pdf
image/*
video/*
audio/*
application/json
text/plain
application/octet-stream
```

Rules:

- Content-Type may include charset, such as `text/html; charset=utf-8`.
- Match by media type before semicolon.
- If Content-Type is missing, V1 can either reject or allow cautiously.

Recommended V1 policy:

```text
Reject missing Content-Type unless there is a clear reason to allow it.
```

If rejected:

```text
NON_HTML_RESPONSE
```

## Part 7: Content-Length Rules

If the response has `Content-Length`, check it before reading body.

If:

```text
content-length > maxResponseBytes
```

return:

```text
RESPONSE_TOO_LARGE
```

If Content-Length is missing:

- Verification can continue without reading full body.
- The page fetcher task will enforce stream/body size limits later.

Do not read huge response bodies during verification.

## Part 8: Redirect Handling

Redirect handling must be manual and safe.

Redirect status codes:

```text
301
302
303
307
308
```

Flow:

1. Request current URL with `redirect: "manual"`.
2. If status is redirect, read `Location` header.
3. If no `Location`, fail with `VERIFICATION_FAILED`.
4. Resolve relative `Location` against current URL.
5. Validate redirect target with `validateRedirectUrl`.
6. If unsafe, fail with `UNSAFE_REDIRECT`.
7. Add hop to redirect chain.
8. Continue until final response or redirect limit.

Redirect limit:

```text
maxRedirects = 5
```

If exceeded:

```text
TOO_MANY_REDIRECTS
```

Rules:

- Every redirect target must be safety-validated.
- Cross-domain redirects are allowed only if safe.
- Redirects from HTTPS to HTTP are allowed in V1 only if the final URL is otherwise safe, but this should be recorded.
- The final URL should be persisted later.

## Part 9: Main Verification Function

Create:

```text
lib/verification/verify-target.ts
```

Expected function:

```ts
export async function verifyTarget(input: string): Promise<VerificationResult>;
```

Flow:

1. Call `validateUrlSafety(input)`.
2. If unsafe, map URL safety failure to verification failure.
3. Initialize redirect chain.
4. Request the normalized URL.
5. If redirect, validate and follow manually.
6. If final status is not acceptable, return failure.
7. Validate Content-Type.
8. Validate Content-Length if present.
9. Return success metadata.

The result should include:

- Original input.
- Normalized URL.
- Final URL.
- Hostname.
- Resolved IPs from initial URL safety check.
- Final status code.
- Final content type.
- Response time.
- Content length if available.
- Redirect chain.
- Verification timestamp.

## Part 10: Mapping URL Safety Errors

URL safety errors from `07-urlnormalization-security.md` should be mapped into verification errors.

Recommended mapping:

```text
EMPTY_INPUT -> INVALID_URL
INPUT_TOO_LONG -> INVALID_URL
INVALID_URL -> INVALID_URL
UNSUPPORTED_PROTOCOL -> INVALID_URL
MISSING_HOSTNAME -> INVALID_URL
CREDENTIALS_NOT_ALLOWED -> INVALID_URL
LOCALHOST_NOT_ALLOWED -> UNSAFE_URL
INTERNAL_HOSTNAME_NOT_ALLOWED -> UNSAFE_URL
IP_ADDRESS_NOT_ALLOWED -> UNSAFE_URL
DNS_RESOLUTION_FAILED -> DNS_FAILED
DNS_RESOLVES_TO_PRIVATE_IP -> UNSAFE_URL
UNSAFE_REDIRECT_TARGET -> UNSAFE_REDIRECT
```

Preserve URL safety detail internally if useful, but expose verification-safe codes to later scan records.

## Part 11: Retry Policy

Verification should not aggressively retry in V1.

Recommended policy:

- No automatic retry for invalid or unsafe URL.
- No retry for 4xx.
- Optional single retry for transient network errors.
- No retry inside unit tests unless explicitly tested.

Reason:

- Verification happens in user-facing scan creation flow later.
- Slow retries can make the UI feel broken.
- The worker can re-verify later if needed.

If adding retry:

- Keep it centralized.
- Use small delay.
- Do not retry unsafe redirects.
- Do not retry non-HTML responses.

## Part 12: Integration With Scan Records Later

Future scan creation should store verification data in `scans`:

```text
input_url
normalized_url
final_url
domain
status_code
content_type
redirect_chain
verification
error_code
error_message
```

If verification succeeds:

```text
status can move toward queued
normalized_url and final_url are persisted
verification JSON stores full success metadata
```

If verification fails:

```text
scan may not be created
or failed scan may be created depending on product decision
error_code and error_message should be shown to user
```

Recommended V1 product behavior:

```text
Do not consume usage for verification failures before scan acceptance.
```

This task does not implement that flow. It only prepares the verifier.

## Part 13: Tests

Use the existing test runner. If none exists, use Vitest as introduced in earlier tasks.

Tests should mock network requests. Avoid depending on live external websites.

Recommended test cases:

### Successful Verification

```text
https://example.com returns 200 text/html -> success
example.com normalizes and verifies -> success
http://example.com returns 200 text/html -> success
```

### URL Safety Failures

```text
localhost -> UNSAFE_URL
file:///etc/passwd -> INVALID_URL
http://169.254.169.254 -> UNSAFE_URL
private DNS result -> UNSAFE_URL
DNS failure -> DNS_FAILED
```

### Redirects

```text
301 to /home -> success with redirect chain
302 to https://www.example.com -> success
redirect chain longer than max -> TOO_MANY_REDIRECTS
redirect to localhost -> UNSAFE_REDIRECT
redirect to 169.254.169.254 -> UNSAFE_REDIRECT
redirect response without Location -> VERIFICATION_FAILED
```

### Status Codes

```text
200 text/html -> success
204 -> UNSUPPORTED_STATUS_CODE or NON_HTML_RESPONSE depending implementation
301 without final -> handled by redirect logic
403 -> FETCH_BLOCKED
404 -> UNSUPPORTED_STATUS_CODE
429 -> FETCH_BLOCKED
500 -> UNSUPPORTED_STATUS_CODE
```

### Content Type

```text
200 application/json -> NON_HTML_RESPONSE
200 application/pdf -> NON_HTML_RESPONSE
200 image/png -> NON_HTML_RESPONSE
200 text/html; charset=utf-8 -> success
200 missing content-type -> NON_HTML_RESPONSE
```

### Timeout And Network Errors

```text
fetch abort -> CONNECTION_TIMEOUT
network failure -> CONNECTION_FAILED
TLS/SSL failure -> SSL_ERROR if distinguishable, otherwise CONNECTION_FAILED
```

### Content Length

```text
content-length above limit -> RESPONSE_TOO_LARGE
content-length below limit -> continue
missing content-length -> continue
```

## Part 14: Manual Verification Script Optional

If useful, create a local-only developer script:

```text
scripts/verify-url.ts
```

It can call:

```ts
verifyTarget(process.argv[2]);
```

Rules:

- Do not expose this as a production API route.
- Do not make this required for the app to run.
- Do not commit secrets.

This is optional. Tests are more important.

## Part 15: UI Integration Later

The future New Scan page should be able to display verification errors such as:

```text
This domain could not be resolved.
The website took too long to respond.
The website redirects too many times.
The website redirects to an unsafe target.
This URL does not appear to return an HTML page.
```

This task should only provide error codes and messages. Do not build the scan form UI here.

## Part 16: Security Notes

Verification is still not a complete network sandbox.

Application-layer protections in this task:

- URL safety validation before fetch.
- DNS resolution safety checks.
- Manual redirect validation.
- Timeout limits.
- Redirect limits.
- Content type rejection.
- Response size preflight.

Future infrastructure hardening:

- Block private network egress at the hosting/network layer.
- Use an outbound proxy with SSRF protections.
- Pin DNS results during connect if using a custom fetch agent.
- Re-check DNS immediately before fetching.
- Add body streaming size limits in the page fetcher.

Agents should not remove application-layer safety checks just because infrastructure-level protections may be added later.

## Part 17: Validation

Run:

```bash
npm run lint
npm run typecheck
npm run build
```

Run tests:

```bash
npm run test
```

If tests use mocked fetch, verify that:

- Redirects are not followed automatically.
- Unsafe redirects are rejected before any second request.
- Timeouts map to the expected error code.

## Expected Final State

At the end of this task:

- A reusable `verifyTarget` function exists.
- Verification uses URL safety validation first.
- Redirects are followed manually.
- Redirect targets are validated safely.
- Final response status is checked.
- Final content type is checked.
- Content-Length is checked when available.
- Timeouts and network failures return structured errors.
- Tests cover success and failure paths.
- No scan creation or SEO analysis has been implemented.

## Acceptance Criteria

This task is complete when:

1. `verifyTarget(input)` exists and returns structured success or failure results.
2. Verification never fetches raw user input directly.
3. URL safety validation runs before the first HTTP request.
4. Automatic redirect following is disabled.
5. Redirect targets are validated before being followed.
6. Redirect chains are recorded.
7. Redirect chains over the configured limit fail.
8. Unsafe redirects fail.
9. Unreachable domains fail with structured errors.
10. Timeouts fail with `CONNECTION_TIMEOUT`.
11. Blocked statuses such as 403 and 429 map to `FETCH_BLOCKED`.
12. Non-2xx final statuses are rejected for V1 analysis.
13. Non-HTML content types are rejected.
14. Large responses are rejected when `Content-Length` exceeds the configured limit.
15. Verification result includes normalized URL, final URL, status code, content type, response time, and redirect chain when available.
16. Tests cover success, invalid URL, unsafe URL, DNS failure, redirects, unsafe redirects, status codes, content types, and timeout/network errors.
17. No scan API, queue, worker, SEO extraction, report generation, PDF export, or billing logic is added.
18. Lint, typecheck, build, and tests pass, or any environment-specific blocker is documented.

## Agent Notes

- Keep verification separate from page fetching for analysis.
- Do not use `fetch` with automatic redirects.
- Do not read large bodies in verification.
- Do not consume scan usage in this task.
- Do not create scan records in this task.
- Make failure codes stable because future UI and scan records will depend on them.
- Prefer conservative rejection when a target is ambiguous.
- If a site behaves oddly with `HEAD`, use `GET` with manual redirects and minimal body handling.
- Future scan creation should call this verifier before accepting a scan.
