import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const { createScanWorker } = await import("./scan-worker");
  const { registerShutdownHandlers } = await import("./lifecycle");
  const { logWorkerError, logWorkerInfo } = await import("./logger");

  const scanWorker = createScanWorker();

  logWorkerInfo("Scan worker started.");

  scanWorker.worker.on("completed", (job) => {
    logWorkerInfo("Job completed.", {
      jobId: job.id,
      jobName: job.name,
    });
  });

  scanWorker.worker.on("failed", (job, error) => {
    logWorkerError("Job failed.", {
      jobId: job?.id,
      jobName: job?.name,
      error: error.message,
    });
  });

  scanWorker.worker.on("error", (error) => {
    logWorkerError("Worker error.", error.message);
  });

  scanWorker.worker.on("stalled", (jobId) => {
    logWorkerInfo("Job stalled.", { jobId });
  });

  registerShutdownHandlers({
    close: scanWorker.close,
    onSignal(signal) {
      logWorkerInfo("Shutdown signal received.", { signal });
    },
    onClosed() {
      logWorkerInfo("Scan worker stopped.");
    },
    onError(error) {
      logWorkerError("Scan worker shutdown failed.", error);
    },
  });
}

void main().catch((error) => {
  console.error("[worker] Worker failed to start.", error);
  process.exit(1);
});
