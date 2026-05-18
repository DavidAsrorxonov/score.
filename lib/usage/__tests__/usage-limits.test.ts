import { describe, expect, it } from "vitest";

import { getUtcDayRange } from "../day-boundary";
import {
  createUsageSummary,
  getUsageCheckResult,
} from "../usage-limit-state";

const resetAt = new Date("2026-05-19T00:00:00.000Z");

function getFreeSummary(usedToday: number) {
  return createUsageSummary({
    usedToday,
    dailyLimit: 5,
    resetAt,
    planCode: "free",
  });
}

describe("usage limit state", () => {
  it("allows a free user with 0 of 5 scans used", () => {
    const result = getUsageCheckResult(getFreeSummary(0));

    expect(result.allowed).toBe(true);
  });

  it("allows a free user with 4 of 5 scans used", () => {
    const result = getUsageCheckResult(getFreeSummary(4));

    expect(result.allowed).toBe(true);
  });

  it("blocks a free user with 5 of 5 scans used", () => {
    const result = getUsageCheckResult(getFreeSummary(5));

    expect(result.allowed).toBe(false);

    if (!result.allowed) {
      expect(result.reason).toBe("DAILY_SCAN_LIMIT_REACHED");
      expect(result.message).toBe(
        "You've used all 5 free scans for today. Your limit resets at midnight UTC."
      );
    }
  });

  it("blocks a free user with more than 5 scans used", () => {
    const result = getUsageCheckResult(getFreeSummary(6));

    expect(result.allowed).toBe(false);
  });

  it("allows paid plans with no daily limit", () => {
    const summary = createUsageSummary({
      usedToday: 500,
      dailyLimit: null,
      resetAt,
      planCode: "pro",
    });

    const result = getUsageCheckResult(summary);

    expect(result.allowed).toBe(true);
    expect(summary.remainingToday).toBeNull();
  });

  it("never reports remaining scans below 0", () => {
    const summary = getFreeSummary(6);

    expect(summary.remainingToday).toBe(0);
  });
});

describe("UTC day boundaries", () => {
  it("starts at 00:00:00.000 UTC", () => {
    const { start } = getUtcDayRange(
      new Date("2026-05-18T14:35:42.123Z")
    );

    expect(start.toISOString()).toBe("2026-05-18T00:00:00.000Z");
  });

  it("ends at the next UTC day boundary", () => {
    const { end } = getUtcDayRange(new Date("2026-05-18T14:35:42.123Z"));

    expect(end.toISOString()).toBe("2026-05-19T00:00:00.000Z");
  });
});
