export function logWorkerInfo(message: string, metadata?: Record<string, unknown>) {
  if (metadata) {
    console.log(`[worker] ${message}`, metadata);
    return;
  }

  console.log(`[worker] ${message}`);
}

export function logWorkerError(message: string, error?: unknown) {
  console.error(`[worker] ${message}`, error);
}
