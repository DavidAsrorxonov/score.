import { beforeAll, describe, expect, it, vi } from "vitest";

import type { User } from "@/lib/db/types";
import type { VerificationResult } from "@/lib/verification";

import type { createScanForCurrentUser as createScanForCurrentUserType } from "../create-scan";
import type { CreateScanType } from "../types";

vi.mock("server-only", () => ({}));

process.env.DATABASE_URL ??= "postgresql://user:password@localhost:5432/score";

let createScanForCurrentUser: typeof createScanForCurrentUserType;

type CreateScanDependencies = NonNullable<
  Parameters<typeof createScanForCurrentUserType>[1]
>;

const user = {
  id: "user-id",
  clerkUserId: "clerk-user-id",
  email: "test@example.com",
  name: "Test User",
  imageUrl: null,
  planCode: "free",
  createdAt: new Date("2026-05-19T00:00:00.000Z"),
  updatedAt: new Date("2026-05-19T00:00:00.000Z"),
} satisfies User;

const successfulVerification = {
  ok: true,
  inputUrl: "example.com",
  normalizedUrl: "https://example.com/",
  finalUrl: "https://example.com/",
  hostname: "example.com",
  resolvedIps: ["93.184.216.34"],
  statusCode: 200,
  contentType: "text/html; charset=utf-8",
  responseTimeMs: 42,
  contentLengthBytes: 1234,
  redirectChain: [],
  verifiedAt: new Date("2026-05-19T00:00:00.000Z"),
} satisfies VerificationResult;

const failedVerification = {
  ok: false,
  inputUrl: "https://example.com/file.pdf",
  normalizedUrl: "https://example.com/file.pdf",
  finalUrl: "https://example.com/file.pdf",
  hostname: "example.com",
  resolvedIps: ["93.184.216.34"],
  statusCode: 200,
  contentType: "application/pdf",
  responseTimeMs: 20,
  redirectChain: [],
  code: "NON_HTML_RESPONSE",
  message: "This URL does not appear to return an HTML page.",
  verifiedAt: new Date("2026-05-19T00:00:00.000Z"),
} satisfies VerificationResult;

function allowedUsage() {
  return {
    allowed: true,
    summary: {
      usedToday: 0,
      dailyLimit: 5,
      remainingToday: 5,
      isLimited: true,
      isLimitReached: false,
      resetAt: new Date("2026-05-20T00:00:00.000Z"),
      planCode: "free",
    },
  } as const;
}

function blockedUsage() {
  return {
    allowed: false,
    reason: "DAILY_SCAN_LIMIT_REACHED",
    message:
      "You've used all 5 free scans for today. Your limit resets at midnight UTC.",
    summary: {
      usedToday: 5,
      dailyLimit: 5,
      remainingToday: 0,
      isLimited: true,
      isLimitReached: true,
      resetAt: new Date("2026-05-20T00:00:00.000Z"),
      planCode: "free",
    },
  } as const;
}

function createDatabase() {
  const returning = vi.fn().mockResolvedValue([
    {
      id: "scan-id",
      status: "queued",
      inputUrl: "example.com",
      normalizedUrl: "https://example.com/",
      finalUrl: "https://example.com/",
      scanType: "homepage",
    },
  ]);
  const values = vi.fn(() => ({ returning }));
  const insert = vi.fn(() => ({ values }));
  const tx = { insert };
  const transaction = vi.fn(async (callback) => callback(tx));

  return {
    database: { transaction } as unknown as CreateScanDependencies["database"],
    transaction,
    tx,
    insert,
    values,
    returning,
  };
}

function baseDependencies(): CreateScanDependencies {
  const { database } = createDatabase();

  return {
    database,
    getCurrentUser: vi.fn().mockResolvedValue(user),
    checkUsage: vi.fn().mockResolvedValue(allowedUsage()),
    recordUsage: vi.fn().mockResolvedValue({ id: "usage-id" }),
    verify: vi.fn().mockResolvedValue(successfulVerification),
  };
}

beforeAll(async () => {
  ({ createScanForCurrentUser } = await import("../create-scan"));
});

describe("createScanForCurrentUser", () => {
  it("rejects unsupported scan types before usage checks", async () => {
    const dependencies = baseDependencies();

    const result = await createScanForCurrentUser(
      {
        input: "example.com",
        scanType: "site_crawl" as CreateScanType,
      },
      dependencies,
    );

    expect(result).toMatchObject({
      ok: false,
      code: "UNSUPPORTED_SCAN_TYPE",
      status: 403,
    });
    expect(dependencies.checkUsage).not.toHaveBeenCalled();
  });

  it("blocks users at the daily limit without verifying or writing", async () => {
    const database = createDatabase();
    const dependencies = {
      ...baseDependencies(),
      database: database.database,
      checkUsage: vi.fn().mockResolvedValue(blockedUsage()),
    };

    const result = await createScanForCurrentUser(
      { input: "example.com", scanType: "homepage" },
      dependencies,
    );

    expect(result).toMatchObject({
      ok: false,
      code: "DAILY_SCAN_LIMIT_REACHED",
      status: 409,
    });
    expect(dependencies.verify).not.toHaveBeenCalled();
    expect(database.transaction).not.toHaveBeenCalled();
  });

  it("does not create a scan or usage event when verification fails", async () => {
    const database = createDatabase();
    const dependencies = {
      ...baseDependencies(),
      database: database.database,
      verify: vi.fn().mockResolvedValue(failedVerification),
    };

    const result = await createScanForCurrentUser(
      { input: "https://example.com/file.pdf", scanType: "single_url" },
      dependencies,
    );

    expect(result).toMatchObject({
      ok: false,
      code: "NON_HTML_RESPONSE",
      status: 422,
    });
    expect(database.transaction).not.toHaveBeenCalled();
    expect(dependencies.recordUsage).not.toHaveBeenCalled();
  });

  it("creates the queued scan and accepted usage inside one transaction", async () => {
    const database = createDatabase();
    const dependencies = {
      ...baseDependencies(),
      database: database.database,
    };

    const result = await createScanForCurrentUser(
      { input: "example.com", scanType: "homepage" },
      dependencies,
    );

    expect(result).toEqual({
      ok: true,
      scan: {
        id: "scan-id",
        status: "queued",
        inputUrl: "example.com",
        normalizedUrl: "https://example.com/",
        finalUrl: "https://example.com/",
        scanType: "homepage",
      },
    });
    expect(database.transaction).toHaveBeenCalledTimes(1);
    expect(database.values).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: user.id,
        scanType: "homepage",
        status: "queued",
        inputUrl: "example.com",
        normalizedUrl: "https://example.com/",
        finalUrl: "https://example.com/",
        domain: "example.com",
        statusCode: 200,
        contentType: "text/html; charset=utf-8",
      }),
    );
    expect(dependencies.recordUsage).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: user.id,
        scanId: "scan-id",
      }),
      database.tx,
    );
  });

  it("re-checks usage inside the transaction before inserting", async () => {
    const database = createDatabase();
    const dependencies = {
      ...baseDependencies(),
      database: database.database,
      checkUsage: vi
        .fn()
        .mockResolvedValueOnce(allowedUsage())
        .mockResolvedValueOnce(blockedUsage()),
    };

    const result = await createScanForCurrentUser(
      { input: "example.com", scanType: "homepage" },
      dependencies,
    );

    expect(result).toMatchObject({
      ok: false,
      code: "DAILY_SCAN_LIMIT_REACHED",
    });
    expect(dependencies.checkUsage).toHaveBeenCalledTimes(2);
    expect(database.insert).not.toHaveBeenCalled();
    expect(dependencies.recordUsage).not.toHaveBeenCalled();
  });
});

