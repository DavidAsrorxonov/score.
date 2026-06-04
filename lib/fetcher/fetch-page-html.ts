import { performance } from "node:perf_hooks";

import {
  validateRedirectUrl,
  validateUrlSafety,
  type UrlSafetyErrorCode,
  type UrlSafetyResult,
} from "@/lib/url";

import { PAGE_FETCHER_CONFIG } from "./config";
import { getPageFetchMessage } from "./errors";
import { readResponseBodyWithLimit } from "./read-response-body";
import type {
  FetchPageFailure,
  FetchPageHtmlOptions,
  FetchPageResult,
  FetchRedirectHop,
  PageFetchErrorCode,
} from "./types";

const REDIRECT_STATUS_CODES = new Set([301, 302, 303, 307, 308]);

function mapUrlSafetyError(code: UrlSafetyErrorCode): PageFetchErrorCode {
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
  code: PageFetchErrorCode;
  normalizedUrl?: string;
  finalUrl?: string;
  hostname?: string;
  resolvedIps?: string[];
  statusCode?: number;
  contentType?: string | null;
  contentLengthBytes?: number | null;
  responseTimeMs?: number;
  pageSizeBytes?: number;
  redirectChain?: FetchRedirectHop[];
}): FetchPageFailure {
  return {
    ok: false,
    inputUrl: params.inputUrl,
    normalizedUrl: params.normalizedUrl,
    finalUrl: params.finalUrl,
    hostname: params.hostname,
    resolvedIps: params.resolvedIps,
    statusCode: params.statusCode,
    contentType: params.contentType,
    contentLengthBytes: params.contentLengthBytes,
    responseTimeMs: params.responseTimeMs,
    pageSizeBytes: params.pageSizeBytes,
    redirectChain: params.redirectChain,
    code: params.code,
    message: getPageFetchMessage(params.code),
    fetchedAt: new Date(),
  };
}

function getStatusErrorCode(statusCode: number): PageFetchErrorCode | null {
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

  return PAGE_FETCHER_CONFIG.acceptedContentTypes.includes(
    mediaType as (typeof PAGE_FETCHER_CONFIG.acceptedContentTypes)[number],
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

function extractCharset(contentType: string): string {
  const charset = contentType
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.toLowerCase().startsWith("charset="));

  return charset?.split("=")[1]?.trim().replace(/^"|"$/g, "") || "utf-8";
}

function decodeHtml(bytes: Uint8Array, contentType: string): string {
  const charset = extractCharset(contentType);

  try {
    return new TextDecoder(charset, { fatal: false }).decode(bytes);
  } catch {
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  }
}

function getErrorName(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.name;
  }

  return undefined;
}

function stringifyUnknownError(error: unknown): string {
  if (error instanceof Error) {
    const cause =
      typeof error.cause === "object" && error.cause !== null
        ? JSON.stringify(error.cause)
        : "";

    return `${error.name} ${error.message} ${cause}`;
  }

  return String(error);
}

function isSslError(error: unknown): boolean {
  const errorText = stringifyUnknownError(error).toLowerCase();

  return (
    errorText.includes("ssl") ||
    errorText.includes("tls") ||
    errorText.includes("cert") ||
    errorText.includes("certificate")
  );
}

async function requestPage(
  url: string,
  options: FetchPageHtmlOptions,
): Promise<Response> {
  const fetchFn = options.fetchFn ?? fetch;
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, PAGE_FETCHER_CONFIG.timeoutMs);

  try {
    return await fetchFn(url, {
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "User-Agent": PAGE_FETCHER_CONFIG.userAgent,
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

function withRedirectSafety(
  safety: UrlSafetyResult,
  fallback: {
    hostname: string;
    resolvedIps: string[];
  },
) {
  if (safety.ok) {
    return {
      hostname: safety.hostname,
      resolvedIps: safety.resolvedIps,
    };
  }

  return fallback;
}

export async function fetchPageHtml(
  inputUrl: string,
  options: FetchPageHtmlOptions = {},
): Promise<FetchPageResult> {
  const startedAt = performance.now();
  const safety = await validateUrlSafety(inputUrl, {
    resolveHostname: options.resolveHostname,
  });

  if (!safety.ok) {
    return createFailure({
      inputUrl,
      normalizedUrl: safety.normalizedUrl,
      hostname: safety.hostname,
      resolvedIps: safety.resolvedIps,
      code: mapUrlSafetyError(safety.code),
      responseTimeMs: Math.round(performance.now() - startedAt),
    });
  }

  const redirectChain: FetchRedirectHop[] = [];
  let currentUrl = safety.normalizedUrl;
  let currentHostname = safety.hostname;
  let currentResolvedIps = safety.resolvedIps;

  try {
    while (true) {
      const response = await requestPage(currentUrl, options);
      const responseTimeMs = Math.round(performance.now() - startedAt);

      if (REDIRECT_STATUS_CODES.has(response.status)) {
        const location = response.headers.get("location");

        if (location === null || location.trim().length === 0) {
          return createFailure({
            inputUrl,
            normalizedUrl: safety.normalizedUrl,
            finalUrl: currentUrl,
            hostname: currentHostname,
            resolvedIps: currentResolvedIps,
            statusCode: response.status,
            responseTimeMs,
            redirectChain,
            code: "PAGE_FETCH_FAILED",
          });
        }

        if (redirectChain.length >= PAGE_FETCHER_CONFIG.maxRedirects) {
          return createFailure({
            inputUrl,
            normalizedUrl: safety.normalizedUrl,
            finalUrl: currentUrl,
            hostname: currentHostname,
            resolvedIps: currentResolvedIps,
            statusCode: response.status,
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
            inputUrl,
            normalizedUrl: safety.normalizedUrl,
            finalUrl: currentUrl,
            hostname: currentHostname,
            resolvedIps: currentResolvedIps,
            statusCode: response.status,
            responseTimeMs,
            redirectChain,
            code: "UNSAFE_REDIRECT",
          });
        }

        redirectChain.push({
          fromUrl: currentUrl,
          toUrl: redirectSafety.normalizedUrl,
          statusCode: response.status,
        });

        const redirectTargetSafety = withRedirectSafety(redirectSafety, {
          hostname: currentHostname,
          resolvedIps: currentResolvedIps,
        });

        currentUrl = redirectSafety.normalizedUrl;
        currentHostname = redirectTargetSafety.hostname;
        currentResolvedIps = redirectTargetSafety.resolvedIps;
        continue;
      }

      const statusErrorCode = getStatusErrorCode(response.status);
      const contentType = response.headers.get("content-type");
      const contentLengthBytes = parseContentLength(response.headers);

      if (statusErrorCode !== null) {
        return createFailure({
          inputUrl,
          normalizedUrl: safety.normalizedUrl,
          finalUrl: currentUrl,
          hostname: currentHostname,
          resolvedIps: currentResolvedIps,
          statusCode: response.status,
          contentType,
          contentLengthBytes,
          responseTimeMs,
          redirectChain,
          code: statusErrorCode,
        });
      }

      const acceptedContentType = getAcceptedContentType(contentType);

      if (acceptedContentType === null) {
        return createFailure({
          inputUrl,
          normalizedUrl: safety.normalizedUrl,
          finalUrl: currentUrl,
          hostname: currentHostname,
          resolvedIps: currentResolvedIps,
          statusCode: response.status,
          contentType,
          contentLengthBytes,
          responseTimeMs,
          redirectChain,
          code: "NON_HTML_RESPONSE",
        });
      }

      const body = await readResponseBodyWithLimit(
        response,
        PAGE_FETCHER_CONFIG.maxResponseBytes,
      );

      if (!body.ok) {
        return createFailure({
          inputUrl,
          normalizedUrl: safety.normalizedUrl,
          finalUrl: currentUrl,
          hostname: currentHostname,
          resolvedIps: currentResolvedIps,
          statusCode: response.status,
          contentType,
          contentLengthBytes,
          responseTimeMs: Math.round(performance.now() - startedAt),
          pageSizeBytes: body.sizeBytes,
          redirectChain,
          code: body.code,
        });
      }

      return {
        ok: true,
        inputUrl,
        normalizedUrl: safety.normalizedUrl,
        finalUrl: currentUrl,
        hostname: currentHostname,
        resolvedIps: currentResolvedIps,
        statusCode: response.status,
        contentType: acceptedContentType,
        contentLengthBytes,
        responseTimeMs: Math.round(performance.now() - startedAt),
        pageSizeBytes: body.sizeBytes,
        redirectChain,
        html: decodeHtml(body.bytes, acceptedContentType),
        fetchedAt: new Date(),
      };
    }
  } catch (error) {
    const code =
      getErrorName(error) === "AbortError"
        ? "CONNECTION_TIMEOUT"
        : isSslError(error)
          ? "SSL_ERROR"
          : "CONNECTION_FAILED";

    return createFailure({
      inputUrl,
      normalizedUrl: safety.normalizedUrl,
      finalUrl: currentUrl,
      hostname: currentHostname,
      resolvedIps: currentResolvedIps,
      responseTimeMs: Math.round(performance.now() - startedAt),
      redirectChain,
      code,
    });
  }
}
