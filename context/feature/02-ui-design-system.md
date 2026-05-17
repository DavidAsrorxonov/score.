# 02. UI Design System

## Purpose

This task establishes the reusable UI foundation for scōre. after the base project setup is complete. It turns the global tweakcn Vercel theme, TailwindCSS, and shadcn/ui setup into a consistent product design system that later agents can use for authentication pages, dashboards, scan creation, scan progress, reports, sharing, billing, and settings.

This task is not about building product workflows. It is about creating the reusable visual and structural building blocks that future tasks will compose.

## Required Context

Before starting this task, read these files:

1. `project-overview.md`
2. `architecture-context.md`
3. `ui-context.md`
4. `01-project-setup.md`

The design system must follow `ui-context.md` strictly. The tweakcn Vercel theme is the global styling source and should not be bypassed with hardcoded component colors.

## Goal

At the end of this task, the codebase should have a small, reusable UI system for scōre.:

- Shared app layout primitives.
- Shared page header components.
- Shared empty, loading, and error states.
- Shared score, status, severity, and usage display components.
- Shared report-section layout primitives.
- Shared navigation primitives.
- A lightweight component preview page or temporary showcase route for visual verification.

No real authentication, database, scan execution, report fetching, or billing logic should be implemented in this task.

## Scope

### In Scope

- Confirm global theme tokens are active.
- Add required shadcn/ui components for layout and state display.
- Create reusable product UI components.
- Create layout primitives for public and authenticated pages.
- Create status, severity, score, and usage display components using mock props only.
- Create reusable report presentation primitives with static props only.
- Create a temporary UI preview route if useful.
- Ensure components are responsive and accessible.
- Verify light and dark mode styling where possible.

### Out Of Scope

- Clerk authentication setup.
- Protected route logic.
- Database integration.
- Real scan creation.
- Real scan status polling.
- Real report data fetching.
- AI report generation.
- PDF generation.
- Stripe billing.
- Full landing page implementation.
- Full dashboard implementation.
- Full report page implementation.

If a component needs data, pass it through props using static examples. Do not add backend calls.

## Design Principles

scōre. should feel like a precise, professional SaaS analytics product.

Use:

- Clean white or black backgrounds from theme tokens.
- Thin borders.
- Compact cards.
- Strong typography hierarchy.
- Tables and lists for dense information.
- Reusable badges for status and severity.
- Minimal shadows.
- Clear focus states.
- Geist font.
- `lucide-react` icons where they improve scanability.

Avoid:

- Hardcoded colors.
- Decorative gradients.
- Blob backgrounds.
- Oversized dashboard text.
- Nested cards.
- Full marketing-page hero composition inside app areas.
- Fake product logic.

## Required shadcn/ui Components

Install only the shadcn components required for the design system.

Recommended components:

```bash
npx shadcn@latest add button input card badge separator skeleton alert progress tabs table dropdown-menu tooltip sheet dialog textarea select accordion
```

If some components are already installed from project setup, do not reinstall unnecessarily.

Do not add every shadcn component available. Keep the system lean.

## Recommended Folder Structure

Use this structure or a close equivalent:

```text
components/
  app/
    app-shell.tsx
    app-sidebar.tsx
    app-topbar.tsx
    page-header.tsx
    page-container.tsx
  marketing/
    public-shell.tsx
  shared/
    empty-state.tsx
    error-state.tsx
    loading-state.tsx
    status-badge.tsx
    severity-badge.tsx
    score-card.tsx
    usage-meter.tsx
    metric-card.tsx
  reports/
    report-section.tsx
    report-header.tsx
    finding-card.tsx
    finding-list.tsx
    recommendation-list.tsx
    developer-checklist.tsx
  ui/
    shadcn components
```

If the app is not ready for all folders, create only the folders required by implemented components. Avoid empty folder sprawl.

## Part 1: Confirm Theme Integration

Before creating components, confirm the base theme is correctly installed.

Check:

- `app/globals.css` uses the tweakcn Vercel theme from `ui-context.md`.
- Theme tokens map to Tailwind color utilities.
- `body` uses `bg-background text-foreground`.
- Geist font is configured in `app/layout.tsx`.
- shadcn components use CSS variables.

Do not change theme values unless the user explicitly requests it.

## Part 2: Add Layout Primitives

Create reusable layout components that future app pages can use.

### `PageContainer`

Purpose:

- Provides consistent page width, horizontal padding, and vertical spacing.

Expected props:

```ts
type PageContainerProps = {
  children: React.ReactNode;
  className?: string;
};
```

Behavior:

- Centers content when appropriate.
- Uses responsive padding.
- Does not impose a card style.
- Does not add feature-specific content.

Recommended styling:

```text
mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8
```

### `PageHeader`

Purpose:

- Standard page header for dashboard, reports, settings, and future billing pages.

Expected props:

```ts
type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
};
```

Behavior:

- Title and description on the left.
- Optional actions on the right on desktop.
- Actions stack or wrap cleanly on mobile.

### `PublicShell`

Purpose:

- Minimal public page shell for landing and auth-adjacent pages.

Should include:

- Top navigation area.
- Product name.
- Optional right-side actions.
- Main content area.

Do not build a full landing page in this task.

### `AppShell`

Purpose:

- Layout foundation for authenticated pages.

Should include:

- Sidebar or top navigation placeholder.
- Main content area.
- Responsive mobile navigation behavior if feasible.

Important:

- This component should not require real auth data yet.
- It may accept static user display props or no user props.
- It should not call Clerk APIs.

## Part 3: Navigation Components

Create navigation primitives using static configuration.

Recommended nav items:

```text
Dashboard
New Scan
Reports
Usage
Settings
```

Use lucide icons:

- `LayoutDashboard`
- `Search`
- `FileText`
- `Gauge`
- `Settings`

Rules:

- Use semantic links where possible.
- Active state should be token-based.
- Icon-only collapsed states need accessible labels.
- Mobile navigation should not overflow.
- Do not implement route protection.

## Part 4: Shared State Components

Create reusable states for future pages.

### `EmptyState`

Purpose:

- Shows empty dashboard, empty report list, or no findings states.

Expected props:

```ts
type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
};
```

Rules:

- Use muted text for description.
- Keep layout compact.
- Do not use decorative illustrations.

### `ErrorState`

Purpose:

- Shows recoverable UI errors.

Expected props:

```ts
type ErrorStateProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
};
```

Rules:

- Use shadcn `Alert` if appropriate.
- Use destructive tokens only for real errors.
- Avoid alarming copy.

### `LoadingState`

Purpose:

- Provides consistent skeleton placeholders.

Expected variants:

```text
page
card
table
report
```

Rules:

- Skeleton should roughly match final layout shape.
- Avoid generic full-page spinners as the only loading state.

## Part 5: Status And Severity Components

Create reusable badge components for scan statuses and SEO finding severity.

### `StatusBadge`

Supported scan statuses:

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

Expected behavior:

- Shows a human-readable label.
- Uses consistent token-based styling.
- Does not hardcode feature-specific colors outside semantic classes.

Recommended labels:

```text
queued -> Queued
validating -> Validating
fetching -> Fetching
analyzing -> Analyzing
generating_report -> Generating report
generating_pdf -> Generating PDF
completed -> Completed
failed -> Failed
```

### `SeverityBadge`

Supported severities:

```text
critical
high
medium
low
info
passed
```

Expected behavior:

- Shows a clear label.
- Does not rely on color alone.
- Uses accessible contrast.

Recommended labels:

```text
critical -> Critical
high -> High
medium -> Medium
low -> Low
info -> Info
passed -> Passed
```

Do not invent final scoring logic here. This component only displays severity.

## Part 6: Score And Metric Components

Create display components for future report and dashboard pages.

### `ScoreCard`

Purpose:

- Shows a score category and numeric value.

Expected props:

```ts
type ScoreCardProps = {
  label: string;
  score: number;
  description?: string;
  trend?: string;
};
```

Rules:

- Clamp display assumptions to `0-100`.
- Use a simple progress indicator.
- Do not determine score values internally.
- Do not implement SEO scoring logic.

### `MetricCard`

Purpose:

- Shows simple dashboard/report metrics such as scans used, issues found, response time, page size, or URLs analyzed.

Expected props:

```ts
type MetricCardProps = {
  label: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
};
```

### `UsageMeter`

Purpose:

- Displays free-tier usage, such as `3 of 5 scans used today`.

Expected props:

```ts
type UsageMeterProps = {
  used: number;
  limit: number;
  label?: string;
};
```

Rules:

- Show progress.
- Handle `0`, partial usage, and limit reached.
- Do not fetch usage data.
- Do not implement quota logic.

## Part 7: Report Presentation Components

Create reusable report layout components with static props only.

### `ReportHeader`

Purpose:

- Displays report identity and actions.

Expected props:

```ts
type ReportHeaderProps = {
  title: string;
  analyzedUrl: string;
  finalUrl?: string;
  scannedAt?: string;
  actions?: React.ReactNode;
};
```

Rules:

- Long URLs must wrap or truncate safely.
- Use `font-mono` for URLs if appropriate.
- Actions should wrap on mobile.

### `ReportSection`

Purpose:

- Standard section container for report content.

Expected props:

```ts
type ReportSectionProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
};
```

Rules:

- Use section semantics.
- Do not nest inside unnecessary cards.
- Keep spacing consistent.

### `FindingCard`

Purpose:

- Displays one SEO finding.

Expected props:

```ts
type FindingCardProps = {
  title: string;
  category: string;
  severity: "critical" | "high" | "medium" | "low" | "info" | "passed";
  affectedUrl?: string;
  description?: string;
  evidence?: React.ReactNode;
  recommendation?: string;
};
```

Rules:

- Severity must be visually visible.
- Evidence should be visually distinct.
- URLs must not overflow.
- Do not assume real database IDs.

### `FindingList`

Purpose:

- Displays a list of finding cards.

Expected props:

```ts
type FindingListProps = {
  findings: FindingCardProps[];
  emptyTitle?: string;
  emptyDescription?: string;
};
```

Rules:

- Use `EmptyState` if no findings are provided.
- Do not implement filtering in this task unless it is purely presentational.

### `RecommendationList`

Purpose:

- Displays AI-written recommendations or prioritized actions.

Expected props:

```ts
type RecommendationItem = {
  title: string;
  description?: string;
  priority?: string;
};

type RecommendationListProps = {
  items: RecommendationItem[];
};
```

### `DeveloperChecklist`

Purpose:

- Displays actionable technical tasks.

Expected props:

```ts
type ChecklistItem = {
  label: string;
  description?: string;
  checked?: boolean;
};

type DeveloperChecklistProps = {
  items: ChecklistItem[];
};
```

Rules:

- This is a display component, not a persisted task system.
- Checked state is prop-driven only.

## Part 8: Temporary UI Preview Route

Create a temporary preview route if useful:

```text
app/ui-preview/page.tsx
```

This page should render examples of:

- Buttons
- Inputs
- Cards
- Badges
- Status badges
- Severity badges
- Score cards
- Usage meter
- Empty state
- Error state
- Loading state
- Finding cards
- Report sections

Rules:

- Preview data must be static.
- The route should not fetch from a database.
- The route should not imply scans work.
- The page can be removed later after real screens exist.

If the team prefers not to include a preview route, components should still be visually verified on the existing home page or a temporary local-only page.

## Part 9: Accessibility Requirements

Every component in this task should be accessible by default.

Requirements:

- Buttons must be real buttons or links.
- Icon-only buttons need `aria-label`.
- Form fields need labels or accessible names.
- Use semantic section/header elements where appropriate.
- Focus styles must remain visible.
- Do not remove outlines globally.
- Do not rely on color alone for status or severity.
- Long technical text and URLs must not break layout.

## Part 10: Responsive Requirements

Components must work across common screen sizes.

Requirements:

- Cards stack on mobile.
- Score grids collapse cleanly.
- Report actions wrap cleanly.
- Sidebar or navigation does not block content on mobile.
- Tables or lists do not overflow the viewport without scroll handling.
- Long URLs use `break-all`, `truncate`, or controlled wrapping depending on context.

## Part 11: Dark Mode Requirements

The design system must support dark mode through the `.dark` class and theme variables.

Requirements:

- Do not write separate dark-mode hardcoded color systems.
- Use token classes that already respond to dark mode.
- Check cards, badges, alerts, progress, and report components in dark mode if possible.

Dark mode toggle functionality does not need to be implemented in this task unless it already exists. The components only need to be compatible with the theme.

## Part 12: Code Quality Requirements

Rules:

- Use TypeScript props for all reusable components.
- Prefer named exports for product-specific components.
- Keep components small and composable.
- Avoid duplicating large class strings across components.
- Use `cn` from `@/lib/utils` for conditional classes.
- Do not import server-only modules into client components.
- Add `"use client"` only when a component truly needs client-side interactivity.
- Keep mock data near the preview route, not inside reusable components.

## Validation

Run:

```bash
npm run lint
npm run typecheck
npm run build
```

If the preview route is added, also run the dev server and visually inspect:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000/ui-preview
```

Check:

- Light mode layout.
- Dark mode compatibility if available.
- Mobile viewport.
- Long URL wrapping.
- Badge contrast.
- Score card readability.
- Report section spacing.

## Expected Final State

At the end of this task:

- scōre. has reusable layout primitives.
- scōre. has reusable status, severity, score, usage, and state components.
- scōre. has report presentation primitives.
- Components use shadcn/ui and theme tokens.
- No business logic is implemented.
- No auth, database, scan, AI, PDF, or billing logic is added.
- Later agents can build real pages using this design system.

## Acceptance Criteria

This task is complete when:

1. Required shadcn/ui components are installed.
2. Global theme tokens remain the styling source.
3. `PageContainer` and `PageHeader` or equivalents exist.
4. `PublicShell` and/or `AppShell` foundations exist without real auth coupling.
5. `EmptyState`, `ErrorState`, and `LoadingState` exist.
6. `StatusBadge` supports all V1 scan statuses.
7. `SeverityBadge` supports all planned finding severities.
8. `ScoreCard`, `MetricCard`, and `UsageMeter` exist.
9. Report presentation components exist for headers, sections, findings, recommendations, and developer checklists.
10. Components are typed with TypeScript.
11. Components use theme classes, not hardcoded colors.
12. Long URLs and technical strings do not overflow layouts.
13. Components are responsive.
14. Components preserve accessible labels and focus states.
15. Lint, typecheck, and build pass, or any environment-specific blocker is documented.

## Agent Notes

- Keep this task limited to reusable UI foundations.
- Do not build the real dashboard yet.
- Do not build the real report page yet.
- Do not add Clerk.
- Do not add database calls.
- Do not add scan APIs.
- Do not add fake backend state.
- Do not create final marketing copy.
- Do not override the tweakcn Vercel theme.
- Prefer reusable components over feature-specific markup.
- If a future feature needs a variation, design the component API now only when the variation is obvious and low-risk.
