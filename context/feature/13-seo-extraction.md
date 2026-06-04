# 13. SEO Extraction

## Purpose

This task implements the SEO extraction layer for scōre.. After the worker safely fetches an HTML page, the system must parse that HTML and extract objective page facts such as title, meta description, canonical URL, headings, links, images, structured data, Open Graph tags, Twitter card tags, word count, language, viewport, and robots directives.

This task extracts factual data only. It does not decide whether something is good or bad, create SEO findings, calculate scores, generate AI recommendations, build report pages, or export PDFs.

The next task, `14-seo-checks.md`, will turn extracted facts into deterministic SEO findings.

## Required Context

Before starting this task, read these files:

1. `project-overview.md`
2. `architecture-context.md`
3. `04-database-schema.md`
4. `11-worker-setup.md`
5. `12-page-fetcher.md`

This task depends on:

- Worker processing `scan.run` jobs.
- Safe page fetcher returning decoded HTML.
- `scan_pages` table with fields for extracted page data.
- Scan lifecycle statuses.

## Goal

At the end of this task:

- A reusable SEO extraction module exists.
- The extractor accepts HTML and page URL context.
- The extractor returns structured page facts.
- The extractor handles malformed HTML gracefully.
- The extractor updates `scan_pages` with extracted facts.
- The worker can fetch a page, extract SEO facts, persist them, and then stop at the SEO checks boundary.
- Tests cover extraction for common HTML cases and edge cases.

No SEO findings or scores should be created in this task.

## Core Rule

Extraction answers:

```text
What is on the page?
```

It does not answer:

```text
Is this good or bad?
```

Examples:

- Extraction can say: `title = "Pricing | Example"`
- Extraction cannot say: `Title is too short`
- Extraction can say: `h1Count = 2`
- Extraction cannot say: `Multiple H1 tags is a high severity issue`

## Scope

### In Scope

- Install HTML parsing dependencies.
- Parse HTML safely on the server.
- Extract title and metadata.
- Extract headings.
- Extract canonical and robots directives.
- Extract language, charset, and viewport.
- Extract internal and external links.
- Extract images and alt text presence.
- Extract Open Graph metadata.
- Extract Twitter card metadata.
- Extract JSON-LD structured data types.
- Extract visible-ish text and word count.
- Persist extracted facts to `scan_pages`.
- Integrate extraction into the worker after page fetch.
- Add tests for extraction.

### Out Of Scope

- SEO findings.
- Severity assignment.
- Recommendations.
- SEO scoring.
- AI report generation.
- Report UI.
- PDF export.
- JavaScript rendering.
- Whole-site crawling.
- Robots.txt fetching.
- Sitemap discovery.
- Broken link checking.
- Competitor comparison.

## Required Packages

Install:

```bash
npm install cheerio
```

Optional if needed:

```bash
npm install html-entities
```

Use Cheerio for deterministic server-side HTML parsing.

Do not add Playwright in this task. Browser-rendered analysis is a later paid/pro feature.

## Recommended Files

Create:

```text
lib/seo/extraction/types.ts
lib/seo/extraction/extract-page-seo.ts
lib/seo/extraction/extract-metadata.ts
lib/seo/extraction/extract-headings.ts
lib/seo/extraction/extract-links.ts
lib/seo/extraction/extract-images.ts
lib/seo/extraction/extract-structured-data.ts
lib/seo/extraction/extract-text.ts
lib/seo/extraction/persist-page-extraction.ts
lib/seo/extraction/index.ts
```

Update:

```text
worker/handlers/run-scan.ts
```

Tests:

```text
lib/seo/extraction/__tests__/extract-page-seo.test.ts
lib/seo/extraction/__tests__/extract-links.test.ts
lib/seo/extraction/__tests__/extract-structured-data.test.ts
```

If the project prefers fewer files initially, it is acceptable to start with one `extract-page-seo.ts` and split later. Keep the public API clean either way.

## Part 1: Extraction Types

Create:

```text
lib/seo/extraction/types.ts
```

Recommended types:

```ts
export type HeadingData = {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
};

export type LinkData = {
  href: string;
  text: string;
  rel: string[];
  target: string | null;
  isInternal: boolean;
  isExternal: boolean;
  isNofollow: boolean;
};

export type ImageData = {
  src: string;
  alt: string | null;
  title: string | null;
  width: string | null;
  height: string | null;
  loading: string | null;
  hasAlt: boolean;
};

export type StructuredDataBlock = {
  type: "json-ld";
  raw: string;
  parsed: unknown | null;
  schemaTypes: string[];
  parseError?: string;
};

export type ExtractedPageSeo = {
  url: string;
  finalUrl: string;
  title: string | null;
  metaDescription: string | null;
  metaRobots: string | null;
  canonicalUrl: string | null;
  htmlLang: string | null;
  charset: string | null;
  viewport: string | null;
  headings: HeadingData[];
  h1: string[];
  h2: string[];
  h3: string[];
  links: LinkData[];
  internalLinks: LinkData[];
  externalLinks: LinkData[];
  images: ImageData[];
  imagesMissingAltCount: number;
  openGraph: Record<string, string>;
  twitterCard: Record<string, string>;
  structuredData: StructuredDataBlock[];
  schemaTypes: string[];
  wordCount: number;
  textSample: string;
};
```

Rules:

- Keep extracted data serializable.
- Avoid returning Cheerio nodes.
- Avoid storing giant text blobs.
- Keep raw JSON-LD blocks only if reasonably bounded.

## Part 2: Main Extractor Function

Create:

```text
lib/seo/extraction/extract-page-seo.ts
```

Expected function:

```ts
export function extractPageSeo(params: {
  html: string;
  url: string;
  finalUrl: string;
}): ExtractedPageSeo;
```

Flow:

1. Load HTML with Cheerio.
2. Extract metadata.
3. Extract headings.
4. Extract links.
5. Extract images.
6. Extract Open Graph metadata.
7. Extract Twitter card metadata.
8. Extract structured data.
9. Extract text and word count.
10. Return structured facts.

Rules:

- Do not throw on malformed HTML.
- Trim whitespace.
- Normalize repeated whitespace to single spaces in text fields.
- Return `null` when a single-value field is missing.
- Return empty arrays/objects for multi-value fields.
- Do not decide severity or recommendations.

## Part 3: Metadata Extraction

Create:

```text
lib/seo/extraction/extract-metadata.ts
```

Extract:

```text
title
meta description
meta robots
canonical URL
html lang
charset
viewport
Open Graph tags
Twitter card tags
```

Selectors:

```text
title -> $("title").first().text()
meta description -> meta[name="description"]
meta robots -> meta[name="robots"]
canonical -> link[rel="canonical"]
html lang -> html[lang]
charset -> meta[charset] or meta[http-equiv="Content-Type"]
viewport -> meta[name="viewport"]
Open Graph -> meta[property^="og:"]
Twitter -> meta[name^="twitter:"]
```

Rules:

- Use first value for single-value fields.
- Preserve maps for Open Graph and Twitter tags.
- Resolve canonical URL relative to final URL when possible.
- Do not validate whether canonical is correct yet.

## Part 4: Heading Extraction

Create:

```text
lib/seo/extraction/extract-headings.ts
```

Extract all headings:

```text
h1
h2
h3
h4
h5
h6
```

Rules:

- Trim text.
- Ignore empty headings.
- Preserve document order.
- Provide convenience arrays for `h1`, `h2`, and `h3`.

Do not create findings such as missing H1 or multiple H1 in this task.

## Part 5: Link Extraction

Create:

```text
lib/seo/extraction/extract-links.ts
```

Extract:

```text
href
anchor text
rel values
target
internal/external classification
nofollow flag
```

Rules:

- Ignore anchors with missing `href`.
- Ignore non-navigation protocols for internal/external counts:
  - `mailto:`
  - `tel:`
  - `javascript:`
  - `data:`
- Resolve relative links against `finalUrl`.
- Treat same hostname as internal.
- Treat different hostname as external.
- Consider protocol and hostname carefully.
- Remove hash-only links from normal link counts if appropriate.

Examples:

```text
/pricing -> internal
https://example.com/about -> internal
https://other.com -> external
mailto:sales@example.com -> ignored or categorized separately
```

Do not check whether links are broken in this task.

## Part 6: Image Extraction

Create:

```text
lib/seo/extraction/extract-images.ts
```

Extract:

```text
src
alt
title
width
height
loading
hasAlt
```

Rules:

- Ignore images without `src` unless needed for reporting later.
- Resolve relative `src` against final URL when possible.
- `hasAlt` should be true when `alt` attribute exists and is not empty after trimming.
- Count missing alt values.
- Do not decide severity.

Note:

- Empty `alt=""` may be valid for decorative images, but V1 extraction should still record it as not having useful alt text. The SEO checks task can decide how to handle it.

## Part 7: Structured Data Extraction

Create:

```text
lib/seo/extraction/extract-structured-data.ts
```

Extract JSON-LD:

```text
script[type="application/ld+json"]
```

For each block:

- Store raw string if reasonably sized.
- Attempt to parse JSON.
- Extract schema types from `@type`.
- Support arrays and `@graph`.
- If parse fails, store parse error and continue.

Recommended schema type extraction cases:

```json
{ "@type": "Organization" }
```

```json
{ "@type": ["Product", "Thing"] }
```

```json
{ "@graph": [{ "@type": "WebSite" }, { "@type": "Organization" }] }
```

Rules:

- Do not fail extraction because one JSON-LD block is malformed.
- Deduplicate schema types.
- Do not validate schema correctness in this task.
- Do not extract microdata or RDFa in V1 unless trivial.

## Part 8: Text And Word Count Extraction

Create:

```text
lib/seo/extraction/extract-text.ts
```

Goal:

- Estimate meaningful visible text and word count.

Remove or ignore:

```text
script
style
noscript
svg
canvas
template
head
```

Recommended behavior:

- Extract text from `body`.
- Normalize whitespace.
- Count words using a simple Unicode-aware split where practical.
- Return a bounded `textSample`.

Recommended `textSample` max:

```text
2000 characters
```

Rules:

- Word count is an estimate.
- Do not use AI for word counting.
- Do not include huge page text in database by default.

## Part 9: Data Normalization

Use small helpers for:

```text
trimOrNull
normalizeWhitespace
dedupeStrings
resolveUrl
safeGetAttribute
```

Recommended file:

```text
lib/seo/extraction/utils.ts
```

Rules:

- Keep helpers deterministic.
- Avoid ad hoc repeated trimming logic across extraction files.
- Preserve user-visible strings after whitespace cleanup.

## Part 10: Persist Extracted Page Data

Create:

```text
lib/seo/extraction/persist-page-extraction.ts
```

Expected function:

```ts
export async function persistPageExtraction(params: {
  scanId: string;
  pageId?: string;
  extraction: ExtractedPageSeo;
}) {}
```

Persist into `scan_pages`:

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
technical_data
updated_at
```

Recommended `technical_data` additions:

```json
{
  "htmlLang": "...",
  "charset": "...",
  "viewport": "...",
  "headingCount": 12,
  "linkCount": 45,
  "structuredDataBlockCount": 2,
  "textSample": "..."
}
```

Rules:

- Do not store all links/images in separate tables in V1 unless already planned.
- It is acceptable to store full extracted arrays in JSONB inside `technical_data` if bounded.
- Do not store unbounded raw HTML in the database.

## Part 11: Worker Integration

Update:

```text
worker/handlers/run-scan.ts
```

Expected flow after this task:

```text
validate job payload
load scan
skip completed/failed scans
set status validating
set status fetching
fetch page HTML
if fetch fails -> mark scan failed
create/update scan_pages metadata
set status analyzing
extract SEO facts from HTML
persist extracted facts
stop with SEO_CHECKS_NOT_IMPLEMENTED
```

Temporary final failure:

```text
error_code = SEO_CHECKS_NOT_IMPLEMENTED
error_message = SEO checks are not implemented yet.
```

Why:

- The worker should not mark scans completed until findings, scores, and reports exist.
- This proves extraction works without faking analysis results.

Do not create `seo_findings` rows in this task.

## Part 12: Scan Page Record Handling

The page fetcher may already create a `scan_pages` row. This task should update that row instead of creating duplicates.

Recommended flow:

1. Fetcher persists or returns fetch metadata.
2. Worker identifies the `scan_pages` record for the scan and final URL.
3. Extraction persistence updates the same row.

If no `scan_pages` row exists:

- Create one using known fetch and extraction metadata.

Unique constraint:

```text
unique(scan_id, url)
```

If the schema uses `final_url` for uniqueness, adapt accordingly.

## Part 13: Error Handling

Extraction should almost never fail completely.

Expected malformed input handling:

- Missing title returns `null`.
- Missing body returns `wordCount = 0`.
- Malformed JSON-LD records parse error but extraction continues.
- Malformed HTML is parsed as best as Cheerio can handle.

Worker failure should happen only for unexpected extraction errors.

Recommended error:

```text
SEO_EXTRACTION_FAILED
```

User-safe message:

```text
The page was fetched, but SEO data could not be extracted.
```

Rules:

- Do not expose raw parser errors to users.
- Log internal details if logging exists.
- Keep extracted partial data if useful, but do not mark scan completed.

## Part 14: Tests

Use Vitest or the existing test runner.

Recommended tests:

### Metadata

```text
extracts title
extracts meta description
extracts canonical URL
resolves relative canonical URL
extracts meta robots
extracts viewport
extracts html lang
extracts charset
returns null for missing single-value fields
```

### Headings

```text
extracts h1-h6 in order
ignores empty headings
returns h1/h2/h3 convenience arrays
normalizes whitespace
```

### Links

```text
resolves relative links
classifies same-host links as internal
classifies different-host links as external
detects nofollow
ignores javascript links
ignores mailto links for normal counts
handles hash-only links
```

### Images

```text
extracts image src
resolves relative image src
extracts alt/title/width/height/loading
counts images missing useful alt text
handles empty alt
```

### Structured Data

```text
parses valid JSON-LD
extracts @type string
extracts @type array
extracts @graph types
deduplicates schema types
continues when JSON-LD is malformed
```

### Text

```text
ignores script/style/noscript
extracts body text
normalizes whitespace
counts words
bounds text sample
```

### Worker Integration

```text
fetch success triggers extraction
extraction results persist to scan_pages
extraction failure marks scan failed
successful extraction stops with SEO_CHECKS_NOT_IMPLEMENTED
no seo_findings are created
```

## Part 15: Manual Validation

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

3. Create a scan for an HTML page.
4. Confirm worker fetches the page.
5. Confirm worker extracts title, metadata, headings, links, images, and word count.
6. Confirm `scan_pages` row is updated.
7. Confirm scan stops with `SEO_CHECKS_NOT_IMPLEMENTED`.

If external network access is restricted, rely on mocked tests and document manual validation as blocked.

## Part 16: Security And Performance Requirements

Rules:

- Do not execute scripts.
- Do not evaluate page JavaScript.
- Do not load external assets.
- Do not parse using a browser in this task.
- Do not store raw HTML in PostgreSQL.
- Bound large text samples.
- Keep extracted arrays reasonably bounded if storing in JSONB.
- Treat malformed HTML as normal.

Recommended bounds:

```text
max stored text sample: 2000 characters
max stored links in technical_data: 500
max stored images in technical_data: 500
max stored JSON-LD raw block: 100000 characters
```

If a page exceeds bounds, truncate stored diagnostic arrays but preserve counts.

## Expected Final State

At the end of this task:

- scōre. can parse fetched HTML into structured SEO facts.
- Extracted facts are persisted to `scan_pages`.
- The worker moves from fetch to extraction.
- Successful extraction stops at the SEO checks boundary.
- No findings, scores, or reports are generated yet.

## Acceptance Criteria

This task is complete when:

1. Cheerio is installed.
2. `extractPageSeo` exists and accepts HTML, URL, and final URL.
3. The extractor returns structured metadata.
4. The extractor returns heading data.
5. The extractor returns link data with internal/external classification.
6. The extractor returns image data and missing-alt counts.
7. The extractor returns Open Graph and Twitter metadata.
8. The extractor parses JSON-LD and extracts schema types.
9. The extractor returns word count and bounded text sample.
10. Extracted facts are persisted to `scan_pages`.
11. Worker runs extraction after successful fetch.
12. Worker does not create SEO findings yet.
13. Worker stops with `SEO_CHECKS_NOT_IMPLEMENTED` after successful extraction.
14. Tests cover metadata, headings, links, images, structured data, text extraction, and worker integration.
15. No SEO checks, scoring, AI report, report UI, PDF, billing, site crawl, or competitor logic is added.
16. Lint, typecheck, build, and tests pass, or any environment-specific blocker is documented.

## Agent Notes

- This task extracts facts only.
- Do not create issue findings.
- Do not calculate scores.
- Do not call AI.
- Do not execute page JavaScript.
- Do not use Playwright.
- Keep extraction deterministic and testable.
- Preserve enough data for SEO checks and AI report generation later.
- If extraction data is too large to store fully, store counts plus bounded samples.
