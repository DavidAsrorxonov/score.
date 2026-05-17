# 01. Project Setup

## Purpose

This task initializes the scōre. codebase as a clean, production-ready Next.js application foundation. It creates the base project structure, installs the core frontend tooling, configures TypeScript, TailwindCSS, shadcn/ui, linting, formatting, environment handling, and baseline scripts.

This step does not build product features. It prepares the workspace so later agents can safely implement authentication, database schema, scan creation, workers, SEO analysis, reports, and billing in isolated steps.

## Required Context

Before starting this task, read these files:

1. `project-overview.md`
2. `architecture-context.md`
3. `ui-context.md`

Those files define the product scope, architecture rules, and UI system. This setup task must follow them, but should not implement the features described in them yet.

## Goal

At the end of this task, the repository should contain a working Next.js 16 + TypeScript app using TailwindCSS and shadcn/ui, with the tweakcn Vercel theme installed globally and a clean structure ready for feature work.

The app should run locally with:

```bash
npm run dev
```

The initial page can be simple. It only needs to prove that the app, theme, fonts, and base layout are working.

## Scope

### In Scope

- Initialize a Next.js app with TypeScript.
- Use the App Router.
- Configure TailwindCSS.
- Configure shadcn/ui.
- Install and configure Geist fonts.
- Add the tweakcn Vercel theme from `ui-context.md`.
- Add a clean project folder structure.
- Add shared utility helpers required by shadcn/ui.
- Add baseline linting and formatting scripts.
- Add environment variable example file.
- Add a basic home page.
- Add a basic metadata setup.
- Confirm the app builds or at least passes lint/type checks where available.

### Out Of Scope

- Authentication.
- Clerk configuration.
- Database setup.
- Prisma or Drizzle schema.
- Redis or queue setup.
- Worker process setup.
- SEO analyzer logic.
- URL validation logic.
- Scan creation.
- Report pages.
- PDF export.
- Stripe billing.
- Full dashboard UI.
- Public marketing copy beyond a minimal placeholder.

If any of these out-of-scope features appear necessary while working on setup, create only the minimal placeholder needed for structure and leave implementation to the proper future task.

## Recommended Stack For This Step

Use:

- Next.js 16
- React
- TypeScript
- TailwindCSS
- shadcn/ui
- lucide-react
- Geist font
- ESLint
- Prettier if the project setup supports it cleanly

Do not add backend infrastructure dependencies in this step unless required by the framework itself.

Examples of dependencies to avoid in this step:

- `@clerk/nextjs`
- `prisma`
- `drizzle-orm`
- `bullmq`
- `ioredis`
- `cheerio`
- `openai`
- `stripe`
- `playwright`

Those belong to later feature-specific steps.

## Setup Flow

### Part 1: Initialize The Next.js App

Create the app in the current repository root.

Use a project setup equivalent to:

```bash
npx create-next-app@latest . \
  --ts \
  --app \
  --tailwind \
  --eslint \
  --src-dir false \
  --import-alias "@/*"
```

Expected decisions:

- Use TypeScript.
- Use the App Router.
- Use TailwindCSS.
- Use ESLint.
- Use the root-level `app` directory, not `src/app`, unless the generated setup requires otherwise.
- Use the import alias `@/*`.

If the generator asks about Turbopack, either choice is acceptable, but the scripts should remain understandable.

### Part 2: Confirm Base Files

After initialization, confirm these files or their equivalents exist:

```text
app/layout.tsx
app/page.tsx
app/globals.css
next.config.ts
tsconfig.json
package.json
eslint.config.mjs
postcss.config.mjs
```

If the generator creates slightly different config filenames, keep the generated modern defaults unless there is a clear reason to change them.

### Part 3: Install shadcn/ui

Initialize shadcn/ui using the current recommended CLI.

Use the approved command prefix if available:

```bash
npx shadcn@latest init
```

Recommended shadcn choices:

- Style: default or new-york, whichever best matches current shadcn defaults.
- Base color: neutral.
- CSS variables: yes.
- Components path: `components/ui`.
- Utilities path: `lib/utils`.
- Tailwind config path: use generated project defaults.
- Global CSS path: `app/globals.css`.
- React Server Components: yes.

The project should use shadcn components as reusable UI primitives throughout later tasks.

### Part 4: Add Initial shadcn Components

Install only the base components needed to prove the setup and support the first screens later.

Recommended initial components:

```bash
npx shadcn@latest add button input card badge separator
```

Do not install every shadcn component upfront. Later tasks should add components as needed.

### Part 5: Install Icons

Install `lucide-react` if shadcn did not already add it.

```bash
npm install lucide-react
```

Icons should be used for clear actions in later UI work. This setup step only needs the dependency available.

### Part 6: Configure Global Theme

Replace the generated global CSS theme with the tweakcn Vercel theme from `ui-context.md`.

The final `app/globals.css` should include:

- `@import "tailwindcss";`
- `@custom-variant dark (&:is(.dark *));`
- The full `:root` token set from `ui-context.md`.
- The full `.dark` token set from `ui-context.md`.
- The `@theme inline` mapping from `ui-context.md`.
- The `@layer base` block from `ui-context.md`.

Do not introduce separate hardcoded app colors.

Do not create feature-level CSS files in this step.

### Part 7: Configure Fonts

Use Geist as the primary font.

Preferred approach:

- Use `next/font/google` for Geist and Geist Mono when available.
- Apply the font variables at the root layout level.
- Ensure the CSS theme references:

```css
--font-sans: Geist, sans-serif;
--font-mono: Geist Mono, monospace;
```

The body should use the global theme classes:

```tsx
className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
```

If the generated Next.js template already uses Geist, keep the generated setup and align it with the theme.

### Part 8: Configure Metadata

Set basic metadata in `app/layout.tsx`.

Recommended values:

```ts
export const metadata = {
  title: "scōre.",
  description: "AI-powered SEO analysis and reporting.",
};
```

Do not write final marketing SEO copy in this task. This is only baseline metadata.

### Part 9: Create Minimal Home Page

Create a simple home page that verifies the theme works.

It can include:

- Product name: `scōre.`
- Short description.
- Disabled or non-functional input preview.
- Button using shadcn `Button`.
- A small card using shadcn `Card`.

The page must not pretend that scanning works yet.

Acceptable placeholder text:

```text
AI-powered SEO reports are being built.
```

Do not build the full landing page or authenticated dashboard in this step.

### Part 10: Create Base Folder Structure

Create folders that future tasks will use.

Recommended structure:

```text
app/
components/
components/ui/
lib/
lib/utils.ts
public/
```

Optional placeholders are acceptable:

```text
lib/.gitkeep
components/.gitkeep
```

Do not create empty feature folders for every planned system yet unless needed. Too many empty folders add noise.

### Part 11: Environment File

Create an environment example file:

```text
.env.example
```

Include only variables that are safe and expected later. Do not create real secrets.

Recommended initial content:

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Auth - added in the auth setup task
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Database - added in the database setup task
DATABASE_URL=

# Redis / Queue - added in the queue setup task
REDIS_URL=

# AI - added in the AI report generation task
OPENAI_API_KEY=

# Storage - added in the PDF/artifact storage task
STORAGE_ACCESS_KEY_ID=
STORAGE_SECRET_ACCESS_KEY=
STORAGE_BUCKET=
STORAGE_ENDPOINT=

# Billing - added in the billing task
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

Do not create `.env.local` unless needed for local execution. If created, do not commit real values.

### Part 12: Package Scripts

Ensure `package.json` includes useful scripts.

Recommended:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  }
}
```

If Next.js 16 uses a different lint command by default, keep the generated script but ensure there is a clear lint command.

### Part 13: TypeScript Configuration

Keep strict TypeScript behavior where practical.

Requirements:

- `strict` should be enabled.
- Import alias `@/*` should work.
- Do not loosen TypeScript settings to bypass errors.

The project should be ready for future typed modules such as:

```text
@/lib/url
@/lib/seo
@/lib/scans
@/components/ui/button
```

### Part 14: Git Ignore

Ensure `.gitignore` includes standard Next.js and environment exclusions:

```text
node_modules
.next
out
dist
.env
.env.local
.env.*.local
```

Do not ignore planning Markdown files.

## Initial Page Requirements

The initial `app/page.tsx` should be intentionally small.

It should:

- Render without auth.
- Use the global theme.
- Use at least one shadcn component.
- Avoid complex layout.
- Avoid scan functionality.
- Avoid fake report data.

Example structure:

```text
Page container
  Product label
  Heading
  Short description
  Card
    Input preview
    Button
    Small setup note
```

The button can say:

```text
Setup in progress
```

The input should be disabled or clearly non-functional until the scan creation task.

## Validation

After setup, run the strongest available checks:

```bash
npm run lint
npm run typecheck
npm run build
```

If `npm run build` is too slow or blocked by local environment issues, at minimum run lint and typecheck.

If a command fails, fix the failure unless it is caused by an external environment limitation. Document any unresolved issue in the final response.

## Expected Final State

At the end of this task:

- The repository is a valid Next.js app.
- TailwindCSS is configured.
- shadcn/ui is initialized.
- The tweakcn Vercel theme is installed globally.
- Geist fonts are configured.
- A minimal home page renders.
- Basic scripts exist.
- `.env.example` exists.
- No product feature logic is implemented.
- The codebase is ready for the next task: UI design system or authentication.

## Acceptance Criteria

This task is complete when:

1. `npm install` has completed successfully.
2. `npm run dev` starts the app without configuration errors.
3. The home page renders at `http://localhost:3000`.
4. The app uses the scōre. name.
5. `app/globals.css` contains the tweakcn Vercel theme from `ui-context.md`.
6. shadcn/ui is initialized and at least `Button`, `Input`, `Card`, `Badge`, and `Separator` are available.
7. `lib/utils.ts` exists and supports shadcn class composition.
8. TypeScript path alias `@/*` works.
9. `.env.example` exists with placeholder variables only.
10. Linting, typechecking, and build pass, or any environment-specific blocker is clearly documented.

## Agent Notes

- Keep this task strictly focused on setup.
- Do not add Clerk, database, workers, SEO logic, AI logic, Stripe, or PDF logic.
- Do not build the dashboard.
- Do not build a full landing page.
- Do not create fake scan data.
- Do not hardcode styles that duplicate theme tokens.
- Use shadcn/ui primitives instead of custom low-level components.
- Keep the first page small so later agents can replace or extend it cleanly.
- If the generated framework files differ from this document because of Next.js version changes, keep the modern generated defaults and document the difference.
