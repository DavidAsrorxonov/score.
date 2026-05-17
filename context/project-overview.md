# scōre.

## Overview

scōre. is an AI-powered SEO analyzer and report platform. Authenticated users enter a domain or URL, the system verifies that the target exists and is reachable, analyzes the page for technical SEO, on-page SEO, content quality, metadata, indexability, and basic performance signals, then generates a detailed AI-assisted report with prioritized recommendations.

Version 1 is focused on single-page analysis. Users can analyze a homepage from a bare domain input or analyze one submitted URL directly. Whole-site crawling, scheduled monitoring, advanced competitor analysis, and agency-grade features are planned paid capabilities for later versions, but the V1 architecture must leave room for them.

The product should feel like a serious SEO audit tool for business owners, developers, marketers, and agencies. Reports should explain what is wrong, why it matters, how severe it is, and what the user should do next.

## Product Goal

The core goal of Version 1 is:

> Let an authenticated user submit a domain or URL and receive a saved, detailed, shareable, exportable SEO report generated from deterministic analysis and AI-written recommendations.

scōre. should not rely on AI to invent SEO facts. The application must first collect and analyze objective page data, produce structured findings, and then use AI to explain, prioritize, and expand those findings into a useful report.

## Version 1 Goals

1. Require users to create an account or log in before using the analyzer.
2. Let users submit either a bare domain, homepage URL, or specific page URL.
3. Normalize and validate submitted inputs safely.
4. Verify that the domain or URL exists and is reachable.
5. Enforce the free-tier limit of 5 URL scans per day.
6. Create scan jobs that run asynchronously through a background worker.
7. Analyze one page per scan in Version 1.
8. Extract factual SEO data from the fetched HTML.
9. Generate deterministic SEO findings and category scores.
10. Generate AI-written summaries, explanations, and recommendations from the deterministic findings.
11. Persist scan history and report data for each user.
12. Provide a detailed private report page.
13. Provide a public shareable report link.
14. Provide PDF export for completed reports.
15. Prepare clear plan boundaries for future paid features.

## Core User Flow

1. User visits the website.
2. User signs up or logs in.
3. User lands on the authenticated dashboard.
4. User enters a domain or URL into the scan form.
5. App checks whether the user has scans remaining for the day.
6. App normalizes the input into a safe HTTP or HTTPS URL.
7. App rejects invalid, unsafe, private, or unsupported targets.
8. App verifies that the target domain or URL is reachable.
9. App creates a scan record with a queued status.
10. App sends a scan job to the background queue.
11. User is redirected to a scan progress or report page.
12. Worker fetches the page and records response metadata.
13. Worker extracts SEO data from the page HTML.
14. Worker runs deterministic SEO checks and scoring.
15. Worker sends structured findings to the AI report generator.
16. AI generates report sections, recommendations, and suggested improvements.
17. App marks the scan as completed.
18. User views the full SEO report.
19. User can revisit the report from scan history.
20. User can share the report through a public link.
21. User can export the report as a PDF.

## Target Users

scōre. should be understandable and useful for a broad audience:

- Business owners who want to understand what is wrong with their website.
- Developers who need concrete technical SEO tasks.
- Marketers who need content and metadata recommendations.
- Freelancers and agencies who want client-ready audit reports.
- Founders and operators who need quick SEO checks without using complex enterprise tools.

The UI and report language should support both non-technical and technical users. The app should explain findings plainly while still preserving enough technical evidence for developers to act on them.

## Features

### Authentication And Accounts

- User sign-up and login are required before scans can be created.
- Authenticated routes are protected.
- Each scan belongs to a user account.
- Users can view their own scan history.
- Future paid plans should attach to the user or billing account without rewriting scan ownership.

### Dashboard

- Authenticated users land on a dashboard.
- Dashboard shows scan usage for the current day.
- Dashboard shows recent scans and their statuses.
- Dashboard provides a clear entry point for creating a new scan.
- Dashboard should make the free-tier limit visible before the user hits the limit.

### URL And Domain Submission

- Users can enter a bare domain such as `example.com`.
- Users can enter a full homepage URL such as `https://example.com`.
- Users can enter a specific page URL such as `https://example.com/pricing`.
- Bare domains should default to HTTPS when normalized.
- Invalid and unsupported inputs should return clear validation errors.

### Domain Verification

- The app verifies that submitted targets exist and are reachable.
- Verification should check DNS resolution, protocol support, redirects, response status, content type, and final URL safety.
- The system must protect against SSRF and must reject private, local, internal, and unsupported targets.
- Verification results should be stored on the scan record for debugging and reporting.

### Usage Limits

- Free users receive 5 URL scans per day.
- Scan attempts should be counted only when a scan is accepted into the system.
- Failed validation should not consume usage.
- Plan and usage logic should be designed so paid limits can be added later.
- When users exceed the free limit, the UI should block new scans and show an upgrade-oriented message.

### Scan Job System

- Scans should run asynchronously through a queue and worker.
- The web app should create scan records and enqueue jobs.
- The worker should perform fetching, extraction, analysis, AI generation, and PDF generation where appropriate.
- The frontend should show scan progress using polling or a similar lightweight status mechanism.
- Scan statuses should be explicit and persisted.

Recommended V1 statuses:

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

### Page Fetching

- Version 1 fetches one page per scan.
- The fetcher should follow safe redirects.
- The fetcher should enforce timeout limits.
- The fetcher should enforce response size limits.
- The fetcher should accept HTML-like content only for analysis.
- The fetcher should record status code, headers, final URL, response time, page size, and redirect chain.

### SEO Extraction

The analyzer should extract objective page data including:

- Page title
- Meta description
- Meta robots
- Canonical URL
- H1 tags
- H2 and H3 headings
- Word count
- Internal links
- External links
- Images and alt text
- Open Graph metadata
- Twitter card metadata
- JSON-LD structured data
- Viewport meta tag
- HTML language attribute
- Charset
- HTTPS status
- Basic response timing
- Basic page size information

### Deterministic SEO Checks

The application should create structured findings from code-based checks. Findings should be factual and backed by evidence.

Example checks:

- Missing title tag
- Title too short or too long
- Missing meta description
- Meta description too short or too long
- Missing H1
- Multiple H1 tags
- Missing canonical tag
- Page marked as noindex
- Missing viewport tag
- Missing image alt text
- Low word count
- Missing Open Graph metadata
- Missing structured data
- Slow response time
- Large HTML response
- Weak heading structure

Each finding should include:

- Category
- Severity
- Title
- Description
- Evidence
- Recommendation
- Affected URL

### SEO Scoring

Each completed scan should produce explainable scores.

Recommended V1 score categories:

- Overall SEO score
- Technical SEO score
- Content SEO score
- Metadata score
- Indexability score
- Basic performance score

Scores should be calculated from deterministic checks and weights. AI should not create the numeric scores.

### AI Report Generation

AI should transform structured findings into a readable report. It should not be the source of truth for technical facts.

AI-generated sections should include:

- Executive summary
- Top priority fixes
- Technical SEO explanation
- Content SEO recommendations
- Suggested title tags
- Suggested meta descriptions
- Developer action checklist
- Business-owner-friendly explanation

AI output should be persisted so the report can be reopened without regenerating content.

### Report Page

The private report page is the main product experience.

It should show:

- Analyzed URL
- Final URL
- Scan date
- Scan status
- Overall score
- Category scores
- Executive summary
- Top priority issues
- Technical SEO findings
- Content SEO findings
- Metadata findings
- Indexability findings
- Basic performance findings
- AI recommendations
- Suggested metadata
- Developer checklist
- Share button
- PDF export button

The report should be detailed but scannable. Important issues should be prioritized clearly.

### Scan History

- Users can view previous scans.
- Each scan list item should show URL, date, status, score, and main issue counts.
- Users can open completed reports.
- Users should be able to identify failed scans and understand why they failed.
- Rescan can be added if usage limits allow it.

### Shareable Reports

- Users can create or access a public report URL.
- Public report URLs should not expose private account information.
- Shared reports should be read-only.
- Future paid plans may limit branding, expiration, or white-label options.

### PDF Export

- Completed reports can be exported as PDF.
- PDF output should be polished enough for business and client use.
- PDF export should use persisted report data rather than rerunning the scan.
- PDF generation may run as a background job or controlled server-side action.

### Plan Boundaries

Version 1 should include a simple plan model even if only the free tier is active at launch.

Free tier:

- Account required
- 5 URL scans per day
- Homepage and single URL scans
- Saved reports
- Shareable reports
- PDF export, possibly limited or branded

Future paid tier:

- Higher scan limits
- Whole-site crawling
- Competitor comparison
- Scheduled scans
- Historical tracking
- JavaScript rendering
- Advanced PDF export
- White-label reports
- Priority queue

## Scope

### In Scope For Version 1

- Next.js application foundation
- Authentication and protected routes
- User dashboard
- Scan creation form
- Free-tier daily usage limit
- Safe URL normalization and validation
- Domain and URL reachability verification
- One-page scan job creation
- Background worker for scan execution
- HTML fetching
- SEO data extraction
- Deterministic SEO checks
- Explainable SEO scoring
- AI-generated report sections
- Private report pages
- Scan history
- Public shareable report pages
- PDF export
- Basic plan model prepared for paid features
- Error handling for common scan failures
- Tests for security-sensitive and analysis-critical logic

### Out Of Scope For Version 1

- Whole-site crawling
- Paid subscription checkout as a fully polished billing flow
- Large-scale competitor crawling
- Scheduled scans
- Historical SEO trend charts
- Team accounts and organization permissions
- White-label agency reports
- Backlink analysis
- Keyword rank tracking
- Full Lighthouse or PageSpeed Insights integration
- Browser-rendered JavaScript crawling as the default path
- Mobile-native applications
- Enterprise permission tiers
- Multi-language report generation

## Success Criteria

Version 1 is successful when:

1. A new user can sign up and access a protected dashboard.
2. A user can submit `example.com`, `https://example.com`, or a specific page URL.
3. The app safely normalizes and validates the submitted input.
4. The app rejects unsafe targets such as local, private, internal, and unsupported URLs.
5. The app verifies that the submitted target is reachable.
6. The app enforces the free-tier limit of 5 scans per day.
7. A valid scan is created as a background job.
8. The worker fetches and analyzes one page.
9. The analyzer produces structured deterministic SEO findings.
10. The scoring engine produces explainable category scores.
11. AI generates report copy from structured findings.
12. The completed report is saved and viewable in the user account.
13. The user can revisit the report from scan history.
14. The user can open a public shareable report link.
15. The user can export the report as PDF.
16. Failed scans show clear, useful errors.
17. The architecture can later support paid whole-site crawling without rewriting the V1 foundation.

## Version 1 Completion Definition

Version 1 ends when the complete single-page SEO scan flow works from account creation to saved report:

```text
sign up
log in
submit URL
check usage
validate target
verify reachability
create scan job
run worker
fetch page
extract SEO data
generate findings
calculate scores
generate AI report
save report
view report
share report
export PDF
block sixth free scan in one day
```

At that point, scōre. is ready for early users and can move into Version 2 planning for paid whole-site crawling, competitor comparison, scheduled scans, and historical SEO monitoring.
