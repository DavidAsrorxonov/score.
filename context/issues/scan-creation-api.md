I am encountering this issue after context/feature/09-scan-creation-api.md file was implemented

I tried stopping the dev server and starting again, it didn't work
I tried logging out of my account and logging back in, still didn't work

I pasted the log from the terminal below, read through it and fix the error

```
 GET /app/new-scan 200 in 2.5s (next.js: 38ms, proxy.ts: 10ms, application-code: 2.5s)
⨯ Error: Clerk: auth() was called but Clerk can't detect usage of clerkMiddleware(). Please ensure the following:
- Your middleware or proxy file exists at ./middleware.(ts|js) or proxy.(ts|js)
- clerkMiddleware() is used in your Next.js middleware or proxy file.
- Your middleware or proxy matcher is configured to match this route or page.
- If you are using the src directory, make sure the middleware or proxy file is inside of it.

If you've verified your configuration and are still seeing this error, there may be a runtime issue or a problem communicating with Clerk.

For more details, see https://clerk.com/err/auth-middleware

    at async POST (app/api/scans/route.ts:24:22)
  22 |
  23 | export async function POST(request: Request) {
> 24 |   const { userId } = await auth();
     |                      ^
  25 |
  26 |   if (!userId) {
  27 |     return jsonFailure("UNAUTHENTICATED");
```
