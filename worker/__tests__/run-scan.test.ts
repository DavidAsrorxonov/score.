import type { Job } from "bullmq";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { ScanStatus } from "@/lib/db/types";
import type { FetchPageSuccess } from "@/lib/fetcher";

import type { handleRunScanJob as handleRunScanJobType } from "../handlers/run-scan";

vi.mock("server-only", () => ({}));

process.env.DATABASE_URL ??= "postgresql://user:password@localhost:5432/score";

let handleRunScanJob: typeof handleRunScanJobType;

interface TestScan {
  id: string;
  status: ScanStatus;
  inputUrl: string;
  normalizedUrl: string | null;
}

function createJob(data: unknown): Job<unknown> {
  return {
    id: "job-id",
    name: "scan.run",
    data,
  } as Job<unknown>;
}

function createFetchSuccess(): FetchPageSuccess {
  return {
    ok: true,
    inputUrl: "https://example.com/",
    normalizedUrl: "https://example.com/",
    finalUrl: "https://example.com/",
    hostname: "example.com",
    resolvedIps: ["93.184.216.34"],
    statusCode: 200,
    contentType: "text/html",
    contentLengthBytes: 18,
    responseTimeMs: 42,
    pageSizeBytes: 18,
    redirectChain: [],
    html: "<html>Hello</html>",
    fetchedAt: new Date("2026-06-03T00:00:00.000Z"),
  };
}

function createTestScan(
  status: ScanStatus,
  overrides: Partial<TestScan> = {},
): TestScan {
  return {
    id: "scan-id",
    status,
    inputUrl: "example.com",
    normalizedUrl: "https://example.com/",
    ...overrides,
  };
}

function createDependencies(scan: TestScan | null = createTestScan("queued")) {
  return {
    loadScan: vi.fn().mockResolvedValue(scan),
    updateStatus: vi.fn().mockResolvedValue(undefined),
    failScan: vi.fn().mockResolvedValue(undefined),
    fetchPage: vi.fn().mockResolvedValue(createFetchSuccess()),
    saveFetchedPage: vi.fn().mockResolvedValue(undefined),
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
    expect(dependencies.fetchPage).not.toHaveBeenCalled();
    expect(dependencies.saveFetchedPage).not.toHaveBeenCalled();
  });

  it("fails missing scans clearly", async () => {
    const dependencies = createDependencies(null);

    await expect(
      handleRunScanJob(createJob({ scanId: "missing-scan" }), dependencies),
    ).rejects.toThrow("SCAN_NOT_FOUND");

    expect(dependencies.loadScan).toHaveBeenCalledWith("missing-scan");
    expect(dependencies.failScan).not.toHaveBeenCalled();
    expect(dependencies.fetchPage).not.toHaveBeenCalled();
    expect(dependencies.saveFetchedPage).not.toHaveBeenCalled();
  });

  it("does not reprocess completed scans", async () => {
    const dependencies = createDependencies(createTestScan("completed"));

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
    expect(dependencies.fetchPage).not.toHaveBeenCalled();
    expect(dependencies.saveFetchedPage).not.toHaveBeenCalled();
  });

  it("does not reprocess failed scans", async () => {
    const dependencies = createDependencies(createTestScan("failed"));

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
    expect(dependencies.fetchPage).not.toHaveBeenCalled();
    expect(dependencies.saveFetchedPage).not.toHaveBeenCalled();
  });

  it("fetches queued scans, persists metadata, and stops at the SEO extraction boundary", async () => {
    const fetchSuccess = createFetchSuccess();
    const dependencies = createDependencies(createTestScan("queued"));
    dependencies.fetchPage.mockResolvedValue(fetchSuccess);

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
    expect(dependencies.fetchPage).toHaveBeenCalledWith("https://example.com/");
    expect(dependencies.saveFetchedPage).toHaveBeenCalledWith(
      "scan-id",
      fetchSuccess,
    );
    expect(dependencies.updateStatus).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        scanId: "scan-id",
        status: "analyzing",
        metadata: expect.objectContaining({
          fetch: expect.objectContaining({
            finalUrl: "https://example.com/",
            pageSizeBytes: 18,
          }),
        }),
      }),
    );
    expect(dependencies.failScan).toHaveBeenCalledWith(
      expect.objectContaining({
        scanId: "scan-id",
        errorCode: "SEO_EXTRACTION_NOT_IMPLEMENTED",
        errorMessage: "SEO extraction is not implemented yet.",
      }),
    );
  });

  it("continues from validating without resetting to queued", async () => {
    const dependencies = createDependencies(createTestScan("validating"));

    await handleRunScanJob(createJob({ scanId: "scan-id" }), dependencies);

    expect(dependencies.updateStatus).toHaveBeenCalledTimes(2);
    expect(dependencies.updateStatus).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        scanId: "scan-id",
        status: "fetching",
      }),
    );
    expect(dependencies.updateStatus).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        scanId: "scan-id",
        status: "analyzing",
      }),
    );
  });

  it("marks scan fetch failures with the fetcher error code", async () => {
    const dependencies = createDependencies(createTestScan("queued"));
    dependencies.fetchPage.mockResolvedValue({
      ok: false,
      inputUrl: "https://example.com/",
      normalizedUrl: "https://example.com/",
      finalUrl: "https://example.com/",
      hostname: "example.com",
      resolvedIps: ["93.184.216.34"],
      statusCode: 403,
      contentType: "text/html",
      contentLengthBytes: null,
      responseTimeMs: 30,
      pageSizeBytes: undefined,
      redirectChain: [],
      code: "FETCH_BLOCKED",
      message: "The website blocked the fetch request.",
      fetchedAt: new Date("2026-06-03T00:00:00.000Z"),
    });

    const result = await handleRunScanJob(
      createJob({ scanId: "scan-id" }),
      dependencies,
    );

    expect(result).toEqual({
      scanId: "scan-id",
      action: "processed",
      status: "failed",
    });
    expect(dependencies.saveFetchedPage).not.toHaveBeenCalled();
    expect(dependencies.failScan).toHaveBeenCalledWith(
      expect.objectContaining({
        scanId: "scan-id",
        errorCode: "FETCH_BLOCKED",
        errorMessage: "The website blocked the fetch request.",
        metadata: expect.objectContaining({
          fetch: expect.objectContaining({
            statusCode: 403,
          }),
        }),
      }),
    );
  });

  it("marks unexpected handler errors on the scan when the scan ID is known", async () => {
    const dependencies = createDependencies(createTestScan("queued"));
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
