import { isIP } from "node:net";

import { getUrlSafetyMessage } from "./errors";
import type { NormalizedUrlResult, UrlSafetyErrorCode } from "./types";

const MAX_URL_INPUT_LENGTH = 2048;
const EXPLICIT_SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:/i;
const DOMAIN_WITH_PORT_PATTERN = /^[a-z0-9.-]+:\d+(?:[/?#]|$)/i;

function failure(input: string, code: UrlSafetyErrorCode): NormalizedUrlResult {
  return {
    ok: false,
    input,
    code,
    message: getUrlSafetyMessage(code),
  };
}

function stripIpv6Brackets(hostname: string): string {
  if (hostname.startsWith("[") && hostname.endsWith("]")) {
    return hostname.slice(1, -1);
  }

  return hostname;
}

function hasExplicitScheme(input: string): boolean {
  if (DOMAIN_WITH_PORT_PATTERN.test(input)) {
    return false;
  }

  return EXPLICIT_SCHEME_PATTERN.test(input);
}

function isValidHostname(hostname: string): boolean {
  const hostnameForIpCheck = stripIpv6Brackets(hostname);

  if (isIP(hostnameForIpCheck) !== 0) {
    return true;
  }

  if (hostname.length > 253) {
    return false;
  }

  const labels = hostname.split(".");

  return labels.every((label) => {
    if (label.length < 1 || label.length > 63) {
      return false;
    }

    if (label.startsWith("-") || label.endsWith("-")) {
      return false;
    }

    return /^[a-z0-9-]+$/i.test(label);
  });
}

export function normalizeUrlInput(input: string): NormalizedUrlResult {
  const trimmedInput = input.trim();

  if (trimmedInput.length === 0) {
    return failure(trimmedInput, "EMPTY_INPUT");
  }

  if (trimmedInput.length > MAX_URL_INPUT_LENGTH) {
    return failure(trimmedInput, "INPUT_TOO_LONG");
  }

  const parseTarget = hasExplicitScheme(trimmedInput)
    ? trimmedInput
    : `https://${trimmedInput}`;

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(parseTarget);
  } catch {
    return failure(trimmedInput, "INVALID_URL");
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return failure(trimmedInput, "UNSUPPORTED_PROTOCOL");
  }

  if (parsedUrl.hostname.length === 0) {
    return failure(trimmedInput, "MISSING_HOSTNAME");
  }

  if (parsedUrl.username.length > 0 || parsedUrl.password.length > 0) {
    return failure(trimmedInput, "CREDENTIALS_NOT_ALLOWED");
  }

  const normalizedHostname = parsedUrl.hostname.toLowerCase().replace(/\.$/, "");

  if (!isValidHostname(normalizedHostname)) {
    return failure(trimmedInput, "INVALID_URL");
  }

  parsedUrl.hostname = normalizedHostname;
  parsedUrl.hash = "";

  return {
    ok: true,
    input: trimmedInput,
    normalizedUrl: parsedUrl.toString(),
    protocol: parsedUrl.protocol,
    hostname: parsedUrl.hostname,
    port: parsedUrl.port,
    pathname: parsedUrl.pathname,
    search: parsedUrl.search,
  };
}
