# UI Context

## Design Direction

scōre. uses a clean Vercel-inspired interface based on the tweakcn Vercel theme. The UI should feel precise, minimal, fast, and professional. It is a SaaS analytics/reporting product, not a decorative marketing site.

The interface should prioritize:

- Clear hierarchy
- Dense but readable information
- Strong table and report layouts
- Minimal visual noise
- High contrast
- Predictable navigation
- Professional report presentation
- Reusable shadcn/ui primitives
- Global design tokens instead of hardcoded colors

Agents must use the global Tailwind and shadcn theme tokens for styling. Do not hardcode one-off colors, shadows, border radii, or typography values inside individual feature components unless there is a documented product reason.

## Theme Source

The app uses the tweakcn Vercel theme as the global design foundation.

All shadcn/ui components should inherit from the CSS variable system below. This theme should live in the global stylesheet, usually `app/globals.css`.

```css
@import "tailwindcss";

@custom-variant dark (&:is(.dark *));

:root {
  --background: oklch(0.99 0 0);
  --foreground: oklch(0 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0 0 0);
  --popover: oklch(0.99 0 0);
  --popover-foreground: oklch(0 0 0);
  --primary: oklch(0 0 0);
  --primary-foreground: oklch(1 0 0);
  --secondary: oklch(0.94 0 0);
  --secondary-foreground: oklch(0 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.44 0 0);
  --accent: oklch(0.94 0 0);
  --accent-foreground: oklch(0 0 0);
  --destructive: oklch(0.63 0.19 23.03);
  --destructive-foreground: oklch(1 0 0);
  --border: oklch(0.92 0 0);
  --input: oklch(0.94 0 0);
  --ring: oklch(0 0 0);
  --chart-1: oklch(0.81 0.17 75.35);
  --chart-2: oklch(0.55 0.22 264.53);
  --chart-3: oklch(0.72 0 0);
  --chart-4: oklch(0.92 0 0);
  --chart-5: oklch(0.56 0 0);
  --sidebar: oklch(0.99 0 0);
  --sidebar-foreground: oklch(0 0 0);
  --sidebar-primary: oklch(0 0 0);
  --sidebar-primary-foreground: oklch(1 0 0);
  --sidebar-accent: oklch(0.94 0 0);
  --sidebar-accent-foreground: oklch(0 0 0);
  --sidebar-border: oklch(0.94 0 0);
  --sidebar-ring: oklch(0 0 0);
  --font-sans: Geist, sans-serif;
  --font-serif: Georgia, serif;
  --font-mono: Geist Mono, monospace;
  --radius: 0.5rem;
  --shadow-x: 0px;
  --shadow-y: 1px;
  --shadow-blur: 2px;
  --shadow-spread: 0px;
  --shadow-opacity: 0.18;
  --shadow-color: hsl(0 0% 0%);
  --shadow-2xs: 0px 1px 2px 0px hsl(0 0% 0% / 0.09);
  --shadow-xs: 0px 1px 2px 0px hsl(0 0% 0% / 0.09);
  --shadow-sm:
    0px 1px 2px 0px hsl(0 0% 0% / 0.18), 0px 1px 2px -1px hsl(0 0% 0% / 0.18);
  --shadow:
    0px 1px 2px 0px hsl(0 0% 0% / 0.18), 0px 1px 2px -1px hsl(0 0% 0% / 0.18);
  --shadow-md:
    0px 1px 2px 0px hsl(0 0% 0% / 0.18), 0px 2px 4px -1px hsl(0 0% 0% / 0.18);
  --shadow-lg:
    0px 1px 2px 0px hsl(0 0% 0% / 0.18), 0px 4px 6px -1px hsl(0 0% 0% / 0.18);
  --shadow-xl:
    0px 1px 2px 0px hsl(0 0% 0% / 0.18), 0px 8px 10px -1px hsl(0 0% 0% / 0.18);
  --shadow-2xl: 0px 1px 2px 0px hsl(0 0% 0% / 0.45);
  --tracking-normal: 0em;
  --spacing: 0.25rem;
}

.dark {
  --background: oklch(0 0 0);
  --foreground: oklch(1 0 0);
  --card: oklch(0.14 0 0);
  --card-foreground: oklch(1 0 0);
  --popover: oklch(0.18 0 0);
  --popover-foreground: oklch(1 0 0);
  --primary: oklch(1 0 0);
  --primary-foreground: oklch(0 0 0);
  --secondary: oklch(0.25 0 0);
  --secondary-foreground: oklch(1 0 0);
  --muted: oklch(0.23 0 0);
  --muted-foreground: oklch(0.72 0 0);
  --accent: oklch(0.32 0 0);
  --accent-foreground: oklch(1 0 0);
  --destructive: oklch(0.69 0.2 23.91);
  --destructive-foreground: oklch(0 0 0);
  --border: oklch(0.26 0 0);
  --input: oklch(0.32 0 0);
  --ring: oklch(0.72 0 0);
  --chart-1: oklch(0.81 0.17 75.35);
  --chart-2: oklch(0.58 0.21 260.84);
  --chart-3: oklch(0.56 0 0);
  --chart-4: oklch(0.44 0 0);
  --chart-5: oklch(0.92 0 0);
  --sidebar: oklch(0.18 0 0);
  --sidebar-foreground: oklch(1 0 0);
  --sidebar-primary: oklch(1 0 0);
  --sidebar-primary-foreground: oklch(0 0 0);
  --sidebar-accent: oklch(0.32 0 0);
  --sidebar-accent-foreground: oklch(1 0 0);
  --sidebar-border: oklch(0.32 0 0);
  --sidebar-ring: oklch(0.72 0 0);
  --font-sans: Geist, sans-serif;
  --font-serif: Georgia, serif;
  --font-mono: Geist Mono, monospace;
  --radius: 0.5rem;
  --shadow-x: 0px;
  --shadow-y: 1px;
  --shadow-blur: 2px;
  --shadow-spread: 0px;
  --shadow-opacity: 0.18;
  --shadow-color: hsl(0 0% 0%);
  --shadow-2xs: 0px 1px 2px 0px hsl(0 0% 0% / 0.09);
  --shadow-xs: 0px 1px 2px 0px hsl(0 0% 0% / 0.09);
  --shadow-sm:
    0px 1px 2px 0px hsl(0 0% 0% / 0.18), 0px 1px 2px -1px hsl(0 0% 0% / 0.18);
  --shadow:
    0px 1px 2px 0px hsl(0 0% 0% / 0.18), 0px 1px 2px -1px hsl(0 0% 0% / 0.18);
  --shadow-md:
    0px 1px 2px 0px hsl(0 0% 0% / 0.18), 0px 2px 4px -1px hsl(0 0% 0% / 0.18);
  --shadow-lg:
    0px 1px 2px 0px hsl(0 0% 0% / 0.18), 0px 4px 6px -1px hsl(0 0% 0% / 0.18);
  --shadow-xl:
    0px 1px 2px 0px hsl(0 0% 0% / 0.18), 0px 8px 10px -1px hsl(0 0% 0% / 0.18);
  --shadow-2xl: 0px 1px 2px 0px hsl(0 0% 0% / 0.45);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --font-serif: var(--font-serif);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  --shadow-2xs: var(--shadow-2xs);
  --shadow-xs: var(--shadow-xs);
  --shadow-sm: var(--shadow-sm);
  --shadow: var(--shadow);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);
  --shadow-xl: var(--shadow-xl);
  --shadow-2xl: var(--shadow-2xl);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

## Styling Rules

1. Use semantic tokens such as `bg-background`, `text-foreground`, `bg-card`, `border-border`, `text-muted-foreground`, `bg-primary`, and `text-primary-foreground`.
2. Do not hardcode raw hex, RGB, HSL, OKLCH, or arbitrary color values in feature components.
3. Do not create per-section color systems. Extend the global theme only when a reusable semantic need exists.
4. Use shadcn/ui components as the base for buttons, inputs, dialogs, dropdowns, tabs, tables, badges, cards, sidebars, sheets, and tooltips.
5. Use the theme radius. Cards and controls should generally use `rounded-lg` or lower.
6. Use subtle borders and small shadows. The product should not look soft, glossy, or decorative.
7. Avoid heavy gradients, glowing effects, decorative blobs, and oversized marketing visuals.
8. Keep letter spacing normal. Do not use negative tracking.
9. Keep spacing consistent with Tailwind spacing and the global theme.
10. Dark mode must work through the `.dark` class and the provided variables.

## Typography

The primary font is Geist.

Rules:

- Use `font-sans` for almost all UI.
- Use `font-mono` for URLs, status codes, technical evidence, IDs, HTTP headers, and code-like values.
- Use concise headings.
- Do not use oversized typography inside dashboards, tables, report sections, cards, or sidebars.
- Reserve large headline type for the public landing page only.
- Avoid long paragraphs in app surfaces. Use short sections, tables, and lists for scan data.

Recommended type hierarchy:

- Page title: `text-2xl` or `text-3xl`
- Section title: `text-lg` or `text-xl`
- Card title: `text-sm` or `text-base`
- Table text: `text-sm`
- Metadata and helper text: `text-xs` or `text-sm text-muted-foreground`

## Layout Principles

scōre. is an operational SaaS app. Layouts should be efficient and scannable.

Use:

- App shell with sidebar or top navigation for authenticated areas.
- Constrained content widths for readable report pages.
- Full-width table/list sections for scan history and issue lists.
- Grid layouts for score summaries and metrics.
- Sticky or persistent report actions where useful.
- Clear empty states.
- Responsive layouts that preserve usability on mobile.

Avoid:

- Landing-page-style heroes inside the authenticated app.
- Floating card sections nested inside other cards.
- Excessively decorative panels.
- One-off visual treatments for each feature.
- Overly spacious dashboards that hide useful information below the fold.

## Navigation Model

Authenticated app navigation should prioritize:

- Dashboard
- New Scan
- Reports
- Usage or Billing
- Settings

Report-specific actions should include:

- Share
- Export PDF
- Rescan
- Copy URL

Use icons from `lucide-react` where appropriate, especially for compact actions. Icon-only buttons must have accessible labels and should use tooltips when the action is not obvious.

## Core Screens

### Public Landing Page

The public landing page should communicate the product clearly:

- What scōre. does
- Who it is for
- URL/domain input preview or call to action
- Example report outcomes
- Free-tier scan limit
- Upgrade-oriented future paid features

The landing page may have a stronger first impression than the app, but it should still use the same token system and restrained Vercel-like styling.

### Authentication Pages

Auth pages should be simple and direct.

They should include:

- Product name
- Minimal supporting copy
- Clerk sign-in/sign-up UI
- Link between login and signup when applicable

Do not build custom auth UI unless the auth provider requires it.

### Dashboard

The dashboard should show:

- Current scan usage, such as `3 of 5 scans used today`
- New scan entry point
- Recent scan history
- Scan statuses
- Overall scores for completed scans
- Failed scan messages where relevant
- Upgrade prompt when limits are close or reached

Dashboard density should be useful. It should not be a marketing page after login.

### New Scan Page

The scan form should be prominent and clear.

It should support:

- Bare domains
- Full homepage URLs
- Specific page URLs

States to design:

- Empty input
- Invalid input
- Unsafe URL rejected
- Usage limit reached
- Validating
- Queued
- Redirecting to scan/report page

The form should explain the free-tier scan limit without overwhelming the user.

### Scan Progress Page

A scan in progress should show:

- Submitted URL
- Current status
- Step progress
- Safe explanatory copy
- Error state when failed

Recommended steps:

```text
Queued
Validating
Fetching
Analyzing
Generating report
Generating PDF
Completed
```

Progress UI should be deterministic and based on persisted scan status.

### Private Report Page

The report page is the primary product surface.

It should include:

- Report header with URL, final URL, date, and actions
- Overall score
- Category scores
- Executive summary
- Top priority fixes
- Findings grouped by category
- Severity filters
- Technical evidence
- AI recommendations
- Suggested title tags
- Suggested meta descriptions
- Developer checklist
- Share and PDF export actions

The report should be detailed, but priority must be obvious. Users should immediately know the top problems and what to do next.

### Public Shared Report Page

The public report page should:

- Be read-only
- Hide private account details
- Show report content clearly
- Include scōre. branding unless future paid white-labeling removes it
- Avoid authenticated-only controls

### PDF Report

PDF reports should look like polished audit documents.

Recommended structure:

- Cover/header
- URL and scan date
- Overall score
- Category scores
- Executive summary
- Top issues
- Detailed findings
- Recommendations
- Developer checklist

PDF styling should reuse the same visual language, but it may use print-specific spacing.

## Report UI Rules

Reports must make severity and priority clear.

Use consistent visual language:

- Critical/high severity: destructive token or destructive-adjacent badge treatment
- Medium severity: neutral strong badge treatment
- Low severity: muted badge treatment
- Passed checks: subtle success treatment, introduced as a reusable semantic token only if needed

Do not make SEO reports look like casual blog content. Use structured sections, score cards, tables, accordions, and checklists.

Each finding should show:

- Finding title
- Severity
- Category
- Affected URL
- Explanation
- Evidence
- Recommendation

Technical evidence should be visually distinct and can use `font-mono`.

## Components To Prefer

Use shadcn/ui components wherever possible:

- `Button`
- `Input`
- `Textarea`
- `Card`
- `Badge`
- `Table`
- `Tabs`
- `Dialog`
- `DropdownMenu`
- `Tooltip`
- `Separator`
- `Skeleton`
- `Alert`
- `Progress`
- `Accordion`
- `Sheet`
- `Sidebar`
- `Select`

Use custom components only when they represent product-specific composition, such as:

- `scan-form`
- `usage-meter`
- `score-card`
- `severity-badge`
- `finding-list`
- `finding-card`
- `report-header`
- `report-section`
- `recommendation-list`
- `developer-checklist`
- `scan-status-timeline`

## State Design

Every important screen should handle:

- Loading
- Empty
- Error
- Success
- Disabled
- Limit reached
- Permission denied

Do not leave blank screens during async states.

Examples:

- Scan history empty state should invite the user to create their first scan.
- Usage limit reached should explain the limit and show upgrade-oriented next steps.
- Failed scan should show the reason, such as timeout, non-HTML response, or unsafe URL.
- Report loading should show skeletons that match the final layout.

## Responsive Rules

The app must work cleanly on mobile, tablet, and desktop.

Rules:

- Use responsive grids for score cards.
- Tables should degrade into scrollable tables or stacked list items on small screens.
- Report actions should remain reachable on mobile.
- Sidebar navigation should collapse into a sheet or mobile navigation.
- Long URLs must wrap or truncate safely.
- No text should overflow buttons, badges, cards, or table cells.

## Accessibility Rules

Agents should preserve accessibility by default:

- Use semantic buttons and links.
- Provide accessible names for icon-only controls.
- Use visible focus states from the theme.
- Do not remove outlines.
- Maintain contrast in light and dark mode.
- Use form labels and error messages.
- Use headings in logical order.
- Do not rely on color alone to communicate severity.

## Chart And Score Rules

Scores should be easy to interpret.

Use:

- Score cards
- Progress bars
- Simple radial or linear indicators only when they remain readable
- Category breakdown tables
- Clear labels and numeric values

Avoid:

- Decorative charts without actionability
- Complex visualizations in V1
- Unlabeled score graphics

Chart colors should use the global chart tokens:

- `chart-1`
- `chart-2`
- `chart-3`
- `chart-4`
- `chart-5`

## Content Tone

UI copy should be direct and helpful.

Use:

- “Analyze a URL”
- “5 scans used today”
- “This page is missing a meta description.”
- “Add a unique meta description between 120 and 160 characters.”

Avoid:

- Hype-heavy language
- Vague AI claims
- Overpromising rankings
- Blaming the user for errors

Reports should distinguish facts from recommendations.

## Invariants

1. The tweakcn Vercel theme is the global source of UI styling.
2. shadcn/ui components must inherit from global CSS variables.
3. Feature components must not hardcode colors that duplicate theme tokens.
4. App screens should feel like a professional SaaS dashboard, not a marketing landing page.
5. Reports should be structured, scannable, and evidence-driven.
6. Every async workflow must include loading, success, and error states.
7. URL text must never break layouts.
8. UI must support light and dark mode through CSS variables.
9. Icon-only controls require accessible labels.
10. Styling decisions should be reusable and centralized.
11. Agents should add new reusable components instead of repeating large component patterns.
12. Agents should avoid bundling unrelated UI redesigns into feature-specific tasks.
