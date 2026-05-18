import { isIP } from "node:net";

import { getUrlSafetyMessage } from "./errors";
import { isUnsafeIpAddress } from "./is-private-ip";
import { normalizeUrlInput } from "./normalize-url";
import { resolvePublicIps } from "./resolve-hostname";
import type {
  HostnameResolver,
  UrlSafetyErrorCode,
  UrlSafetyResult,
} from "./types";

interface ValidateUrlSafetyOptions {
  resolveHostname?: HostnameResolver;
}

function stripIpv6Brackets(hostname: string): string {
  if (hostname.startsWith("[") && hostname.endsWith("]")) {
    return hostname.slice(1, -1);
  }

  return hostname;
}

function normalizeHostnameForPolicy(hostname: string): string {
  return stripIpv6Brackets(hostname).toLowerCase().replace(/\.$/, "");
}

function failure(params: {
  code: UrlSafetyErrorCode;
  normalizedUrl?: string;
  hostname?: string;
  resolvedIps?: string[];
}): UrlSafetyResult {
  return {
    ok: false,
    ...params,
    message: getUrlSafetyMessage(params.code),
  };
}

function getBlockedHostnameCode(
  hostname: string,
): "LOCALHOST_NOT_ALLOWED" | "INTERNAL_HOSTNAME_NOT_ALLOWED" | null {
  const normalizedHostname = normalizeHostnameForPolicy(hostname);

  if (
    normalizedHostname === "localhost" ||
    normalizedHostname === "localhost.localdomain" ||
    normalizedHostname.endsWith(".localhost")
  ) {
    return "LOCALHOST_NOT_ALLOWED";
  }

  if (
    normalizedHostname === "metadata" ||
    normalizedHostname === "metadata.google.internal" ||
    normalizedHostname.endsWith(".internal") ||
    normalizedHostname.endsWith(".local") ||
    normalizedHostname.endsWith(".lan") ||
    normalizedHostname.endsWith(".home") ||
    !normalizedHostname.includes(".")
  ) {
    return "INTERNAL_HOSTNAME_NOT_ALLOWED";
  }

  return null;
}

export function isBlockedHostname(hostname: string): boolean {
  return getBlockedHostnameCode(hostname) !== null;
}

export async function validateUrlSafety(
  input: string,
  options: ValidateUrlSafetyOptions = {},
): Promise<UrlSafetyResult> {
  const normalized = normalizeUrlInput(input);

  if (!normalized.ok) {
    return normalized;
  }

  const hostname = normalizeHostnameForPolicy(normalized.hostname);

  if (isIP(hostname) !== 0) {
    return failure({
      code: "IP_ADDRESS_NOT_ALLOWED",
      normalizedUrl: normalized.normalizedUrl,
      hostname,
    });
  }

  const blockedHostnameCode = getBlockedHostnameCode(hostname);

  if (blockedHostnameCode !== null) {
    return failure({
      code: blockedHostnameCode,
      normalizedUrl: normalized.normalizedUrl,
      hostname,
    });
  }

  const resolvedIpResult = await resolvePublicIps(
    hostname,
    options.resolveHostname,
  );

  if (!resolvedIpResult.ok) {
    return failure({
      code: resolvedIpResult.code,
      normalizedUrl: normalized.normalizedUrl,
      hostname,
    });
  }

  const unsafeResolvedIp = resolvedIpResult.ips.some((ip) => {
    if (isIP(stripIpv6Brackets(ip)) === 0) {
      return true;
    }

    return isUnsafeIpAddress(ip);
  });

  if (unsafeResolvedIp) {
    return failure({
      code: "DNS_RESOLVES_TO_PRIVATE_IP",
      normalizedUrl: normalized.normalizedUrl,
      hostname,
      resolvedIps: resolvedIpResult.ips,
    });
  }

  return {
    ok: true,
    normalizedUrl: normalized.normalizedUrl,
    hostname,
    resolvedIps: resolvedIpResult.ips,
  };
}
