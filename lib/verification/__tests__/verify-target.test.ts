import { describe, expect, it, vi } from "vitest";

import {
  requestForVerification,
  VerificationRequestError,
} from "../http-client";
import { verifyTarget } from "../verify-target";
import type { VerificationHttpResponse } from "../types";
import type { HostnameResolver } from "../../url/types";

function createResolver(records: Record<string, string[]>): HostnameResolver {
  return async (hostname: string) => {
    const ips = records[hostname];

    if (!ips) {
      throw new Error("DNS resolution failed");
    }

    return ips;
  };
}

function createRequest(
  responses: Record<string, VerificationHttpResponse>,
): (url: string) => Promise<VerificationHttpResponse> {
  return async (url: string) => {
    const response = responses[url];

    if (!response) {
      throw new VerificationRequestError("CONNECTION_FAILED");
    }

    return response;
  };
}

function httpResponse(
  statusCode: number,
  headers: Record<string, string> = {},
): VerificationHttpResponse {
  return {
    statusCode,
    headers: new Headers(headers),
    responseTimeMs: 25,
  };
}

const publicResolver = createResolver({
  "example.com": ["93.184.216.34"],
  "www.example.com": ["93.184.216.34"],
});

describe("requestForVerification", () => {
  it("uses GET and disables automatic redirect following", async () => {
    const fetchFn = vi.fn<typeof fetch>(async () => {
      return new Response(null, {
        status: 301,
        headers: {
          location: "https://example.com/home",
        },
      });
    });

    const result = await requestForVerification("https://example.com/", {
      fetchFn,
    });

    expect(result.statusCode).toBe(301);
    expect(result.headers.get("location")).toBe("https://example.com/home");
    expect(fetchFn).toHaveBeenCalledWith(
      "https://example.com/",
      expect.objectContaining({
        method: "GET",
        redirect: "manual",
      }),
    );
  });

  it("maps aborted fetches to CONNECTION_TIMEOUT", async () => {
    const fetchFn = vi.fn<typeof fetch>(async () => {
      throw new DOMException("The operation was aborted.", "AbortError");
    });

    await expect(
      requestForVerification("https://example.com/", { fetchFn }),
    ).rejects.toMatchObject({
      code: "CONNECTION_TIMEOUT",
    });
  });
});

describe("verifyTarget successful verification", () => {
  it("verifies an HTTPS HTML page", async () => {
    const result = await verifyTarget("https://example.com", {
      resolveHostname: publicResolver,
      request: createRequest({
        "https://example.com/": httpResponse(200, {
          "content-type": "text/html",
          "content-length": "5000",
        }),
      }),
    });

    expect(result).toMatchObject({
      ok: true,
      inputUrl: "https://example.com",
      normalizedUrl: "https://example.com/",
      finalUrl: "https://example.com/",
      hostname: "example.com",
      resolvedIps: ["93.184.216.34"],
      statusCode: 200,
      contentType: "text/html",
      responseTimeMs: 25,
      contentLengthBytes: 5000,
      redirectChain: [],
    });
  });

  it("normalizes a bare domain before the first request", async () => {
    const request = vi.fn(createRequest({
      "https://example.com/": httpResponse(200, {
        "content-type": "text/html",
      }),
    }));

    const result = await verifyTarget("example.com", {
      resolveHostname: publicResolver,
      request,
    });

    expect(result).toMatchObject({
      ok: true,
      normalizedUrl: "https://example.com/",
    });
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith("https://example.com/");
    expect(request).not.toHaveBeenCalledWith("example.com");
  });

  it("supports explicit HTTP targets", async () => {
    const result = await verifyTarget("http://example.com", {
      resolveHostname: publicResolver,
      request: createRequest({
        "http://example.com/": httpResponse(200, {
          "content-type": "text/html",
        }),
      }),
    });

    expect(result).toMatchObject({
      ok: true,
      normalizedUrl: "http://example.com/",
      finalUrl: "http://example.com/",
    });
  });
});

describe("verifyTarget URL safety failures", () => {
  it.each([
    ["localhost", "UNSAFE_URL"],
    ["file:///etc/passwd", "INVALID_URL"],
    ["http://169.254.169.254", "UNSAFE_URL"],
  ])("maps %s to %s without requesting it", async (input, code) => {
    const request = vi.fn<(url: string) => Promise<VerificationHttpResponse>>();

    const result = await verifyTarget(input, {
      resolveHostname: publicResolver,
      request,
    });

    expect(result).toMatchObject({
      ok: false,
      code,
    });
    expect(request).not.toHaveBeenCalled();
  });

  it("maps private DNS results to UNSAFE_URL", async () => {
    const result = await verifyTarget("private.example", {
      resolveHostname: createResolver({
        "private.example": ["192.168.1.1"],
      }),
      request: createRequest({}),
    });

    expect(result).toMatchObject({
      ok: false,
      code: "UNSAFE_URL",
      normalizedUrl: "https://private.example/",
      hostname: "private.example",
      resolvedIps: ["192.168.1.1"],
    });
  });

  it("maps DNS failures to DNS_FAILED", async () => {
    const result = await verifyTarget("missing.example", {
      resolveHostname: createResolver({}),
      request: createRequest({}),
    });

    expect(result).toMatchObject({
      ok: false,
      code: "DNS_FAILED",
      normalizedUrl: "https://missing.example/",
      hostname: "missing.example",
    });
  });
});

describe("verifyTarget redirects", () => {
  it("follows a safe relative redirect and records the chain", async () => {
    const result = await verifyTarget("https://example.com", {
      resolveHostname: publicResolver,
      request: createRequest({
        "https://example.com/": httpResponse(301, {
          location: "/home",
        }),
        "https://example.com/home": httpResponse(200, {
          "content-type": "text/html; charset=utf-8",
        }),
      }),
    });

    expect(result).toMatchObject({
      ok: true,
      finalUrl: "https://example.com/home",
      responseTimeMs: 50,
      redirectChain: [
        {
          fromUrl: "https://example.com/",
          toUrl: "https://example.com/home",
          statusCode: 301,
        },
      ],
    });
  });

  it("follows a safe cross-domain redirect", async () => {
    const result = await verifyTarget("https://example.com", {
      resolveHostname: publicResolver,
      request: createRequest({
        "https://example.com/": httpResponse(302, {
          location: "https://www.example.com/",
        }),
        "https://www.example.com/": httpResponse(200, {
          "content-type": "application/xhtml+xml",
        }),
      }),
    });

    expect(result).toMatchObject({
      ok: true,
      finalUrl: "https://www.example.com/",
      redirectChain: [
        {
          fromUrl: "https://example.com/",
          toUrl: "https://www.example.com/",
          statusCode: 302,
        },
      ],
    });
  });

  it("rejects redirect chains over the limit", async () => {
    const result = await verifyTarget("https://example.com", {
      resolveHostname: publicResolver,
      request: createRequest({
        "https://example.com/": httpResponse(301, { location: "/1" }),
        "https://example.com/1": httpResponse(301, { location: "/2" }),
        "https://example.com/2": httpResponse(301, { location: "/3" }),
        "https://example.com/3": httpResponse(301, { location: "/4" }),
        "https://example.com/4": httpResponse(301, { location: "/5" }),
        "https://example.com/5": httpResponse(301, { location: "/6" }),
      }),
    });

    expect(result).toMatchObject({
      ok: false,
      code: "TOO_MANY_REDIRECTS",
      finalUrl: "https://example.com/5",
    });
    expect(result.redirectChain).toHaveLength(5);
  });

  it.each(["http://localhost", "http://169.254.169.254/latest/meta-data"])(
    "rejects unsafe redirect to %s before making a second request",
    async (location) => {
      const request = vi.fn(createRequest({
        "https://example.com/": httpResponse(302, {
          location,
        }),
      }));

      const result = await verifyTarget("https://example.com", {
        resolveHostname: publicResolver,
        request,
      });

      expect(result).toMatchObject({
        ok: false,
        code: "UNSAFE_REDIRECT",
        finalUrl: "https://example.com/",
      });
      expect(request).toHaveBeenCalledTimes(1);
    },
  );

  it("rejects redirect responses without a Location header", async () => {
    const result = await verifyTarget("https://example.com", {
      resolveHostname: publicResolver,
      request: createRequest({
        "https://example.com/": httpResponse(301),
      }),
    });

    expect(result).toMatchObject({
      ok: false,
      code: "VERIFICATION_FAILED",
      statusCode: 301,
    });
  });
});

describe("verifyTarget final status rules", () => {
  it.each([
    [403, "FETCH_BLOCKED"],
    [429, "FETCH_BLOCKED"],
    [404, "UNSUPPORTED_STATUS_CODE"],
    [410, "UNSUPPORTED_STATUS_CODE"],
    [500, "UNSUPPORTED_STATUS_CODE"],
  ])("maps %s to %s", async (statusCode, code) => {
    const result = await verifyTarget("https://example.com", {
      resolveHostname: publicResolver,
      request: createRequest({
        "https://example.com/": httpResponse(statusCode, {
          "content-type": "text/html",
        }),
      }),
    });

    expect(result).toMatchObject({
      ok: false,
      code,
      statusCode,
    });
  });
});

describe("verifyTarget content validation", () => {
  it.each([
    ["application/json", "NON_HTML_RESPONSE"],
    ["application/pdf", "NON_HTML_RESPONSE"],
    ["image/png", "NON_HTML_RESPONSE"],
  ])("rejects %s responses", async (contentType, code) => {
    const result = await verifyTarget("https://example.com", {
      resolveHostname: publicResolver,
      request: createRequest({
        "https://example.com/": httpResponse(200, {
          "content-type": contentType,
        }),
      }),
    });

    expect(result).toMatchObject({
      ok: false,
      code,
      contentType,
    });
  });

  it("rejects missing Content-Type", async () => {
    const result = await verifyTarget("https://example.com", {
      resolveHostname: publicResolver,
      request: createRequest({
        "https://example.com/": httpResponse(200),
      }),
    });

    expect(result).toMatchObject({
      ok: false,
      code: "NON_HTML_RESPONSE",
      contentType: null,
    });
  });

  it("rejects responses over the verification content-length limit", async () => {
    const result = await verifyTarget("https://example.com", {
      resolveHostname: publicResolver,
      request: createRequest({
        "https://example.com/": httpResponse(200, {
          "content-type": "text/html",
          "content-length": "2000001",
        }),
      }),
    });

    expect(result).toMatchObject({
      ok: false,
      code: "RESPONSE_TOO_LARGE",
    });
  });

  it("continues when Content-Length is missing", async () => {
    const result = await verifyTarget("https://example.com", {
      resolveHostname: publicResolver,
      request: createRequest({
        "https://example.com/": httpResponse(200, {
          "content-type": "text/html",
        }),
      }),
    });

    expect(result).toMatchObject({
      ok: true,
      contentLengthBytes: null,
    });
  });
});

describe("verifyTarget request failures", () => {
  it("maps request timeouts to CONNECTION_TIMEOUT", async () => {
    const result = await verifyTarget("https://example.com", {
      resolveHostname: publicResolver,
      request: async () => {
        throw new VerificationRequestError("CONNECTION_TIMEOUT");
      },
    });

    expect(result).toMatchObject({
      ok: false,
      code: "CONNECTION_TIMEOUT",
    });
  });

  it("maps network failures to CONNECTION_FAILED", async () => {
    const result = await verifyTarget("https://example.com", {
      resolveHostname: publicResolver,
      request: async () => {
        throw new VerificationRequestError("CONNECTION_FAILED");
      },
    });

    expect(result).toMatchObject({
      ok: false,
      code: "CONNECTION_FAILED",
    });
  });

  it("maps TLS failures to SSL_ERROR when distinguishable", async () => {
    const result = await verifyTarget("https://example.com", {
      resolveHostname: publicResolver,
      request: async () => {
        throw new VerificationRequestError("SSL_ERROR");
      },
    });

    expect(result).toMatchObject({
      ok: false,
      code: "SSL_ERROR",
    });
  });
});
