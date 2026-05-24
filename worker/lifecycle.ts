interface ShutdownHandlersParams {
  close: () => Promise<void>;
  onSignal?: (signal: NodeJS.Signals) => void;
  onClosed?: () => void;
  onError?: (error: unknown) => void;
}

export function registerShutdownHandlers(params: ShutdownHandlersParams) {
  let shuttingDown = false;

  async function shutdown(signal: NodeJS.Signals) {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    params.onSignal?.(signal);

    try {
      await params.close();
      params.onClosed?.();
      process.exit(0);
    } catch (error) {
      params.onError?.(error);
      process.exit(1);
    }
  }

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}
