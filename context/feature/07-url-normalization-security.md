# 07. URL Normalization And Security

## Purpose

This task implements the URL normalization and security layer for scōre.. Users can submit arbitrary domains and URLs, so the application must treat every submitted target as hostile until it has been normalized, validated, DNS-checked, and confirmed safe for server-side fetching.

This is one of the most security-sensitive parts of the product. The goal is to prevent SSRF, local network access, unsafe protocols, malformed inputs, redirect abuse, and ambiguous URL handling before later tasks build domain verification, scan creation, and page fetching.

This task does not implement domain reachability verification, scan creation, queue jobs, workers, SEO extraction, reports, or billing. It builds the reusable URL safety utilities those future systems must call.

## Required Context

Before starting this task, read these files:

1. `project-overview.md`
2. `architecture-context.md`
3. `04-database-schema.md`
4. `06-usage-limits.md`

Important architecture rules:

- User-submitted URLs are untrusted input.
- SSRF protections are mandatory before any network request to a user-submitted target.
- Redirect safety must be checked, not assumed.
- Both API request handlers and background workers must use the same URL safety utilities.

## Goal

At the end of this task:

- The app can normalize domain and URL input into a canonical HTTP or HTTPS URL.
- Unsafe protocols are rejected.
- Localhost and internal hostnames are rejected.
- Private, loopback, link-local, multicast, and reserved IP ranges are rejected.
- DNS results are checked before network requests.
- Redirect targets can be evaluated safely by later fetchers.
- Utilities return structured success/error results.
- Tests cover valid, invalid, and hostile URL inputs.

These utilities should be ready for future integration into:

- Domain verification
- Scan creation API
- Worker page fetching
- Redirect chain validation

## Scope

### In Scope

- URL input trimming and normalization.
- Bare domain support.
- HTTP/HTTPS protocol enforcement.
- Hostname validation.
- Public IP safety checks.
- DNS resolution safety checks.
- Unsafe hostname blocking.
- Redirect target validation helper.
- Structured error codes.
- Tests for normalization and SSRF protection.
- Documentation of how later scan flows must use these utilities.

### Out Of Scope

- Domain reachability verification.
- Actual HTTP fetch logic.
- Redirect following implementation.
- Response content-type validation.
- Response size limits.
- Timeout handling.
- Scan creation API.
- Queue jobs.
- Worker execution.
- SEO extraction.
- AI report generation.
- PDF generation.
- Billing.

The next task, `08-domain-verification.md`, will use this safety layer to verify that a domain or URL exists and is reachable.

## Supported User Inputs

The system should accept:

```text
example.com
www.example.com
https://example.com
http://example.com
https://example.com/pricing
https://www.example.com/blog/post?ref=homepage
```

The system should normalize:

```text
example.com
```

to:

```text
https://example.com/
```

The system should normalize:

```text
www.example.com
```

to:

```text
https://www.example.com/
```

The system should preserve valid path and query values:

```text
https://example.com/pricing?utm_source=test
```

can remain:

```text
https://example.com/pricing?utm_source=test
```

Do not remove tracking parameters in this task. URL canonicalization for SEO analysis can happen later.

## Inputs To Reject

Reject unsupported or unsafe values such as:

```text
localhost
http://localhost
127.0.0.1
http://127.0.0.1
0.0.0.0
http://0.0.0.0
::1
http://[::1]
file:///etc/passwd
ftp://example.com
data:text/html,hello
mailto:test@example.com
javascript:alert(1)
http://169.254.169.254/latest/meta-data
http://metadata.google.internal
http://10.0.0.1
http://172.16.0.1
http://192.168.1.1
http://[fd00::1]
http://[fe80::1]
```

Also reject:

- Empty strings.
- Whitespace-only strings.
- Extremely long inputs.
- URLs with unsupported protocols.
- URLs with missing hostnames.
- URLs with embedded credentials.
- Hostnames containing obvious invalid characters.
- Hostnames resolving only to unsafe IPs.

## Recommended Files

Create:

```text
lib/url/types.ts
lib/url/errors.ts
lib/url/normalize-url.ts
lib/url/ip-ranges.ts
lib/url/is-private-ip.ts
lib/url/resolve-hostname.ts
lib/url/validate-url-safety.ts
lib/url/validate-redirect-url.ts
lib/url/index.ts
```

Tests:

```text
lib/url/__tests__/normalize-url.test.ts
lib/url/__tests__/url-safety.test.ts
```

If the project uses a different test structure, follow the existing convention.

## Part 1: Define Result Types

Create:

```text
lib/url/types.ts
```

Recommended types:

```ts
export type UrlSafetyErrorCode =
  | "EMPTY_INPUT"
  | "INPUT_TOO_LONG"
  | "INVALID_URL"
  | "UNSUPPORTED_PROTOCOL"
  | "MISSING_HOSTNAME"
  | "CREDENTIALS_NOT_ALLOWED"
  | "LOCALHOST_NOT_ALLOWED"
  | "INTERNAL_HOSTNAME_NOT_ALLOWED"
  | "IP_ADDRESS_NOT_ALLOWED"
  | "DNS_RESOLUTION_FAILED"
  | "DNS_RESOLVES_TO_PRIVATE_IP"
  | "UNSAFE_REDIRECT_TARGET";

export type NormalizedUrlResult =
  | {
      ok: true;
      input: string;
      normalizedUrl: string;
      protocol: "http:" | "https:";
      hostname: string;
      port: string;
      pathname: string;
      search: string;
    }
  | {
      ok: false;
      input: string;
      code: UrlSafetyErrorCode;
      message: string;
    };

export type UrlSafetyResult =
  | {
      ok: true;
      normalizedUrl: string;
      hostname: string;
      resolvedIps: string[];
    }
  | {
      ok: false;
      normalizedUrl?: string;
      hostname?: string;
      code: UrlSafetyErrorCode;
      message: string;
      resolvedIps?: string[];
    };
```

Rules:

- Return structured results for expected user input failures.
- Do not throw for normal invalid input.
- Throw only for unexpected programming or system errors.
- User-facing messages should be safe and clear.

## Part 2: Normalize Raw Input

Create:

```text
lib/url/normalize-url.ts
```

Expected function:

```ts
export function normalizeUrlInput(input: string): NormalizedUrlResult;
```

Behavior:

1. Trim whitespace.
2. Reject empty input.
3. Reject overly long input.
4. If no protocol is present, prepend `https://`.
5. Parse using the standard `URL` constructor.
6. Allow only `http:` and `https:`.
7. Require a hostname.
8. Reject embedded credentials.
9. Lowercase hostname.
10. Remove URL hash fragments.
11. Normalize the final URL string.

Recommended max input length:

```text
2048 characters
```

Hash behavior:

```text
https://example.com/page#section
```

should normalize to:

```text
https://example.com/page
```

Reason:

- Fragment identifiers are client-side only and should not affect server fetch targets.

Do not:

- Strip query parameters.
- Force `http` to `https` if the user explicitly entered `http://`.
- Perform DNS resolution in this function.
- Fetch the URL.

## Part 3: Hostname Safety Checks

The normalized hostname must be checked before DNS or fetch.

Reject:

```text
localhost
localhost.localdomain
*.localhost
```

Reject known internal metadata hostnames:

```text
metadata.google.internal
metadata
```

Reject obvious internal-only names where appropriate:

```text
*.internal
*.local
*.lan
*.home
```

Be careful:

- Some real public domains may contain words like `internal` as a subdomain. The strongest rule is about TLD-style internal names and known metadata hosts.
- Prefer clear security over permissiveness for V1.

Expected helper:

```ts
export function isBlockedHostname(hostname: string): boolean;
```

This can live in:

```text
lib/url/validate-url-safety.ts
```

or a separate helper file.

## Part 4: IP Address Detection

Create:

```text
lib/url/is-private-ip.ts
```

Expected function:

```ts
export function isUnsafeIpAddress(ip: string): boolean;
```

It should return `true` for:

### IPv4

```text
0.0.0.0/8
10.0.0.0/8
100.64.0.0/10
127.0.0.0/8
169.254.0.0/16
172.16.0.0/12
192.0.0.0/24
192.0.2.0/24
192.168.0.0/16
198.18.0.0/15
198.51.100.0/24
203.0.113.0/24
224.0.0.0/4
240.0.0.0/4
255.255.255.255/32
```

### IPv6

```text
::1/128
::/128
fc00::/7
fe80::/10
ff00::/8
2001:db8::/32
```

Also reject IPv4-mapped IPv6 addresses that map to unsafe IPv4 ranges:

```text
::ffff:127.0.0.1
::ffff:10.0.0.1
::ffff:192.168.1.1
```

Implementation options:

- Use a small well-maintained package for IP parsing/range checks.
- Or implement carefully using Node's `net.isIP` plus range conversion helpers.

If adding a dependency, keep it narrow and security-oriented.

Do not write brittle string-prefix checks for IP ranges.

## Part 5: Direct IP Host Handling

If the URL hostname is itself an IP address, validate it immediately.

Examples:

```text
https://8.8.8.8/
```

May be allowed if direct IP scans are supported.

For V1, recommended policy:

```text
Reject direct IP addresses, even public ones.
```

Reason:

- Product is domain/URL-oriented.
- Direct IP support increases edge cases.
- SEO reports are less useful for raw IP targets.

If this policy is chosen, reject all direct IP hostnames with:

```text
IP_ADDRESS_NOT_ALLOWED
```

If the team wants to allow public IPs later, the helper can be relaxed.

## Part 6: DNS Resolution

Create:

```text
lib/url/resolve-hostname.ts
```

Expected function:

```ts
export async function resolveHostname(hostname: string): Promise<string[]>;
```

Use Node's DNS promises API:

```ts
import { promises as dns } from "node:dns";
```

Recommended behavior:

- Resolve both A and AAAA records.
- Return a combined list of IP addresses.
- If one family fails but the other succeeds, return successful results.
- If both fail, return DNS resolution failure.

Expected helper:

```ts
export async function resolvePublicIps(
  hostname: string,
): Promise<
  | { ok: true; ips: string[] }
  | { ok: false; code: "DNS_RESOLUTION_FAILED"; message: string }
>;
```

After resolving, check every returned IP.

Policy:

```text
If any resolved IP is unsafe, reject the hostname.
```

Reason:

- DNS may return mixed public/private results.
- Fetchers may connect to any returned address depending on runtime behavior.

If no IPs are returned, reject.

## Part 7: Full URL Safety Validation

Create:

```text
lib/url/validate-url-safety.ts
```

Expected function:

```ts
export async function validateUrlSafety(
  input: string,
): Promise<UrlSafetyResult>;
```

Flow:

1. Normalize raw input.
2. If normalization fails, return failure.
3. Check blocked hostname rules.
4. Reject direct IP hostnames according to V1 policy.
5. Resolve hostname with DNS.
6. Reject if DNS fails.
7. Reject if any resolved IP is unsafe.
8. Return normalized URL, hostname, and resolved IPs.

This function should be the main entry point used by future server routes and workers.

Do not fetch the URL in this function.

## Part 8: Redirect Target Validation

Create:

```text
lib/url/validate-redirect-url.ts
```

Expected function:

```ts
export async function validateRedirectUrl(params: {
  fromUrl: string;
  location: string;
}): Promise<UrlSafetyResult>;
```

Behavior:

1. Resolve relative redirects against the current URL.
2. Normalize the redirect target.
3. Run the same safety validation as normal URLs.
4. Return structured result.

Examples:

```text
fromUrl = https://example.com
location = /login
result = https://example.com/login
```

```text
fromUrl = https://example.com
location = http://169.254.169.254/latest/meta-data
result = rejected
```

Rules:

- Redirects can cross domains.
- Every redirect target must be validated before following it.
- Relative redirects must be handled safely.
- Unsafe redirect targets must return `UNSAFE_REDIRECT_TARGET` or a specific underlying code.

Actual redirect following belongs to the fetcher/domain verification tasks. This helper only validates a proposed redirect destination.

## Part 9: Error Messages

Create:

```text
lib/url/errors.ts
```

Provide user-safe messages.

Recommended messages:

```ts
export const URL_SAFETY_MESSAGES = {
  EMPTY_INPUT: "Enter a domain or URL to analyze.",
  INPUT_TOO_LONG: "The URL is too long to analyze.",
  INVALID_URL: "Enter a valid domain or URL.",
  UNSUPPORTED_PROTOCOL: "Only HTTP and HTTPS URLs are supported.",
  MISSING_HOSTNAME: "Enter a URL with a valid hostname.",
  CREDENTIALS_NOT_ALLOWED:
    "URLs with embedded usernames or passwords are not supported.",
  LOCALHOST_NOT_ALLOWED: "Localhost URLs cannot be analyzed.",
  INTERNAL_HOSTNAME_NOT_ALLOWED: "Internal hostnames cannot be analyzed.",
  IP_ADDRESS_NOT_ALLOWED: "Direct IP address targets are not supported.",
  DNS_RESOLUTION_FAILED: "This domain could not be resolved.",
  DNS_RESOLVES_TO_PRIVATE_IP:
    "This domain resolves to a private or internal network address.",
  UNSAFE_REDIRECT_TARGET: "The URL redirects to an unsafe target.",
} as const;
```

Rules:

- Do not expose internal IP lists in user-facing messages.
- Do not include raw exception stacks.
- Do not reveal sensitive infrastructure details.

## Part 10: Public API Of The URL Module

Create:

```text
lib/url/index.ts
```

Export only the intended public helpers:

```ts
export { normalizeUrlInput } from "./normalize-url";
export { validateUrlSafety } from "./validate-url-safety";
export { validateRedirectUrl } from "./validate-redirect-url";
export type {
  NormalizedUrlResult,
  UrlSafetyResult,
  UrlSafetyErrorCode,
} from "./types";
```

Internal range helpers can remain unexported unless tests need direct imports.

Future code should import from:

```ts
import { validateUrlSafety } from "@/lib/url";
```

## Part 11: Tests

Add tests using the existing test runner. If none exists, use Vitest.

Install if needed:

```bash
npm install -D vitest
```

Add script if needed:

```json
{
  "scripts": {
    "test": "vitest run"
  }
}
```

### Normalization Tests

Test accepted inputs:

```text
example.com -> https://example.com/
www.example.com -> https://www.example.com/
https://example.com -> https://example.com/
http://example.com -> http://example.com/
https://example.com/pricing -> https://example.com/pricing
https://example.com/path?x=1 -> https://example.com/path?x=1
https://example.com/path#section -> https://example.com/path
```

Test rejected inputs:

```text
""
"   "
"not a url with spaces"
"ftp://example.com"
"file:///etc/passwd"
"javascript:alert(1)"
"https://user:pass@example.com"
```

### IP Safety Tests

Test unsafe IPv4:

```text
127.0.0.1
10.0.0.1
172.16.0.1
172.31.255.255
192.168.1.1
169.254.169.254
0.0.0.0
255.255.255.255
```

Test unsafe IPv6:

```text
::1
fc00::1
fd00::1
fe80::1
ff00::1
2001:db8::1
```

### Hostname Safety Tests

Test rejection:

```text
localhost
http://localhost
test.localhost
metadata.google.internal
example.local
example.internal
```

### DNS Safety Tests

DNS tests can be handled in one of two ways:

1. Unit test with mocked DNS resolver.
2. Integration test using known domains.

Preferred:

```text
Mock DNS resolver for deterministic tests.
```

Mock cases:

```text
example.com -> 93.184.216.34 -> allowed
private.example -> 192.168.1.1 -> rejected
mixed.example -> 93.184.216.34 and 10.0.0.1 -> rejected
missing.example -> DNS failure -> rejected
```

Do not make tests depend heavily on live DNS if avoidable.

### Redirect Tests

Test:

```text
relative redirect /login resolves safely
absolute redirect to https://example.com/login is checked
redirect to localhost is rejected
redirect to 169.254.169.254 is rejected
redirect to file:// is rejected
```

## Part 12: Integration Contract For Later Tasks

Future scan creation must use:

```ts
const safety = await validateUrlSafety(input);

if (!safety.ok) {
  // return validation error
}
```

Future domain verification must:

- Call `validateUrlSafety` before any network request.
- Validate every redirect target with `validateRedirectUrl`.
- Reject redirects to unsafe targets.
- Persist normalized URL and safety error codes on the scan record.

Future page fetcher must:

- Never fetch raw user input directly.
- Fetch only normalized URLs that passed safety validation.
- Re-check redirect targets before following them.
- Enforce response timeout and size limits in its own task.

## Part 13: Security Notes

Important SSRF risks:

- Hostname resolves to private IP.
- DNS rebinding.
- Redirect from public URL to private URL.
- Encoded or unusual IP formats.
- IPv6 loopback and local ranges.
- Embedded credentials.
- Cloud metadata service access.
- Internal `.local` or `.internal` hosts.

V1 mitigations:

- Reject direct IP hostnames.
- Resolve DNS before fetch.
- Reject any unsafe resolved IP.
- Validate every redirect target.
- Reject unsupported protocols.
- Reject localhost and internal hostnames.
- Keep network fetch code separate from normalization code.

Future hardening:

- Custom DNS lookup during fetch to pin resolved public IPs.
- Re-resolve and re-check immediately before connect.
- Use an outbound proxy with network egress restrictions.
- Block private network egress at infrastructure level.
- Add per-request timeout and max response size.

This task should implement application-layer protections, but infrastructure-level egress restrictions are still recommended later.

## Part 14: UI Integration

This task does not build the scan form, but it should prepare error codes and messages for the future UI.

Future new scan UI should be able to show:

```text
Enter a valid domain or URL.
Only HTTP and HTTPS URLs are supported.
Localhost URLs cannot be analyzed.
This domain could not be resolved.
This domain resolves to a private or internal network address.
```

Do not add UI components in this task unless needed for a small developer-only demo.

## Part 15: Validation

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

If no test runner exists and this task adds Vitest, ensure the test script works.

Manual validation can be done through a temporary script if useful, but do not add a production API route for testing.

## Expected Final State

At the end of this task:

- URL normalization utilities exist.
- Unsafe protocols are rejected.
- Embedded credentials are rejected.
- Direct IP targets are rejected for V1.
- Localhost and internal hostnames are rejected.
- DNS resolution is checked.
- Private DNS results are rejected.
- Redirect target safety helper exists.
- Error codes and messages are centralized.
- Tests cover normal, invalid, and hostile inputs.
- No scan creation or domain verification has been implemented.

## Acceptance Criteria

This task is complete when:

1. `normalizeUrlInput` accepts bare domains and valid HTTP/HTTPS URLs.
2. `normalizeUrlInput` rejects empty, malformed, unsupported, and credentialed URLs.
3. URL hashes are removed during normalization.
4. Query strings and paths are preserved.
5. Direct IP targets are rejected according to V1 policy.
6. Localhost targets are rejected.
7. Internal hostnames are rejected.
8. DNS resolution helper exists.
9. Hostnames resolving to private/internal IPs are rejected.
10. Mixed public/private DNS results are rejected.
11. Redirect target validation supports relative and absolute redirects.
12. Redirects to unsafe targets are rejected.
13. Structured error codes and safe messages exist.
14. URL utilities are exported from `lib/url/index.ts`.
15. Tests cover accepted, rejected, IP, DNS, and redirect cases.
16. No HTTP fetching, domain verification, scan creation, queue, worker, SEO, report, PDF, or billing logic is added.
17. Lint, typecheck, build, and tests pass, or any environment-specific blocker is documented.

## Agent Notes

- This is a security task. Keep the implementation conservative.
- Do not fetch user-submitted URLs in this task.
- Do not rely on string-prefix checks for IP range security.
- Use the standard `URL` parser.
- Prefer structured result objects over exceptions for expected validation failures.
- Keep the main public helper simple: `validateUrlSafety(input)`.
- Future agents must use this module before any network request.
- If a URL seems ambiguous, reject it in V1.
- If direct IP support is requested later, relax that rule in a dedicated task with tests.
