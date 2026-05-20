import "server-only";

import { Queue } from "bullmq";

import { SCAN_QUEUE_DEFAULT_JOB_OPTIONS } from "./config";
import { getRedisConnection } from "./connection";
import { QUEUE_NAMES } from "./names";
import type { RunScanJobData } from "./types";

declare global {
  var scoreScanQueue: Queue<RunScanJobData> | undefined;
}

export function getScanQueue() {
  if (!globalThis.scoreScanQueue) {
    globalThis.scoreScanQueue = new Queue<RunScanJobData>(QUEUE_NAMES.scans, {
      connection: getRedisConnection(),
      defaultJobOptions: SCAN_QUEUE_DEFAULT_JOB_OPTIONS,
    });
  }

  return globalThis.scoreScanQueue;
}
