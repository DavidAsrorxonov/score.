# 10. Queue Setup

## Purpose

This task adds the background job queue foundation for scōre. using BullMQ and Redis. Scan creation should remain fast: once a scan is accepted and stored, the app should enqueue a background job instead of processing SEO analysis inside the request lifecycle.

This task creates queue infrastructure, job types, enqueue helpers, and basic job status coordination. It does not implement the worker processing logic, page fetching, SEO extraction, scoring, AI report generation, or PDF export.

The worker implementation comes next in `11-worker-setup.md`.

## Required Context

Before starting this task, read these files:

1. `project-overview.md`
2. `architecture-context.md`
3. `04-database-schema.md`
4. `09-scan-creation-api.md`

This task depends on:

- A scan creation flow that creates queued scan records.
- Drizzle database schema.
- Redis environment variable placeholders.
- Accepted scans with `status = queued`.

## Goal

At the end of this task:

- BullMQ is installed.
- Redis connection configuration exists.
- A scan queue exists.
- Scan job types are defined.
- Accepted scans are enqueued after database creation.
- Queue jobs carry IDs, not large payloads.
- Queue failures during enqueue are handled predictably.
- Development tools or scripts can inspect queue behavior.
- No actual scan processing happens yet.

## Core Rule

Queue jobs must contain small payloads:

```ts
{
  scanId: string;
}
```

Do not place raw HTML, full report data, extracted SEO data, or large objects in Redis job payloads. Workers should load canonical data from PostgreSQL.

## Scope

### In Scope

- Install BullMQ.
- Install Redis client dependency if needed.
- Add Redis connection helper.
- Add queue constants.
- Add scan job type definitions.
- Add scan queue instance.
- Add enqueue helper.
- Update scan creation to enqueue accepted scans after transaction commit.
- Add basic queue health utility.
- Add development script for queue smoke test if useful.
- Add tests for enqueue helper where practical.

### Out Of Scope

- Worker process.
- BullMQ `Worker` implementation.
- Page fetching.
- Domain re-verification inside worker.
- SEO extraction.
- SEO checks.
- Scoring.
- AI report generation.
- PDF generation.
- Retry handling for real processing failures.
- Queue dashboard UI.
- Production Redis provisioning.

## Required Packages

Install:

```bash
npm install bullmq ioredis
```

BullMQ uses Redis. `ioredis` is the standard Redis client used by BullMQ.

Do not install worker-specific packages yet unless required by BullMQ setup.

## Environment Variables

Update `.env.example`:

```env
# Redis / Queue
REDIS_URL=
```

Expected examples:

```text
redis://localhost:6379
rediss://default:PASSWORD@HOST:PORT
```

Notes:

- Use `rediss://` when the provider requires TLS.
- Do not commit real Redis credentials.
- Upstash Redis may need provider-specific connection options. Keep connection config isolated so it can be adjusted later.

## Recommended Files

Create:

```text
lib/queue/config.ts
lib/queue/connection.ts
lib/queue/names.ts
lib/queue/types.ts
lib/queue/scan-queue.ts
lib/queue/enqueue-scan.ts
lib/queue/health.ts
lib/queue/index.ts
```

Optional:

```text
scripts/queue-smoke-test.ts
lib/queue/__tests__/enqueue-scan.test.ts
```

## Part 1: Queue Names

Create:

```text
lib/queue/names.ts
```

Recommended constants:

```ts
export const QUEUE_NAMES = {
  scans: "score-scans",
} as const;

export const JOB_NAMES = {
  runScan: "scan.run",
  generateReport: "report.generate",
  generatePdf: "pdf.generate",
} as const;
```

V1 should only enqueue:

```text
scan.run
```

The other job names may exist as future-safe constants but should not be used until their feature tasks.

## Part 2: Queue Types

Create:

```text
lib/queue/types.ts
```

Recommended types:

```ts
export type RunScanJobData = {
  scanId: string;
};

export type GenerateReportJobData = {
  scanId: string;
};

export type GeneratePdfJobData = {
  scanId: string;
  pdfExportId?: string;
};

export type QueueJobData =
  | RunScanJobData
  | GenerateReportJobData
  | GeneratePdfJobData;
```

Rules:

- Keep job payloads small.
- Use database IDs.
- Do not include user-submitted raw input except when there is a strong reason.
- Do not include raw HTML or AI prompt data.

## Part 3: Redis Connection

Create:

```text
lib/queue/connection.ts
```

Expected behavior:

- Reads `REDIS_URL`.
- Creates an `ioredis` connection.
- Exports connection options or a connection instance usable by BullMQ.

Important BullMQ setting:

```ts
maxRetriesPerRequest: null;
```

BullMQ often requires this for blocking commands.

Example shape:

```ts
import IORedis from "ioredis";

export function createRedisConnection() {
  if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL is required for queue operations.");
  }

  return new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
  });
}
```

Rules:

- Do not expose Redis credentials to client components.
- Queue helpers are server-only.
- Avoid creating Redis connections in React client components.
- If using a singleton connection, ensure it works in development without excessive duplicate connections.

## Part 4: Queue Config

Create:

```text
lib/queue/config.ts
```

Recommended config:

```ts
export const SCAN_QUEUE_DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 5000,
  },
  removeOnComplete: {
    age: 60 * 60 * 24,
    count: 1000,
  },
  removeOnFail: {
    age: 60 * 60 * 24 * 7,
    count: 5000,
  },
} as const;
```

Notes:

- These are queue-level job retention settings.
- Real processing retry rules may be refined during worker implementation.
- Failed job data should not contain sensitive or large payloads.

## Part 5: Scan Queue Instance

Create:

```text
lib/queue/scan-queue.ts
```

Expected behavior:

- Creates and exports the BullMQ `Queue` for scan jobs.
- Uses the Redis connection.
- Applies default job options.

Example shape:

```ts
import { Queue } from "bullmq";
import { createRedisConnection } from "./connection";
import { QUEUE_NAMES } from "./names";
import { SCAN_QUEUE_DEFAULT_JOB_OPTIONS } from "./config";
import type { RunScanJobData } from "./types";

export const scanQueue = new Queue<RunScanJobData>(QUEUE_NAMES.scans, {
  connection: createRedisConnection(),
  defaultJobOptions: SCAN_QUEUE_DEFAULT_JOB_OPTIONS,
});
```

If singleton handling is needed for Next.js development hot reload, implement it carefully in this file.

## Part 6: Enqueue Helper

Create:

```text
lib/queue/enqueue-scan.ts
```

Expected function:

```ts
export async function enqueueScanRun(scanId: string) {
  return scanQueue.add(
    JOB_NAMES.runScan,
    { scanId },
    {
      jobId: `scan.run-${scanId}`,
    },
  );
}
```

Rules:

- Use deterministic `jobId` based on scan ID to avoid duplicate jobs.
- Do not enqueue if `scanId` is empty.
- Return the BullMQ job or a small result object.
- Do not update scan status here unless enqueue failure handling requires it.

Idempotency:

- Calling `enqueueScanRun(scanId)` twice should not create duplicate jobs if the first job still exists.
- BullMQ deterministic job IDs help with this.

## Part 7: Integrate With Scan Creation

Update the scan creation service from `09-scan-creation-api.md`.

Recommended behavior:

```text
create scan and usage event in database transaction
commit transaction
enqueue scan.run job
return scan response
```

Important:

- Enqueue after transaction commit.
- Do not enqueue inside the transaction.
- Do not enqueue if transaction fails.
- If enqueue fails, handle it clearly.

### Enqueue Failure Policy

Recommended V1 policy:

If scan row is created but queue enqueue fails:

1. Mark scan as `failed`.
2. Set `error_code = QUEUE_ENQUEUE_FAILED`.
3. Set user-safe error message.
4. Return failure or success-with-failed-status depending on UX choice.

Better user experience:

```text
Return failure and tell the user the scan could not be started.
```

But note:

- Usage was already recorded if the transaction committed.
- If queue enqueue fails due to infrastructure, consuming usage may feel unfair.

Recommended V1 compromise:

```text
Create scan and usage event in transaction.
After commit, enqueue job.
If enqueue fails, mark scan failed and create a clear error.
Do not attempt to delete usage automatically in this task.
```

Future improvement:

- Add a repair job that enqueues queued scans missing jobs.
- Add an outbox table for transactional enqueue reliability.

Outbox pattern is not required for V1 unless the team wants stronger reliability now.

## Part 8: Add Queue Error Code

If the scan error code list exists, add:

```text
QUEUE_ENQUEUE_FAILED
```

User-safe message:

```text
The scan was created, but processing could not be started. Please try again later.
```

Do not expose Redis errors to the user.

## Part 9: Queue Health Helper

Create:

```text
lib/queue/health.ts
```

Expected function:

```ts
export async function checkQueueHealth() {
  // returns whether Redis can be reached and queue can respond
}
```

Recommended output:

```ts
export type QueueHealth = {
  ok: boolean;
  message: string;
};
```

This can be used later by admin or deployment checks.

Do not expose a public unauthenticated health endpoint unless explicitly needed.

## Part 10: Optional Smoke Test Script

Optional file:

```text
scripts/queue-smoke-test.ts
```

Expected behavior:

- Reads a scan ID from command line or uses a test ID.
- Calls `enqueueScanRun`.
- Logs the job ID.

Example usage:

```bash
npx tsx scripts/queue-smoke-test.ts scan-id
```

Only add this if the project already uses `tsx` or adding it is acceptable.

Do not make this script create real scans.

## Part 11: Tests

Add tests where practical.

Recommended test cases:

```text
enqueueScanRun rejects empty scan ID
enqueueScanRun uses job name scan.run
enqueueScanRun uses payload { scanId }
enqueueScanRun uses deterministic job ID
scan creation calls enqueue after database write
scan creation does not enqueue when verification fails
scan creation does not enqueue when usage limit blocks
enqueue failure marks scan failed if implemented
```

Mock BullMQ in unit tests. Do not require a live Redis server for normal unit tests.

Integration tests with real Redis are optional and should be clearly separated.

## Part 12: Security And Reliability Requirements

Rules:

- Redis credentials stay server-side.
- Queue jobs contain only IDs and small metadata.
- Do not store raw HTML in Redis.
- Do not store AI prompts or generated reports in Redis.
- Do not trust a queued `scanId` without loading and checking the scan in the worker later.
- Use deterministic job IDs to avoid accidental duplicates.
- Enqueue only after database transaction commit.
- Handle enqueue errors.

## Part 13: UI Integration

After this task:

- Creating a scan should still redirect to the scan status placeholder.
- The scan should show `queued`.
- The user should not see worker details.
- If enqueue fails and scan is marked failed, show the scan error message.

No queue progress UI is required yet.

Polling and worker-driven status updates belong to later tasks.

## Part 14: Validation

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

If a Redis URL is available, manually verify:

1. Start the app.
2. Create a scan.
3. Confirm scan row is created.
4. Confirm usage event is created.
5. Confirm a `scan.run` job is added to Redis.
6. Confirm the scan remains `queued` because no worker exists yet.

If Redis is unavailable, document that live enqueue could not be tested.

## Expected Final State

At the end of this task:

- BullMQ and Redis are configured.
- Scan queue exists.
- `scan.run` job type exists.
- Accepted scans enqueue a background job.
- Jobs carry only `scanId`.
- Duplicate enqueue calls are guarded by deterministic job IDs.
- Queue errors are handled.
- No worker processing has been implemented.

## Acceptance Criteria

This task is complete when:

1. `bullmq` and `ioredis` are installed.
2. `REDIS_URL` is documented in `.env.example`.
3. Queue names and job names are centralized.
4. Redis connection helper exists.
5. Scan queue instance exists.
6. `enqueueScanRun(scanId)` exists.
7. Enqueued scan jobs use payload `{ scanId }`.
8. Enqueued scan jobs use deterministic job IDs.
9. Scan creation enqueues a `scan.run` job after successful database commit.
10. Failed validation does not enqueue.
11. Failed usage limit check does not enqueue.
12. Failed domain verification does not enqueue.
13. Enqueue failure is handled and does not expose raw Redis errors.
14. No worker, page fetcher, SEO extraction, AI report, PDF, billing, or crawl logic is added.
15. Lint, typecheck, build, and tests pass, or any environment-specific blocker is documented.

## Agent Notes

- This is queue setup only.
- Do not implement a BullMQ Worker in this task.
- Do not process jobs in API routes.
- Do not put large payloads in Redis.
- Enqueue after database commit, not before.
- Keep queue helpers server-only.
- Use deterministic job IDs for idempotency.
- Leave job processing to `11-worker-setup.md`.
