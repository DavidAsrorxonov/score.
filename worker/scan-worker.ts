import { Worker } from "bullmq";

import { createRedisConnection, JOB_NAMES, QUEUE_NAMES } from "@/lib/queue";
import type { RunScanJobData } from "@/lib/queue";

import { WORKER_CONFIG } from "./config";
import { handleRunScanJob } from "./handlers/run-scan";

export function createScanWorker() {
  const connection = createRedisConnection();

  const worker = new Worker<RunScanJobData>(
    QUEUE_NAMES.scans,
    async (job) => {
      if (job.name === JOB_NAMES.runScan) {
        return handleRunScanJob(job);
      }

      throw new Error(`Unknown job name: ${job.name}`);
    },
    {
      connection,
      concurrency: WORKER_CONFIG.concurrency,
      lockDuration: WORKER_CONFIG.lockDurationMs,
      stalledInterval: WORKER_CONFIG.stalledIntervalMs,
    },
  );

  return {
    worker,
    async close() {
      await worker.close();
      connection.disconnect();
    },
  };
}
