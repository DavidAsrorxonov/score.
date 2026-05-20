import { beforeEach, describe, expect, it, vi } from "vitest";

import { JOB_NAMES } from "../names";

const addMock = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));

vi.mock("../scan-queue", () => ({
  getScanQueue: () => ({
    add: addMock,
  }),
}));

describe("enqueueScanRun", () => {
  beforeEach(() => {
    addMock.mockReset();
    addMock.mockResolvedValue({ id: "scan.run-scan-id" });
  });

  it("rejects an empty scan ID", async () => {
    const { enqueueScanRun } = await import("../enqueue-scan");

    await expect(enqueueScanRun(" ")).rejects.toThrow(
      "scanId is required to enqueue a scan.",
    );
    expect(addMock).not.toHaveBeenCalled();
  });

  it("enqueues scan.run with a small deterministic payload", async () => {
    const { enqueueScanRun } = await import("../enqueue-scan");

    await enqueueScanRun(" scan-id ");

    expect(addMock).toHaveBeenCalledWith(
      JOB_NAMES.runScan,
      { scanId: "scan-id" },
      {
        jobId: `${JOB_NAMES.runScan}-scan-id`,
      },
    );
  });
});
