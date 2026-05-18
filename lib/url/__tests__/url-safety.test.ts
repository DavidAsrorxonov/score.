import { describe, expect, it, vi } from "vitest";

import { isUnsafeIpAddress } from "../is-private-ip";
import { validateRedirectUrl } from "../validate-redirect-url";
import { validateUrlSafety } from "../validate-url-safety";
import type { HostnameResolver } from "../types";

function createResolver(records: Record<string, string[]>): HostnameResolver {
  return async (hostname: string) => {
    const ips = records[hostname];

    if (!ips) {
      throw new Error("DNS resolution failed");
    }

    return ips;
  };
}

describe("isUnsafeIpAddress", () => {
  it.each([
    "127.0.0.1",
    "10.0.0.1",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.1.1",
    "169.254.169.254",
    "0.0.0.0",
    "255.255.255.255",
    "100.64.0.1",
    "192.0.2.1",
    "198.51.100.1",
    "203.0.113.1",
  ])("marks unsafe IPv4 address %s as unsafe", (ip) => {
    expect(isUnsafeIpAddress(ip)).toBe(true);
  });

  it.each([
    "::1",
    "::",
    "fc00::1",
    "fd00::1",
    "fe80::1",
    "ff00::1",
    "2001:db8::1",
    "::ffff:127.0.0.1",
    "::ffff:7f00:1",
    "::ffff:10.0.0.1",
    "::ffff:192.168.1.1",
  ])("marks unsafe IPv6 address %s as unsafe", (ip) => {
    expect(isUnsafeIpAddress(ip)).toBe(true);
  });

  it.each(["8.8.8.8", "1.1.1.1", "2606:4700:4700::1111"])(
    "does not mark public IP address %s as unsafe",
    (ip) => {
      expect(isUnsafeIpAddress(ip)).toBe(false);
    },
  );
});

describe("validateUrlSafety", () => {
  it.each([
    ["localhost", "LOCALHOST_NOT_ALLOWED"],
    ["http://localhost", "LOCALHOST_NOT_ALLOWED"],
    ["test.localhost", "LOCALHOST_NOT_ALLOWED"],
    ["metadata.google.internal", "INTERNAL_HOSTNAME_NOT_ALLOWED"],
    ["metadata", "INTERNAL_HOSTNAME_NOT_ALLOWED"],
    ["example.local", "INTERNAL_HOSTNAME_NOT_ALLOWED"],
    ["example.internal", "INTERNAL_HOSTNAME_NOT_ALLOWED"],
    ["example.lan", "INTERNAL_HOSTNAME_NOT_ALLOWED"],
    ["example.home", "INTERNAL_HOSTNAME_NOT_ALLOWED"],
  ])("rejects blocked hostname %s with %s", async (input, expectedCode) => {
    const resolver = vi.fn<HostnameResolver>();
    const result = await validateUrlSafety(input, {
      resolveHostname: resolver,
    });

    expect(result).toMatchObject({
      ok: false,
      code: expectedCode,
    });
    expect(resolver).not.toHaveBeenCalled();
  });

  it.each([
    "127.0.0.1",
    "http://127.0.0.1",
    "0.0.0.0",
    "http://0.0.0.0",
    "https://8.8.8.8",
    "http://[::1]",
    "http://[fd00::1]",
    "http://[fe80::1]",
  ])("rejects direct IP target %s", async (input) => {
    const resolver = vi.fn<HostnameResolver>();
    const result = await validateUrlSafety(input, {
      resolveHostname: resolver,
    });

    expect(result).toMatchObject({
      ok: false,
      code: "IP_ADDRESS_NOT_ALLOWED",
    });
    expect(resolver).not.toHaveBeenCalled();
  });

  it("allows a hostname that resolves only to public IP addresses", async () => {
    const result = await validateUrlSafety("example.com", {
      resolveHostname: createResolver({
        "example.com": ["93.184.216.34"],
      }),
    });

    expect(result).toEqual({
      ok: true,
      normalizedUrl: "https://example.com/",
      hostname: "example.com",
      resolvedIps: ["93.184.216.34"],
    });
  });

  it("rejects a hostname that resolves only to private IP addresses", async () => {
    const result = await validateUrlSafety("private.example", {
      resolveHostname: createResolver({
        "private.example": ["192.168.1.1"],
      }),
    });

    expect(result).toMatchObject({
      ok: false,
      code: "DNS_RESOLVES_TO_PRIVATE_IP",
      resolvedIps: ["192.168.1.1"],
    });
  });

  it("rejects a hostname with mixed public and private DNS results", async () => {
    const result = await validateUrlSafety("mixed.example", {
      resolveHostname: createResolver({
        "mixed.example": ["93.184.216.34", "10.0.0.1"],
      }),
    });

    expect(result).toMatchObject({
      ok: false,
      code: "DNS_RESOLVES_TO_PRIVATE_IP",
      resolvedIps: ["93.184.216.34", "10.0.0.1"],
    });
  });

  it("rejects a hostname when DNS resolution fails", async () => {
    const result = await validateUrlSafety("missing.example", {
      resolveHostname: createResolver({}),
    });

    expect(result).toMatchObject({
      ok: false,
      code: "DNS_RESOLUTION_FAILED",
    });
  });
});

describe("validateRedirectUrl", () => {
  const resolver = createResolver({
    "example.com": ["93.184.216.34"],
  });

  it("resolves a relative redirect against the current URL", async () => {
    const result = await validateRedirectUrl(
      {
        fromUrl: "https://example.com",
        location: "/login",
      },
      { resolveHostname: resolver },
    );

    expect(result).toEqual({
      ok: true,
      normalizedUrl: "https://example.com/login",
      hostname: "example.com",
      resolvedIps: ["93.184.216.34"],
    });
  });

  it("checks an absolute redirect target", async () => {
    const result = await validateRedirectUrl(
      {
        fromUrl: "https://example.com",
        location: "https://example.com/login",
      },
      { resolveHostname: resolver },
    );

    expect(result).toMatchObject({
      ok: true,
      normalizedUrl: "https://example.com/login",
    });
  });

  it.each([
    ["http://localhost", "LOCALHOST_NOT_ALLOWED"],
    ["http://169.254.169.254/latest/meta-data", "IP_ADDRESS_NOT_ALLOWED"],
    ["file:///etc/passwd", "UNSUPPORTED_PROTOCOL"],
  ])("rejects unsafe redirect target %s", async (location, expectedCode) => {
    const result = await validateRedirectUrl(
      {
        fromUrl: "https://example.com",
        location,
      },
      { resolveHostname: resolver },
    );

    expect(result).toMatchObject({
      ok: false,
      code: expectedCode,
    });
  });
});
