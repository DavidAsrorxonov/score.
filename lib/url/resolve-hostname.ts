import { promises as dns } from "node:dns";

import { getUrlSafetyMessage } from "./errors";

export async function resolveHostname(hostname: string): Promise<string[]> {
  const [ipv4Result, ipv6Result] = await Promise.allSettled([
    dns.resolve4(hostname),
    dns.resolve6(hostname),
  ]);

  const ips = [
    ...(ipv4Result.status === "fulfilled" ? ipv4Result.value : []),
    ...(ipv6Result.status === "fulfilled" ? ipv6Result.value : []),
  ];

  if (ips.length === 0) {
    throw new Error("DNS resolution failed");
  }

  return Array.from(new Set(ips));
}

export async function resolvePublicIps(
  hostname: string,
  resolver = resolveHostname,
): Promise<
  | { ok: true; ips: string[] }
  | { ok: false; code: "DNS_RESOLUTION_FAILED"; message: string }
> {
  try {
    const ips = await resolver(hostname);

    if (ips.length === 0) {
      return {
        ok: false,
        code: "DNS_RESOLUTION_FAILED",
        message: getUrlSafetyMessage("DNS_RESOLUTION_FAILED"),
      };
    }

    return {
      ok: true,
      ips: Array.from(new Set(ips)),
    };
  } catch {
    return {
      ok: false,
      code: "DNS_RESOLUTION_FAILED",
      message: getUrlSafetyMessage("DNS_RESOLUTION_FAILED"),
    };
  }
}
