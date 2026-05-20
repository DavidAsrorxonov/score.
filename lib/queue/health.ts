import "server-only";

import { getScanQueue } from "./scan-queue";
import type { QueueHealth } from "./types";

export async function checkQueueHealth(): Promise<QueueHealth> {
  try {
    const queue = getScanQueue();

    await queue.getJobCounts("waiting", "active", "delayed", "failed");

    return {
      ok: true,
      message: "Queue is reachable.",
    };
  } catch {
    return {
      ok: false,
      message: "Queue is not reachable.",
    };
  }
}
