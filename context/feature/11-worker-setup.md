# 11. Worker Setup

## Purpose

This task adds the background worker foundation for scōre.. The worker consumes queued `scan.run` jobs from BullMQ, loads the scan from PostgreSQL, validates ownership and state, moves the scan through early lifecycle statuses, and prepares the processing boundary for page fetching, SEO extraction, scoring, AI report generation, and PDF generation.

This task should prove that queued scans can be picked up and status-updated outside the Next.js request lifecycle. It should not implement the real page fetcher, SEO analyzer, scoring engine, AI report generator, or PDF export.

## Required Context

Before starting this task, read these files:

1. `project-overview.md`
2. `architecture-context.md`
3. `04-database-schema.md`
4. `08-domain-verification.md`
5. `09-scan-creation-api.md`
6. `10-queue-setup.md`

This task depends on:

- Drizzle database schema and client.
- Scan records with `status = queued`.
- BullMQ queue setup.
- Redis connection setup.
- `scan.run` jobs containing `{ scanId }`.

## Goal

At the end of this task:

- A separate worker entrypoint exists.
- The worker can connect to Redis and PostgreSQL.
- The worker consumes `scan.run` jobs.
- The worker loads scan records by ID.
- The worker ignores or fails invalid jobs safely.
- The worker updates scan status from `queued` to processing statuses.
- The worker handles success, failure, retries, and shutdown cleanly.
- A local worker script can be run during development.
- Accepted scans no longer sit permanently untouched in the queue.

The worker may end by marking scans as `failed` with a clear “processing not implemented yet” error, or it may complete a no-op smoke path if that is more useful for local validation. Do not fake SEO results.

## Core Rule

The Next.js app accepts scans. The worker processes scans.

Request handlers must not perform long-running scan work. The worker is the only place where future page fetching, SEO extraction, scoring, AI generation, and PDF generation should run.

## Scope

### In Scope

- Worker package scripts.
- Worker entrypoint.
- BullMQ `Worker` setup.
- Shared Redis connection usage.
- Scan job data validation.
- Scan record loading.
- Scan status transition helpers.
- Worker error handling.
- Retry-aware failure behavior.
- Graceful shutdown.
- Local development instructions.
- Basic tests for job handler logic.

### Out Of Scope

- Real page fetching.
- Full domain re-verification logic inside worker.
- SEO extraction.
- SEO checks.
- Scoring.
- AI report generation.
- PDF generation.
- Whole-site crawling.
- Worker deployment configuration beyond basic notes.
- Queue monitoring dashboard.

The next tasks will fill in the processing internals.

## Recommended Files

Create:

```text
worker/index.ts
worker/scan-worker.ts
worker/handlers/run-scan.ts
worker/lifecycle.ts
lib/scans/status.ts
lib/scans/errors.ts
```

Optional:

```text
worker/logger.ts
worker/config.ts
worker/__tests__/run-scan.test.ts
```

If the project prefers `src/worker`, use the existing structure, but keep the worker separate from React components and browser code.

## Part 1: Add Worker Scripts

Update `package.json`.

Recommended scripts:

```json
{
  "scripts": {
    "worker": "tsx worker/index.ts",
    "worker:dev": "tsx watch worker/index.ts"
  }
}
```

Install `tsx` if it is not already installed:

```bash
npm install -D tsx
```

Rules:

- The worker must be runnable separately from `next dev`.
- Do not run the worker automatically inside Next.js.
- In local development, the user should run the app and worker in separate terminals.

Example local dev:

```bash
npm run dev
npm run worker:dev
```

## Part 2: Worker Configuration

Create:

```text
worker/config.ts
```

Recommended config:

```ts
export const WORKER_CONFIG = {
  concurrency: 2,
  lockDurationMs: 120000,
  stalledIntervalMs: 30000,
} as const;
```

V1 recommendations:

- Keep concurrency low.
- Do not overload target websites.
- Do not run many scans at once before rate limits and per-domain concurrency exist.

The concurrency value can be tuned later.

## Part 3: Scan Status Helpers

Create:

```text
lib/scans/status.ts
```

Expected helpers:

```ts
export async function updateScanStatus(params: {
  scanId: string;
  status:
    | "queued"
    | "validating"
    | "fetching"
    | "analyzing"
    | "generating_report"
    | "generating_pdf"
    | "completed"
    | "failed";
  errorCode?: string | null;
  errorMessage?: string | null;
}) {}
```

Additional helper:

```ts
export async function markScanFailed(params: {
  scanId: string;
  errorCode: string;
  errorMessage: string;
}) {}
```

Rules:

- Status transitions should update `updated_at`.
- `failed` should set `failed_at`.
- `completed` should set `completed_at`.
- Error fields should be cleared when moving into non-failed active statuses.
- Do not overwrite scores or report data in this task.

If a `scan_events` table exists, optionally record status transitions there. Do not add it if the schema intentionally skipped it.

## Part 4: Job Data Validation

Create validation for `scan.run` payloads.

Expected payload:

```ts
{
  scanId: string;
}
```

Use Zod if it already exists:

```ts
const runScanJobSchema = z.object({
  scanId: z.string().min(1),
});
```

Rules:

- Reject jobs without `scanId`.
- Reject non-string scan IDs.
- Do not trust queue payloads just because the app enqueued them.
- Invalid job payloads should fail the job with a clear internal error.

## Part 5: Run Scan Handler

Create:

```text
worker/handlers/run-scan.ts
```

Expected function:

```ts
export async function handleRunScanJob(job: Job<RunScanJobData>) {
  // validate job data
  // load scan
  // check scan state
  // update statuses
}
```

V1 worker smoke behavior:

```text
validate job data
load scan by scanId
if scan does not exist -> fail job
if scan is completed -> no-op
if scan is failed -> no-op or fail depending policy
if scan is queued -> status validating
status fetching
stop before real fetcher
mark failed with PROCESSING_NOT_IMPLEMENTED
```

Recommended temporary final status:

```text
failed
```

Temporary error:

```text
PROCESSING_NOT_IMPLEMENTED
```

User-safe message:

```text
Scan processing is not implemented yet.
```

Why mark failed instead of completed:

- Avoids fake successful scans.
- Makes it clear the worker path ran.
- Prevents later UI from showing a completed report with no analysis.

Once `12-page-fetcher.md` and later analysis tasks are implemented, this temporary failure should be replaced with real processing.

## Part 6: Scan State Rules

The handler should treat scan states carefully.

Recommended behavior:

```text
queued -> process
validating/fetching/analyzing/generating_report/generating_pdf -> process or recover based on retry policy
completed -> no-op success
failed -> no-op success unless retrying failed scans is explicitly supported
```

For V1 worker setup:

- Only normal `queued` scans need to be processed.
- Completed scans should not be reprocessed.
- Failed scans should not be reprocessed automatically.

Do not delete jobs for unknown scans without logging or failing clearly.

## Part 7: Worker Instance

Create:

```text
worker/scan-worker.ts
```

Expected behavior:

- Creates a BullMQ `Worker`.
- Listens to the scan queue.
- Handles only `scan.run` jobs.
- Uses shared Redis connection config.
- Uses configured concurrency.

Example shape:

```ts
import { Worker } from "bullmq";
import { createRedisConnection } from "@/lib/queue/connection";
import { QUEUE_NAMES, JOB_NAMES } from "@/lib/queue/names";
import { WORKER_CONFIG } from "./config";
import { handleRunScanJob } from "./handlers/run-scan";

export function createScanWorker() {
  return new Worker(
    QUEUE_NAMES.scans,
    async (job) => {
      if (job.name === JOB_NAMES.runScan) {
        return handleRunScanJob(job);
      }

      throw new Error(`Unknown job name: ${job.name}`);
    },
    {
      connection: createRedisConnection(),
      concurrency: WORKER_CONFIG.concurrency,
      lockDuration: WORKER_CONFIG.lockDurationMs,
      stalledInterval: WORKER_CONFIG.stalledIntervalMs,
    },
  );
}
```

Rules:

- Do not import React or Next.js route code.
- Worker code should run in Node.js.
- Worker code can import shared server-only libraries.

## Part 8: Worker Entrypoint

Create:

```text
worker/index.ts
```

Expected behavior:

- Starts the scan worker.
- Logs startup.
- Logs completed and failed jobs.
- Handles process shutdown.

Recommended events:

```ts
worker.on("completed", ...)
worker.on("failed", ...)
worker.on("error", ...)
worker.on("stalled", ...)
```

Do not log sensitive values.

## Part 9: Graceful Shutdown

Create:

```text
worker/lifecycle.ts
```

or implement in `worker/index.ts`.

Required signals:

```text
SIGINT
SIGTERM
```

Expected behavior:

```text
receive shutdown signal
close worker
close Redis connection if owned
exit process
```

Rules:

- Avoid abrupt exit while a job is active when possible.
- Log shutdown progress.
- Do not leave dangling connections in local development.

## Part 10: Error Handling

Worker errors should be mapped to stable scan errors when they affect a scan.

Recommended worker-specific error codes:

```text
SCAN_NOT_FOUND
INVALID_JOB_PAYLOAD
PROCESSING_NOT_IMPLEMENTED
WORKER_PROCESSING_FAILED
```

Rules:

- Invalid job payload should fail the job.
- Missing scan should fail the job.
- Known scan processing failure should mark the scan failed.
- Unexpected errors should mark the scan failed when a scan ID is known.
- Do not expose internal stack traces in `scans.error_message`.

## Part 11: Retry Behavior

Queue job retry attempts were configured in `10-queue-setup.md`.

For this setup task:

- Do not retry `PROCESSING_NOT_IMPLEMENTED`.
- Do not repeatedly mark the same scan failed in a noisy way.
- Consider throwing only for infrastructure errors where BullMQ retry is useful.

Future tasks may refine retry behavior for:

- Temporary network failures.
- AI provider failures.
- PDF generation failures.

## Part 12: Integration With Scan Creation

After this task, the flow should be:

```text
user creates scan
scan row status = queued
scan.run job enqueued
worker picks up job
scan status changes to validating/fetching
worker stops at temporary processing boundary
scan status becomes failed with PROCESSING_NOT_IMPLEMENTED
```

This is acceptable for this task because it proves the async path works without pretending analysis exists.

Later tasks will replace the temporary failure with real processing.

## Part 13: Dashboard And Status UI

The existing dashboard and scan status placeholder should reflect worker updates:

- `queued`
- `validating`
- `fetching`
- `failed`

No polling improvements are required in this task unless a basic refresh is already available.

If the scan status page is opened after worker execution, it should show the updated status and user-safe error message.

## Part 14: Tests

Add tests for job handler logic where practical.

Recommended test cases:

```text
invalid payload fails
missing scan fails
completed scan no-ops
failed scan no-ops
queued scan transitions to validating
queued scan transitions to fetching
queued scan ends with PROCESSING_NOT_IMPLEMENTED temporary failure
unexpected error marks scan failed when scan ID is known
```

Mock:

- Database calls.
- Status update helpers.
- BullMQ job object.

Do not require a live Redis server for unit tests.

Integration test with real Redis is optional.

## Part 15: Manual Validation

Run:

```bash
npm run lint
npm run typecheck
npm run build
npm run test
```

Manual local flow with Redis and Neon configured:

1. Start Redis or configure managed Redis.
2. Start the Next.js app:

```bash
npm run dev
```

3. Start the worker in another terminal:

```bash
npm run worker:dev
```

4. Sign in.
5. Create a scan.
6. Confirm scan is inserted with `queued`.
7. Confirm job is enqueued.
8. Confirm worker picks up the job.
9. Confirm scan status changes.
10. Confirm scan ends with temporary `PROCESSING_NOT_IMPLEMENTED` failure.

If Redis or Neon is unavailable locally, document which checks could not be run.

## Part 16: Deployment Notes

The worker should deploy separately from the Next.js app.

Recommended deployment targets:

- Railway
- Render
- Fly.io
- ECS
- VPS

Required environment variables:

```env
DATABASE_URL=
REDIS_URL=
```

Future worker tasks may also require:

```env
OPENAI_API_KEY=
STORAGE_ACCESS_KEY_ID=
STORAGE_SECRET_ACCESS_KEY=
STORAGE_BUCKET=
STORAGE_ENDPOINT=
```

Do not assume Vercel serverless functions will run the worker.

## Expected Final State

At the end of this task:

- A worker process exists.
- The worker consumes `scan.run` jobs.
- Job payloads are validated.
- Scan records are loaded from PostgreSQL.
- Scan statuses are updated by the worker.
- Invalid jobs fail safely.
- Missing scans fail safely.
- Worker shutdown is graceful.
- Real SEO processing is still not implemented.

## Acceptance Criteria

This task is complete when:

1. Worker scripts exist in `package.json`.
2. A worker entrypoint exists.
3. A BullMQ `Worker` consumes the scan queue.
4. The worker handles `scan.run` jobs.
5. Job payloads are validated.
6. Worker jobs load scan records by `scanId`.
7. Completed scans are not reprocessed.
8. Failed scans are not reprocessed automatically.
9. Queued scans transition through early processing statuses.
10. The temporary processing boundary is explicit and does not fake SEO results.
11. Known worker failures mark scans failed with stable error codes.
12. Worker logs job completion and failure without leaking secrets.
13. Graceful shutdown handles `SIGINT` and `SIGTERM`.
14. Unit tests cover core handler behavior where practical.
15. No page fetcher, SEO extraction, scoring, AI report, PDF, billing, or crawl logic is added.
16. Lint, typecheck, build, and tests pass, or any environment-specific blocker is documented.

## Agent Notes

- This task proves the asynchronous architecture.
- Do not process scans inside API routes.
- Do not fake completed reports.
- Do not add SEO findings yet.
- Do not fetch target pages yet unless a minimal verification re-check already exists and is explicitly scoped.
- Keep worker code server-only and Node-only.
- Keep payloads small.
- Later tasks should replace `PROCESSING_NOT_IMPLEMENTED` with real processing stages.
