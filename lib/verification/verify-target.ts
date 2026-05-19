import {
  validateRedirectUrl,
  validateUrlSafety,
  type UrlSafetyErrorCode,
} from "../url";
import type { HostnameResolver } from "../url/types";

import { VERIFICATION_CONFIG } from "./config";
import { getVerificationMessage } from "./errors";
import {
  requestForVerification,
  VerificationRequestError,
} from "./http-client";
import type {
  RedirectHop,
  VerificationErrorCode,
  VerificationFailure,
  VerificationHttpResponse,
  VerificationResult,
} from "./types";

interface VerifyTargetOptions {
  resolveHostname?: HostnameResolver;
  request?: (url: string) => Promise<VerificationHttpResponse>;
}

const REDIRECT_STATUS_CODES = new Set([301, 302, 303, 307, 308]);

function mapUrlSafetyError(code: UrlSafetyErrorCode): VerificationErrorCode {
  switch (code) {
    case "EMPTY_INPUT":
    case "INPUT_TOO_LONG":
    case "INVALID_URL":
    case "UNSUPPORTED_PROTOCOL":
    case "MISSING_HOSTNAME":
    case "CREDENTIALS_NOT_ALLOWED":
      return "INVALID_URL";
    case "DNS_RESOLUTION_FAILED":
      return "DNS_FAILED";
    case "UNSAFE_REDIRECT_TARGET":
      return "UNSAFE_REDIRECT";
    case "LOCALHOST_NOT_ALLOWED":
    case "INTERNAL_HOSTNAME_NOT_ALLOWED":
    case "IP_ADDRESS_NOT_ALLOWED":
    case "DNS_RESOLVES_TO_PRIVATE_IP":
      return "UNSAFE_URL";
  }
}

function createFailure(params: {
  inputUrl: string;
  code: VerificationErrorCode;
  normalizedUrl?: string;
  finalUrl?: string;
  hostname?: string;
  resolvedIps?: string[];
  statusCode?: number;
  contentType?: string | null;
  responseTimeMs?: number;
  redirectChain?: RedirectHop[];
}): VerificationFailure {
  return {
    ok: false,
    inputUrl: params.inputUrl,
    normalizedUrl: params.normalizedUrl,
    finalUrl: params.finalUrl,
    hostname: params.hostname,
    resolvedIps: params.resolvedIps,
    statusCode: params.statusCode,
    contentType: params.contentType,
    responseTimeMs: params.responseTimeMs,
    redirectChain: params.redirectChain,
    code: params.code,
    message: getVerificationMessage(params.code),
    verifiedAt: new Date(),
  };
}

function getStatusErrorCode(statusCode: number): VerificationErrorCode | null {
  if (statusCode >= 200 && statusCode < 300) {
    return null;
  }

  if (statusCode === 401 || statusCode === 403 || statusCode === 429) {
    return "FETCH_BLOCKED";
  }

  return "UNSUPPORTED_STATUS_CODE";
}

function getAcceptedContentType(contentType: string | null): string | null {
  if (contentType === null) {
    return null;
  }

  const mediaType = contentType.split(";")[0]?.trim().toLowerCase();

  if (!mediaType) {
    return null;
  }

  return VERIFICATION_CONFIG.acceptedContentTypes.includes(
    mediaType as (typeof VERIFICATION_CONFIG.acceptedContentTypes)[number],
  )
    ? contentType
    : null;
}

function parseContentLength(headers: Headers): number | null {
  const contentLength = headers.get("content-length");

  if (contentLength === null) {
    return null;
  }

  const parsedContentLength = Number.parseInt(contentLength, 10);

  if (!Number.isFinite(parsedContentLength) || parsedContentLength < 0) {
    return null;
  }

  return parsedContentLength;
}

export async function verifyTarget(
  input: string,
  options: VerifyTargetOptions = {},
): Promise<VerificationResult> {
  const safety = await validateUrlSafety(input, {
    resolveHostname: options.resolveHostname,
  });

  if (!safety.ok) {
    return createFailure({
      inputUrl: input,
      normalizedUrl: safety.normalizedUrl,
      hostname: safety.hostname,
      resolvedIps: safety.resolvedIps,
      code: mapUrlSafetyError(safety.code),
    });
  }

  const request = options.request ?? requestForVerification;
  const redirectChain: RedirectHop[] = [];
  let currentUrl = safety.normalizedUrl;
  let responseTimeMs = 0;

  try {
    while (true) {
      const response = await request(currentUrl);
      responseTimeMs += response.responseTimeMs;

      if (REDIRECT_STATUS_CODES.has(response.statusCode)) {
        const location = response.headers.get("location");

        if (location === null || location.trim().length === 0) {
          return createFailure({
            inputUrl: input,
            normalizedUrl: safety.normalizedUrl,
            finalUrl: currentUrl,
            hostname: safety.hostname,
            resolvedIps: safety.resolvedIps,
            statusCode: response.statusCode,
            responseTimeMs,
            redirectChain,
            code: "VERIFICATION_FAILED",
          });
        }

        if (redirectChain.length >= VERIFICATION_CONFIG.maxRedirects) {
          return createFailure({
            inputUrl: input,
            normalizedUrl: safety.normalizedUrl,
            finalUrl: currentUrl,
            hostname: safety.hostname,
            resolvedIps: safety.resolvedIps,
            statusCode: response.statusCode,
            responseTimeMs,
            redirectChain,
            code: "TOO_MANY_REDIRECTS",
          });
        }

        const redirectSafety = await validateRedirectUrl(
          {
            fromUrl: currentUrl,
            location,
          },
          {
            resolveHostname: options.resolveHostname,
          },
        );

        if (!redirectSafety.ok) {
          return createFailure({
            inputUrl: input,
            normalizedUrl: safety.normalizedUrl,
            finalUrl: currentUrl,
            hostname: safety.hostname,
            resolvedIps: safety.resolvedIps,
            statusCode: response.statusCode,
            responseTimeMs,
            redirectChain,
            code: "UNSAFE_REDIRECT",
          });
        }

        redirectChain.push({
          fromUrl: currentUrl,
          toUrl: redirectSafety.normalizedUrl,
          statusCode: response.statusCode,
        });
        currentUrl = redirectSafety.normalizedUrl;
        continue;
      }

      const statusErrorCode = getStatusErrorCode(response.statusCode);
      const contentType = response.headers.get("content-type");

      if (statusErrorCode !== null) {
        return createFailure({
          inputUrl: input,
          normalizedUrl: safety.normalizedUrl,
          finalUrl: currentUrl,
          hostname: safety.hostname,
          resolvedIps: safety.resolvedIps,
          statusCode: response.statusCode,
          contentType,
          responseTimeMs,
          redirectChain,
          code: statusErrorCode,
        });
      }

      if (getAcceptedContentType(contentType) === null) {
        return createFailure({
          inputUrl: input,
          normalizedUrl: safety.normalizedUrl,
          finalUrl: currentUrl,
          hostname: safety.hostname,
          resolvedIps: safety.resolvedIps,
          statusCode: response.statusCode,
          contentType,
          responseTimeMs,
          redirectChain,
          code: "NON_HTML_RESPONSE",
        });
      }

      const contentLengthBytes = parseContentLength(response.headers);

      if (
        contentLengthBytes !== null &&
        contentLengthBytes > VERIFICATION_CONFIG.maxResponseBytes
      ) {
        return createFailure({
          inputUrl: input,
          normalizedUrl: safety.normalizedUrl,
          finalUrl: currentUrl,
          hostname: safety.hostname,
          resolvedIps: safety.resolvedIps,
          statusCode: response.statusCode,
          contentType,
          responseTimeMs,
          redirectChain,
          code: "RESPONSE_TOO_LARGE",
        });
      }

      return {
        ok: true,
        inputUrl: input,
        normalizedUrl: safety.normalizedUrl,
        finalUrl: currentUrl,
        hostname: safety.hostname,
        resolvedIps: safety.resolvedIps,
        statusCode: response.statusCode,
        contentType,
        responseTimeMs,
        contentLengthBytes,
        redirectChain,
        verifiedAt: new Date(),
      };
    }
  } catch (error) {
    const code =
      error instanceof VerificationRequestError
        ? error.code
        : "VERIFICATION_FAILED";

    return createFailure({
      inputUrl: input,
      normalizedUrl: safety.normalizedUrl,
      finalUrl: currentUrl,
      hostname: safety.hostname,
      resolvedIps: safety.resolvedIps,
      responseTimeMs,
      redirectChain,
      code,
    });
  }
}
