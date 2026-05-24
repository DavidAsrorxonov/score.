import type { Job } from "bullmq";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { ScanStatus } from "@/lib/db/types";

import type { handleRunScanJob as handleRunScanJobType } from "../handlers/run-scan";

vi.mock("server-only", () => ({}));

process.env.DATABASE_URL ??= "postgresql://user:password@localhost:5432/score";

let handleRunScanJob: typeof handleRunScanJobType;

interface TestScan {
  id: string;
  status: ScanStatus;
}

function createJob(data: unknown): Job<unknown> {
  return {
    id: "job-id",
    name: "scan.run",
    data,
  } as Job<unknown>;
}

function createDependencies(scan: TestScan | null = { id: "scan-id", status: "queued" }) {
  return {
    loadScan: vi.fn().mockResolvedValue(scan),
    updateStatus: vi.fn().mockResolvedValue(undefined),
    failScan: vi.fn().mockResolvedValue(undefined),
  };
}

beforeAll(async () => {
  ({ handleRunScanJob } = await import("../handlers/run-scan"));
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("handleRunScanJob", () => {
  it("fails invalid payloads", async () => {
    const dependencies = createDependencies();

    await expect(
      handleRunScanJob(createJob({ scanId: "" }), dependencies),
    ).rejects.toThrow("INVALID_JOB_PAYLOAD");

    expect(dependencies.loadScan).not.toHaveBeenCalled();
    expect(dependencies.updateStatus).not.toHaveBeenCalled();
    expect(dependencies.failScan).not.toHaveBeenCalled();
  });

  it("fails missing scans clearly", async () => {
    const dependencies = createDependencies(null);

    await expect(
      handleRunScanJob(createJob({ scanId: "missing-scan" }), dependencies),
    ).rejects.toThrow("SCAN_NOT_FOUND");

    expect(dependencies.loadScan).toHaveBeenCalledWith("missing-scan");
    expect(dependencies.failScan).not.toHaveBeenCalled();
  });

  it("does not reprocess completed scans", async () => {
    const dependencies = createDependencies({
      id: "scan-id",
      status: "completed",
    });

    const result = await handleRunScanJob(
      createJob({ scanId: "scan-id" }),
      dependencies,
    );

    expect(result).toEqual({
      scanId: "scan-id",
      action: "skipped",
      status: "completed",
    });
    expect(dependencies.updateStatus).not.toHaveBeenCalled();
    expect(dependencies.failScan).not.toHaveBeenCalled();
  });

  it("does not reprocess failed scans", async () => {
    const dependencies = createDependencies({
      id: "scan-id",
      status: "failed",
    });

    const result = await handleRunScanJob(
      createJob({ scanId: "scan-id" }),
      dependencies,
    );

    expect(result).toEqual({
      scanId: "scan-id",
      action: "skipped",
      status: "failed",
    });
    expect(dependencies.updateStatus).not.toHaveBeenCalled();
    expect(dependencies.failScan).not.toHaveBeenCalled();
  });

  it("moves queued scans through early statuses and stops at the temporary boundary", async () => {
    const dependencies = createDependencies({
      id: "scan-id",
      status: "queued",
    });

    const result = await handleRunScanJob(
      createJob({ scanId: " scan-id " }),
      dependencies,
    );

    expect(result).toEqual({
      scanId: "scan-id",
      action: "processed",
      status: "failed",
    });
    expect(dependencies.updateStatus).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        scanId: "scan-id",
        status: "validating",
      }),
    );
    expect(dependencies.updateStatus).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        scanId: "scan-id",
        status: "fetching",
      }),
    );
    expect(dependencies.failScan).toHaveBeenCalledWith(
      expect.objectContaining({
        scanId: "scan-id",
        errorCode: "PROCESSING_NOT_IMPLEMENTED",
        errorMessage: "Scan processing is not implemented yet.",
      }),
    );
  });

  it("continues from validating without resetting to queued", async () => {
    const dependencies = createDependencies({
      id: "scan-id",
      status: "validating",
    });

    await handleRunScanJob(createJob({ scanId: "scan-id" }), dependencies);

    expect(dependencies.updateStatus).toHaveBeenCalledTimes(1);
    expect(dependencies.updateStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        scanId: "scan-id",
        status: "fetching",
      }),
    );
  });

  it("marks unexpected handler errors on the scan when the scan ID is known", async () => {
    const dependencies = createDependencies({
      id: "scan-id",
      status: "queued",
    });
    dependencies.updateStatus.mockRejectedValueOnce(new Error("database down"));

    await expect(
      handleRunScanJob(createJob({ scanId: "scan-id" }), dependencies),
    ).rejects.toThrow("database down");

    expect(dependencies.failScan).toHaveBeenCalledWith(
      expect.objectContaining({
        scanId: "scan-id",
        errorCode: "WORKER_PROCESSING_FAILED",
        errorMessage: "The scan could not be processed.",
      }),
    );
  });
});
