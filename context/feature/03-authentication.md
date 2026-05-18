# 03. Authentication

## Purpose

This task adds authentication to scōre. using Clerk. It ensures users must sign up or log in before accessing the app dashboard and future scan/report functionality.

This task establishes identity and route protection only. It should not implement database user profiles, scan creation, usage limits, billing, report history, or SEO analysis.

## Required Context

Before starting this task, read these files:

1. `project-overview.md`
2. `architecture-context.md`
3. `ui-context.md`
4. `01-project-setup.md`
5. `02-ui-design-system.md`

Authentication must follow the architecture rule that authenticated users are required for scan creation and private report access.

## Goal

At the end of this task:

- Clerk is installed and configured.
- Public routes remain accessible.
- Sign-in and sign-up pages work.
- Authenticated app routes are protected.
- Authenticated users can reach the app shell.
- Unauthenticated users are redirected to sign in.
- The app can read the current Clerk user ID on the server.
- The UI has a basic account/user control.

No database integration is required in this task.

## Scope

### In Scope

- Install Clerk for Next.js.
- Add required environment variables to `.env.example`.
- Configure Clerk provider in the root layout.
- Add Clerk middleware for route protection.
- Add sign-in route.
- Add sign-up route.
- Add authenticated app route group.
- Add authenticated app layout using the existing UI system.
- Add basic user/account controls using Clerk components.
- Add redirect behavior after sign in and sign up.
- Add helper utilities for requiring authentication in server contexts if useful.
- Verify authenticated and unauthenticated navigation.

### Out Of Scope

- Creating a `users` table.
- Syncing Clerk users to the database.
- Webhooks.
- Organizations.
- Team accounts.
- Billing.
- Usage limits.
- Dashboard scan data.
- Scan creation.
- Report access logic.
- Admin roles.
- Custom Clerk UI beyond theme-compatible layout.

If a future database user model feels necessary, leave it to `04-database-schema.md`.

## Recommended Routes

Use route structure similar to:

```text
app/
  page.tsx
  sign-in/
    [[...sign-in]]/
      page.tsx
  sign-up/
    [[...sign-up]]/
      page.tsx
  app/
    layout.tsx
    page.tsx
```

Route meanings:

- `/` is public.
- `/sign-in` is public.
- `/sign-up` is public.
- `/app` is protected and becomes the authenticated dashboard entry.

Future protected routes will live under:

```text
/app/new-scan
/app/reports
/app/reports/[id]
/app/settings
/app/usage
```

Public shared reports will later live outside the authenticated app:

```text
/r/[shareId]
```

Do not protect `/r/[shareId]` in this task because shared report access will be handled later.

## Environment Variables

Update `.env.example` with Clerk placeholders if they are not already present:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/app
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/app
```

Local development requires real values in `.env.local`, but do not commit real secrets.

## Part 1: Install Clerk

Install Clerk:

```bash
npm install @clerk/nextjs
```

Do not install database or billing packages during this step.

## Part 2: Add Clerk Provider

Wrap the app with Clerk provider in `app/layout.tsx`.

Expected behavior:

- Clerk context is available throughout the app.
- Public pages still render without requiring auth.
- Theme and font setup from project setup remains intact.

Example shape:

```tsx
import { ClerkProvider } from "@clerk/nextjs";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

Keep the existing Geist font variables, metadata, and theme classes.

## Part 3: Add Middleware

Create or update:

```text
proxy.ts
```

Use Clerk middleware to protect authenticated app routes.

Routes that should be protected:

```text
/app
/app/(.*)
```

Routes that should remain public:

```text
/
/sign-in
/sign-up
/r/(.*)
```

Expected behavior:

- Visiting `/app` while signed out redirects to `/sign-in`.
- Visiting `/app` while signed in allows access.
- Visiting `/` works for signed-out users.
- Visiting `/sign-in` and `/sign-up` works for signed-out users.

Do not protect all routes by default unless public shared reports and auth routes are explicitly excluded.

## Part 4: Add Sign-In Page

Create:

```text
app/sign-in/[[...sign-in]]/page.tsx
```

Use Clerk's `SignIn` component.

The page should:

- Use the scōre. design system.
- Show the product name.
- Keep layout minimal.
- Avoid custom auth logic.
- Redirect authenticated users according to Clerk settings.

Recommended UI:

```text
Centered auth panel
  scōre.
  Short supporting line
  Clerk SignIn component
```

Do not add scan forms, dashboard data, or marketing sections.

## Part 5: Add Sign-Up Page

Create:

```text
app/sign-up/[[...sign-up]]/page.tsx
```

Use Clerk's `SignUp` component.

The page should:

- Match the sign-in page layout.
- Use theme tokens.
- Keep copy minimal.
- Redirect new users to `/app`.

Recommended UI:

```text
Centered auth panel
  scōre.
  Short supporting line
  Clerk SignUp component
```

## Part 6: Add Authenticated App Layout

Create:

```text
app/app/layout.tsx
```

This layout should:

- Use the `AppShell` from the UI design system if it exists.
- Show authenticated app navigation.
- Provide a consistent content area for protected pages.
- Include a user/account control.

Use Clerk components where appropriate:

- `UserButton`
- `SignedIn`
- `SignedOut` if needed

Do not fetch database data.

Do not show real scan counts or usage counts yet.

## Part 7: Add Protected App Home Page

Create or update:

```text
app/app/page.tsx
```

This page is a placeholder for the future dashboard.

It should:

- Render only for authenticated users because the route is protected.
- Show a simple page title such as `Dashboard`.
- Show a small note that scan features are coming in later tasks.
- Optionally show placeholder cards using UI system components.

Do not build the real dashboard yet.

Acceptable placeholder content:

```text
Your SEO scan dashboard will appear here.
```

## Part 8: Server-Side Auth Helper

Create a small helper only if useful:

```text
lib/auth/require-user.ts
```

Purpose:

- Centralize server-side checks for authenticated user ID.

Expected behavior:

- Uses Clerk server auth APIs.
- Returns the authenticated Clerk user ID.
- Redirects or throws when unauthenticated, depending on usage.

Example shape:

```ts
export async function requireUserId() {
  // Return Clerk user ID or redirect to sign in.
}
```

Do not connect this helper to a database user record yet.

Future tasks will use this helper in scan creation and report access.

## Part 9: Public Header Auth Actions

Update the public home page or public shell so auth actions are visible.

Signed-out users should see:

- Sign in
- Get started or Sign up

Signed-in users may see:

- Dashboard
- User button

Use Clerk components if needed:

- `SignedIn`
- `SignedOut`
- `UserButton`

Keep the public page simple. Do not turn this task into a full landing page implementation.

## Part 10: Redirect Behavior

Ensure these flows work:

### Signed-Out User

```text
visit /
can see public page
click sign in
sign in successfully
redirect to /app
```

### Signed-Out User Direct App Access

```text
visit /app
redirect to /sign-in
sign in successfully
redirect to /app
```

### New User

```text
visit /sign-up
create account
redirect to /app
```

### Signed-In User

```text
visit /app
dashboard placeholder renders
user button is visible
```

## UI Requirements

Authentication pages must follow `ui-context.md`.

Rules:

- Use theme tokens.
- Use shadcn/ui primitives where useful.
- Do not hardcode colors.
- Keep auth panels compact.
- Avoid large decorative graphics.
- Avoid dashboard-style complexity on auth pages.
- Support mobile screens.
- Preserve Clerk component accessibility.

## Security Requirements

- Do not expose `CLERK_SECRET_KEY` to the client.
- Only use `NEXT_PUBLIC_` variables for safe client values.
- Do not put secrets in code.
- Do not commit `.env.local`.
- Protected app routes must not render private content to signed-out users.
- Server-side helpers should use Clerk server APIs, not client-side session assumptions.

## Validation

Run:

```bash
npm run lint
npm run typecheck
npm run build
```

Then run:

```bash
npm run dev
```

Manually verify:

- `/` loads publicly.
- `/sign-in` loads.
- `/sign-up` loads.
- `/app` redirects when signed out.
- `/app` renders when signed in.
- User button appears in the authenticated app shell.
- Sign out returns the user to a public/signed-out state.

If real Clerk environment variables are unavailable, the build should still be structurally correct, but runtime auth cannot be fully tested. Document that limitation.

## Expected Final State

At the end of this task:

- Clerk is installed.
- Clerk provider is configured.
- Clerk middleware protects `/app`.
- Sign-in and sign-up routes exist.
- Authenticated app layout exists.
- Protected dashboard placeholder exists.
- Public navigation exposes auth actions.
- A server-side auth helper may exist.
- No database user syncing is implemented.
- No product features are implemented beyond authentication and route protection.

## Acceptance Criteria

This task is complete when:

1. `@clerk/nextjs` is installed.
2. Clerk environment placeholders exist in `.env.example`.
3. `ClerkProvider` wraps the app without breaking fonts or theme.
4. Middleware protects `/app` and future `/app/*` routes.
5. `/sign-in` renders Clerk sign-in UI.
6. `/sign-up` renders Clerk sign-up UI.
7. Signed-out users cannot access `/app`.
8. Signed-in users can access `/app`.
9. Authenticated layout includes app navigation and a user/account control.
10. Public navigation includes sign-in/sign-up or dashboard actions depending on auth state.
11. No database, scan, report, usage, billing, or SEO logic is added.
12. Lint, typecheck, and build pass, or any environment-specific blocker is documented.

## Agent Notes

- Keep this task strictly focused on authentication.
- Use Clerk defaults where possible.
- Do not customize Clerk deeply unless needed for layout consistency.
- Do not build user profiles in the database.
- Do not add organization logic.
- Do not build the real dashboard.
- Do not implement usage limits.
- Do not add fake scan data.
- Keep route protection simple and explicit.
- Future tasks will use the authenticated user ID for database ownership and scan creation.
